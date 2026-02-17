import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Smartphone, Package, Euro, CheckCircle2, 
  ChevronRight, ChevronLeft, Loader2, ImagePlus, X, Warehouse, Link2, Plus, Trash2
} from "lucide-react";
import type { DeviceBrand, DeviceModel } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getSpecsConfig } from "@/lib/device-category-config";

interface SmartphoneWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: any) => void;
  editingProduct?: any;
}

function getWizardSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("common.nameRequired")),
    sku: z.string().optional(),
    category: z.string().min(1, t("products.selectCategory")),
    brand: z.string().min(1, t("products.selectBrand")),
    description: z.string().optional(),
    condition: z.string().min(1, t("common.selectCondition")),
    storage: z.string().optional(),
    batteryHealth: z.string().optional(),
    grade: z.string().min(1, t("products.selectGrade")),
    networkLock: z.string().default("unlocked"),
    imei: z.string().optional(),
    imei2: z.string().optional(),
    serialNumber: z.string().optional(),
    originalBox: z.boolean().default(false),
    accessories: z.array(z.string()).default([]),
    notes: z.string().optional(),
    warrantyMonths: z.string().default("12"),
    unitPrice: z.string().min(1, t("products.sellPriceRequired")),
    costPrice: z.string().optional(),
    supplierId: z.string().optional(),
    initialStock: z.array(z.object({
      warehouseId: z.string(),
      quantity: z.number(),
      location: z.string(),
    })).default([]),
  });
}

function getSteps(t: (key: string) => string) {
  return [
    { id: 1, name: t("products.basicInfo"), icon: Smartphone },
    { id: 2, name: t("products.technicalSpecs"), icon: Package },
    { id: 3, name: t("products.priceAndStock"), icon: Euro },
    { id: 4, name: t("products.compatibility"), icon: Link2 },
    { id: 5, name: t("common.confirm"), icon: CheckCircle2 },
  ];
}

interface CompatibilityEntry {
  deviceBrandId: string;
  deviceModelId: string | null;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

const STORAGE_OPTIONS = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
// Marche per dispositivi mobili (smartphone, tablet)
const MOBILE_BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Motorola", "Sony", "Nokia", "Lenovo", "Altro"];
// Marche per computer (PC fissi, portatili)
const PC_BRANDS = ["Apple", "Dell", "HP", "Lenovo", "ASUS", "Acer", "MSI", "Microsoft", "Razer", "Samsung", "Huawei", "Altro"];
// Funzione per ottenere le marche in base alla categoria
const getBrandsForCategory = (category: string): string[] => {
  switch (category) {
    case "smartphone":
    case "tablet":
      return MOBILE_BRANDS;
    case "pc_fisso":
    case "portatile":
      return PC_BRANDS;
    default:
      return Array.from(new Set([...MOBILE_BRANDS, ...PC_BRANDS])); // Tutte le marche per altre categorie
  }
};

function getGradeOptions(t: (key: string) => string) {
  return [
    { value: "A+", label: t("products.gradeAPlus") },
    { value: "A", label: t("products.gradeA") },
    { value: "B", label: t("products.gradeB") },
    { value: "C", label: t("products.gradeC") },
    { value: "D", label: t("products.gradeD") },
  ];
}
function getConditionOptions(t: (key: string) => string) {
  return [
    { value: "nuovo", label: t("common.new") },
    { value: "ricondizionato", label: t("products.refurbished") },
    { value: "usato", label: t("products.used") },
    { value: "difettoso", label: t("products.defective") },
  ];
}
function getNetworkLockOptions(t: (key: string) => string) {
  return [
    { value: "unlocked", label: t("products.unlocked") },
    { value: "locked", label: t("products.carrierLocked") },
    { value: "icloud_locked", label: t("products.icloudLocked") },
  ];
}
function getBatteryOptions(t: (key: string) => string) {
  return [
    { value: "100", label: "100%" },
    { value: "95-99", label: "95-99%" },
    { value: "90-94", label: "90-94%" },
    { value: "85-89", label: "85-89%" },
    { value: "80-84", label: "80-84%" },
    { value: "<80", label: t("products.lessThan80") },
  ];
}
function getCategoryOptions(t: (key: string) => string) {
  return [
    { value: "smartphone", label: t("repair.smartphone") },
    { value: "tablet", label: t("repair.tablet") },
    { value: "portatile", label: t("repair.laptop") },
    { value: "pc_fisso", label: t("repair.desktop") },
    { value: "smartwatch", label: t("repair.smartwatch") },
    { value: "console", label: t("repair.console") },
    { value: "altro", label: t("common.other") },
  ];
}

// Categorie che sono dispositivi (hanno specs tecniche)
const DEVICE_CATEGORIES = ["smartphone", "tablet", "portatile", "pc_fisso", "smartwatch", "console"];
const isDeviceCategory = (category: string) => DEVICE_CATEGORIES.includes(category);
function getAccessoryOptions(t: (key: string) => string) {
  return [
    t("products.originalCharger"),
    t("products.usbCable"),
    t("products.earphones"),
    t("products.cover"),
    t("products.screenProtector"),
    t("products.originalBox"),
    t("products.manual"),
  ];
}


export function SmartphoneWizard({ 
  open, 
  onOpenChange, 
  onSuccess,
  editingProduct 
}: SmartphoneWizardProps) {
  const { t } = useTranslation();
  const wizardSchema = getWizardSchema(t);
  type WizardData = z.infer<typeof wizardSchema>;
  const STEPS = getSteps(t);
  const CONDITION_OPTIONS = getConditionOptions(t);
  const NETWORK_LOCK_OPTIONS = getNetworkLockOptions(t);
  const CATEGORY_OPTIONS = getCategoryOptions(t);
  const GRADE_OPTIONS = getGradeOptions(t);
  const BATTERY_OPTIONS = getBatteryOptions(t);
  const ACCESSORY_OPTIONS = getAccessoryOptions(t);
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to top when step changes
  useEffect(() => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const { user } = useUser();

  const isAdmin = user?.role === "admin";
  const isReseller = user?.role === "reseller";

  const form = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: "",
      sku: "",
      category: "smartphone",
      brand: "",
      description: "",
      condition: "ricondizionato",
      storage: "128GB",
      batteryHealth: "",
      grade: "A",
      networkLock: "unlocked",
      imei: "",
      imei2: "",
      serialNumber: "",
      originalBox: false,
      accessories: [],
      notes: "",
      warrantyMonths: "12",
      unitPrice: "",
      costPrice: "",
      supplierId: "",
      initialStock: [],
    },
  });

  // Reset hidden fields when category changes
  const watchedCategory = form.watch("category");
  useEffect(() => {
    const specsConfig = getSpecsConfig(watchedCategory);
    // Reset fields that are not visible for this category
    if (!specsConfig.storage) {
      form.setValue("storage", "");
    }
    if (!specsConfig.batteryHealth) {
      form.setValue("batteryHealth", "");
    }
    if (!specsConfig.networkLock) {
      form.setValue("networkLock", "unlocked");
    }
    if (!specsConfig.imei) {
      form.setValue("imei", "");
    }
    if (!specsConfig.accessories) {
      form.setValue("accessories", []);
    }
  }, [watchedCategory, form]);

  // Use /api/warehouses/accessible for all non-admin roles - it handles all roles internally
  // and returns own + sub-reseller + repair center warehouses for resellers
  const warehouseEndpoint = isAdmin 
    ? "/api/admin/all-warehouses" 
    : "/api/warehouses/accessible";

  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: [warehouseEndpoint],
    queryFn: async () => {
      const res = await fetch(warehouseEndpoint, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch warehouses");
      return res.json();
    },
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers/list"],
  });

  // Device compatibility state and queries
  const [compatibilities, setCompatibilities] = useState<CompatibilityEntry[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  const { data: deviceBrands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [] } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      const res = await fetch(`/api/device-models?brandId=${selectedBrandId}`);
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    enabled: !!selectedBrandId,
  });

  const addCompatibility = () => {
    if (!selectedBrandId) return;
    // Check if already exists
    const exists = compatibilities.some(c => 
      c.deviceBrandId === selectedBrandId && c.deviceModelId === null
    );
    if (exists) {
      toast({ title: t("products.compatibilityAlreadyAdded"), variant: "destructive" });
      return;
    }
    setCompatibilities([...compatibilities, { deviceBrandId: selectedBrandId, deviceModelId: null }]);
    setSelectedBrandId("");
  };

  const addModelCompatibility = (modelId: string) => {
    if (!selectedBrandId || !modelId) return;
    const exists = compatibilities.some(c => 
      c.deviceBrandId === selectedBrandId && c.deviceModelId === modelId
    );
    if (exists) {
      toast({ title: t("products.compatibilityAlreadyAdded"), variant: "destructive" });
      return;
    }
    setCompatibilities([...compatibilities, { deviceBrandId: selectedBrandId, deviceModelId: modelId }]);
  };

  const removeCompatibility = (index: number) => {
    setCompatibilities(compatibilities.filter((_, i) => i !== index));
  };

  // Generate automatic SKU from brand, condition and timestamp
  const generateSku = (brand: string, condition: string): string => {
    const brandCode = brand.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 4);
    const conditionCode = condition.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString(36).toUpperCase();
    return `SM-${brandCode}-${conditionCode}-${timestamp}`;
  };

  const createMutation = useMutation({
    mutationFn: async (data: WizardData) => {
      // Generate SKU if not provided
      const sku = data.sku?.trim() || generateSku(data.brand, data.condition);
      
      const productData = {
        name: data.name,
        sku: sku,
        category: data.category,
        description: data.description,
        type: data.category,
        unitPriceCents: Math.round(parseFloat(data.unitPrice) * 100),
        costPriceCents: data.costPrice ? Math.round(parseFloat(data.costPrice) * 100) : undefined,
        condition: data.condition,
        warrantyMonths: parseInt(data.warrantyMonths),
      };
      
      // Costruisci specsData solo con i campi visibili per questa categoria
      const specsConfig = getSpecsConfig(data.category);
      const specsData: Record<string, any> = {
        brand: data.brand,
        notes: data.notes,
      };
      
      // Aggiungi solo i campi visibili per questa categoria
      if (specsConfig.storage && data.storage) {
        specsData.storage = data.storage;
      }
      if (specsConfig.grade) {
        specsData.grade = data.grade;
      }
      if (specsConfig.batteryHealth && data.batteryHealth) {
        specsData.batteryHealth = data.batteryHealth;
      }
      if (specsConfig.networkLock) {
        specsData.networkLock = data.networkLock;
      }
      if (specsConfig.imei && data.imei) {
        specsData.imei = data.imei;
      }
      if (data.imei2) {
        specsData.imei2 = data.imei2;
      }
      if (specsConfig.serialNumber && data.serialNumber) {
        specsData.serialNumber = data.serialNumber;
      }
      if (specsConfig.originalBox) {
        specsData.originalBox = data.originalBox;
      }
      if (specsConfig.accessories) {
        specsData.accessories = data.accessories;
      }

      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("product", JSON.stringify(productData));
        formDataUpload.append("specs", JSON.stringify(specsData));
        formDataUpload.append("image", imageFile);
        if (data.initialStock.length > 0) {
          formDataUpload.append("initialStock", JSON.stringify(data.initialStock));
        }
        const response = await fetch("/api/smartphones", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!response.ok) throw new Error(t("products.smartphoneCreationError"));
        return response.json();
      } else {
        return apiRequest("POST", "/api/smartphones", {
          product: productData,
          specs: specsData,
          initialStock: data.initialStock.length > 0 ? data.initialStock : undefined,
        }).then(res => res.json());
      }
    },
    onSuccess: async (newProduct) => {
      // Save device compatibilities if any were selected
      if (compatibilities.length > 0 && newProduct?.id) {
        try {
          await apiRequest("PUT", `/api/products/${newProduct.id}/compatibilities`, {
            compatibilities: compatibilities,
          });
        } catch (err) {
          console.error("Failed to save compatibilities:", err);
        }
      }
      // Save supplier link if selected
      const supplierId = form.getValues("supplierId");
      if (supplierId && newProduct?.id) {
        try {
          await apiRequest("POST", `/api/products/${newProduct.id}/suppliers`, {
            supplierId: supplierId,
            isPreferred: true,
          });
        } catch (err) {
          console.error("Failed to save supplier link:", err);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      toast({ title: t("products.deviceCreated"), description: t("products.addedToCatalog", { name: form.getValues("name") }) });
      handleClose();
      onSuccess?.(newProduct);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setImageFile(null);
    setImagePreview(null);
    setCompatibilities([]);
    setSelectedBrandId("");
    form.reset();
    onOpenChange(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof WizardData)[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ["name", "category", "brand", "condition"];
    } else if (currentStep === 2) {
      // Valida solo i campi visibili in base alla categoria
      const specsConfig = getSpecsConfig(form.getValues("category"));
      fieldsToValidate = [];
      if (specsConfig.grade) {
        fieldsToValidate.push("grade");
      }
      if (specsConfig.storage) {
        fieldsToValidate.push("storage");
      }
    } else if (currentStep === 3) {
      fieldsToValidate = ["unitPrice"];
    }
    // Step 4 (compatibilità) has no required fields

    const isValid = fieldsToValidate.length === 0 || await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    // Only submit if we're on the final step (step 5)
    if (currentStep !== 5) return;
    form.handleSubmit((data) => {
      createMutation.mutate(data);
    })();
  };

  const addWarehouseStock = () => {
    const current = form.getValues("initialStock");
    form.setValue("initialStock", [...current, { warehouseId: "", quantity: 1, location: "" }]);
  };

  const removeWarehouseStock = (index: number) => {
    const current = form.getValues("initialStock");
    form.setValue("initialStock", current.filter((_, i) => i !== index));
  };

  const values = form.watch();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent ref={dialogContentRef} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingProduct ? t("products.editDevice") : t("products.newDevice")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6 px-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 text-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "text-xs mt-1 font-medium",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-2",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <Smartphone className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">{t("products.basicInfo")}</h3>
                  <p className="text-sm text-muted-foreground">{t("products.enterMainDeviceData")}</p>
                </div>

                <div className="flex justify-center mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt={t("common.preview")} className="w-32 h-32 object-cover rounded-lg" />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-32 h-32 flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-xs">{t("common.addPhoto")}</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.productName")} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t("products.deviceNamePlaceholder")} {...field} data-testid="input-smartphone-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.category")} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-product-category">
                              <SelectValue placeholder={t("common.selectCategory")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.brand")} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-smartphone-brand">
                              <SelectValue placeholder={t("common.selectBrand")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getBrandsForCategory(form.watch("category")).map(brand => (
                              <SelectItem key={brand} value={brand}>{brand === "Altro" ? t("common.other") : brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.condition")} *</FormLabel>
                      <div className="grid grid-cols-4 gap-2">
                        {CONDITION_OPTIONS.map(option => (
                          <Card
                            key={option.value}
                            className={cn(
                              "cursor-pointer transition-all hover-elevate",
                              field.value === option.value && "ring-2 ring-primary"
                            )}
                            onClick={() => field.onChange(option.value)}
                          >
                            <CardContent className="p-3 text-center">
                              <span className="text-sm font-medium">{option.label}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.skuCode")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("products.internalCodeOptional")} {...field} data-testid="input-smartphone-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 2 && (() => {
              const specsConfig = getSpecsConfig(form.watch("category"));
              return (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <Package className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">{t("products.technicalSpecs")}</h3>
                  <p className="text-sm text-muted-foreground">{t("products.technicalDetails")}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {specsConfig.storage && (
                    <FormField
                      control={form.control}
                      name="storage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("products.storage")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-smartphone-storage">
                                <SelectValue placeholder={t("common.select")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STORAGE_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {specsConfig.grade && (
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("products.cosmeticGrade")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-smartphone-grade">
                                <SelectValue placeholder={t("common.select")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GRADE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {(specsConfig.batteryHealth || specsConfig.networkLock) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {specsConfig.batteryHealth && (
                      <FormField
                        control={form.control}
                        name="batteryHealth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("repair.battery")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-smartphone-battery">
                                  <SelectValue placeholder={t("products.batteryHealth")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BATTERY_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {specsConfig.networkLock && (
                      <FormField
                        control={form.control}
                        name="networkLock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("products.networkLock")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-smartphone-network">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {NETWORK_LOCK_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {specsConfig.imei && (
                    <FormField
                      control={form.control}
                      name="imei"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("repair.imei")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("repair.imeiCode")} {...field} data-testid="input-smartphone-imei" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {specsConfig.serialNumber && (
                    <FormField
                      control={form.control}
                      name="serialNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.serialNumber")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("repair.serialAbbr")} {...field} data-testid="input-smartphone-serial" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {specsConfig.originalBox && (
                  <FormField
                    control={form.control}
                    name="originalBox"
                    render={({ field }) => (
                      <FormItem className="flex flex-wrap items-center gap-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-original-box"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">{t("products.originalBoxIncluded")}</FormLabel>
                      </FormItem>
                    )}
                  />
                )}

                {specsConfig.accessories && (
                  <FormField
                    control={form.control}
                    name="accessories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.includedAccessories")}</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ACCESSORY_OPTIONS.map(acc => (
                            <div key={acc} className="flex flex-wrap items-center gap-2">
                              <Checkbox
                                checked={field.value?.includes(acc)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, acc]);
                                  } else {
                                    field.onChange(field.value.filter((v: string) => v !== acc));
                                  }
                                }}
                              />
                              <Label className="text-sm">{acc}</Label>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                {specsConfig.description && (
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.description")}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t("products.additionalProductNotes")} 
                            {...field} 
                            data-testid="textarea-smartphone-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            );})()}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <Euro className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">{t("products.priceAndWarehouse")}</h3>
                  <p className="text-sm text-muted-foreground">{t("products.configurePricesAndAvailability")}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.salePriceEur")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            data-testid="input-smartphone-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.purchasePriceEur")}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                            data-testid="input-smartphone-cost"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("products.supplierOptional")}</Label>
                  <Select
                    value={form.watch("supplierId") || "none"}
                    onValueChange={(value) => form.setValue("supplierId", value === "none" ? "" : value)}
                  >
                    <SelectTrigger data-testid="select-supplier">
                      <SelectValue placeholder={t("products.selectSupplier")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("products.noSupplier")}</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  control={form.control}
                  name="warrantyMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.warrantyMonths")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-smartphone-warranty">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">{t("common.noneFem")}</SelectItem>
                          <SelectItem value="3">{t("products.nMonths", { count: 3 })}</SelectItem>
                          <SelectItem value="6">{t("products.nMonths", { count: 6 })}</SelectItem>
                          <SelectItem value="12">{t("products.nMonths", { count: 12 })}</SelectItem>
                          <SelectItem value="24">{t("products.nMonths", { count: 24 })}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">{t("warehouse.initialStock")}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addWarehouseStock}>
                      <Warehouse className="h-4 w-4 mr-1" />
                      {t("warehouse.addWarehouse")}
                    </Button>
                  </div>

                  {values.initialStock.map((stock, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">{t("warehouse.warehouse")}</Label>
                            <Select
                              value={stock.warehouseId}
                              onValueChange={(value) => {
                                const current = form.getValues("initialStock");
                                current[index].warehouseId = value;
                                form.setValue("initialStock", [...current]);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={t("common.select")} />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((w: any) => (
                                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">{t("common.quantity")}</Label>
                            <Input
                              type="number"
                              min="1"
                              value={stock.quantity}
                              onChange={(e) => {
                                const current = form.getValues("initialStock");
                                current[index].quantity = parseInt(e.target.value) || 1;
                                form.setValue("initialStock", [...current]);
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">{t("warehouse.position")}</Label>
                            <Input
                              placeholder={t("warehouse.positionExample")}
                              value={stock.location}
                              onChange={(e) => {
                                const current = form.getValues("initialStock");
                                current[index].location = e.target.value;
                                form.setValue("initialStock", [...current]);
                              }}
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeWarehouseStock(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <Link2 className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                  <h3 className="text-lg font-medium">{t("products.deviceCompatibility")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("products.selectCompatibleDevices")}
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs mb-1 block">{t("products.deviceBrand")}</Label>
                        <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                          <SelectTrigger>
                            <SelectValue placeholder={t("common.selectBrand")} />
                          </SelectTrigger>
                          <SelectContent>
                            {deviceBrands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addCompatibility}
                          disabled={!selectedBrandId}
                          data-testid="button-add-brand-compat"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {t("products.allModels")}
                        </Button>
                      </div>
                    </div>

                    {selectedBrandId && deviceModels.length > 0 && (
                      <div>
                        <Label className="text-xs mb-2 block">{t("products.orSelectSpecificModels")}:</Label>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                          {deviceModels.map((model) => {
                            const isSelected = compatibilities.some(
                              c => c.deviceBrandId === selectedBrandId && c.deviceModelId === model.id
                            );
                            return (
                              <Badge
                                key={model.id}
                                variant={isSelected ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => !isSelected && addModelCompatibility(model.id)}
                                data-testid={`badge-model-${model.id}`}
                              >
                                {model.modelName}
                                {isSelected && " ✓"}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {compatibilities.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          {t("products.selectedCompatibilities", { count: compatibilities.length })}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {compatibilities.map((compat, index) => {
                            const brand = deviceBrands.find(b => b.id === compat.deviceBrandId);
                            let label = brand?.name || t("common.brand");
                            if (compat.deviceModelId) {
                              const allModels = deviceModels.filter(m => m.brandId === compat.deviceBrandId);
                              const model = allModels.find(m => m.id === compat.deviceModelId);
                              label = `${brand?.name || ""} ${model?.modelName || t("common.model")}`;
                            } else {
                              label = `${brand?.name || t("common.brand")} (${t("products.allModels")})`;
                            }
                            return (
                              <Badge key={index} variant="secondary" className="gap-1">
                                {label}
                                <button
                                  type="button"
                                  onClick={() => removeCompatibility(index)}
                                  className="ml-1 hover:text-destructive"
                                  data-testid={`button-remove-compat-${index}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {compatibilities.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {t("products.noCompatibilitySelected")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <h3 className="text-lg font-medium">{t("repair.summary")}</h3>
                  <p className="text-sm text-muted-foreground">{t("products.verifyBeforeSaving")}</p>
                </div>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-4">
                      {imagePreview && (
                        <img src={imagePreview} alt={t("common.preview")} className="w-20 h-20 object-cover rounded-lg" />
                      )}
                      <div>
                        <h4 className="font-semibold text-lg" data-testid="text-summary-name">{values.name || t("products.nameNotEntered")}</h4>
                        {values.sku && (
                          <p className="text-xs text-muted-foreground" data-testid="text-summary-sku">SKU: {values.sku}</p>
                        )}
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{values.brand}</Badge>
                          <Badge variant="outline">{values.condition}</Badge>
                          <Badge>{values.storage}</Badge>
                        </div>
                      </div>
                    </div>

                    {(values.imei || values.imei2) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                        {values.imei && (
                          <div>
                            <Label className="text-xs text-muted-foreground">{t("repair.imei")}</Label>
                            <p className="font-medium font-mono text-sm" data-testid="text-summary-imei">{values.imei}</p>
                          </div>
                        )}
                        {values.imei2 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">{t("repair.imei2")}</Label>
                            <p className="font-medium font-mono text-sm" data-testid="text-summary-imei2">{values.imei2}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("products.grade")}</Label>
                        <p className="font-medium">{values.grade}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("repair.battery")}</Label>
                        <p className="font-medium">{values.batteryHealth || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("products.networkLock")}</Label>
                        <p className="font-medium">{NETWORK_LOCK_OPTIONS.find(o => o.value === values.networkLock)?.label}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("products.salePrice")}</Label>
                        <p className="font-semibold text-lg text-primary">€{values.unitPrice || "0"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("products.purchasePrice")}</Label>
                        <p className="font-medium">€{values.costPrice || "-"}</p>
                      </div>
                      {form.watch("supplierId") && (
                        <div>
                          <Label className="text-xs text-muted-foreground">{t("common.supplier")}</Label>
                          <p className="font-medium">{suppliers.find(s => s.id === form.watch("supplierId"))?.name || "-"}</p>
                        </div>
                      )}
                    </div>

                    {values.initialStock.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">{t("warehouse.initialStock")}</Label>
                        <div className="mt-2 space-y-1">
                          {values.initialStock.map((stock, i) => {
                            const wh = warehouses.find((w: any) => w.id === stock.warehouseId);
                            return (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{wh?.name || t("common.warehouse")}</span>
                                <span className="font-medium">{stock.quantity} {t("products.pcsAbbr")}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {values.accessories.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">{t("products.accessories")}</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {values.accessories.map(acc => (
                            <Badge key={acc} variant="outline" className="text-xs">{acc}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {compatibilities.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">{t("products.deviceCompatibility")}</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {compatibilities.map((compat, index) => {
                            const brand = deviceBrands.find(b => b.id === compat.deviceBrandId);
                            let label = brand?.name || t("common.brand");
                            if (!compat.deviceModelId) {
                              label = `${brand?.name || t("common.brand")} (${t("products.allModels")})`;
                            }
                            return (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {label}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? handleClose : handleBack}
                data-testid="button-wizard-back"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {currentStep === 1 ? t("common.cancel") : t("common.back")}
              </Button>

              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext} data-testid="button-wizard-next">
                  {t("common.next")}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  type="button"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  data-testid="button-wizard-submit"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t("products.saveDevice")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
