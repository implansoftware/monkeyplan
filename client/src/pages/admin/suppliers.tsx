import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Supplier, InsertSupplier } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Search, Phone, Mail, Globe, Pencil, Trash2, Building2, 
  MessageCircle, Code, Truck, AlertCircle, RefreshCw, Database, 
  CheckCircle2, Clock, XCircle, Loader2, Key, Link2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ItalianCitySelect } from "@/components/italian-city-select";

type CommunicationChannel = 'email' | 'api' | 'whatsapp';
type SupplierApiType = 'foneday' | 'ifixit' | 'mobilax' | 'generic_rest' | 'custom';
type SupplierApiAuthMethod = 'bearer_token' | 'api_key_header' | 'api_key_query' | 'basic_auth' | 'oauth2' | 'none';
type SupplierSyncStatus = 'pending' | 'syncing' | 'success' | 'partial' | 'failed';

const communicationChannelLabels: Record<CommunicationChannel, string> = {
  email: "Email",
  api: "API",
  whatsapp: "WhatsApp",
};

const communicationChannelIcons: Record<CommunicationChannel, typeof Mail> = {
  email: Mail,
  api: Code,
  whatsapp: MessageCircle,
};

const apiTypeLabels: Record<SupplierApiType, string> = {
  foneday: "Foneday",
  ifixit: "iFixit",
  mobilax: "Mobilax",
  generic_rest: "REST Generico",
  custom: "Personalizzato",
};

const apiAuthMethodLabels: Record<SupplierApiAuthMethod, string> = {
  bearer_token: "Bearer Token",
  api_key_header: "API Key (Header)",
  api_key_query: "API Key (Query String)",
  basic_auth: "Basic Auth (user:pass)",
  oauth2: "OAuth 2.0",
  none: "Nessuna",
};

const syncStatusConfig: Record<SupplierSyncStatus, { label: string; icon: typeof CheckCircle2; color: string }> = {
  pending: { label: "In attesa", icon: Clock, color: "text-muted-foreground" },
  syncing: { label: "Sincronizzazione...", icon: Loader2, color: "text-blue-500" },
  success: { label: "Completata", icon: CheckCircle2, color: "text-green-500" },
  partial: { label: "Parziale", icon: AlertCircle, color: "text-yellow-500" },
  failed: { label: "Fallita", icon: XCircle, color: "text-red-500" },
};

export default function AdminSuppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedApiType, setSelectedApiType] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (editingSupplier) {
      setSelectedCity(editingSupplier.city || "");
      setSelectedApiType(editingSupplier.apiType || "");
    } else {
      setSelectedCity("");
      setSelectedApiType("");
    }
  }, [editingSupplier]);

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertSupplier) => {
      const res = await apiRequest("POST", "/api/suppliers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: "Fornitore creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSupplier> }) => {
      const res = await apiRequest("PATCH", `/api/suppliers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setDialogOpen(false);
      setEditingSupplier(null);
      toast({ title: "Fornitore aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: "Fornitore eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const syncCatalogMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const res = await apiRequest("POST", `/api/suppliers/${supplierId}/sync-catalog`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ 
        title: "Sincronizzazione avviata", 
        description: `Prodotti sincronizzati: ${data.productsSynced || 0}` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore sincronizzazione", description: error.message, variant: "destructive" });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const res = await apiRequest("POST", `/api/suppliers/${supplierId}/test-connection`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Connessione riuscita", description: "L'API del fornitore è raggiungibile" });
    },
    onError: (error: Error) => {
      toast({ title: "Connessione fallita", description: error.message, variant: "destructive" });
    },
  });

  type PaymentTerms = 'immediate' | 'cod' | 'bank_transfer_15' | 'bank_transfer_30' | 'bank_transfer_60' | 'bank_transfer_90' | 'riba_30' | 'riba_60' | 'credit_card' | 'paypal' | 'custom';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertSupplier = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || undefined,
      phone: formData.get("phone") as string || undefined,
      whatsapp: formData.get("whatsapp") as string || undefined,
      website: formData.get("website") as string || undefined,
      address: formData.get("address") as string || undefined,
      city: selectedCity || undefined,
      zipCode: formData.get("zipCode") as string || undefined,
      country: formData.get("country") as string || "IT",
      vatNumber: formData.get("vatNumber") as string || undefined,
      fiscalCode: formData.get("fiscalCode") as string || undefined,
      communicationChannel: formData.get("communicationChannel") as CommunicationChannel || "email",
      apiEndpoint: formData.get("apiEndpoint") as string || undefined,
      apiFormat: formData.get("apiFormat") as string || undefined,
      orderEmailTemplate: formData.get("orderEmailTemplate") as string || undefined,
      returnEmailTemplate: formData.get("returnEmailTemplate") as string || undefined,
      paymentTerms: (formData.get("paymentTerms") as PaymentTerms) || "bank_transfer_30",
      deliveryDays: formData.get("deliveryDays") ? parseInt(formData.get("deliveryDays") as string) : 3,
      minOrderAmount: formData.get("minOrderAmount") ? parseInt(formData.get("minOrderAmount") as string) * 100 : undefined,
      shippingCost: formData.get("shippingCost") ? parseInt(formData.get("shippingCost") as string) * 100 : undefined,
      freeShippingThreshold: formData.get("freeShippingThreshold") ? parseInt(formData.get("freeShippingThreshold") as string) * 100 : undefined,
      internalNotes: formData.get("internalNotes") as string || undefined,
      isActive: true,
      apiType: formData.get("apiType") as SupplierApiType || undefined,
      apiSecretName: formData.get("apiSecretName") as string || undefined,
      apiAuthMethod: formData.get("apiAuthMethod") as SupplierApiAuthMethod || undefined,
      apiProductsEndpoint: formData.get("apiProductsEndpoint") as string || undefined,
      apiOrdersEndpoint: formData.get("apiOrdersEndpoint") as string || undefined,
      apiCartEndpoint: formData.get("apiCartEndpoint") as string || undefined,
      apiInvoicesEndpoint: formData.get("apiInvoicesEndpoint") as string || undefined,
      catalogSyncEnabled: formData.get("catalogSyncEnabled") === "on",
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setActiveTab("general");
    setDialogOpen(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    setSelectedCity(""); // Reset city for new supplier
    setActiveTab("general");
    setDialogOpen(true);
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (supplier.city && supplier.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const ChannelIcon = editingSupplier?.communicationChannel 
    ? communicationChannelIcons[editingSupplier.communicationChannel as CommunicationChannel]
    : Mail;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Anagrafica Fornitori</h1>
          <p className="text-muted-foreground">
            Gestisci i fornitori e le loro configurazioni di comunicazione
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewSupplier} data-testid="button-new-supplier">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Fornitore
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? "Modifica Fornitore" : "Nuovo Fornitore"}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier 
                  ? "Modifica i dati del fornitore selezionato" 
                  : "Inserisci i dati del nuovo fornitore"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="general">Generale</TabsTrigger>
                  <TabsTrigger value="contact">Contatti</TabsTrigger>
                  <TabsTrigger value="communication">Comunicazione</TabsTrigger>
                  <TabsTrigger value="commercial">Condizioni</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4" forceMount hidden={activeTab !== "general"}>
                  {editingSupplier && (
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-muted-foreground text-xs">Codice Fornitore</Label>
                      <p className="font-mono font-semibold" data-testid="text-supplier-code">{editingSupplier.code}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Ragione Sociale *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={editingSupplier?.name}
                      required 
                      data-testid="input-supplier-name" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">Partita IVA</Label>
                      <Input 
                        id="vatNumber" 
                        name="vatNumber" 
                        defaultValue={editingSupplier?.vatNumber || ""}
                        data-testid="input-supplier-vat" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fiscalCode">Codice Fiscale</Label>
                      <Input 
                        id="fiscalCode" 
                        name="fiscalCode" 
                        defaultValue={editingSupplier?.fiscalCode || ""}
                        data-testid="input-supplier-fiscal" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internalNotes">Note Interne</Label>
                    <Textarea 
                      id="internalNotes" 
                      name="internalNotes" 
                      rows={3}
                      defaultValue={editingSupplier?.internalNotes || ""}
                      data-testid="input-supplier-internal-notes" 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4" forceMount hidden={activeTab !== "contact"}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        defaultValue={editingSupplier?.email || ""}
                        data-testid="input-supplier-email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel"
                        defaultValue={editingSupplier?.phone || ""}
                        data-testid="input-supplier-phone" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Business</Label>
                      <Input 
                        id="whatsapp" 
                        name="whatsapp" 
                        type="tel"
                        placeholder="+39..."
                        defaultValue={editingSupplier?.whatsapp || ""}
                        data-testid="input-supplier-whatsapp" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Sito Web</Label>
                      <Input 
                        id="website" 
                        name="website" 
                        type="url"
                        placeholder="https://..."
                        defaultValue={editingSupplier?.website || ""}
                        data-testid="input-supplier-website" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Indirizzo</Label>
                    <Input 
                      id="address" 
                      name="address" 
                      defaultValue={editingSupplier?.address || ""}
                      data-testid="input-supplier-address" 
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Città</Label>
                      <ItalianCitySelect
                        value={selectedCity}
                        onChange={setSelectedCity}
                        placeholder="Seleziona città..."
                        id="city"
                        data-testid="select-supplier-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CAP</Label>
                      <Input 
                        id="zipCode" 
                        name="zipCode" 
                        defaultValue={editingSupplier?.zipCode || ""}
                        data-testid="input-supplier-zip" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Paese</Label>
                      <Input 
                        id="country" 
                        name="country" 
                        defaultValue={editingSupplier?.country || "IT"}
                        data-testid="input-supplier-country" 
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="communication" className="space-y-4 mt-4" forceMount hidden={activeTab !== "communication"}>
                  <div className="space-y-2">
                    <Label htmlFor="communicationChannel">Canale Preferito *</Label>
                    <Select 
                      name="communicationChannel" 
                      defaultValue={editingSupplier?.communicationChannel || "email"}
                    >
                      <SelectTrigger data-testid="select-communication-channel">
                        <SelectValue placeholder="Seleziona canale" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="api">
                          <div className="flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            API
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Code className="h-4 w-4" />
                      Configurazione API (se canale = API)
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiEndpoint">Endpoint API</Label>
                      <Input 
                        id="apiEndpoint" 
                        name="apiEndpoint" 
                        type="url"
                        placeholder="https://api.fornitore.com/orders"
                        defaultValue={editingSupplier?.apiEndpoint || ""}
                        data-testid="input-supplier-api-endpoint" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiFormat">Formato</Label>
                      <Select name="apiFormat" defaultValue={editingSupplier?.apiFormat || "json"}>
                        <SelectTrigger data-testid="select-api-format">
                          <SelectValue placeholder="Formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="custom">Personalizzato</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per configurare la chiave API in modo sicuro, usa il tab "API"
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4" />
                      Template Email
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orderEmailTemplate">Template Ordini</Label>
                      <Textarea 
                        id="orderEmailTemplate" 
                        name="orderEmailTemplate" 
                        rows={3}
                        placeholder="Template per email ordini..."
                        defaultValue={editingSupplier?.orderEmailTemplate || ""}
                        data-testid="input-supplier-order-template" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnEmailTemplate">Template Resi</Label>
                      <Textarea 
                        id="returnEmailTemplate" 
                        name="returnEmailTemplate" 
                        rows={3}
                        placeholder="Template per email resi..."
                        defaultValue={editingSupplier?.returnEmailTemplate || ""}
                        data-testid="input-supplier-return-template" 
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="commercial" className="space-y-4 mt-4" forceMount hidden={activeTab !== "commercial"}>
                  <div className="space-y-2">
                    <Label>Condizioni di Pagamento</Label>
                    <Select 
                      name="paymentTerms" 
                      defaultValue={editingSupplier?.paymentTerms || "bank_transfer_30"}
                    >
                      <SelectTrigger data-testid="select-payment-terms">
                        <SelectValue placeholder="Seleziona condizioni" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Pagamento Immediato</SelectItem>
                        <SelectItem value="cod">Contrassegno</SelectItem>
                        <SelectItem value="bank_transfer_15">Bonifico 15gg DFFM</SelectItem>
                        <SelectItem value="bank_transfer_30">Bonifico 30gg DFFM</SelectItem>
                        <SelectItem value="bank_transfer_60">Bonifico 60gg DFFM</SelectItem>
                        <SelectItem value="bank_transfer_90">Bonifico 90gg DFFM</SelectItem>
                        <SelectItem value="riba_30">RiBa 30gg DFFM</SelectItem>
                        <SelectItem value="riba_60">RiBa 60gg DFFM</SelectItem>
                        <SelectItem value="credit_card">Carta di Credito</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="custom">Personalizzato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryDays">Tempo di Consegna (giorni)</Label>
                      <Input 
                        id="deliveryDays" 
                        name="deliveryDays" 
                        type="number"
                        min={1}
                        defaultValue={editingSupplier?.deliveryDays || 3}
                        data-testid="input-supplier-delivery-days" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minOrderAmount">Ordine Minimo (EUR)</Label>
                      <Input 
                        id="minOrderAmount" 
                        name="minOrderAmount" 
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={editingSupplier?.minOrderAmount ? editingSupplier.minOrderAmount / 100 : ""}
                        data-testid="input-supplier-min-order" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCost">Costo Spedizione (EUR)</Label>
                      <Input 
                        id="shippingCost" 
                        name="shippingCost" 
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={editingSupplier?.shippingCost ? editingSupplier.shippingCost / 100 : ""}
                        data-testid="input-supplier-shipping" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="freeShippingThreshold">Soglia Spedizione Gratuita (EUR)</Label>
                      <Input 
                        id="freeShippingThreshold" 
                        name="freeShippingThreshold" 
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={editingSupplier?.freeShippingThreshold ? editingSupplier.freeShippingThreshold / 100 : ""}
                        data-testid="input-supplier-free-shipping" 
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="api" className="space-y-4 mt-4" forceMount hidden={activeTab !== "api"}>
                  <div className="space-y-2">
                    <Label htmlFor="apiType">Tipo Integrazione</Label>
                    <Select 
                      name="apiType" 
                      value={selectedApiType}
                      onValueChange={setSelectedApiType}
                    >
                      <SelectTrigger data-testid="select-api-type">
                        <SelectValue placeholder="Seleziona tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="foneday">Foneday</SelectItem>
                        <SelectItem value="ifixit">iFixit</SelectItem>
                        <SelectItem value="mobilax">Mobilax</SelectItem>
                        <SelectItem value="generic_rest">REST Generico</SelectItem>
                        <SelectItem value="custom">Personalizzato</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedApiType === 'foneday' && (
                      <p className="text-xs text-muted-foreground">
                        Gli endpoint Foneday sono preconfigurati automaticamente
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiAuthMethod">Metodo Autenticazione</Label>
                      <Select 
                        name="apiAuthMethod" 
                        defaultValue={editingSupplier?.apiAuthMethod || "bearer_token"}
                      >
                        <SelectTrigger data-testid="select-api-auth-method">
                          <SelectValue placeholder="Seleziona metodo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bearer_token">Bearer Token</SelectItem>
                          <SelectItem value="api_key_header">API Key (Header)</SelectItem>
                          <SelectItem value="api_key_query">API Key (Query String)</SelectItem>
                          <SelectItem value="basic_auth">Basic Auth</SelectItem>
                          <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                          <SelectItem value="none">Nessuna</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="apiSecretName">Nome Segreto</Label>
                      <Input 
                        id="apiSecretName" 
                        name="apiSecretName" 
                        placeholder="FONEDAY_API_TOKEN"
                        defaultValue={editingSupplier?.apiSecretName || ""}
                        data-testid="input-api-secret-name" 
                      />
                      <p className="text-xs text-muted-foreground">
                        Nome del segreto nei Replit Secrets
                      </p>
                    </div>
                  </div>

                  {selectedApiType !== 'foneday' && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Link2 className="h-4 w-4" />
                        Endpoint API
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiProductsEndpoint">Endpoint Prodotti</Label>
                          <Input 
                            id="apiProductsEndpoint" 
                            name="apiProductsEndpoint" 
                            type="url"
                            placeholder="https://api.fornitore.com/products"
                            defaultValue={editingSupplier?.apiProductsEndpoint || ""}
                            data-testid="input-api-products-endpoint" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiOrdersEndpoint">Endpoint Ordini</Label>
                          <Input 
                            id="apiOrdersEndpoint" 
                            name="apiOrdersEndpoint" 
                            type="url"
                            placeholder="https://api.fornitore.com/orders"
                            defaultValue={editingSupplier?.apiOrdersEndpoint || ""}
                            data-testid="input-api-orders-endpoint" 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="apiCartEndpoint">Endpoint Carrello</Label>
                          <Input 
                            id="apiCartEndpoint" 
                            name="apiCartEndpoint" 
                            type="url"
                            placeholder="https://api.fornitore.com/cart"
                            defaultValue={editingSupplier?.apiCartEndpoint || ""}
                            data-testid="input-api-cart-endpoint" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiInvoicesEndpoint">Endpoint Fatture</Label>
                          <Input 
                            id="apiInvoicesEndpoint" 
                            name="apiInvoicesEndpoint" 
                            type="url"
                            placeholder="https://api.fornitore.com/invoices"
                            defaultValue={editingSupplier?.apiInvoicesEndpoint || ""}
                            data-testid="input-api-invoices-endpoint" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Database className="h-4 w-4" />
                        Sincronizzazione Catalogo
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="catalogSyncEnabled"
                          name="catalogSyncEnabled"
                          defaultChecked={editingSupplier?.catalogSyncEnabled || false}
                          data-testid="switch-catalog-sync"
                        />
                        <Label htmlFor="catalogSyncEnabled" className="text-sm">Abilita sincronizzazione</Label>
                      </div>
                    </div>
                    
                    {editingSupplier && editingSupplier.catalogSyncStatus && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const status = editingSupplier.catalogSyncStatus as SupplierSyncStatus;
                              const config = syncStatusConfig[status];
                              const StatusIcon = config?.icon || Clock;
                              return (
                                <>
                                  <StatusIcon className={`h-4 w-4 ${config?.color || ''} ${status === 'syncing' ? 'animate-spin' : ''}`} />
                                  <span className="text-sm">{config?.label || status}</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {editingSupplier.catalogProductsCount || 0} prodotti
                            {editingSupplier.catalogLastSyncAt && (
                              <span className="ml-2">
                                | Ultimo sync: {new Date(editingSupplier.catalogLastSyncAt).toLocaleString('it-IT')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {editingSupplier && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => testConnectionMutation.mutate(editingSupplier.id)}
                          disabled={testConnectionMutation.isPending}
                          data-testid="button-test-connection"
                        >
                          {testConnectionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Link2 className="h-4 w-4 mr-2" />
                          )}
                          Testa Connessione
                        </Button>
                        <Button
                          type="button"
                          onClick={() => syncCatalogMutation.mutate(editingSupplier.id)}
                          disabled={syncCatalogMutation.isPending || !editingSupplier.catalogSyncEnabled}
                          data-testid="button-sync-catalog"
                        >
                          {syncCatalogMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sincronizza Ora
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-supplier"
                >
                  {(createMutation.isPending || updateMutation.isPending) 
                    ? "Salvataggio..." 
                    : editingSupplier ? "Aggiorna" : "Crea Fornitore"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, codice o città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-suppliers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun fornitore trovato</p>
              <p className="text-sm">Clicca su "Nuovo Fornitore" per aggiungerne uno</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Canale</TableHead>
                  <TableHead>Consegna</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => {
                  const ChannelIcon = communicationChannelIcons[supplier.communicationChannel as CommunicationChannel] || Mail;
                  return (
                    <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                      <TableCell>
                        <Badge variant="outline">{supplier.code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          {supplier.city && (
                            <div className="text-xs text-muted-foreground">{supplier.city}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <ChannelIcon className="h-3 w-3" />
                          {communicationChannelLabels[supplier.communicationChannel as CommunicationChannel]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          {supplier.deliveryDays || 3}gg
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.isActive ? "default" : "secondary"}>
                          {supplier.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(supplier)}
                            data-testid={`button-edit-supplier-${supplier.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questo fornitore?")) {
                                deleteMutation.mutate(supplier.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-supplier-${supplier.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
