import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Truck, Search, Mail, Phone, MapPin, Plus, Pencil, Trash2, Globe, User, Settings, ShoppingCart, Package, CheckCircle, AlertTriangle, Zap, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalIntegration } from "@shared/schema";
import { ActionGuard } from "@/components/permission-guard";

type Supplier = {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  zipCode: string | null;
  country: string | null;
  vatNumber: string | null;
  fiscalCode: string | null;
  deliveryDays: number | null;
  isActive: boolean;
  createdBy: string | null;
  isGlobal: boolean;
  isOwn: boolean;
};

type SupplierFormData = {
  name: string;
  email: string;
  phone: string;
  vatNumber: string;
  fiscalCode: string;
  deliveryDays: string;
};

type SifarCredential = {
  id: string;
  environment: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  hasClientKey: boolean;
};

type SifarStore = {
  id: string;
  storeCode: string;
  storeName: string | null;
  isDefault: boolean;
};

type TrovausatiCredential = {
  id: string;
  apiType: string;
  isActive: boolean;
  lastTestResult: string | null;
  createdAt: string;
};

type TrovausatiShop = {
  id: string;
  shopId: string;
  shopName: string | null;
  isActive: boolean;
};

const initialFormData: SupplierFormData = {
  name: "",
  email: "",
  phone: "",
  vatNumber: "",
  fiscalCode: "",
  deliveryDays: "3",
};

export default function ResellerSuppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedZipCode, setSelectedZipCode] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editingSupplier) {
      setSelectedAddress(editingSupplier.address || "");
      setSelectedCity(editingSupplier.city || "");
      setSelectedZipCode(editingSupplier.zipCode || "");
    } else {
      setSelectedAddress("");
      setSelectedCity("");
      setSelectedZipCode("");
    }
  }, [editingSupplier]);

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/reseller/suppliers"],
  });

  const { data: sifarCredential } = useQuery<SifarCredential | null>({
    queryKey: ["/api/sifar/credentials"],
  });

  const { data: sifarStores = [] } = useQuery<SifarStore[]>({
    queryKey: ["/api/sifar/stores"],
    enabled: !!sifarCredential?.hasClientKey,
  });

  const { data: externalIntegrations = [] } = useQuery<ExternalIntegration[]>({
    queryKey: ["/api/external-integrations"],
  });

  const { data: trovausatiCredential } = useQuery<TrovausatiCredential | null>({
    queryKey: ["/api/trovausati/credentials"],
  });

  const { data: trovausatiShops = [] } = useQuery<TrovausatiShop[]>({
    queryKey: ["/api/trovausati/shops"],
    enabled: !!trovausatiCredential,
  });

  // Query Foneday credentials
  const { data: fonedayCredential } = useQuery<{ id: string; isActive: boolean } | null>({
    queryKey: ["/api/foneday/credentials"],
  });

  // Query MobileSentrix credentials
  const { data: mobilesentrixCredential } = useQuery<{ id: string; isActive: boolean } | null>({
    queryKey: ["/api/mobilesentrix/credentials"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      return apiRequest("POST", "/api/reseller/suppliers", {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: selectedAddress || null,
        city: selectedCity || null,
        zipCode: selectedZipCode || null,
        country: "IT",
        vatNumber: data.vatNumber || null,
        fiscalCode: data.fiscalCode || null,
        deliveryDays: data.deliveryDays ? parseInt(data.deliveryDays) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/suppliers"] });
      toast({ title: "Fornitore creato", description: "Il nuovo fornitore è stato aggiunto con successo" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Errore durante la creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SupplierFormData }) => {
      return apiRequest("PATCH", `/api/reseller/suppliers/${id}`, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: selectedAddress || null,
        city: selectedCity || null,
        zipCode: selectedZipCode || null,
        country: "IT",
        vatNumber: data.vatNumber || null,
        fiscalCode: data.fiscalCode || null,
        deliveryDays: data.deliveryDays ? parseInt(data.deliveryDays) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/suppliers"] });
      toast({ title: "Fornitore aggiornato", description: "Le modifiche sono state salvate" });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Errore durante l'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/suppliers"] });
      toast({ title: "Fornitore eliminato", description: "Il fornitore è stato rimosso" });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message || "Errore durante l'eliminazione", variant: "destructive" });
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
    setFormData(initialFormData);
    setSelectedAddress("");
    setSelectedCity("");
    setSelectedZipCode("");
  };

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData(initialFormData);
    setSelectedAddress("");
    setSelectedCity("");
    setSelectedZipCode("");
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || "",
      phone: supplier.phone || "",
      vatNumber: supplier.vatNumber || "",
      fiscalCode: supplier.fiscalCode || "",
      deliveryDays: supplier.deliveryDays?.toString() || "3",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Errore", description: "Il nome del fornitore è obbligatorio", variant: "destructive" });
      return;
    }

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const globalSuppliers = filteredSuppliers.filter(s => s.isGlobal);
  const ownSuppliers = filteredSuppliers.filter(s => s.isOwn);

  const sifarConfigured = sifarCredential?.hasClientKey === true;
  const sifarStoreCount = sifarStores.length;
  const trovausatiConfigured = !!trovausatiCredential;
  const trovausatiShopCount = trovausatiShops.length;
  const fonedayConfigured = !!fonedayCredential;
  const mobilesentrixConfigured = !!mobilesentrixCredential;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">Fornitori</h1>
              <p className="text-sm text-white/80">Gestisci fornitori manuali e integrazioni API</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-white/30">
              <Globe className="h-3 w-3" />
              {globalSuppliers.length} globali
            </Badge>
            <Badge variant="secondary" className="gap-1 bg-white/20 text-white border-white/30">
              <User className="h-3 w-3" />
              {ownSuppliers.length} personali
            </Badge>
            <ActionGuard module="suppliers" action="create">
              <Button onClick={handleOpenCreate} variant="secondary" className="shadow-lg" data-testid="button-add-supplier">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Fornitore
              </Button>
            </ActionGuard>
          </div>
        </div>
      </div>

      {externalIntegrations.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Integrazioni API</h2>
            <Badge variant="secondary">{externalIntegrations.length}</Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {externalIntegrations.map((integration) => {
              const isSifar = integration.code === 'sifar';
              const isTrovausati = integration.code === 'trovausati';
              const isFoneday = integration.code === 'foneday';
              const isMobilesentrix = integration.code === 'mobilesentrix';
              const isKnownIntegration = isSifar || isTrovausati || isFoneday || isMobilesentrix;
              const isConfigured = isSifar ? sifarConfigured 
                : isTrovausati ? trovausatiConfigured 
                : isFoneday ? fonedayConfigured 
                : isMobilesentrix ? mobilesentrixConfigured 
                : false;
              
              return (
                <Card 
                  key={integration.id} 
                  className={`relative overflow-hidden rounded-2xl transition-all duration-200 hover:shadow-md ${
                    isConfigured 
                      ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20' 
                      : 'border-border hover:border-primary/30'
                  }`}
                  data-testid={`card-integration-${integration.code}`}
                >
                  {isConfigured && (
                    <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                      <div className="absolute top-2 right-[-20px] w-[80px] bg-green-500 text-white text-[10px] font-medium py-0.5 text-center rotate-45 shadow-sm">
                        Attivo
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 p-3 rounded-xl ${
                        isConfigured 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-muted'
                      }`}>
                        {integration.logoUrl ? (
                          <img 
                            src={integration.logoUrl} 
                            alt={integration.name}
                            className="h-8 w-8 object-contain"
                          />
                        ) : (
                          <Zap className={`h-8 w-8 ${isConfigured ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 flex-wrap">
                          <CardTitle className="text-base font-semibold">
                            {integration.name}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                            API
                          </Badge>
                        </div>
                        {integration.description && (
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {integration.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {isSifar ? (
                      isConfigured ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>Ambiente: <Badge variant="outline" className="ml-1" data-testid="text-sifar-environment">{sifarCredential?.environment}</Badge></span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span data-testid="text-sifar-store-count">{sifarStoreCount} {sifarStoreCount === 1 ? 'punto vendita' : 'punti vendita'}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 flex-wrap">
                            <Link href="/reseller/sifar/catalog">
                              <Button variant="default" size="sm" data-testid="button-sifar-catalog">
                                <Package className="h-4 w-4 mr-2" />
                                Catalogo Ricambi
                              </Button>
                            </Link>
                            <Link href="/reseller/sifar/cart">
                              <Button variant="outline" size="sm" data-testid="button-sifar-cart">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Carrello
                              </Button>
                            </Link>
                            <Link href="/reseller/sifar/settings">
                              <Button variant="ghost" size="sm" data-testid="button-sifar-settings">
                                <Settings className="h-4 w-4 mr-2" />
                                Impostazioni
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              Configura le credenziali per ordinare ricambi dal catalogo SIFAR.
                            </p>
                          </div>
                          <Link href="/reseller/sifar/settings">
                            <Button size="sm" className="w-full" data-testid="button-sifar-configure">
                              <Settings className="h-4 w-4 mr-2" />
                              Configura SIFAR
                            </Button>
                          </Link>
                        </div>
                      )
                    ) : isTrovausati ? (
                      isConfigured ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex flex-wrap items-center gap-1">
                              <Package className="h-4 w-4" />
                              <span>Tipo: <Badge variant="outline" className="ml-1" data-testid="text-trovausati-type">{trovausatiCredential?.apiType === 'resellers' ? 'Rivenditori' : 'Negozi/GDS'}</Badge></span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span data-testid="text-trovausati-shop-count">{trovausatiShopCount} {trovausatiShopCount === 1 ? 'negozio' : 'negozi'}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 flex-wrap">
                            <Link href="/reseller/trovausati/settings">
                              <Button variant="ghost" size="sm" data-testid="button-trovausati-settings">
                                <Settings className="h-4 w-4 mr-2" />
                                Impostazioni
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              Configura le credenziali per accedere a valutazioni e marketplace usato.
                            </p>
                          </div>
                          <Link href="/reseller/trovausati/settings">
                            <Button size="sm" className="w-full" data-testid="button-trovausati-configure">
                              <Settings className="h-4 w-4 mr-2" />
                              Configura TrovaUsati
                            </Button>
                          </Link>
                        </div>
                      )
                    ) : isFoneday ? (
                      isConfigured ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <p className="text-xs text-green-800 dark:text-green-200">
                              Credenziali API configurate correttamente.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 flex-wrap">
                            <Link href="/reseller/foneday/catalog">
                              <Button variant="default" size="sm" data-testid="button-foneday-catalog">
                                <Package className="h-4 w-4 mr-2" />
                                Catalogo
                              </Button>
                            </Link>
                            <Link href="/reseller/foneday/cart">
                              <Button variant="outline" size="sm" data-testid="button-foneday-cart">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Carrello
                              </Button>
                            </Link>
                            <Link href="/reseller/foneday/settings">
                              <Button variant="ghost" size="sm" data-testid="button-foneday-settings">
                                <Settings className="h-4 w-4 mr-2" />
                                Impostazioni
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              Configura il tuo API Token per ordinare ricambi da Foneday.
                            </p>
                          </div>
                          <Link href="/reseller/foneday/settings">
                            <Button size="sm" className="w-full" data-testid="button-foneday-configure">
                              <Settings className="h-4 w-4 mr-2" />
                              Configura Foneday
                            </Button>
                          </Link>
                        </div>
                      )
                    ) : isMobilesentrix ? (
                      isConfigured ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                            <p className="text-xs text-green-800 dark:text-green-200">
                              Credenziali API configurate correttamente.
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 flex-wrap">
                            <Link href="/reseller/mobilesentrix/catalog">
                              <Button variant="default" size="sm" data-testid="button-mobilesentrix-catalog">
                                <Package className="h-4 w-4 mr-2" />
                                Catalogo
                              </Button>
                            </Link>
                            <Link href="/reseller/mobilesentrix/settings">
                              <Button variant="ghost" size="sm" data-testid="button-mobilesentrix-settings">
                                <Settings className="h-4 w-4 mr-2" />
                                Impostazioni
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              Configura le credenziali per ordinare ricambi da MobileSentrix.
                            </p>
                          </div>
                          <Link href="/reseller/mobilesentrix/settings">
                            <Button size="sm" className="w-full" data-testid="button-mobilesentrix-configure">
                              <Settings className="h-4 w-4 mr-2" />
                              Configura MobileSentrix
                            </Button>
                          </Link>
                        </div>
                      )
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed">
                          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            Questa integrazione sarà disponibile a breve.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {integration.supportsCatalog && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Package className="h-3 w-3" />
                              Catalogo prodotti
                            </Badge>
                          )}
                          {integration.supportsOrdering && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <ShoppingCart className="h-3 w-3" />
                              Invio ordini
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Truck className="h-5 w-5" />
            Elenco Fornitori
          </CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cerca fornitore..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun fornitore trovato</p>
              <p className="text-sm mt-1">Clicca su "Nuovo Fornitore" per aggiungere il tuo primo fornitore</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Codice</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Città</TableHead>
                  <TableHead>Tempi Consegna</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="w-[100px]">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell>
                      {supplier.isGlobal ? (
                        <Badge variant="outline" className="gap-1" data-testid={`badge-supplier-type-${supplier.id}`}>
                          <Globe className="h-3 w-3" />
                          Globale
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1" data-testid={`badge-supplier-type-${supplier.id}`}>
                          <User className="h-3 w-3" />
                          Personale
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-supplier-code-${supplier.id}`}>
                      {supplier.code}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-supplier-name-${supplier.id}`}>
                      {supplier.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        {supplier.email && (
                          <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span data-testid={`text-supplier-email-${supplier.id}`}>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span data-testid={`text-supplier-phone-${supplier.id}`}>{supplier.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city && (
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span data-testid={`text-supplier-city-${supplier.id}`}>{supplier.city}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-supplier-delivery-${supplier.id}`}>
                      {supplier.deliveryDays ? `${supplier.deliveryDays} giorni` : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? "default" : "secondary"} data-testid={`badge-supplier-status-${supplier.id}`}>
                        {supplier.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.isOwn && (
                        <div className="flex flex-wrap items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(supplier)}
                            data-testid={`button-edit-supplier-${supplier.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(supplier.id)}
                            data-testid={`button-delete-supplier-${supplier.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Modifica Fornitore" : "Nuovo Fornitore"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome / Ragione Sociale *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome del fornitore"
                data-testid="input-supplier-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@esempio.it"
                data-testid="input-supplier-email"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+39 123 456 7890"
                data-testid="input-supplier-phone"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Indirizzo</Label>
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
                placeholder="Inizia a digitare l'indirizzo..."
                data-testid="input-supplier-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Città</Label>
              <Input
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="Milano"
                data-testid="input-supplier-city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">CAP</Label>
              <Input
                id="zipCode"
                value={selectedZipCode}
                onChange={(e) => setSelectedZipCode(e.target.value)}
                placeholder="20100"
                data-testid="input-supplier-zipcode"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">Partita IVA</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                placeholder="IT12345678901"
                data-testid="input-supplier-vat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscalCode">Codice Fiscale</Label>
              <Input
                id="fiscalCode"
                value={formData.fiscalCode}
                onChange={(e) => setFormData({ ...formData, fiscalCode: e.target.value })}
                placeholder="RSSMRA80A01H501U"
                data-testid="input-supplier-fiscal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDays">Tempi di Consegna (giorni)</Label>
              <Input
                id="deliveryDays"
                type="number"
                min="1"
                value={formData.deliveryDays}
                onChange={(e) => setFormData({ ...formData, deliveryDays: e.target.value })}
                placeholder="3"
                data-testid="input-supplier-delivery"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
              Annulla
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Sei sicuro di voler eliminare questo fornitore? L'operazione non può essere annullata.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} data-testid="button-cancel-delete">
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
