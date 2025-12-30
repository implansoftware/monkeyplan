import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, Wrench, Ticket, TrendingUp, Package, Building, 
  Store, Warehouse, ShoppingCart, Zap, FileCheck, Clock,
  UserPlus, AlertTriangle, Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Reseller = {
  id: string;
  username: string;
  fullName: string | null;
};

type RepairCenter = {
  id: string;
  name: string;
  resellerId: string | null;
};

type AdminStats = {
  overview: {
    totalRevenue: number;
    paidInvoices: number;
    totalRepairs: number;
    activeRepairs: number;
    completedRepairs: number;
    avgRepairTime: number;
    totalTickets: number;
    openTickets: number;
  };
  ticketsByStatus: {
    open: number;
    in_progress: number;
    closed: number;
  };
  repairsByStatus: {
    pending: number;
    ingressato: number;
    in_diagnosi: number;
    preventivo_emesso: number;
    preventivo_accettato: number;
    preventivo_rifiutato: number;
    attesa_ricambi: number;
    in_riparazione: number;
    pronto_ritiro: number;
    consegnato: number;
    annullato: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    usageCount: number;
    stockIn: number;
    centersCount: number;
  }>;
  repairCenterPerformance: Array<{
    repairCenterId: string;
    totalRepairs: number;
    completedRepairs: number;
    cancelledRepairs: number;
    avgRepairDays: number;
    successRate: number;
    totalRevenue: number;
  }>;
  latestCustomers: Array<{
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    createdAt: string;
    resellerId: string | null;
  }>;
  latestResellers: Array<{
    id: string;
    username: string;
    email: string;
    fullName: string | null;
    phone: string | null;
    createdAt: string;
    isActive: boolean;
  }>;
  resellerStats: {
    total: number;
    active: number;
    withCenters: number;
    withCustomers: number;
  };
  repairCenterGlobalStats: {
    total: number;
    active: number;
    totalRepairs: number;
    avgRepairsPerCenter: number;
  };
  utilityStats: {
    total: number;
    byStatus: Record<string, number>;
    totalCommissions: number;
    pendingCommissions: number;
  };
  warehouseStats: {
    totalWarehouses: number;
    totalStock: number;
    totalValue: number;
    lowStockItems: number;
  };
  ecommerceStats: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    activeCartItems: number;
  };
};


export default function AdminDashboard() {
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [selectedRepairCenterId, setSelectedRepairCenterId] = useState<string>("");
  
  // Build query params for filtered stats - use URL in queryKey for default fetcher
  const statsParams = new URLSearchParams();
  if (selectedResellerId) statsParams.set("resellerId", selectedResellerId);
  if (selectedRepairCenterId) statsParams.set("repairCenterId", selectedRepairCenterId);
  const statsQueryString = statsParams.toString();
  const statsUrl = statsQueryString ? `/api/stats?${statsQueryString}` : "/api/stats";
  
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: [statsUrl],
  });
  
  // Fetch resellers for filter dropdown
  const { data: resellers } = useQuery<Reseller[]>({
    queryKey: ["/api/resellers"],
  });
  
  // Fetch repair centers for filter dropdown
  const { data: repairCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });
  
  // Filter repair centers by selected reseller
  const filteredRepairCenters = selectedResellerId 
    ? repairCenters?.filter(rc => rc.resellerId === selectedResellerId)
    : repairCenters;
  
  const clearFilters = () => {
    setSelectedResellerId("");
    setSelectedRepairCenterId("");
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: it });
    } catch {
      return "-";
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Dashboard Amministratore</h1>
          <p className="text-muted-foreground">
            Panoramica completa della piattaforma Monkey Plan Beta v.21
          </p>
        </div>
        
        {/* Filtri Grafici */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtra per:</span>
            </div>
            
            <Select 
              value={selectedResellerId} 
              onValueChange={(value) => {
                setSelectedResellerId(value === "all" ? "" : value);
                setSelectedRepairCenterId(""); // Reset repair center when reseller changes
              }}
            >
              <SelectTrigger className="w-[180px]" data-testid="select-reseller-filter">
                <SelectValue placeholder="Rivenditore" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Rivenditori</SelectItem>
                {resellers?.map((reseller) => (
                  <SelectItem key={reseller.id} value={reseller.id}>
                    {reseller.fullName || reseller.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedRepairCenterId} 
              onValueChange={(value) => setSelectedRepairCenterId(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[200px]" data-testid="select-repair-center-filter">
                <SelectValue placeholder="Centro Riparazione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Centri</SelectItem>
                {filteredRepairCenters?.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(selectedResellerId || selectedRepairCenterId) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                Rimuovi Filtri
              </Button>
            )}
          </div>
          
          {(selectedResellerId || selectedRepairCenterId) && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filtri attivi:</span>
              {selectedResellerId && (
                <Badge variant="secondary" className="text-xs">
                  Rivenditore: {resellers?.find(r => r.id === selectedResellerId)?.fullName || resellers?.find(r => r.id === selectedResellerId)?.username}
                </Badge>
              )}
              {selectedRepairCenterId && (
                <Badge variant="secondary" className="text-xs">
                  Centro: {repairCenters?.find(rc => rc.id === selectedRepairCenterId)?.name}
                </Badge>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-kpi-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fatturato Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-kpi-revenue">
                  {formatCurrency(stats?.overview?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.overview?.paidInvoices ?? 0} fatture pagate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-repairs">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riparazioni Totali</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-kpi-repairs">
                  {stats?.overview?.totalRepairs ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.overview?.activeRepairs ?? 0} in corso
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-tickets">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Totali</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-kpi-tickets">
                  {stats?.overview?.totalTickets ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.overview?.openTickets ?? 0} aperti
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-avgtime">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Medio Riparazione</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-kpi-avgtime">
                  {(stats?.overview?.avgRepairTime || 0).toFixed(1)} giorni
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.overview?.completedRepairs ?? 0} completate
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Reseller Stats */}
        <Card data-testid="card-stats-resellers">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rivenditori</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Totale</span>
                  <span className="font-semibold">{stats?.resellerStats?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Attivi</span>
                  <span className="font-semibold text-green-600">{stats?.resellerStats?.active ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Con Centri</span>
                  <span className="font-semibold">{stats?.resellerStats?.withCenters ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repair Center Stats */}
        <Card data-testid="card-stats-centers">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Centri Riparazione</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Totale</span>
                  <span className="font-semibold">{stats?.repairCenterGlobalStats?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Attivi</span>
                  <span className="font-semibold text-green-600">{stats?.repairCenterGlobalStats?.active ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Media Lavorazioni</span>
                  <span className="font-semibold">{stats?.repairCenterGlobalStats?.avgRepairsPerCenter ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Utility Stats */}
        <Card data-testid="card-stats-utility">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utility & Pratiche</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Pratiche Totali</span>
                  <span className="font-semibold">{stats?.utilityStats?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Compensi Totali</span>
                  <span className="font-semibold">{formatCurrency(stats?.utilityStats?.totalCommissions ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">In Attesa</span>
                  <span className="font-semibold text-yellow-600">{formatCurrency(stats?.utilityStats?.pendingCommissions ?? 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warehouse Stats */}
        <Card data-testid="card-stats-warehouse">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Magazzino</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Magazzini</span>
                  <span className="font-semibold">{stats?.warehouseStats?.totalWarehouses ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Stock Totale</span>
                  <span className="font-semibold">{stats?.warehouseStats?.totalStock ?? 0} pz</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Sotto Scorta</span>
                  <Badge variant={stats?.warehouseStats?.lowStockItems ? "destructive" : "secondary"} className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {stats?.warehouseStats?.lowStockItems ?? 0}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* E-commerce Stats Row */}
      <Card data-testid="card-stats-ecommerce">
        <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            E-commerce
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="text-2xl font-bold">{stats?.ecommerceStats?.totalOrders ?? 0}</div>
                <div className="text-xs text-muted-foreground">Ordini Totali</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="text-2xl font-bold">{formatCurrency(stats?.ecommerceStats?.totalRevenue ?? 0)}</div>
                <div className="text-xs text-muted-foreground">Fatturato E-commerce</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="text-2xl font-bold text-yellow-600">{stats?.ecommerceStats?.pendingOrders ?? 0}</div>
                <div className="text-xs text-muted-foreground">Ordini Pendenti</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded-md">
                <div className="text-2xl font-bold">{stats?.ecommerceStats?.activeCartItems ?? 0}</div>
                <div className="text-xs text-muted-foreground">Carrelli Attivi</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Latest Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Customers */}
        <Card data-testid="card-latest-customers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Ultimi Clienti Registrati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : stats?.latestCustomers && stats.latestCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.latestCustomers.map((customer) => (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium">
                        {customer.fullName || customer.username}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.email}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Nessun cliente registrato
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Resellers */}
        <Card data-testid="card-latest-resellers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Ultimi Rivenditori Registrati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : stats?.latestResellers && stats.latestResellers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.latestResellers.map((reseller) => (
                    <TableRow key={reseller.id} data-testid={`row-reseller-${reseller.id}`}>
                      <TableCell className="font-medium">
                        {reseller.fullName || reseller.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant={reseller.isActive ? "default" : "secondary"}>
                          {reseller.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(reseller.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Nessun rivenditore registrato
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Prodotti Più Utilizzati
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : stats?.topProducts && stats.topProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Utilizzo</TableHead>
                  <TableHead className="text-right">Stock In</TableHead>
                  <TableHead className="text-right">Centri</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell className="capitalize">{product.category}</TableCell>
                    <TableCell className="text-right">{product.usageCount}</TableCell>
                    <TableCell className="text-right">{product.stockIn}</TableCell>
                    <TableCell className="text-right">{product.centersCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nessun dato sui prodotti disponibile
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
