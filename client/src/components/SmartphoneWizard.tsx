import { useState, useRef } from "react";
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

interface SmartphoneWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: any) => void;
  editingProduct?: any;
}

const wizardSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  sku: z.string().optional(),
  brand: z.string().min(1, "Seleziona la marca"),
  color: z.string().optional(),
  description: z.string().optional(),
  condition: z.string().min(1, "Seleziona la condizione"),
  storage: z.string().min(1, "Seleziona la memoria"),
  batteryHealth: z.string().optional(),
  grade: z.string().min(1, "Seleziona il grado"),
  networkLock: z.string().default("unlocked"),
  imei: z.string().optional(),
  imei2: z.string().optional(),
  serialNumber: z.string().optional(),
  originalBox: z.boolean().default(false),
  accessories: z.array(z.string()).default([]),
  notes: z.string().optional(),
  warrantyMonths: z.string().default("12"),
  unitPrice: z.string().min(1, "Prezzo vendita obbligatorio"),
  costPrice: z.string().optional(),
  initialStock: z.array(z.object({
    warehouseId: z.string(),
    quantity: z.number(),
    location: z.string(),
  })).default([]),
});

type WizardData = z.infer<typeof wizardSchema>;

const STEPS = [
  { id: 1, name: "Info Base", icon: Smartphone },
  { id: 2, name: "Specifiche", icon: Package },
  { id: 3, name: "Prezzo & Stock", icon: Euro },
  { id: 4, name: "Compatibilità", icon: Link2 },
  { id: 5, name: "Conferma", icon: CheckCircle2 },
];

interface CompatibilityEntry {
  deviceBrandId: string;
  deviceModelId: string | null;
}

const STORAGE_OPTIONS = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Motorola", "Sony", "Nokia", "Altro"];
const COLOR_OPTIONS = [
  "Nero", "Bianco", "Argento", "Grigio", "Oro", "Oro Rosa", "Blu", "Blu Notte", 
  "Verde", "Verde Alpino", "Viola", "Rosso", "Giallo", "Arancione", "Rosa", "Titanio Nero", 
  "Titanio Naturale", "Titanio Blu", "Titanio Bianco", "Altro"
];
const GRADE_OPTIONS = [
  { value: "A+", label: "A+ - Come nuovo" },
  { value: "A", label: "A - Ottimo" },
  { value: "B", label: "B - Buono" },
  { value: "C", label: "C - Discreto" },
  { value: "D", label: "D - Danneggiato" },
];
const CONDITION_OPTIONS = [
  { value: "nuovo", label: "Nuovo" },
  { value: "ricondizionato", label: "Ricondizionato" },
  { value: "usato", label: "Usato" },
  { value: "difettoso", label: "Difettoso" },
];
const NETWORK_LOCK_OPTIONS = [
  { value: "unlocked", label: "Sbloccato" },
  { value: "locked", label: "Bloccato operatore" },
  { value: "icloud_locked", label: "Bloccato iCloud" },
];
const BATTERY_OPTIONS = [
  { value: "100", label: "100%" },
  { value: "95-99", label: "95-99%" },
  { value: "90-94", label: "90-94%" },
  { value: "85-89", label: "85-89%" },
  { value: "80-84", label: "80-84%" },
  { value: "<80", label: "Meno di 80%" },
];
const ACCESSORY_OPTIONS = [
  "Caricatore originale",
  "Cavo USB",
  "Auricolari",
  "Cover",
  "Pellicola",
  "Scatola originale",
  "Manuale",
];

export function SmartphoneWizard({ 
  open, 
  onOpenChange, 
  onSuccess,
  editingProduct 
}: SmartphoneWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
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
      initialStock: [],
    },
  });

  const warehouseEndpoint = isAdmin 
    ? "/api/admin/all-warehouses" 
    : isReseller 
      ? "/api/reseller/warehouses" 
      : "/api/repair-center/warehouses";

  const { data: warehouses = [] } = useQuery<any[]>({
    queryKey: [warehouseEndpoint],
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
      toast({ title: "Compatibilità già aggiunta", variant: "destructive" });
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
      toast({ title: "Compatibilità già aggiunta", variant: "destructive" });
      return;
    }
    setCompatibilities([...compatibilities, { deviceBrandId: selectedBrandId, deviceModelId: modelId }]);
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
        type: "smartphone",
        unitPriceCents: Math.round(parseFloat(data.unitPrice) * 100),
        costPriceCents: data.costPrice ? Math.round(parseFloat(data.costPrice) * 100) : undefined,
        condition: data.condition,
        warrantyMonths: parseInt(data.warrantyMonths),
      };
      const specsData = {
        brand: data.brand,
        color: data.color,
        storage: data.storage,
        batteryHealth: data.batteryHealth,
        grade: data.grade,
        networkLock: data.networkLock,
        imei: data.imei,
        imei2: data.imei2,
        serialNumber: data.serialNumber,
        originalBox: data.originalBox,
        accessories: data.accessories,
        notes: data.notes,
      };

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
        if (!response.ok) throw new Error("Errore creazione smartphone");
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
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      toast({ title: "Smartphone creato", description: `${form.getValues("name")} aggiunto al catalogo` });
      handleClose();
      onSuccess?.(newProduct);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      fieldsToValidate = ["name", "brand", "condition"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["storage", "grade"];
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

  const handleSubmit = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingProduct ? "Modifica Smartphone" : "Nuovo Smartphone"}
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
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <Smartphone className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">Informazioni Base</h3>
                  <p className="text-sm text-muted-foreground">Inserisci i dati principali dello smartphone</p>
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
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
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
                      <span className="text-xs">Aggiungi foto</span>
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Prodotto *</FormLabel>
                      <FormControl>
                        <Input placeholder="es. iPhone 14 Pro 128GB" {...field} data-testid="input-smartphone-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-smartphone-brand">
                              <SelectValue placeholder="Seleziona marca" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BRANDS.map(brand => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
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
                        <FormLabel>Colore</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-smartphone-color">
                              <SelectValue placeholder="Seleziona colore" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COLOR_OPTIONS.map(color => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
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
                      <FormLabel>Condizione *</FormLabel>
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
                      <FormLabel>SKU / Codice</FormLabel>
                      <FormControl>
                        <Input placeholder="Codice interno (opzionale)" {...field} data-testid="input-smartphone-sku" />
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
                  <Package className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">Specifiche Tecniche</h3>
                  <p className="text-sm text-muted-foreground">Dettagli tecnici e identificativi</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="storage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Memoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-smartphone-storage">
                              <SelectValue placeholder="Seleziona" />
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

                  <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grado Estetico *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-smartphone-grade">
                              <SelectValue placeholder="Seleziona" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="batteryHealth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Batteria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-smartphone-battery">
                              <SelectValue placeholder="Salute batteria" />
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

                  <FormField
                    control={form.control}
                    name="networkLock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blocco Rete</FormLabel>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="imei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMEI</FormLabel>
                        <FormControl>
                          <Input placeholder="Codice IMEI" {...field} data-testid="input-smartphone-imei" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero di Serie</FormLabel>
                        <FormControl>
                          <Input placeholder="S/N" {...field} data-testid="input-smartphone-serial" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="originalBox"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-original-box"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Scatola originale inclusa</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accessories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accessori Inclusi</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {ACCESSORY_OPTIONS.map(acc => (
                          <div key={acc} className="flex items-center gap-2">
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Note aggiuntive sul prodotto..." 
                          {...field} 
                          data-testid="textarea-smartphone-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <Euro className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">Prezzo & Magazzino</h3>
                  <p className="text-sm text-muted-foreground">Configura prezzi e disponibilità</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prezzo Vendita (€) *</FormLabel>
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
                        <FormLabel>Costo Acquisto (€)</FormLabel>
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

                <FormField
                  control={form.control}
                  name="warrantyMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garanzia (mesi)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-smartphone-warranty">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Nessuna</SelectItem>
                          <SelectItem value="3">3 mesi</SelectItem>
                          <SelectItem value="6">6 mesi</SelectItem>
                          <SelectItem value="12">12 mesi</SelectItem>
                          <SelectItem value="24">24 mesi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Stock Iniziale</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addWarehouseStock}>
                      <Warehouse className="h-4 w-4 mr-1" />
                      Aggiungi Magazzino
                    </Button>
                  </div>

                  {values.initialStock.map((stock, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-end">
                          <div className="flex-1">
                            <Label className="text-xs">Magazzino</Label>
                            <Select
                              value={stock.warehouseId}
                              onValueChange={(value) => {
                                const current = form.getValues("initialStock");
                                current[index].warehouseId = value;
                                form.setValue("initialStock", [...current]);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses.map((w: any) => (
                                  <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-24">
                            <Label className="text-xs">Quantità</Label>
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
                            <Label className="text-xs">Posizione</Label>
                            <Input
                              placeholder="es. A-01"
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
                  <h3 className="text-lg font-medium">Compatibilità Dispositivi</h3>
                  <p className="text-sm text-muted-foreground">
                    Seleziona i dispositivi compatibili con questo prodotto (opzionale)
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs mb-1 block">Marca Dispositivo</Label>
                        <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona marca" />
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
                          Tutti i modelli
                        </Button>
                      </div>
                    </div>

                    {selectedBrandId && deviceModels.length > 0 && (
                      <div>
                        <Label className="text-xs mb-2 block">Oppure seleziona modelli specifici:</Label>
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
                                {model.name}
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
                          Compatibilità selezionate ({compatibilities.length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {compatibilities.map((compat, index) => {
                            const brand = deviceBrands.find(b => b.id === compat.deviceBrandId);
                            let label = brand?.name || "Marca";
                            if (compat.deviceModelId) {
                              const allModels = deviceModels.filter(m => m.brandId === compat.deviceBrandId);
                              const model = allModels.find(m => m.id === compat.deviceModelId);
                              label = `${brand?.name || ""} ${model?.name || "Modello"}`;
                            } else {
                              label = `${brand?.name || "Marca"} (tutti)`;
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
                        Nessuna compatibilità selezionata. Puoi saltare questo passaggio.
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
                  <h3 className="text-lg font-medium">Riepilogo</h3>
                  <p className="text-sm text-muted-foreground">Verifica i dati prima di salvare</p>
                </div>

                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      )}
                      <div>
                        <h4 className="font-semibold text-lg">{values.name || "Nome non inserito"}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{values.brand}</Badge>
                          <Badge variant="outline">{values.condition}</Badge>
                          <Badge>{values.storage}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">Grado</Label>
                        <p className="font-medium">{values.grade}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Colore</Label>
                        <p className="font-medium">{values.color || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Batteria</Label>
                        <p className="font-medium">{values.batteryHealth || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Blocco Rete</Label>
                        <p className="font-medium">{NETWORK_LOCK_OPTIONS.find(o => o.value === values.networkLock)?.label}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">Prezzo Vendita</Label>
                        <p className="font-semibold text-lg text-primary">€{values.unitPrice || "0"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Costo Acquisto</Label>
                        <p className="font-medium">€{values.costPrice || "-"}</p>
                      </div>
                    </div>

                    {values.initialStock.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">Stock Iniziale</Label>
                        <div className="mt-2 space-y-1">
                          {values.initialStock.map((stock, i) => {
                            const wh = warehouses.find((w: any) => w.id === stock.warehouseId);
                            return (
                              <div key={i} className="flex justify-between text-sm">
                                <span>{wh?.name || "Magazzino"}</span>
                                <span className="font-medium">{stock.quantity} pz</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {values.accessories.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">Accessori</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {values.accessories.map(acc => (
                            <Badge key={acc} variant="outline" className="text-xs">{acc}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {compatibilities.length > 0 && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">Compatibilità Dispositivi</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {compatibilities.map((compat, index) => {
                            const brand = deviceBrands.find(b => b.id === compat.deviceBrandId);
                            let label = brand?.name || "Marca";
                            if (!compat.deviceModelId) {
                              label = `${brand?.name || "Marca"} (tutti)`;
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
                {currentStep === 1 ? "Annulla" : "Indietro"}
              </Button>

              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext} data-testid="button-wizard-next">
                  Avanti
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  data-testid="button-wizard-submit"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salva Smartphone
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
