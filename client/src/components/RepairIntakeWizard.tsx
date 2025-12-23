import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  User, Smartphone, ClipboardCheck, CheckCircle2, 
  ChevronRight, ChevronLeft, Loader2, Plus, Search,
  Monitor, Tablet, Laptop, Tv, Gamepad2, Watch, Headphones, Printer,
  AlertCircle, UserPlus, X, Mail, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RepairIntakeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (order: any) => void;
}

// Wizard schema - includes acceptance flow fields
const wizardSchema = z.object({
  // Step 1: Customer
  customerId: z.string().min(1, "Seleziona un cliente"),
  
  // Step 2: Device
  deviceType: z.string().min(1, "Seleziona il tipo di dispositivo"),
  deviceBrandId: z.string().optional(),
  deviceModelId: z.string().optional(),
  deviceModel: z.string().optional(),
  brand: z.string().optional(),
  imei: z.string().optional(),
  serial: z.string().optional(),
  // IMEI flags
  imeiNotReadable: z.boolean().default(false),
  imeiNotPresent: z.boolean().default(false),
  serialOnly: z.boolean().default(false),
  issueDescription: z.string().min(1, "Descrivi il problema"),
  
  // Step 3: Conditions
  aestheticCondition: z.string().optional(),
  accessories: z.array(z.string()).default([]),
  notes: z.string().optional(),
  
  // Step 4: Confirm
  repairCenterId: z.string().optional(),
});

type WizardData = z.infer<typeof wizardSchema>;

const STEPS = [
  { id: 1, name: "Cliente", icon: User },
  { id: 2, name: "Dispositivo", icon: Smartphone },
  { id: 3, name: "Condizioni", icon: ClipboardCheck },
  { id: 4, name: "Conferma", icon: CheckCircle2 },
];

const DEVICE_TYPE_ICONS: Record<string, any> = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  pc: Monitor,
  tv: Tv,
  console: Gamepad2,
  smartwatch: Watch,
  cuffie: Headphones,
  stampante: Printer,
};

const AESTHETIC_CONDITIONS = [
  { value: "new", label: "Come nuovo", color: "bg-green-500" },
  { value: "good", label: "Buono", color: "bg-blue-500" },
  { value: "fair", label: "Usura normale", color: "bg-yellow-500" },
  { value: "poor", label: "Danneggiato", color: "bg-red-500" },
];

export function RepairIntakeWizard({ 
  open, 
  onOpenChange, 
  onSuccess 
}: RepairIntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ fullName: "", email: "", phone: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const form = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      customerId: "",
      deviceType: "",
      deviceBrandId: "",
      deviceModelId: "",
      deviceModel: "",
      brand: "",
      imei: "",
      serial: "",
      imeiNotReadable: false,
      imeiNotPresent: false,
      serialOnly: false,
      issueDescription: "",
      aestheticCondition: "",
      accessories: [],
      notes: "",
      repairCenterId: "",
    },
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setCustomerSearch("");
      setSelectedTypeId("");
      setSelectedBrandId("");
      setShowNewCustomerForm(false);
      setNewCustomerForm({ fullName: "", email: "", phone: "" });
      form.reset();
    }
  }, [open, form]);

  // Queries
  const customerEndpoint = user?.role === "reseller" ? "/api/reseller/customers" : "/api/customers";

  // Mutation per creare nuovo cliente rapido
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { fullName: string; email?: string; phone?: string }) => {
      return apiRequest("POST", "/api/customers/quick", data);
    },
    onSuccess: async (response) => {
      const newCustomer = await response.json();
      // Invalida la cache clienti
      queryClient.invalidateQueries({ queryKey: [customerEndpoint] });
      // Seleziona automaticamente il nuovo cliente
      form.setValue("customerId", newCustomer.id);
      // Chiudi il form e resetta
      setShowNewCustomerForm(false);
      setNewCustomerForm({ fullName: "", email: "", phone: "" });
      toast({ 
        title: "Cliente creato", 
        description: `${newCustomer.fullName} è stato aggiunto` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile creare il cliente", 
        variant: "destructive" 
      });
    },
  });
  const { data: customers = [] } = useQuery<Array<{
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  }>>({
    queryKey: [customerEndpoint],
    select: (data: any[]) => data?.map((u: any) => ({
      id: u.id,
      fullName: u.fullName || u.companyName || u.username || "Cliente",
      email: u.email || "",
      phone: u.phone || "",
    })) || [],
  });

  const { data: deviceTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-types"],
  });

  const isResellerOrStaff = ["reseller", "reseller_staff"].includes(user?.role || "");

  const { data: deviceBrands = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: isResellerOrStaff 
      ? ["/api/reseller/device-brands", { includeGlobal: true }]
      : ["/api/device-brands"],
    queryFn: async () => {
      const url = isResellerOrStaff 
        ? "/api/reseller/device-brands?includeGlobal=true"
        : "/api/device-brands";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const { data: deviceModels = [] } = useQuery<Array<{ 
    id: string; 
    modelName: string; 
    brandId: string;
  }>>({
    queryKey: isResellerOrStaff
      ? ["/api/reseller/device-models", { typeId: selectedTypeId, includeGlobal: true }]
      : ["/api/device-models", { typeId: selectedTypeId }],
    queryFn: async () => {
      const params = new URLSearchParams({ typeId: selectedTypeId });
      if (isResellerOrStaff) params.append("includeGlobal", "true");
      const url = isResellerOrStaff 
        ? `/api/reseller/device-models?${params}`
        : `/api/device-models?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const { data: repairCenters = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: user?.role === "reseller" 
      ? ["/api/reseller/repair-centers"]
      : ["/api/repair-centers"],
    enabled: user?.role === "admin" || user?.role === "reseller",
  });

  const { data: accessoryTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/accessory-types", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? `?deviceTypeId=${selectedTypeId}` : "";
      const res = await fetch(`/api/accessory-types${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  // Filter customers by search
  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Filter brands that have models for selected type
  const availableBrands = deviceBrands.filter(brand =>
    deviceModels.some(model => model.brandId === brand.id)
  );

  // Filter models by selected brand
  const filteredModels = selectedBrandId 
    ? deviceModels.filter(m => m.brandId === selectedBrandId)
    : deviceModels;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: WizardData) => {
      // Find selected device type name
      const selectedType = deviceTypes.find(t => t.id === data.deviceType);
      const selectedBrand = deviceBrands.find(b => b.id === data.deviceBrandId);
      const selectedModel = deviceModels.find(m => m.id === data.deviceModelId);

      // Build acceptance-aware payload
      const payload: Record<string, any> = {
        customerId: data.customerId,
        deviceType: selectedType?.name || data.deviceType,
        deviceModel: selectedModel?.modelName || data.deviceModel || "Non specificato",
        issueDescription: data.issueDescription,
        // IMEI flags - always include for acceptance flow
        imeiNotReadable: data.imeiNotReadable || false,
        imeiNotPresent: data.imeiNotPresent || false,
        serialOnly: data.serialOnly || false,
      };

      // Add optional order fields
      if (selectedBrand?.name || data.brand) {
        payload.brand = selectedBrand?.name || data.brand;
      }
      if (data.deviceModelId) {
        payload.deviceModelId = data.deviceModelId;
      }
      if (data.imei) {
        payload.imei = data.imei;
      }
      if (data.serial) {
        payload.serial = data.serial;
      }
      if (data.notes) {
        payload.notes = data.notes;
      }
      if (data.repairCenterId || user?.repairCenterId) {
        payload.repairCenterId = data.repairCenterId || user?.repairCenterId;
      }

      // Build acceptance object with structured data and required defaults
      // Always include acceptance to trigger the acceptance flow on backend
      const acceptance: Record<string, any> = {
        // Arrays - empty by default
        declaredDefects: [],
        accessories: data.accessories || [],
        // Required booleans with sensible defaults
        aestheticPhotosMandatory: false,
        hasLockCode: false,
        accessoriesRemoved: true, // Default to accessories being removed/checked
      };
      
      // Add optional fields if provided
      if (data.aestheticCondition) {
        acceptance.aestheticCondition = data.aestheticCondition;
      }
      
      // Include acceptance in payload - this triggers acceptanceOrderSchema on backend
      payload.acceptance = acceptance;

      const res = await apiRequest("POST", "/api/repair-orders", payload);
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "Riparazione creata",
        description: "La nuova riparazione è stata registrata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      onOpenChange(false);
      onSuccess?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare la riparazione",
        variant: "destructive",
      });
    },
  });

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!form.watch("customerId");
      case 2:
        return !!form.watch("deviceType") && !!form.watch("issueDescription");
      case 3:
        return true; // Optional step
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      createMutation.mutate(data);
    })();
  };

  const selectedCustomer = customers.find(c => c.id === form.watch("customerId"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Nuova Riparazione</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-primary/20 text-primary",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
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
                    isCompleted ? "bg-primary/50" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <Form {...form}>
          <form className="space-y-4">
            {/* Step 1: Customer Selection */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <User className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">
                    {showNewCustomerForm ? "Nuovo Cliente" : "Seleziona il Cliente"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {showNewCustomerForm 
                      ? "Inserisci i dati del nuovo cliente" 
                      : "Cerca e seleziona il cliente per questa riparazione"}
                  </p>
                </div>

                {!showNewCustomerForm ? (
                  <>
                    {/* Search + New Customer Button */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca per nome o email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="pl-10"
                          data-testid="input-customer-search"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewCustomerForm(true)}
                        data-testid="button-new-customer"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nuovo
                      </Button>
                    </div>

                    {/* Customer List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredCustomers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>Nessun cliente trovato</p>
                          <Button
                            type="button"
                            variant="link"
                            onClick={() => setShowNewCustomerForm(true)}
                            className="mt-2"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Crea nuovo cliente
                          </Button>
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <Card
                            key={customer.id}
                            className={cn(
                              "cursor-pointer transition-colors hover-elevate",
                              form.watch("customerId") === customer.id && "ring-2 ring-primary"
                            )}
                            onClick={() => form.setValue("customerId", customer.id)}
                            data-testid={`card-customer-${customer.id}`}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{customer.fullName}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {customer.email}
                                </p>
                              </div>
                              {form.watch("customerId") === customer.id && (
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  /* New Customer Form */
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Dati Cliente</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowNewCustomerForm(false);
                            setNewCustomerForm({ fullName: "", email: "", phone: "" });
                          }}
                          data-testid="button-cancel-new-customer"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="new-customer-name">Nome Completo *</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-customer-name"
                              placeholder="Mario Rossi"
                              value={newCustomerForm.fullName}
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, fullName: e.target.value }))}
                              className="pl-10"
                              data-testid="input-new-customer-name"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="new-customer-email">Email</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-customer-email"
                              type="email"
                              placeholder="mario.rossi@email.com"
                              value={newCustomerForm.email}
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                              className="pl-10"
                              data-testid="input-new-customer-email"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="new-customer-phone">Telefono</Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-customer-phone"
                              type="tel"
                              placeholder="+39 333 1234567"
                              value={newCustomerForm.phone}
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="pl-10"
                              data-testid="input-new-customer-phone"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowNewCustomerForm(false);
                            setNewCustomerForm({ fullName: "", email: "", phone: "" });
                          }}
                        >
                          Annulla
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          disabled={!newCustomerForm.fullName.trim() || createCustomerMutation.isPending}
                          onClick={() => {
                            createCustomerMutation.mutate({
                              fullName: newCustomerForm.fullName.trim(),
                              email: newCustomerForm.email.trim() || undefined,
                              phone: newCustomerForm.phone.trim() || undefined,
                            });
                          }}
                          data-testid="button-create-customer"
                        >
                          {createCustomerMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creazione...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Crea Cliente
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Device Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <Smartphone className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">Dati Dispositivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Seleziona il tipo di dispositivo e descrivi il problema
                  </p>
                </div>

                {/* Device Type Selection */}
                <FormField
                  control={form.control}
                  name="deviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Dispositivo *</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {deviceTypes.map((type) => {
                          const Icon = DEVICE_TYPE_ICONS[type.name.toLowerCase()] || Smartphone;
                          return (
                            <Card
                              key={type.id}
                              className={cn(
                                "cursor-pointer transition-colors hover-elevate",
                                field.value === type.id && "ring-2 ring-primary"
                              )}
                              onClick={() => {
                                field.onChange(type.id);
                                setSelectedTypeId(type.id);
                                setSelectedBrandId("");
                                form.setValue("deviceBrandId", "");
                                form.setValue("deviceModelId", "");
                              }}
                              data-testid={`card-device-type-${type.id}`}
                            >
                              <CardContent className="p-3 text-center">
                                <Icon className="h-6 w-6 mx-auto mb-1" />
                                <span className="text-sm">{type.name}</span>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brand & Model */}
                {selectedTypeId && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deviceBrandId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marca</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              setSelectedBrandId(val);
                              form.setValue("deviceModelId", "");
                            }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-brand">
                                <SelectValue placeholder="Seleziona marca" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableBrands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deviceModelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Modello</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={!selectedBrandId}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-model">
                                <SelectValue placeholder="Seleziona modello" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredModels.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.modelName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Manual model input if no catalog match */}
                {selectedTypeId && !form.watch("deviceModelId") && (
                  <FormField
                    control={form.control}
                    name="deviceModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modello (manuale)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="es. iPhone 14 Pro, Galaxy S23..."
                            data-testid="input-device-model"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* IMEI / Serial */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="imei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMEI</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Opzionale"
                            disabled={form.watch("imeiNotPresent") || form.watch("imeiNotReadable")}
                            data-testid="input-imei"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seriale</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Opzionale"
                            data-testid="input-serial"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* IMEI Flags */}
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="imeiNotReadable"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue("imei", "");
                                form.setValue("imeiNotPresent", false);
                              }
                            }}
                            data-testid="checkbox-imei-not-readable"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          IMEI non leggibile
                        </FormLabel>
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
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue("imei", "");
                                form.setValue("imeiNotReadable", false);
                              }
                            }}
                            data-testid="checkbox-imei-not-present"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          IMEI non presente
                        </FormLabel>
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
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                // Serial only implies IMEI not present
                                form.setValue("imei", "");
                                form.setValue("imeiNotPresent", true);
                                form.setValue("imeiNotReadable", false);
                              }
                            }}
                            data-testid="checkbox-serial-only"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Solo seriale
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Problem Description */}
                <FormField
                  control={form.control}
                  name="issueDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione Problema *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descrivi il problema segnalato dal cliente..."
                          rows={3}
                          data-testid="textarea-issue"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Conditions */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">Condizioni e Accessori</h3>
                  <p className="text-sm text-muted-foreground">
                    Documenta lo stato del dispositivo (opzionale)
                  </p>
                </div>

                {/* Aesthetic Condition */}
                <FormField
                  control={form.control}
                  name="aestheticCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condizione Estetica</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {AESTHETIC_CONDITIONS.map((condition) => (
                          <Card
                            key={condition.value}
                            className={cn(
                              "cursor-pointer transition-colors hover-elevate",
                              field.value === condition.value && "ring-2 ring-primary"
                            )}
                            onClick={() => field.onChange(condition.value)}
                            data-testid={`card-condition-${condition.value}`}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className={cn("w-3 h-3 rounded-full", condition.color)} />
                              <span className="text-sm font-medium">{condition.label}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Accessories */}
                <FormField
                  control={form.control}
                  name="accessories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accessori Consegnati</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {accessoryTypes.length > 0 ? (
                          accessoryTypes.map((accessory) => (
                            <div
                              key={accessory.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`acc-${accessory.id}`}
                                checked={field.value?.includes(accessory.name)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, accessory.name]);
                                  } else {
                                    field.onChange(current.filter((a: string) => a !== accessory.name));
                                  }
                                }}
                                data-testid={`checkbox-accessory-${accessory.id}`}
                              />
                              <Label htmlFor={`acc-${accessory.id}`} className="text-sm">
                                {accessory.name}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground col-span-2">
                            Nessun accessorio definito per questo tipo di dispositivo
                          </p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Aggiuntive</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Note opzionali..."
                          rows={2}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Summary */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">Conferma Dati</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifica i dati e conferma la creazione
                  </p>
                </div>

                {/* Summary Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {/* Customer */}
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="font-medium">{selectedCustomer?.fullName}</p>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.email}</p>
                      </div>
                    </div>

                    {/* Device */}
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Dispositivo</p>
                        <p className="font-medium">
                          {deviceTypes.find(t => t.id === form.watch("deviceType"))?.name}
                          {form.watch("deviceModelId") && (
                            <> - {deviceModels.find(m => m.id === form.watch("deviceModelId"))?.modelName}</>
                          )}
                          {!form.watch("deviceModelId") && form.watch("deviceModel") && (
                            <> - {form.watch("deviceModel")}</>
                          )}
                        </p>
                        {(form.watch("imei") || form.watch("serial")) && (
                          <p className="text-sm text-muted-foreground">
                            {form.watch("imei") && `IMEI: ${form.watch("imei")}`}
                            {form.watch("imei") && form.watch("serial") && " | "}
                            {form.watch("serial") && `S/N: ${form.watch("serial")}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Problem */}
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Problema</p>
                        <p className="font-medium">{form.watch("issueDescription")}</p>
                      </div>
                    </div>

                    {/* Condition & Accessories */}
                    {(form.watch("aestheticCondition") || (form.watch("accessories")?.length || 0) > 0) && (
                      <div className="flex items-start gap-3">
                        <ClipboardCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Condizioni</p>
                          {form.watch("aestheticCondition") && (
                            <Badge variant="secondary" className="mr-2">
                              {AESTHETIC_CONDITIONS.find(c => c.value === form.watch("aestheticCondition"))?.label}
                            </Badge>
                          )}
                          {(form.watch("accessories")?.length || 0) > 0 && (
                            <p className="text-sm mt-1">
                              Accessori: {form.watch("accessories")?.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Repair Center Selection (if needed) */}
                {(user?.role === "admin" || user?.role === "reseller") && repairCenters.length > 0 && (
                  <FormField
                    control={form.control}
                    name="repairCenterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Centro Riparazione</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-repair-center">
                              <SelectValue placeholder="Seleziona centro (opzionale)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {repairCenters.map((rc) => (
                              <SelectItem key={rc.id} value={rc.id}>
                                {rc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </form>
        </Form>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            data-testid="button-wizard-back"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Indietro
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              data-testid="button-wizard-next"
            >
              Avanti
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              data-testid="button-wizard-confirm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Crea Riparazione
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
