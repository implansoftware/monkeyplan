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
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { useTranslation } from "react-i18next";

type CommunicationChannel = 'email' | 'api' | 'whatsapp';

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

export default function AdminSuppliers() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedZipCode, setSelectedZipCode] = useState("");
  const [selectedAddress, setSelectedAddress] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (editingSupplier) {
      setSelectedCity(editingSupplier.city || "");
      setSelectedZipCode(editingSupplier.zipCode || "");
      setSelectedAddress(editingSupplier.address || "");
    } else {
      setSelectedCity("");
      setSelectedZipCode("");
      setSelectedAddress("");
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
      toast({ title: t("suppliers.supplierCreated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("suppliers.supplierUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      toast({ title: t("suppliers.supplierDeleted") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      address: selectedAddress || undefined,
      city: selectedCity || undefined,
      zipCode: selectedZipCode || undefined,
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
    setSelectedCity("");
    setSelectedZipCode("");
    setSelectedAddress("");
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Anagrafica Fornitori</h1>
              <p className="text-sm text-muted-foreground">
                Gestisci i fornitori e le loro configurazioni di comunicazione
              </p>
            </div>
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
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">{t("common.general")}</TabsTrigger>
                  <TabsTrigger value="contact">{t("common.contacts")}</TabsTrigger>
                  <TabsTrigger value="communication">{t("suppliers.communication")}</TabsTrigger>
                  <TabsTrigger value="commercial">{t("suppliers.conditions")}</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4" forceMount hidden={activeTab !== "general"}>
                  {editingSupplier && (
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-muted-foreground text-xs">Codice Fornitore</Label>
                      <p className="font-mono font-semibold" data-testid="text-supplier-code">{editingSupplier.code}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("suppliers.businessName")} *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={editingSupplier?.name}
                      required 
                      data-testid="input-supplier-name" 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">{t("suppliers.vatNumber")}</Label>
                      <Input 
                        id="vatNumber" 
                        name="vatNumber" 
                        defaultValue={editingSupplier?.vatNumber || ""}
                        data-testid="input-supplier-vat" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fiscalCode">{t("suppliers.fiscalCode")}</Label>
                      <Input 
                        id="fiscalCode" 
                        name="fiscalCode" 
                        defaultValue={editingSupplier?.fiscalCode || ""}
                        data-testid="input-supplier-fiscal" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="internalNotes">{t("common.internalNotes")}</Label>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("common.email")}</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email"
                        defaultValue={editingSupplier?.email || ""}
                        data-testid="input-supplier-email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("common.phone")}</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel"
                        defaultValue={editingSupplier?.phone || ""}
                        data-testid="input-supplier-phone" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <Label htmlFor="website">{t("suppliers.website")}</Label>
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
                    <Label htmlFor="address">{t("common.address")}</Label>
                    <AddressAutocomplete
                      id="address"
                      name="address"
                      value={selectedAddress}
                      onChange={setSelectedAddress}
                      onAddressSelect={(result) => {
                        setSelectedAddress(result.address);
                        setSelectedCity(result.city);
                        setSelectedZipCode(result.postalCode);
                      }}
                      placeholder={t("common.startTypingAddress")}
                      data-testid="input-supplier-address"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("common.city")}</Label>
                      <Input
                        id="city"
                        name="city"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        placeholder={t("common.city")}
                        data-testid="input-supplier-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">CAP</Label>
                      <Input 
                        id="zipCode" 
                        name="zipCode" 
                        value={selectedZipCode}
                        onChange={(e) => setSelectedZipCode(e.target.value)}
                        placeholder="CAP"
                        data-testid="input-supplier-zip" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t("common.country")}</Label>
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
                    <Label htmlFor="communicationChannel">{t("suppliers.preferredChannel")} *</Label>
                    <Select 
                      name="communicationChannel" 
                      defaultValue={editingSupplier?.communicationChannel || "email"}
                    >
                      <SelectTrigger data-testid="select-communication-channel">
                        <SelectValue placeholder={t("suppliers.selectChannel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex flex-wrap items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="api">
                          <div className="flex flex-wrap items-center gap-2">
                            <Code className="h-4 w-4" />
                            API
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex flex-wrap items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
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
                      <Label htmlFor="apiFormat">{t("suppliers.format")}</Label>
                      <Select name="apiFormat" defaultValue={editingSupplier?.apiFormat || "json"}>
                        <SelectTrigger data-testid="select-api-format">
                          <SelectValue placeholder={t("suppliers.format")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="custom">{t("suppliers.custom")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Per configurare la chiave API in modo sicuro, usa il tab "API"
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <Mail className="h-4 w-4" />
                      Template Email
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orderEmailTemplate">{t("suppliers.orderTemplate")}</Label>
                      <Textarea 
                        id="orderEmailTemplate" 
                        name="orderEmailTemplate" 
                        rows={3}
                        placeholder={t("suppliers.orderEmailTemplate")}
                        defaultValue={editingSupplier?.orderEmailTemplate || ""}
                        data-testid="input-supplier-order-template" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="returnEmailTemplate">{t("suppliers.returnTemplate")}</Label>
                      <Textarea 
                        id="returnEmailTemplate" 
                        name="returnEmailTemplate" 
                        rows={3}
                        placeholder={t("suppliers.returnEmailTemplate")}
                        defaultValue={editingSupplier?.returnEmailTemplate || ""}
                        data-testid="input-supplier-return-template" 
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="commercial" className="space-y-4 mt-4" forceMount hidden={activeTab !== "commercial"}>
                  <div className="space-y-2">
                    <Label>{t("suppliers.paymentTerms")}</Label>
                    <Select 
                      name="paymentTerms" 
                      defaultValue={editingSupplier?.paymentTerms || "bank_transfer_30"}
                    >
                      <SelectTrigger data-testid="select-payment-terms">
                        <SelectValue placeholder={t("suppliers.selectTerms")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">{t("suppliers.immediatePayment")}</SelectItem>
                        <SelectItem value="cod">{t("suppliers.cashOnDelivery")}</SelectItem>
                        <SelectItem value="bank_transfer_15">{t("suppliers.bankTransfer15")}</SelectItem>
                        <SelectItem value="bank_transfer_30">{t("suppliers.bankTransfer30")}</SelectItem>
                        <SelectItem value="bank_transfer_60">{t("suppliers.bankTransfer60")}</SelectItem>
                        <SelectItem value="bank_transfer_90">{t("suppliers.bankTransfer90")}</SelectItem>
                        <SelectItem value="riba_30">RiBa 30gg DFFM</SelectItem>
                        <SelectItem value="riba_60">RiBa 60gg DFFM</SelectItem>
                        <SelectItem value="credit_card">{t("suppliers.creditCard")}</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="custom">{t("suppliers.custom")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    ? t("settings.savingRate") 
                    : editingSupplier ? "Aggiorna" : "Crea Fornitore"}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
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
              <p>{t("suppliers.noSuppliers")}</p>
              <p className="text-sm">Clicca su "Nuovo Fornitore" per aggiungerne uno</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.code")}</TableHead>
                  <TableHead>{t("suppliers.supplier")}</TableHead>
                  <TableHead>{t("common.contacts")}</TableHead>
                  <TableHead>{t("suppliers.channel")}</TableHead>
                  <TableHead>{t("suppliers.delivery")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                            <div className="flex flex-wrap items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex flex-wrap items-center gap-2">
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
                        <div className="flex flex-wrap items-center gap-1 text-sm">
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
