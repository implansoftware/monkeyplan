import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, Wrench, Ticket, TrendingUp, Package, Building, 
  Store, Warehouse, ShoppingCart, Zap, FileCheck, Clock,
  UserPlus, AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/stats"],
  });

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

  const ticketsChartData = stats?.ticketsByStatus ? [
    { name: "Aperti", value: stats.ticketsByStatus.open || 0, fill: COLORS[0] },
    { name: "In Corso", value: stats.ticketsByStatus.in_progress || 0, fill: COLORS[1] },
    { name: "Chiusi", value: stats.ticketsByStatus.closed || 0, fill: COLORS[2] },
  ] : [];

  const repairsChartData = stats?.repairsByStatus ? [
    { name: "In Attesa", value: stats.repairsByStatus.pending || 0, fill: COLORS[0] },
    { name: "Ingressato", value: stats.repairsByStatus.ingressato || 0, fill: COLORS[1] },
    { name: "In Diagnosi", value: stats.repairsByStatus.in_diagnosi || 0, fill: COLORS[2] },
    { name: "Prev. Emesso", value: stats.repairsByStatus.preventivo_emesso || 0, fill: COLORS[3] },
    { name: "Prev. Accettato", value: stats.repairsByStatus.preventivo_accettato || 0, fill: COLORS[0] },
    { name: "Prev. Rifiutato", value: stats.repairsByStatus.preventivo_rifiutato || 0, fill: COLORS[1] },
    { name: "Attesa Ricambi", value: stats.repairsByStatus.attesa_ricambi || 0, fill: COLORS[2] },
    { name: "In Riparazione", value: stats.repairsByStatus.in_riparazione || 0, fill: COLORS[3] },
    { name: "Pronto Ritiro", value: stats.repairsByStatus.pronto_ritiro || 0, fill: COLORS[0] },
    { name: "Consegnato", value: stats.repairsByStatus.consegnato || 0, fill: COLORS[1] },
    { name: "Annullato", value: stats.repairsByStatus.annullato || 0, fill: COLORS[2] },
  ].filter(item => item.value > 0) : []; // Mostra solo stati con valori > 0

  const utilityChartData = stats?.utilityStats?.byStatus ? 
    Object.entries(stats.utilityStats.byStatus).map(([status, count], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
      fill: COLORS[index % COLORS.length]
    })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard Amministratore</h1>
        <p className="text-muted-foreground">
          Panoramica completa della piattaforma Monkey Plan Beta v.21
        </p>
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tickets per Stato</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ticketsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {ticketsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riparazioni per Stato</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={repairsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      padding: '8px 12px'
                    }}
                    formatter={(value: number, name: string) => [value, 'Riparazioni']}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))">
                    {repairsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Utility Practices Chart */}
      {utilityChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Pratiche Utility per Stato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={utilityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

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
