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
import { Smartphone, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, UserPlus, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
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
  repairCenterId: z.string().min(1, "Centro di riparazione richiesto"),
  deviceType: z.string().min(1, "Device type required"),
  deviceModel: z.string().optional(),
  brand: z.string().optional(),
  issueDescription: z.string().min(1, "Seleziona almeno un problema"),
  otherIssueDescription: z.string().optional(),
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
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [showOtherIssue, setShowOtherIssue] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    customerType: "private" as "private" | "company",
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "IT",
    vatNumber: "",
    fiscalCode: "",
    pec: "",
    codiceUnivoco: "",
    iban: "",
    username: "",
    password: "",
  });
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

  const { data: issueTypes = [] } = useQuery<Array<{
    id: string;
    name: string;
    description: string | null;
    deviceTypeId: string | null;
  }>>({
    queryKey: ["/api/issue-types", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? new URLSearchParams({ deviceTypeId: selectedTypeId }) : new URLSearchParams();
      const res = await fetch(`/api/issue-types?${params}`);
      if (!res.ok) throw new Error("Failed to fetch issue types");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const { data: allDeviceBrands = [] } = useQuery<Array<{
    id: string;
    name: string;
  }>>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [] } = useQuery<Array<{
    id: string;
    modelName: string;
    brandId: string;
    typeId: string;
  }>>({
    queryKey: ["/api/device-models", { typeId: selectedTypeId }],
    queryFn: async () => {
      const params = new URLSearchParams({ typeId: selectedTypeId });
      const res = await fetch(`/api/device-models?${params}`);
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const deviceBrands = allDeviceBrands.filter(brand => 
    deviceModels.some(model => model.brandId === brand.id)
  );

  const filteredModels = selectedBrandId 
    ? deviceModels.filter(model => model.brandId === selectedBrandId)
    : deviceModels;

  const getBrandName = (brandId: string) => {
    const brand = allDeviceBrands.find(b => b.id === brandId);
    return brand?.name || "";
  };

  const { data: repairCenters = [] } = useQuery<Array<{
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  }>>({
    queryKey: ["/api/repair-centers"],
    enabled: user?.role === "admin" || user?.role === "repair_center",
  });

  const form = useForm<AcceptanceWizardData>({
    resolver: zodResolver(acceptanceWizardSchema),
    defaultValues: {
      customerId: customerId || "",
      repairCenterId: "",
      deviceType: "",
      deviceModel: "",
      brand: "",
      issueDescription: "",
      otherIssueDescription: "",
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

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof newCustomerData) => {
      let endpoint: string;
      let payload: any;
      
      const basePayload = {
        customerType: data.customerType,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        zipCode: data.zipCode,
        country: data.country || "IT",
        iban: data.iban || undefined,
        ...(data.customerType === "private" 
          ? { fullName: data.fullName }
          : { 
              companyName: data.companyName,
              fullName: data.companyName,
              vatNumber: data.vatNumber || undefined,
              fiscalCode: data.fiscalCode || undefined,
              pec: data.pec || undefined,
              codiceUnivoco: data.codiceUnivoco || undefined,
            }
        ),
      };
      
      if (user?.role === "admin") {
        endpoint = "/api/admin/users";
        payload = { 
          ...basePayload, 
          username: data.username,
          password: data.password,
          role: "customer", 
          isActive: true 
        };
      } else if (user?.role === "reseller") {
        endpoint = "/api/reseller/customers";
        payload = { 
          ...basePayload, 
          username: data.username,
          password: data.password,
          isActive: true 
        };
      } else {
        endpoint = "/api/customers";
        payload = basePayload;
      }
      
      const response = await apiRequest("POST", endpoint, payload);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Errore durante la creazione del cliente");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      const customerId = data.user?.id || data.id;
      const customerName = data.user?.fullName || data.fullName;
      form.setValue("customerId", customerId);
      setShowNewCustomerForm(false);
      setNewCustomerData({
        customerType: "private",
        fullName: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        country: "IT",
        vatNumber: "",
        fiscalCode: "",
        pec: "",
        codiceUnivoco: "",
        iban: "",
        username: "",
        password: "",
      });
      toast({
        title: "Cliente creato",
        description: `Il cliente ${customerName} è stato creato con successo`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile creare il cliente",
      });
    },
  });

  const handleCreateCustomer = () => {
    const isPrivate = newCustomerData.customerType === "private";
    
    if (isPrivate && !newCustomerData.fullName) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Nome completo è obbligatorio",
      });
      return;
    }
    
    if (!isPrivate && !newCustomerData.companyName) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Ragione sociale è obbligatoria",
      });
      return;
    }
    
    if (!newCustomerData.email) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Email è obbligatoria",
      });
      return;
    }
    
    if (!newCustomerData.phone || !newCustomerData.address || !newCustomerData.city || !newCustomerData.zipCode) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Telefono, indirizzo, città e CAP sono obbligatori",
      });
      return;
    }
    
    if (!isPrivate && !newCustomerData.pec && !newCustomerData.codiceUnivoco) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Per le aziende, almeno PEC o Codice Univoco è obbligatorio",
      });
      return;
    }
    
    if (user?.role !== "repair_center" && 
        (!newCustomerData.username || !newCustomerData.password)) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Username e password sono obbligatori",
      });
      return;
    }
    createCustomerMutation.mutate(newCustomerData);
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof AcceptanceWizardData)[] = [];
    
    if (step === "device-info") {
      fieldsToValidate = ["customerId", "repairCenterId", "deviceType", "issueDescription"];
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
    setSelectedTypeId("");
    setSelectedBrandId("");
    setSelectedIssues([]);
    setShowOtherIssue(false);
    onOpenChange(false);
  };

  const renderDeviceInfoStep = () => (
    <div className="space-y-4">
      {(user?.role === "admin" || user?.role === "repair_center") && (
        <>
          {!showNewCustomerForm ? (
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer" className="flex-1">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewCustomerForm(true)}
                      data-testid="button-new-customer"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Seleziona il cliente o creane uno nuovo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nuovo Cliente
                </CardTitle>
                <CardDescription>Inserisci i dati del nuovo cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {/* Tipo Cliente */}
                <div className="space-y-2">
                  <Label>Tipo Cliente *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerType"
                        checked={newCustomerData.customerType === "private"}
                        onChange={() => setNewCustomerData(prev => ({ ...prev, customerType: "private" }))}
                        className="w-4 h-4"
                        data-testid="radio-customer-private"
                      />
                      <span>Privato</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerType"
                        checked={newCustomerData.customerType === "company"}
                        onChange={() => setNewCustomerData(prev => ({ ...prev, customerType: "company" }))}
                        className="w-4 h-4"
                        data-testid="radio-customer-company"
                      />
                      <span>Azienda</span>
                    </label>
                  </div>
                </div>

                {/* Nome / Ragione Sociale */}
                {newCustomerData.customerType === "private" ? (
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-name">Nome completo *</Label>
                    <Input
                      id="new-customer-name"
                      placeholder="Mario Rossi"
                      value={newCustomerData.fullName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, fullName: e.target.value }))}
                      data-testid="input-new-customer-name"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-company">Ragione Sociale *</Label>
                    <Input
                      id="new-customer-company"
                      placeholder="Azienda S.r.l."
                      value={newCustomerData.companyName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, companyName: e.target.value }))}
                      data-testid="input-new-customer-company"
                    />
                  </div>
                )}

                {/* Email e Telefono */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-email">Email *</Label>
                    <Input
                      id="new-customer-email"
                      type="email"
                      placeholder="mario@email.com"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-new-customer-email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-phone">Telefono *</Label>
                    <Input
                      id="new-customer-phone"
                      placeholder="+39 333 1234567"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-new-customer-phone"
                    />
                  </div>
                </div>

                {/* Indirizzo */}
                <div className="space-y-1">
                  <Label htmlFor="new-customer-address">Indirizzo *</Label>
                  <Input
                    id="new-customer-address"
                    placeholder="Via Roma, 1"
                    value={newCustomerData.address}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, address: e.target.value }))}
                    data-testid="input-new-customer-address"
                  />
                </div>

                {/* Città, CAP, Paese */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-city">Città *</Label>
                    <Input
                      id="new-customer-city"
                      placeholder="Milano"
                      value={newCustomerData.city}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                      data-testid="input-new-customer-city"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-zip">CAP *</Label>
                    <Input
                      id="new-customer-zip"
                      placeholder="20100"
                      value={newCustomerData.zipCode}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, zipCode: e.target.value }))}
                      data-testid="input-new-customer-zip"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-country">Paese</Label>
                    <Input
                      id="new-customer-country"
                      placeholder="IT"
                      value={newCustomerData.country}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, country: e.target.value }))}
                      data-testid="input-new-customer-country"
                    />
                  </div>
                </div>

                {/* Campi Azienda */}
                {newCustomerData.customerType === "company" && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-vat">Partita IVA</Label>
                        <Input
                          id="new-customer-vat"
                          placeholder="IT12345678901"
                          value={newCustomerData.vatNumber}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, vatNumber: e.target.value }))}
                          data-testid="input-new-customer-vat"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-fiscal">Codice Fiscale</Label>
                        <Input
                          id="new-customer-fiscal"
                          placeholder="12345678901"
                          value={newCustomerData.fiscalCode}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, fiscalCode: e.target.value }))}
                          data-testid="input-new-customer-fiscal"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-pec">PEC *</Label>
                        <Input
                          id="new-customer-pec"
                          type="email"
                          placeholder="azienda@pec.it"
                          value={newCustomerData.pec}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, pec: e.target.value }))}
                          data-testid="input-new-customer-pec"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-sdi">Codice Univoco (SDI) *</Label>
                        <Input
                          id="new-customer-sdi"
                          placeholder="A1B2C3D"
                          value={newCustomerData.codiceUnivoco}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, codiceUnivoco: e.target.value }))}
                          data-testid="input-new-customer-sdi"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">* Almeno PEC o Codice Univoco è obbligatorio</p>
                  </>
                )}

                {/* IBAN */}
                <div className="space-y-1">
                  <Label htmlFor="new-customer-iban">IBAN</Label>
                  <Input
                    id="new-customer-iban"
                    placeholder="IT60X0542811101000000123456"
                    value={newCustomerData.iban}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, iban: e.target.value }))}
                    data-testid="input-new-customer-iban"
                  />
                </div>

                {/* Username e Password (solo admin/reseller) */}
                {user?.role !== "repair_center" && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-username">Username *</Label>
                        <Input
                          id="new-customer-username"
                          placeholder="mrossi"
                          value={newCustomerData.username}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, username: e.target.value }))}
                          data-testid="input-new-customer-username"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-password">Password *</Label>
                        <Input
                          id="new-customer-password"
                          type="password"
                          placeholder="Password"
                          value={newCustomerData.password}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, password: e.target.value }))}
                          data-testid="input-new-customer-password"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewCustomerForm(false);
                      setNewCustomerData({
                        customerType: "private",
                        fullName: "",
                        companyName: "",
                        email: "",
                        phone: "",
                        address: "",
                        city: "",
                        zipCode: "",
                        country: "IT",
                        vatNumber: "",
                        fiscalCode: "",
                        pec: "",
                        codiceUnivoco: "",
                        iban: "",
                        username: "",
                        password: "",
                      });
                    }}
                    data-testid="button-cancel-new-customer"
                  >
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={createCustomerMutation.isPending}
                    data-testid="button-save-new-customer"
                  >
                    {createCustomerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creazione...
                      </>
                    ) : (
                      "Crea Cliente"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Centro di Riparazione */}
      <FormField
        control={form.control}
        name="repairCenterId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centro di Riparazione *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-repair-center">
                  <SelectValue placeholder="Seleziona centro di riparazione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {repairCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name} {center.address ? `- ${center.address}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Seleziona il centro che effettuerà la riparazione
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

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
                form.setValue("issueDescription", "");
                form.setValue("otherIssueDescription", "");
                setSelectedBrandId("");
                setSelectedIssues([]);
                setShowOtherIssue(false);
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
                if (name === "__all__") {
                  field.onChange("");
                  setSelectedBrandId("");
                } else {
                  field.onChange(name);
                  const brand = deviceBrands.find(b => b.name === name);
                  setSelectedBrandId(brand?.id || "");
                }
                form.setValue("deviceModel", "");
              }} 
              value={field.value || "__all__"}
              disabled={!selectedTypeId}
            >
              <FormControl>
                <SelectTrigger data-testid="select-brand">
                  <SelectValue placeholder="Seleziona brand" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="__all__">Tutti i brand ({deviceBrands.length})</SelectItem>
                {deviceBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {selectedTypeId ? `${deviceBrands.length} brand disponibili` : "Seleziona prima il tipo dispositivo"}
            </FormDescription>
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
            {selectedTypeId && filteredModels.length > 0 ? (
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-device-model">
                    <SelectValue placeholder="Seleziona modello" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {filteredModels.map((model) => (
                    <SelectItem key={model.id} value={model.modelName}>
                      {selectedBrandId ? model.modelName : `${getBrandName(model.brandId)} - ${model.modelName}`}
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
              {selectedTypeId && filteredModels.length === 0 && "Nessun modello disponibile, inserisci manualmente"}
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
            <FormLabel>Problemi riscontrati *</FormLabel>
            <FormDescription className="text-xs">
              Seleziona uno o più problemi segnalati dal cliente
            </FormDescription>
            {!selectedTypeId ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                Seleziona prima un tipo di dispositivo per vedere i problemi disponibili
              </div>
            ) : issueTypes.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Caricamento problemi...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md" data-testid="issue-types-list">
                {issueTypes.map((issue) => {
                  const isSelected = selectedIssues.includes(issue.name);
                  const isOther = issue.name === "Altro";
                  return (
                    <div key={issue.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={`issue-${issue.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          let newSelected: string[];
                          if (checked) {
                            newSelected = [...selectedIssues, issue.name];
                          } else {
                            newSelected = selectedIssues.filter(i => i !== issue.name);
                          }
                          setSelectedIssues(newSelected);
                          if (isOther) {
                            setShowOtherIssue(!!checked);
                            if (!checked) {
                              form.setValue("otherIssueDescription", "");
                            }
                          }
                          const issueText = newSelected.join(", ");
                          field.onChange(issueText);
                        }}
                        data-testid={`checkbox-issue-${issue.id}`}
                      />
                      <Label 
                        htmlFor={`issue-${issue.id}`} 
                        className="text-sm font-normal cursor-pointer leading-tight"
                        title={issue.description || undefined}
                      >
                        {issue.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedIssues.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Selezionati: {selectedIssues.join(", ")}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {showOtherIssue && (
        <FormField
          control={form.control}
          name="otherIssueDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrivi altro problema *</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Descrivi il problema non elencato"
                  rows={2}
                  data-testid="textarea-other-issue"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

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
    const selectedRepairCenter = repairCenters.find((c) => c.id === formData.repairCenterId);
    
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
            <CardTitle className="text-base">Centro di Riparazione</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="font-medium" data-testid="text-review-repair-center">
              {selectedRepairCenter ? `${selectedRepairCenter.name}${selectedRepairCenter.address ? ` - ${selectedRepairCenter.address}` : ''}` : "-"}
            </div>
          </CardContent>
        </Card>
        
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
              <div className="text-muted-foreground mb-1">Problemi segnalati:</div>
              <div className="font-medium" data-testid="text-review-issue">{formData.issueDescription}</div>
              {formData.otherIssueDescription && (
                <div className="text-sm text-muted-foreground mt-1">
                  Altro: {formData.otherIssueDescription}
                </div>
              )}
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
                    key="next-button"
                    type="button"
                    onClick={handleNext}
                    data-testid="button-next"
                  >
                    Avanti
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    key="submit-button"
                    type="button"
                    onClick={handleSubmit}
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
