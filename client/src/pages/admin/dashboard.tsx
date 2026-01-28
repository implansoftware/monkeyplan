import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, Wrench, Ticket, TrendingUp, Package, Building, 
  Store, Warehouse, ShoppingCart, Zap, FileCheck, Clock,
  UserPlus, AlertTriangle, ArrowLeftRight, LayoutDashboard,
  Sparkles, Activity, CircuitBoard, ChartBar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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
  transferRequestStats: {
    total: number;
    pending: number;
    approved: number;
    shipped: number;
    received: number;
    rejected: number;
    cancelled: number;
  };
};

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

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
    { name: "Aperti", value: stats.ticketsByStatus.open || 0, fill: CHART_COLORS[0] },
    { name: "In Corso", value: stats.ticketsByStatus.in_progress || 0, fill: CHART_COLORS[1] },
    { name: "Chiusi", value: stats.ticketsByStatus.closed || 0, fill: CHART_COLORS[3] },
  ] : [];

  const repairsChartData = stats?.repairsByStatus ? [
    { name: "In Attesa", value: stats.repairsByStatus.pending || 0, fill: CHART_COLORS[0] },
    { name: "Ingressato", value: stats.repairsByStatus.ingressato || 0, fill: CHART_COLORS[1] },
    { name: "Diagnosi", value: stats.repairsByStatus.in_diagnosi || 0, fill: CHART_COLORS[2] },
    { name: "Prev. Emesso", value: stats.repairsByStatus.preventivo_emesso || 0, fill: CHART_COLORS[3] },
    { name: "Prev. Accettato", value: stats.repairsByStatus.preventivo_accettato || 0, fill: CHART_COLORS[4] },
    { name: "Att. Ricambi", value: stats.repairsByStatus.attesa_ricambi || 0, fill: CHART_COLORS[5] },
    { name: "Riparazione", value: stats.repairsByStatus.in_riparazione || 0, fill: CHART_COLORS[6] },
    { name: "Pronto", value: stats.repairsByStatus.pronto_ritiro || 0, fill: CHART_COLORS[0] },
    { name: "Consegnato", value: stats.repairsByStatus.consegnato || 0, fill: CHART_COLORS[3] },
  ].filter(item => item.value > 0) : [];

  const utilityChartData = stats?.utilityStats?.byStatus ? 
    Object.entries(stats.utilityStats.byStatus).map(([status, count], index) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    })) : [];

  return (
    <div className="space-y-6">
      {/* Hero Header - Modern Gradient Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 -right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <LayoutDashboard className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dashboard Amministratore</h1>
              <p className="text-blue-100/80 mt-1">Panoramica completa della piattaforma MonkeyPlan Beta v.24</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium">
              <Activity className="inline-block h-4 w-4 mr-2 text-emerald-300" />
              Sistema Attivo
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards - Gradient Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300" data-testid="card-kpi-revenue">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-blue-100">Fatturato Totale</span>
              <div className="p-2 rounded-xl bg-white/20">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-white/20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-kpi-revenue">
                  {formatCurrency(stats?.overview?.totalRevenue || 0)}
                </div>
                <p className="text-sm text-blue-100/80 mt-2">
                  {stats?.overview?.paidInvoices ?? 0} fatture pagate
                </p>
              </>
            )}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300" data-testid="card-kpi-repairs">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-violet-100">Riparazioni Totali</span>
              <div className="p-2 rounded-xl bg-white/20">
                <Wrench className="h-5 w-5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-white/20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-kpi-repairs">
                  {stats?.overview?.totalRepairs ?? 0}
                </div>
                <p className="text-sm text-violet-100/80 mt-2">
                  {stats?.overview?.activeRepairs ?? 0} in corso
                </p>
              </>
            )}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 p-6 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300" data-testid="card-kpi-tickets">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-cyan-100">Ticket Totali</span>
              <div className="p-2 rounded-xl bg-white/20">
                <Ticket className="h-5 w-5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-white/20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-kpi-tickets">
                  {stats?.overview?.totalTickets ?? 0}
                </div>
                <p className="text-sm text-cyan-100/80 mt-2">
                  {stats?.overview?.openTickets ?? 0} aperti
                </p>
              </>
            )}
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300" data-testid="card-kpi-avgtime">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-amber-100">Tempo Medio</span>
              <div className="p-2 rounded-xl bg-white/20">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 bg-white/20" />
            ) : (
              <>
                <div className="text-3xl font-bold" data-testid="text-kpi-avgtime">
                  {(stats?.overview?.avgRepairTime || 0).toFixed(1)}g
                </div>
                <p className="text-sm text-amber-100/80 mt-2">
                  {stats?.overview?.completedRepairs ?? 0} completate
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid - Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50 backdrop-blur-sm" data-testid="card-stats-resellers">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Rivenditori</CardTitle>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Totale</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{stats?.resellerStats?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Attivi</span>
                  <span className="font-semibold text-emerald-600">{stats?.resellerStats?.active ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Con Centri</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{stats?.resellerStats?.withCenters ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50 backdrop-blur-sm" data-testid="card-stats-centers">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Centri Riparazione</CardTitle>
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Building className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Totale</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{stats?.repairCenterGlobalStats?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Attivi</span>
                  <span className="font-semibold text-emerald-600">{stats?.repairCenterGlobalStats?.active ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Media Lavorazioni</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{stats?.repairCenterGlobalStats?.avgRepairsPerCenter ?? 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50 backdrop-blur-sm" data-testid="card-stats-utility">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Utility & Pratiche</CardTitle>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Pratiche Totali</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{stats?.utilityStats?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Compensi Totali</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(stats?.utilityStats?.totalCommissions ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">In Attesa</span>
                  <span className="font-semibold text-amber-600">{formatCurrency(stats?.utilityStats?.pendingCommissions ?? 0)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50 backdrop-blur-sm" data-testid="card-stats-warehouse">
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Magazzino</CardTitle>
            <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
              <Warehouse className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Magazzini</span>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">{stats?.warehouseStats?.totalWarehouses ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Stock Totale</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{stats?.warehouseStats?.totalStock ?? 0} pz</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">Sotto Scorta</span>
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

      {/* E-commerce & Interscambio Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50" data-testid="card-stats-ecommerce">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
              E-commerce
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{stats?.ecommerceStats?.totalOrders ?? 0}</div>
                  <div className="text-xs text-slate-500 mt-1">Ordini Totali</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(stats?.ecommerceStats?.totalRevenue ?? 0)}</div>
                  <div className="text-xs text-slate-500 mt-1">Fatturato</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-amber-600">{stats?.ecommerceStats?.pendingOrders ?? 0}</div>
                  <div className="text-xs text-slate-500 mt-1">Ordini Pendenti</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl">
                  <div className="text-2xl font-bold text-violet-600">{stats?.ecommerceStats?.activeCartItems ?? 0}</div>
                  <div className="text-xs text-slate-500 mt-1">Carrelli Attivi</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50" data-testid="card-stats-interscambio">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <ArrowLeftRight className="h-5 w-5 text-white" />
              </div>
              Interscambio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{stats?.transferRequestStats?.total ?? 0}</div>
                  <div className="text-xs text-slate-500">Totali</div>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <div className="text-xl font-bold text-amber-600">{stats?.transferRequestStats?.pending ?? 0}</div>
                  <div className="text-xs text-slate-500">In Attesa</div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="text-xl font-bold text-blue-600">{stats?.transferRequestStats?.shipped ?? 0}</div>
                  <div className="text-xs text-slate-500">Spedite</div>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div className="text-xl font-bold text-emerald-600">{stats?.transferRequestStats?.received ?? 0}</div>
                  <div className="text-xs text-slate-500">Ricevute</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50" data-testid="card-latest-customers">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
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
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.latestCustomers.map((customer) => (
                      <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {customer.fullName || customer.username}
                        </TableCell>
                        <TableCell className="text-slate-500">{customer.email}</TableCell>
                        <TableCell className="text-right text-slate-500">
                          {formatDate(customer.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <Users className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                Nessun cliente registrato
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50" data-testid="card-latest-resellers">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Store className="h-5 w-5 text-white" />
              </div>
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
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-slate-600 dark:text-slate-400">Nome</TableHead>
                      <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                      <TableHead className="text-right text-slate-600 dark:text-slate-400">Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.latestResellers.map((reseller) => (
                      <TableRow key={reseller.id} data-testid={`row-reseller-${reseller.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell className="font-medium text-slate-900 dark:text-white">
                          {reseller.fullName || reseller.username}
                        </TableCell>
                        <TableCell>
                          <Badge variant={reseller.isActive ? "default" : "secondary"} className={reseller.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}>
                            {reseller.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-slate-500">
                          {formatDate(reseller.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm text-slate-500 text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <Store className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                Nessun rivenditore registrato
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600">
                <Ticket className="h-5 w-5 text-white" />
              </div>
              Tickets per Stato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : ticketsChartData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <Ticket className="h-12 w-12 mb-4 opacity-40" />
                <p className="text-sm text-center">Nessun ticket trovato</p>
              </div>
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
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <ChartBar className="h-5 w-5 text-white" />
              </div>
              Riparazioni per Stato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : repairsChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <Wrench className="h-12 w-12 mb-4 opacity-40" />
                <p className="text-sm text-center">Nessuna riparazione trovata</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={repairsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => [value, 'Riparazioni']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
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
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <FileCheck className="h-5 w-5 text-white" />
              </div>
              Pratiche Utility per Stato
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={utilityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                  <YAxis tick={{ fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Products */}
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-900 dark:text-white">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
              <Package className="h-5 w-5 text-white" />
            </div>
            Prodotti Piu Utilizzati
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
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="text-slate-600 dark:text-slate-400">Prodotto</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">SKU</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Categoria</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-400">Utilizzo</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-400">Stock In</TableHead>
                    <TableHead className="text-right text-slate-600 dark:text-slate-400">Centri</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topProducts.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <TableCell className="font-medium text-slate-900 dark:text-white">{product.name}</TableCell>
                      <TableCell className="text-slate-500 font-mono text-sm">{product.sku}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize bg-slate-100 dark:bg-slate-700">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">{product.usageCount}</TableCell>
                      <TableCell className="text-right text-slate-600 dark:text-slate-400">{product.stockIn}</TableCell>
                      <TableCell className="text-right text-slate-600 dark:text-slate-400">{product.centersCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <Package className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              Nessun dato sui prodotti disponibile
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
