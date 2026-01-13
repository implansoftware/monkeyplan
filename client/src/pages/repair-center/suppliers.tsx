import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, Search, Mail, Phone, MapPin, Globe, User, Settings, ShoppingCart, Package, CheckCircle, AlertTriangle, Zap, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalIntegration } from "@shared/schema";

import sifarLogo from "@/assets/logos/sifar.png";
import fonedayLogo from "@/assets/logos/foneday.png";
import mobilesentrixLogo from "@/assets/logos/mobilesentrix.png";
import trovausatiLogo from "@/assets/logos/trovausati.png";

const INTEGRATION_LOGOS: Record<string, string> = {
  sifar: sifarLogo,
  foneday: fonedayLogo,
  mobilesentrix: mobilesentrixLogo,
  trovausati: trovausatiLogo,
};

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

export default function RepairCenterSuppliers() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/repair-center/suppliers"],
  });

  const { data: sifarCredential } = useQuery<SifarCredential | null>({
    queryKey: ["/api/repair-center/sifar/credentials"],
  });

  const { data: sifarStores = [] } = useQuery<SifarStore[]>({
    queryKey: ["/api/repair-center/sifar/stores"],
    enabled: !!sifarCredential?.hasClientKey,
  });

  const { data: externalIntegrations = [] } = useQuery<ExternalIntegration[]>({
    queryKey: ["/api/external-integrations"],
  });

  const { data: trovausatiCredential } = useQuery<TrovausatiCredential | null>({
    queryKey: ["/api/repair-center/trovausati/credentials"],
  });

  const { data: trovausatiShops = [] } = useQuery<TrovausatiShop[]>({
    queryKey: ["/api/repair-center/trovausati/shops"],
    enabled: !!trovausatiCredential,
  });

  const { data: fonedayCredential } = useQuery<{ id: string; isActive: boolean } | null>({
    queryKey: ["/api/repair-center/foneday/credentials"],
  });

  const { data: mobilesentrixCredential } = useQuery<{ id: string; isActive: boolean } | null>({
    queryKey: ["/api/repair-center/mobilesentrix/credentials"],
  });

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.city?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const globalSuppliers = filteredSuppliers.filter(s => s.isGlobal);
  const resellerSuppliers = filteredSuppliers.filter(s => !s.isGlobal);

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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Fornitori</h1>
              <p className="text-sm text-muted-foreground">Visualizza i fornitori disponibili</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              {globalSuppliers.length} globali
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              {resellerSuppliers.length} rivenditore
            </Badge>
          </div>
        </div>
      </div>

      {externalIntegrations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Integrazioni API</h2>
            <Badge variant="secondary">{externalIntegrations.length}</Badge>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Le integrazioni API sono gestite dal tuo rivenditore. Contatta il tuo rivenditore per abilitare o configurare nuove integrazioni.
            </AlertDescription>
          </Alert>
          
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
                  className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
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
                      <div className={`flex-shrink-0 p-2 rounded-xl ${
                        isConfigured 
                          ? 'bg-green-100 dark:bg-green-900/30' 
                          : 'bg-muted'
                      }`}>
                        {INTEGRATION_LOGOS[integration.code] ? (
                          <div className="h-10 w-16 flex items-center justify-center">
                            <img 
                              src={INTEGRATION_LOGOS[integration.code]} 
                              alt={integration.name}
                              className="max-h-8 max-w-full object-contain"
                            />
                          </div>
                        ) : integration.logoUrl ? (
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
                        <div className="flex items-center gap-2 flex-wrap">
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
                    {isSifar && isConfigured && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>Ambiente: <Badge variant="outline" className="ml-1" data-testid="text-sifar-environment">{sifarCredential?.environment}</Badge></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span data-testid="text-sifar-store-count">{sifarStoreCount} {sifarStoreCount === 1 ? 'punto vendita' : 'punti vendita'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href="/repair-center/sifar/catalog">
                            <Button variant="default" size="sm" data-testid="button-sifar-catalog">
                              <Package className="h-4 w-4 mr-2" />
                              Catalogo Ricambi
                            </Button>
                          </Link>
                          <Link href="/repair-center/sifar/cart">
                            <Button variant="outline" size="sm" data-testid="button-sifar-cart">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Carrello
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                    {isFoneday && isConfigured && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-xs text-green-800 dark:text-green-200">
                            Integrazione attiva tramite il rivenditore.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href="/repair-center/foneday/catalog">
                            <Button variant="default" size="sm" data-testid="button-foneday-catalog">
                              <Package className="h-4 w-4 mr-2" />
                              Catalogo
                            </Button>
                          </Link>
                          <Link href="/repair-center/foneday/cart">
                            <Button variant="outline" size="sm" data-testid="button-foneday-cart">
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Carrello
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                    {isTrovausati && isConfigured && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>Tipo: <Badge variant="outline" className="ml-1" data-testid="text-trovausati-type">{trovausatiCredential?.apiType === 'resellers' ? 'Rivenditori' : 'Negozi/GDS'}</Badge></span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span data-testid="text-trovausati-shop-count">{trovausatiShopCount} {trovausatiShopCount === 1 ? 'negozio' : 'negozi'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-xs text-green-800 dark:text-green-200">
                            Integrazione attiva tramite il rivenditore.
                          </p>
                        </div>
                      </div>
                    )}
                    {isMobilesentrix && isConfigured && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                          <p className="text-xs text-green-800 dark:text-green-200">
                            Integrazione attiva tramite il rivenditore.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href="/repair-center/mobilesentrix/catalog">
                            <Button variant="default" size="sm" data-testid="button-mobilesentrix-catalog">
                              <Package className="h-4 w-4 mr-2" />
                              Catalogo
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                    {!isConfigured && isKnownIntegration && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Questa integrazione non è stata configurata dal rivenditore.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
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
              data-testid="input-search-supplier"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun fornitore disponibile</p>
              <p className="text-sm mt-1">I fornitori del tuo rivenditore appariranno qui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Tempi</TableHead>
                  <TableHead>Tipo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-supplier-code-${supplier.id}`}>
                      {supplier.code}
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-supplier-name-${supplier.id}`}>
                      {supplier.name}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.city && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {supplier.city}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.deliveryDays && (
                        <span className="text-sm">{supplier.deliveryDays} giorni</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.isGlobal ? (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          Globale
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <User className="h-3 w-3" />
                          Rivenditore
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
