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
  ShoppingBag, Euro, CheckCircle2, 
  ChevronRight, ChevronLeft, Loader2, ImagePlus, X, Warehouse, ChevronDown, Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessoryWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: any) => void;
  editingProduct?: any;
}

function getWizardSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("common.nameRequired")),
    sku: z.string().optional(),
    brand: z.string().min(1, t("products.selectBrand")),
    color: z.string().optional(),
    description: z.string().optional(),
    condition: z.string().min(1, t("common.selectCondition")),
    accessoryType: z.string().min(1, t("common.selectType")),
    material: z.string().optional(),
    isUniversal: z.boolean().default(false),
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

interface CompatibilityEntry {
  deviceBrandId: string;
  deviceBrandName: string;
  deviceModelId: string | null;
  deviceModelName: string | null;
}

interface DeviceBrand {
  id: string;
  name: string;
}

interface DeviceModel {
  id: string;
  modelName: string;
  deviceBrandId: string;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

function getSteps(t: (key: string) => string) {
  return [
    { id: 1, name: t("products.basicInfo"), icon: ShoppingBag },
    { id: 2, name: t("products.priceAndStock"), icon: Euro },
    { id: 3, name: t("products.compatibility"), icon: Link2 },
    { id: 4, name: t("common.confirm"), icon: CheckCircle2 },
  ];
}

function getAccessoryTypes(t: (key: string) => string) {
  return [
    { value: "cover", label: t("products.accessoryTypes.cover") },
    { value: "pellicola", label: t("products.accessoryTypes.protectiveFilm") },
    { value: "caricatore", label: t("repair.charger") },
    { value: "cavo", label: t("products.accessoryTypes.cable") },
    { value: "auricolare", label: t("products.accessoryTypes.earphones") },
    { value: "powerbank", label: t("products.accessoryTypes.powerBank") },
    { value: "supporto", label: t("products.accessoryTypes.standSupport") },
    { value: "adattatore", label: t("products.accessoryTypes.adapter") },
    { value: "altro", label: t("common.other") },
  ];
}

function getConditionOptions(t: (key: string) => string) {
  return [
    { value: "nuovo", label: t("common.new") },
    { value: "ricondizionato", label: t("products.refurbished") },
    { value: "usato", label: t("common.used") },
  ];
}

function getBrandOptions(t: (key: string) => string) {
  return [
    { value: "Apple", label: "Apple" },
    { value: "Samsung", label: "Samsung" },
    { value: "Xiaomi", label: "Xiaomi" },
    { value: "Huawei", label: "Huawei" },
    { value: "Anker", label: "Anker" },
    { value: "Belkin", label: "Belkin" },
    { value: "Spigen", label: "Spigen" },
    { value: "OtterBox", label: "OtterBox" },
    { value: "Universale", label: t("products.brands.universal") },
    { value: "Altro", label: t("common.other") },
  ];
}

function getColorOptions(t: (key: string) => string) {
  return [
    { value: "Nero", label: t("products.colors.black") },
    { value: "Bianco", label: t("products.colors.white") },
    { value: "Argento", label: t("products.colors.silver") },
    { value: "Grigio", label: t("products.colors.grey") },
    { value: "Oro", label: t("products.colors.gold") },
    { value: "Oro Rosa", label: t("products.colors.roseGold") },
    { value: "Blu", label: t("products.colors.blue") },
    { value: "Blu Notte", label: t("products.colors.nightBlue") },
    { value: "Verde", label: t("products.colors.green") },
    { value: "Rosso", label: t("products.colors.red") },
    { value: "Giallo", label: t("products.colors.yellow") },
    { value: "Arancione", label: t("products.colors.orange") },
    { value: "Rosa", label: t("products.colors.pink") },
    { value: "Viola", label: t("products.colors.purple") },
    { value: "Marrone", label: t("products.colors.brown") },
    { value: "Trasparente", label: t("products.colors.transparent") },
    { value: "Multicolore", label: t("products.colors.multicolor") },
    { value: "Altro", label: t("common.other") },
  ];
}

function getMaterialOptions(t: (key: string) => string) {
  return [
    { value: "Silicone", label: t("products.materials.silicone") },
    { value: "TPU", label: t("products.materials.tpu") },
    { value: "Plastica", label: t("products.materials.plastic") },
    { value: "Policarbonato", label: t("products.materials.polycarbonate") },
    { value: "Pelle", label: t("products.materials.leather") },
    { value: "Pelle sintetica", label: t("products.materials.syntheticLeather") },
    { value: "Vetro temperato", label: t("products.materials.temperedGlass") },
    { value: "Metallo", label: t("products.materials.metal") },
    { value: "Alluminio", label: t("products.materials.aluminum") },
    { value: "Tessuto", label: t("products.materials.fabric") },
    { value: "Legno", label: t("products.materials.wood") },
    { value: "Carbonio", label: t("products.materials.carbon") },
    { value: "Altro", label: t("common.other") },
  ];
}

export function AccessoryWizard({ 
  open, 
  onOpenChange, 
  onSuccess,
  editingProduct 
}: AccessoryWizardProps) {
  const { t } = useTranslation();
  const wizardSchema = getWizardSchema(t);
  type WizardData = z.infer<typeof wizardSchema>;
  const STEPS = getSteps(t);
  const ACCESSORY_TYPES = getAccessoryTypes(t);
  const CONDITION_OPTIONS = getConditionOptions(t);
  const BRAND_OPTIONS = getBrandOptions(t);
  const COLOR_OPTIONS = getColorOptions(t);
  const MATERIAL_OPTIONS = getMaterialOptions(t);
  const [currentStep, setCurrentStep] = useState(1);
  const [compatibilities, setCompatibilities] = useState<CompatibilityEntry[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
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
  const isReseller = user?.role === "reseller" || user?.role === "reseller_staff";

  const form = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: "",
      sku: "",
      brand: "",
      color: "",
      description: "",
      condition: "nuovo",
      accessoryType: "cover",
      material: "",
      isUniversal: false,
      notes: "",
      warrantyMonths: "12",
      unitPrice: "",
      costPrice: "",
      supplierId: "",
      initialStock: [],
    },
  });

  // Use /api/warehouses/accessible for all non-admin roles - it handles all roles internally
  // and returns own + sub-reseller + repair center warehouses for resellers
  const warehouseEndpoint = isAdmin 
    ? "/api/admin/all-warehouses" 
    : "/api/warehouses/accessible";

  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: [warehouseEndpoint],
    queryFn: async () => {
      const res = await fetch(warehouseEndpoint, { credentials: "include" });
      if (!res.ok) throw new Error(t("products.loadError"));
      return res.json();
    },
  });

  const { data: deviceBrands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers/list"],
  });

  const { data: deviceModels = [] } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      const res = await fetch(`/api/device-models?brandId=${selectedBrandId}`);
      if (!res.ok) throw new Error(t("products.loadError"));
      return res.json();
    },
    enabled: !!selectedBrandId,
  });

  const addBrandCompatibility = () => {
    if (!selectedBrandId) return;
    const exists = compatibilities.some(c => 
      c.deviceBrandId === selectedBrandId && c.deviceModelId === null
    );
    if (exists) {
      toast({ title: t("products.compatibilityAlreadyAdded"), variant: "destructive" });
      return;
    }
    const brand = deviceBrands.find(b => b.id === selectedBrandId);
    setCompatibilities([...compatibilities, { 
      deviceBrandId: selectedBrandId, 
      deviceBrandName: brand?.name || "?",
      deviceModelId: null,
      deviceModelName: null,
    }]);
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
    const brand = deviceBrands.find(b => b.id === selectedBrandId);
    const model = deviceModels.find(m => m.id === modelId);
    setCompatibilities([...compatibilities, { 
      deviceBrandId: selectedBrandId, 
      deviceBrandName: brand?.name || "?",
      deviceModelId: modelId,
      deviceModelName: model?.modelName || "?",
    }]);
  };

  const removeCompatibility = (index: number) => {
    setCompatibilities(compatibilities.filter((_, i) => i !== index));
  };

  const createMutation = useMutation({
    mutationFn: async (data: WizardData) => {
      const productData = {
        name: data.name,
        sku: data.sku || undefined,
        description: data.description,
        type: "accessory",
        unitPriceCents: Math.round(parseFloat(data.unitPrice) * 100),
        costPriceCents: data.costPrice ? Math.round(parseFloat(data.costPrice) * 100) : undefined,
        condition: data.condition,
        warrantyMonths: parseInt(data.warrantyMonths),
      };
      const specsData = {
        brand: data.brand,
        color: data.color,
        accessoryType: data.accessoryType,
        material: data.material,
        isUniversal: data.isUniversal,
        notes: data.notes,
      };

      let createdProduct;
      if (imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("product", JSON.stringify(productData));
        formDataUpload.append("specs", JSON.stringify(specsData));
        formDataUpload.append("image", imageFile);
        if (data.initialStock.length > 0) {
          formDataUpload.append("initialStock", JSON.stringify(data.initialStock));
        }
        const response = await fetch("/api/accessories", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!response.ok) throw new Error(t("products.accessoryCreationError"));
        createdProduct = await response.json();
      } else {
        const response = await apiRequest("POST", "/api/accessories", {
          product: productData,
          specs: specsData,
          initialStock: data.initialStock.length > 0 ? data.initialStock : undefined,
        });
        createdProduct = await response.json();
      }

      return createdProduct;
    },
    onSuccess: async (newProduct) => {
      if (compatibilities.length > 0 && newProduct?.id) {
        try {
          await apiRequest("PUT", `/api/products/${newProduct.id}/compatibilities`, {
            compatibilities: compatibilities,
          });
        } catch (err) {
          console.error("Failed to save compatibilities:", err);
        }
      }
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
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: t("products.accessoryCreated"), description: t("products.addedToCatalog", { name: form.getValues("name") }) });
      handleClose();
      onSuccess?.(newProduct);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    setCurrentStep(1);
    setCompatibilities([]);
    setSelectedBrandId("");
    setImageFile(null);
    setImagePreview(null);
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
      fieldsToValidate = ["name", "brand", "accessoryType", "condition"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["unitPrice"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = () => {
    // Only submit if we're on the final step (step 4)
    if (currentStep !== 4) return;
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
            {editingProduct ? t("products.editAccessory") : t("products.newAccessory")}
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
                  <ShoppingBag className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">{t("products.basicInfo")}</h3>
                  <p className="text-sm text-muted-foreground">{t("products.enterAccessoryData")}</p>
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

                <FormField
                  control={form.control}
                  name="accessoryType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.accessoryType")} *</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {ACCESSORY_TYPES.map(type => (
                          <Card
                            key={type.value}
                            className={cn(
                              "cursor-pointer transition-all hover-elevate",
                              field.value === type.value && "ring-2 ring-primary"
                            )}
                            onClick={() => field.onChange(type.value)}
                          >
                            <CardContent className="p-3 text-center">
                              <span className="text-sm font-medium">{type.label}</span>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.productName")} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t("products.accessoryNamePlaceholder")} {...field} data-testid="input-accessory-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.brand")} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-accessory-brand">
                              <SelectValue placeholder={t("common.selectBrand")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BRAND_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.color")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-accessory-color">
                              <SelectValue placeholder={t("common.selectColor")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COLOR_OPTIONS.map(opt => (
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
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.condition")} *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-accessory-condition">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONDITION_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("products.material")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-accessory-material">
                              <SelectValue placeholder={t("common.select")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MATERIAL_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("products.skuInternalCode")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("products.internalCodeOptional")} {...field} data-testid="input-accessory-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 2 && (
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
                            data-testid="input-accessory-price"
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
                            data-testid="input-accessory-cost"
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
                          <SelectTrigger data-testid="select-accessory-warranty">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">{t("common.noneFem")}</SelectItem>
                          <SelectItem value="3">{t("products.monthCount", { count: 3 })}</SelectItem>
                          <SelectItem value="6">{t("products.monthCount", { count: 6 })}</SelectItem>
                          <SelectItem value="12">{t("products.monthCount", { count: 12 })}</SelectItem>
                          <SelectItem value="24">{t("products.monthCount", { count: 24 })}</SelectItem>
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

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <Link2 className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">{t("products.deviceCompatibility")}</h3>
                  <p className="text-sm text-muted-foreground">{t("products.selectCompatibleDevices")}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                      <SelectTrigger className="flex-1" data-testid="select-device-brand">
                        <SelectValue placeholder={t("products.selectDeviceBrand")} />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceBrands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={addBrandCompatibility} disabled={!selectedBrandId} data-testid="button-add-brand">
                      {t("products.addBrand")}
                    </Button>
                  </div>

                  {selectedBrandId && deviceModels.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <Label className="text-sm font-medium">{t("products.availableModels")}:</Label>
                      <div className="flex flex-wrap gap-2">
                        {deviceModels.map((model) => (
                          <Button
                            key={model.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addModelCompatibility(model.id)}
                            disabled={compatibilities.some(c => c.deviceModelId === model.id)}
                            data-testid={`button-add-model-${model.id}`}
                          >
                            {model.modelName}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {compatibilities.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("products.selectedCompatibilities")}:</Label>
                      <div className="flex flex-wrap gap-2">
                        {compatibilities.map((compat, index) => (
                          <Badge key={index} variant="secondary" className="flex flex-wrap items-center gap-1">
                            {compat.deviceBrandName}{compat.deviceModelName ? ` - ${compat.deviceModelName}` : ` (${t("products.allModels")})`}
                            <X className="h-3 w-3 cursor-pointer" onClick={() => removeCompatibility(index)} />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {compatibilities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("products.noCompatibilitySelected")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
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
                        <h4 className="font-semibold text-lg">{values.name || t("products.nameNotEntered")}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{values.brand}</Badge>
                          <Badge variant="outline">
                            {ACCESSORY_TYPES.find(t => t.value === values.accessoryType)?.label}
                          </Badge>
                          <Badge>{values.condition}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("common.color")}</Label>
                        <p className="font-medium">{values.color || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("products.material")}</Label>
                        <p className="font-medium">{values.material || "-"}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground">{t("products.universal")}</Label>
                      <Badge className="mt-1">{values.isUniversal ? t("common.yes") : t("common.no")}</Badge>
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
                    </div>

                    {form.watch("supplierId") && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">{t("common.supplier")}</Label>
                        <p className="font-medium">{suppliers.find(s => s.id === form.watch("supplierId"))?.name || "-"}</p>
                      </div>
                    )}

                    {values.initialStock.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">{t("warehouse.initialStock")}</Label>
                        <div className="mt-2 space-y-1">
                          {values.initialStock.map((stock, i) => {
                            const wh = warehouses.find((w: any) => w.id === stock.warehouseId);
                            return (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{wh?.name || t("common.warehouse")}</span>
                                <span className="font-medium">{t("products.pcsCount", { count: stock.quantity })}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {compatibilities.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">{t("products.compatibility")}</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {compatibilities.map((compat, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {compat.deviceBrandName}{compat.deviceModelName ? ` ${compat.deviceModelName}` : ` (${t("products.allModelsShort")})`}
                            </Badge>
                          ))}
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

              {currentStep < 4 ? (
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
                  {t("products.saveAccessory")}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
