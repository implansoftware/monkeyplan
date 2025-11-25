import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertRepairOrderSchema, insertRepairAcceptanceSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Smartphone, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AcceptanceWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (order: any) => void;
  customerId?: string;
}

type WizardStep = "device-info" | "acceptance-checks" | "review";

const acceptanceWizardSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  deviceType: z.string().min(1, "Device type required"),
  deviceModel: z.string().optional(),
  brand: z.string().optional(),
  issueDescription: z.string().min(1, "Issue description required"),
  notes: z.string().optional(),
  imei: z.string().optional(),
  serial: z.string().optional(),
  imeiNotReadable: z.boolean().optional(),
  imeiNotPresent: z.boolean().optional(),
  serialOnly: z.boolean().optional(),
  acceptance: z.object({
    declaredDefects: z.string().optional(),
    aestheticCondition: z.string().optional(),
    aestheticNotes: z.string().optional(),
    aestheticPhotosMandatory: z.boolean().optional(),
    accessories: z.string().optional(),
    lockCode: z.string().optional(),
    lockPattern: z.string().optional(),
    hasLockCode: z.boolean().optional(),
    accessoriesRemoved: z.boolean().optional(),
  }),
});

type AcceptanceWizardData = z.infer<typeof acceptanceWizardSchema>;

export function AcceptanceWizardDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  customerId 
}: AcceptanceWizardDialogProps) {
  const [step, setStep] = useState<WizardStep>("device-info");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: customers = [] } = useQuery<Array<{
    id: string;
    fullName: string;
    email: string;
  }>>({
    queryKey: ["/api/users"],
    select: (data: any[]) => data.filter((u) => u.role === "customer"),
    enabled: user?.role === "admin" || user?.role === "repair_center",
  });

  const { data: deviceTypes = [] } = useQuery<Array<{
    id: string;
    name: string;
  }>>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands = [] } = useQuery<Array<{
    id: string;
    name: string;
  }>>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [], refetch: refetchModels } = useQuery<Array<{
    id: string;
    modelName: string;
    brandId: string;
    typeId: string;
  }>>({
    queryKey: ["/api/device-models", { typeId: selectedTypeId, brandId: selectedBrandId }],
    queryFn: async () => {
      const params = new URLSearchParams({ 
        typeId: selectedTypeId, 
        brandId: selectedBrandId 
      });
      const res = await fetch(`/api/device-models?${params}`);
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    enabled: !!selectedTypeId && !!selectedBrandId,
  });

  const form = useForm<AcceptanceWizardData>({
    resolver: zodResolver(acceptanceWizardSchema),
    defaultValues: {
      customerId: customerId || "",
      deviceType: "",
      deviceModel: "",
      brand: "",
      issueDescription: "",
      notes: "",
      imei: "",
      serial: "",
      imeiNotReadable: false,
      imeiNotPresent: false,
      serialOnly: false,
      acceptance: {
        declaredDefects: "",
        aestheticCondition: "",
        aestheticNotes: "",
        aestheticPhotosMandatory: false,
        accessories: "",
        lockCode: "",
        lockPattern: "",
        hasLockCode: false,
        accessoriesRemoved: false,
      },
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: AcceptanceWizardData) => {
      const response = await apiRequest("POST", "/api/repair-orders", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      toast({
        title: "Riparazione ingressata",
        description: `Ordine ${data.order.orderNumber} creato con successo`,
      });
      handleClose();
      if (onSuccess) onSuccess(data);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile creare l'ordine",
      });
    },
  });

  const handleNext = async () => {
    let fieldsToValidate: (keyof AcceptanceWizardData)[] = [];
    
    if (step === "device-info") {
      fieldsToValidate = ["customerId", "deviceType", "issueDescription"];
    }
    
    const isValid = await form.trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined);
    
    if (isValid) {
      if (step === "device-info") {
        setStep("acceptance-checks");
      } else if (step === "acceptance-checks") {
        setStep("review");
      }
    }
  };

  const handleBack = () => {
    if (step === "acceptance-checks") {
      setStep("device-info");
    } else if (step === "review") {
      setStep("acceptance-checks");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit if we're on the review step
    if (step !== "review") {
      return;
    }
    
    form.handleSubmit((data) => {
      const payload = {
        ...data,
        acceptance: {
          ...data.acceptance,
          declaredDefects: data.acceptance.declaredDefects 
            ? data.acceptance.declaredDefects.split('\n').filter(d => d.trim())
            : [],
          accessories: data.acceptance.accessories
            ? data.acceptance.accessories.split(',').map(a => a.trim()).filter(a => a)
            : [],
        }
      };
      createOrderMutation.mutate(payload as any);
    })();
  };

  const handleClose = () => {
    form.reset();
    setStep("device-info");
    onOpenChange(false);
  };

  const renderDeviceInfoStep = () => (
    <div className="space-y-4">
      {(user?.role === "admin" || user?.role === "repair_center") && (
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-customer">
                    <SelectValue placeholder="Seleziona cliente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.fullName} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Seleziona il cliente per cui stai creando l'ordine di riparazione
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="deviceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo dispositivo *</FormLabel>
            <Select 
              onValueChange={(name) => {
                field.onChange(name);
                const type = deviceTypes.find(t => t.name === name);
                setSelectedTypeId(type?.id || "");
                form.setValue("brand", "");
                form.setValue("deviceModel", "");
                setSelectedBrandId("");
              }} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger data-testid="select-device-type">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {deviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="brand"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand</FormLabel>
            <Select 
              onValueChange={(name) => {
                field.onChange(name);
                const brand = deviceBrands.find(b => b.name === name);
                setSelectedBrandId(brand?.id || "");
                form.setValue("deviceModel", "");
              }} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger data-testid="select-brand">
                  <SelectValue placeholder="Seleziona brand" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {deviceBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="deviceModel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Modello</FormLabel>
            {selectedTypeId && selectedBrandId && deviceModels.length > 0 ? (
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-device-model">
                    <SelectValue placeholder="Seleziona modello" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {deviceModels.map((model) => (
                    <SelectItem key={model.id} value={model.modelName}>
                      {model.modelName}
                    </SelectItem>
                  ))}
                  <SelectItem value="__other__">Altro (inserimento manuale)</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <FormControl>
                <Input {...field} placeholder="es. iPhone 13 Pro, Galaxy S21" data-testid="input-device-model" />
              </FormControl>
            )}
            <FormDescription>
              {selectedTypeId && selectedBrandId && deviceModels.length === 0 && "Nessun modello disponibile, inserisci manualmente"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="imei"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IMEI</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Codice IMEI" 
                  disabled={form.watch("imeiNotReadable") || form.watch("imeiNotPresent")}
                  data-testid="input-imei"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="imeiNotReadable"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-imei-not-readable"
                  />
                </FormControl>
                <FormLabel className="font-normal">IMEI non leggibile</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imeiNotPresent"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-imei-not-present"
                  />
                </FormControl>
                <FormLabel className="font-normal">IMEI non presente</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="serial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di serie</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Serial number" data-testid="input-serial" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serialOnly"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-serial-only"
                />
              </FormControl>
              <FormLabel className="font-normal">Solo numero di serie</FormLabel>
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <FormField
        control={form.control}
        name="issueDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrizione problema *</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Descrivi il problema riportato dal cliente"
                rows={3}
                data-testid="textarea-issue-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note aggiuntive</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Note interne"
                rows={2}
                data-testid="textarea-notes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderAcceptanceChecksStep = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="acceptance.declaredDefects"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Difetti dichiarati</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Un difetto per riga (es: Schermo rotto, Batteria non si ricarica)"
                rows={3}
                data-testid="textarea-declared-defects"
              />
            </FormControl>
            <FormDescription>
              Inserisci un difetto per riga
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acceptance.aestheticCondition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condizioni estetiche</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-aesthetic-condition">
                  <SelectValue placeholder="Seleziona condizione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ottimo">Ottimo</SelectItem>
                <SelectItem value="buono">Buono</SelectItem>
                <SelectItem value="discreto">Discreto</SelectItem>
                <SelectItem value="scadente">Scadente</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acceptance.aestheticNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note estetiche</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Graffi, ammaccature, segni di usura..."
                rows={2}
                data-testid="textarea-aesthetic-notes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acceptance.aestheticPhotosMandatory"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-photos-mandatory"
              />
            </FormControl>
            <FormLabel className="font-normal">Foto obbligatorie per documentazione</FormLabel>
          </FormItem>
        )}
      />

      <Separator />

      <FormField
        control={form.control}
        name="acceptance.accessories"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Accessori consegnati</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Separa con virgole (es: Caricabatterie, Custodia, Cavo USB)"
                rows={2}
                data-testid="textarea-accessories"
              />
            </FormControl>
            <FormDescription>
              Separa gli accessori con virgole
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acceptance.accessoriesRemoved"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-accessories-removed"
              />
            </FormControl>
            <FormLabel className="font-normal">Accessori rimossi prima dell'accettazione</FormLabel>
          </FormItem>
        )}
      />

      <Separator />

      <FormField
        control={form.control}
        name="acceptance.hasLockCode"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-has-lock-code"
              />
            </FormControl>
            <FormLabel className="font-normal">Il dispositivo ha un codice di blocco</FormLabel>
          </FormItem>
        )}
      />

      {form.watch("acceptance.hasLockCode") && (
        <>
          <FormField
            control={form.control}
            name="acceptance.lockCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice PIN/Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password"
                    placeholder="Codice di sblocco"
                    data-testid="input-lock-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptance.lockPattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sequenza sblocco</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Descrizione sequenza (es. L invertita)"
                    data-testid="input-lock-pattern"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );

  const renderReviewStep = () => {
    const formData = form.getValues();
    const selectedCustomer = customers.find((c) => c.id === formData.customerId);
    
    return (
      <div className="space-y-4">
        {(user?.role === "admin" || user?.role === "repair_center") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium" data-testid="text-review-customer">
                {selectedCustomer ? `${selectedCustomer.fullName} (${selectedCustomer.email})` : "-"}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informazioni dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Tipo:</div>
              <div className="font-medium" data-testid="text-review-device-type">{formData.deviceType || "-"}</div>
              
              <div className="text-muted-foreground">Brand:</div>
              <div className="font-medium" data-testid="text-review-brand">{formData.brand || "-"}</div>
              
              <div className="text-muted-foreground">Modello:</div>
              <div className="font-medium" data-testid="text-review-model">{formData.deviceModel || "-"}</div>
              
              <div className="text-muted-foreground">IMEI:</div>
              <div className="font-medium" data-testid="text-review-imei">
                {formData.imeiNotReadable ? "Non leggibile" : 
                 formData.imeiNotPresent ? "Non presente" : 
                 formData.imei || "-"}
              </div>
              
              <div className="text-muted-foreground">Serial:</div>
              <div className="font-medium" data-testid="text-review-serial">
                {formData.serialOnly ? `Solo serial: ${formData.serial}` : formData.serial || "-"}
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div>
              <div className="text-muted-foreground mb-1">Problema:</div>
              <div className="font-medium" data-testid="text-review-issue">{formData.issueDescription}</div>
            </div>
            
            {formData.notes && (
              <div>
                <div className="text-muted-foreground mb-1">Note:</div>
                <div className="font-medium" data-testid="text-review-notes">{formData.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Controlli accettazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {formData.acceptance.declaredDefects && (
              <div>
                <div className="text-muted-foreground mb-1">Difetti dichiarati:</div>
                <div className="font-medium" data-testid="text-review-defects">{formData.acceptance.declaredDefects}</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Condizioni estetiche:</div>
              <div className="font-medium capitalize" data-testid="text-review-aesthetic">
                {formData.acceptance.aestheticCondition || "-"}
              </div>
            </div>
            
            {formData.acceptance.aestheticNotes && (
              <div>
                <div className="text-muted-foreground mb-1">Note estetiche:</div>
                <div className="font-medium" data-testid="text-review-aesthetic-notes">{formData.acceptance.aestheticNotes}</div>
              </div>
            )}
            
            {formData.acceptance.accessories && (
              <div>
                <div className="text-muted-foreground mb-1">Accessori:</div>
                <div className="font-medium" data-testid="text-review-accessories">{formData.acceptance.accessories}</div>
              </div>
            )}
            
            <div className="flex flex-col gap-1 mt-2">
              {formData.acceptance.aestheticPhotosMandatory && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span>Foto obbligatorie richieste</span>
                </div>
              )}
              {formData.acceptance.accessoriesRemoved && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Accessori rimossi</span>
                </div>
              )}
              {formData.acceptance.hasLockCode && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span>Codice di blocco fornito</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-md bg-muted p-4 text-sm">
          <p className="font-medium mb-1">Nota importante</p>
          <p className="text-muted-foreground">
            Dopo la conferma, l'ordine verrà creato con stato "Ingressato" 
            e sarà pronto per la fase di diagnosi.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Accettazione dispositivo - {step === "device-info" ? "Passo 1/3" : step === "acceptance-checks" ? "Passo 2/3" : "Passo 3/3"}
          </DialogTitle>
          <DialogDescription>
            {step === "device-info" && "Inserisci le informazioni del dispositivo e i codici identificativi"}
            {step === "acceptance-checks" && "Verifica le condizioni del dispositivo e gli accessori"}
            {step === "review" && "Controlla i dati inseriti prima di confermare"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "device-info" && renderDeviceInfoStep()}
            {step === "acceptance-checks" && renderAcceptanceChecksStep()}
            {step === "review" && renderReviewStep()}

            <Separator />

            <div className="flex justify-between gap-2">
              {step !== "device-info" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Indietro
                </Button>
              )}
              
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  data-testid="button-cancel"
                >
                  Annulla
                </Button>
                
                {step !== "review" ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    data-testid="button-next"
                  >
                    Avanti
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={createOrderMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createOrderMutation.isPending ? "Creazione..." : "Conferma ingresso"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
