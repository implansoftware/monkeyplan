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
  Wrench, Euro, CheckCircle2, 
  ChevronRight, ChevronLeft, Loader2, ImagePlus, X, Warehouse
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SparePartWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: any) => void;
  editingProduct?: any;
}

const wizardSchema = z.object({
  name: z.string().min(1, "Nome obbligatorio"),
  sku: z.string().optional(),
  partCode: z.string().optional(),
  description: z.string().optional(),
  partType: z.string().min(1, "Seleziona il tipo"),
  quality: z.string().min(1, "Seleziona la qualità"),
  compatibleModels: z.string().optional(),
  notes: z.string().optional(),
  warrantyMonths: z.string().default("3"),
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
  { id: 1, name: "Info Base", icon: Wrench },
  { id: 2, name: "Prezzo & Stock", icon: Euro },
  { id: 3, name: "Conferma", icon: CheckCircle2 },
];

const PART_TYPES = [
  { value: "display", label: "Display / Schermo" },
  { value: "batteria", label: "Batteria" },
  { value: "fotocamera", label: "Fotocamera" },
  { value: "connettore", label: "Connettore di Ricarica" },
  { value: "altoparlante", label: "Altoparlante / Speaker" },
  { value: "microfono", label: "Microfono" },
  { value: "tasto", label: "Tasto / Pulsante" },
  { value: "flex", label: "Flat / Flex Cable" },
  { value: "scheda_madre", label: "Scheda Madre" },
  { value: "frame", label: "Frame / Telaio" },
  { value: "vetro", label: "Vetro Posteriore" },
  { value: "antenna", label: "Antenna" },
  { value: "sensore", label: "Sensore" },
  { value: "altro", label: "Altro" },
];

const QUALITY_OPTIONS = [
  { value: "originale", label: "Originale (OEM)" },
  { value: "originale_rigenerato", label: "Originale Rigenerato" },
  { value: "compatibile_alta", label: "Compatibile Alta Qualità" },
  { value: "compatibile", label: "Compatibile Standard" },
  { value: "aftermarket", label: "Aftermarket" },
];


export function SparePartWizard({ 
  open, 
  onOpenChange, 
  onSuccess,
  editingProduct 
}: SparePartWizardProps) {
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
  const isReseller = user?.role === "reseller" || user?.role === "reseller_staff";

  const form = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      name: "",
      sku: "",
      partCode: "",
      description: "",
      partType: "display",
      quality: "compatibile_alta",
      compatibleModels: "",
      notes: "",
      warrantyMonths: "3",
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

  const createMutation = useMutation({
    mutationFn: async (data: WizardData) => {
      const productData = {
        name: data.name,
        sku: data.sku || undefined,
        partCode: data.partCode,
        description: data.description,
        type: "spare_part",
        unitPriceCents: Math.round(parseFloat(data.unitPrice) * 100),
        costPriceCents: data.costPrice ? Math.round(parseFloat(data.costPrice) * 100) : undefined,
        warrantyMonths: parseInt(data.warrantyMonths),
      };
      const specsData = {
        partType: data.partType,
        quality: data.quality,
        compatibleModels: data.compatibleModels,
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
        const response = await fetch("/api/spare-parts", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!response.ok) throw new Error("Errore creazione ricambio");
        createdProduct = await response.json();
      } else {
        const response = await apiRequest("POST", "/api/spare-parts", {
          product: productData,
          specs: specsData,
          initialStock: data.initialStock.length > 0 ? data.initialStock : undefined,
        });
        createdProduct = await response.json();
      }

      return createdProduct;
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Ricambio creato", description: `${form.getValues("name")} aggiunto al catalogo` });
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
      fieldsToValidate = ["name", "partType", "quality"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["unitPrice"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit if we're on the final step (step 3)
    if (currentStep !== 3) return;
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
            {editingProduct ? "Modifica Ricambio" : "Nuovo Ricambio"}
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
                  <Wrench className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">Informazioni Base</h3>
                  <p className="text-sm text-muted-foreground">Inserisci i dati principali del ricambio</p>
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
                  name="partType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Ricambio *</FormLabel>
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {PART_TYPES.map(type => (
                          <Card
                            key={type.value}
                            className={cn(
                              "cursor-pointer transition-all hover-elevate",
                              field.value === type.value && "ring-2 ring-primary"
                            )}
                            onClick={() => field.onChange(type.value)}
                          >
                            <CardContent className="p-3 text-center">
                              <span className="text-xs font-medium">{type.label}</span>
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
                      <FormLabel>Nome Ricambio *</FormLabel>
                      <FormControl>
                        <Input placeholder="es. Display iPhone 14 Pro OLED" {...field} data-testid="input-part-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualità *</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {QUALITY_OPTIONS.map(opt => (
                          <Card
                            key={opt.value}
                            className={cn(
                              "cursor-pointer transition-all hover-elevate",
                              field.value === opt.value && "ring-2 ring-primary"
                            )}
                            onClick={() => field.onChange(opt.value)}
                          >
                            <CardContent className="p-3 text-center">
                              <span className="text-sm font-medium">{opt.label}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU / Codice Interno</FormLabel>
                        <FormControl>
                          <Input placeholder="Codice interno" {...field} data-testid="input-part-sku" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="partCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Codice Fornitore</FormLabel>
                        <FormControl>
                          <Input placeholder="Codice originale" {...field} data-testid="input-part-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
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
                            data-testid="input-part-price"
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
                            data-testid="input-part-cost"
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
                          <SelectTrigger data-testid="select-part-warranty">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Nessuna</SelectItem>
                          <SelectItem value="1">1 mese</SelectItem>
                          <SelectItem value="3">3 mesi</SelectItem>
                          <SelectItem value="6">6 mesi</SelectItem>
                          <SelectItem value="12">12 mesi</SelectItem>
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

            {currentStep === 3 && (
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
                          <Badge variant="secondary">
                            {PART_TYPES.find(t => t.value === values.partType)?.label}
                          </Badge>
                          <Badge variant="outline">
                            {QUALITY_OPTIONS.find(q => q.value === values.quality)?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">SKU</Label>
                        <p className="font-medium">{values.sku || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Codice Fornitore</Label>
                        <p className="font-medium">{values.partCode || "-"}</p>
                      </div>
                    </div>

                    {values.compatibleModels && (
                      <div className="pt-4 border-t">
                        <Label className="text-xs text-muted-foreground">Note Compatibilità</Label>
                        <p className="text-sm mt-1">{values.compatibleModels}</p>
                      </div>
                    )}

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

              {currentStep < 3 ? (
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
                  Salva Ricambio
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
