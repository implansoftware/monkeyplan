import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Users, TrendingUp, FileText, Package, AlertTriangle, Zap, ArrowRightLeft, Network, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Wrench, UserPlus, Building2, CalendarPlus, PackageOpen, 
  Truck, Receipt, Warehouse
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RepairOrder, Invoice } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";

type ResellerStats = {
  overview: {
    totalRepairs: number;
    activeRepairs: number;
    completedRepairs: number;
    totalCustomers: number;
    totalRevenue: number;
  };
  repairsByStatus: {
    ingressato: number;
    in_diagnosi: number;
    preventivo_emesso: number;
    preventivo_accettato: number;
    preventivo_rifiutato: number;
    attesa_ricambi: number;
    in_riparazione: number;
    in_test: number;
    pronto_ritiro: number;
    consegnato: number;
    cancelled: number;
  };
  interscambio: {
    pendingRequests: number;
    shippedRequests: number;
    totalIncoming: number;
    totalOutgoing: number;
  };
  utility: {
    activePractices: number;
    totalPractices: number;
  };
  b2b: {
    pendingOrders: number;
    totalOrders: number;
  };
  warehouse: {
    totalStock: number;
    lowStockItems: number;
    warehouseCount: number;
  };
  network: {
    subResellers: number;
    repairCenters: number;
  };
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ResellerDashboard() {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [acceptanceDialogOpen, setAcceptanceDialogOpen] = useState(false);

  const { data: stats, isLoading } = useQuery<ResellerStats>({
    queryKey: ["/api/stats"],
  });

  const { data: repairs = [] } = useQuery<RepairOrder[]>({
    queryKey: ["/api/reseller/repairs"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });


  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const recentRepairs = repairs.slice(0, 5);
  const pendingInvoices = invoices.filter(inv => inv.paymentStatus === 'pending');
  const overdueInvoices = invoices.filter(inv => inv.paymentStatus === 'overdue');

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "In Attesa", variant: "outline" },
      ingressato: { label: "Ingressato", variant: "secondary" },
      in_diagnosi: { label: "In Diagnosi", variant: "secondary" },
      preventivo_emesso: { label: "Prev. Emesso", variant: "outline" },
      preventivo_accettato: { label: "Prev. OK", variant: "default" },
      preventivo_rifiutato: { label: "Prev. Rifiutato", variant: "destructive" },
      attesa_ricambi: { label: "Attesa Ricambi", variant: "outline" },
      in_riparazione: { label: "In Riparazione", variant: "default" },
      in_test: { label: "In Test", variant: "default" },
      pronto_ritiro: { label: "Pronto", variant: "default" },
      consegnato: { label: "Consegnato", variant: "secondary" },
      cancelled: { label: "Annullato", variant: "destructive" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Chart data using correct Italian status names
  const repairsChartData = stats?.repairsByStatus ? [
    { name: "Ingressato", value: stats.repairsByStatus.ingressato },
    { name: "Diagnosi", value: stats.repairsByStatus.in_diagnosi },
    { name: "Prev. Emesso", value: stats.repairsByStatus.preventivo_emesso },
    { name: "In Rip.", value: stats.repairsByStatus.in_riparazione },
    { name: "Pronto", value: stats.repairsByStatus.pronto_ritiro },
    { name: "Consegnato", value: stats.repairsByStatus.consegnato },
  ].filter(d => d.value > 0) : [];

  const pieData = stats?.repairsByStatus ? [
    { name: "In Lavorazione", value: (stats.repairsByStatus.ingressato || 0) + (stats.repairsByStatus.in_diagnosi || 0) + (stats.repairsByStatus.in_riparazione || 0) },
    { name: "In Attesa", value: (stats.repairsByStatus.preventivo_emesso || 0) + (stats.repairsByStatus.attesa_ricambi || 0) },
    { name: "Completate", value: stats.repairsByStatus.consegnato || 0 },
    { name: "Pronte", value: stats.repairsByStatus.pronto_ritiro || 0 },
  ].filter(d => d.value > 0) : [];

  const quickActions = [
    { icon: PackageOpen, label: "Nuova Lavorazione", color: "text-orange-500", onClick: () => setAcceptanceDialogOpen(true) },
    { icon: UserPlus, label: "Nuovo Cliente", color: "text-blue-500", onClick: () => setCustomerDialogOpen(true) },
    { icon: CalendarPlus, label: "Appuntamento", color: "text-green-500", href: "/reseller/appointments" },
    { icon: Warehouse, label: "Magazzino", color: "text-amber-500", href: "/reseller/warehouses" },
    { icon: ArrowRightLeft, label: "Interscambio", color: "text-purple-500", href: "/reseller/transfer-requests" },
    { icon: ShoppingCart, label: "Ordine B2B", color: "text-blue-500", href: "/reseller/b2b-catalog" },
    { icon: Zap, label: "Pratiche Utility", color: "text-indigo-500", href: "/reseller/utility/practices" },
    { icon: Building2, label: "Centri Rip.", color: "text-violet-500", href: "/reseller/repair-centers" },
    { icon: Truck, label: "Fornitori", color: "text-teal-500", href: "/reseller/suppliers" },
    { icon: Receipt, label: "Fatture", color: "text-red-500", href: "/reseller/invoices" },
  ];

  return (
    <div className="space-y-8" data-testid="page-reseller-dashboard">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Panoramica delle tue attività
        </p>
      </div>

      {/* Alerts - More prominent if present */}
      {(overdueInvoices.length > 0 || pendingInvoices.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {overdueInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-red-900 dark:text-red-100">Fatture Scadute</p>
                <p className="text-sm text-red-700 dark:text-red-300">{overdueInvoices.length} da saldare</p>
              </div>
              <Link href="/reseller/invoices">
                <Button size="sm" variant="outline" className="border-red-300 dark:border-red-700">
                  Vedi
                </Button>
              </Link>
            </div>
          )}
          {pendingInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-900 dark:text-amber-100">Fatture in Sospeso</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{pendingInvoices.length} da pagare</p>
              </div>
              <Link href="/reseller/invoices">
                <Button size="sm" variant="outline" className="border-amber-300 dark:border-amber-700">
                  Vedi
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main KPI Cards - Redesigned */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Riparazioni Attive */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Riparazioni Attive</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold mt-1" data-testid="text-active-repairs">
                    {stats?.overview?.activeRepairs ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{stats?.overview?.totalRepairs ?? 0} totali</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clienti */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clienti</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold mt-1" data-testid="text-customers">
                    {stats?.overview?.totalCustomers ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Clienti gestiti</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fatturato */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fatturato</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-24 mt-1" />
                ) : (
                  <p className="text-3xl font-bold mt-1" data-testid="text-revenue">
                    {formatCurrency(stats?.overview?.totalRevenue ?? 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Da riparazioni</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-bl-full" />
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Magazzino</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold mt-1" data-testid="text-stock">
                    {stats?.warehouse?.totalStock ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.warehouse?.lowStockItems ? `${stats.warehouse.lowStockItems} sotto scorta` : "Articoli"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Warehouse className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Interscambio */}
        <Link href="/reseller/transfer-requests" className="block">
          <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid="card-interscambio">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-pending-transfers">
                    {stats?.interscambio?.pendingRequests ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Interscambio</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* B2B */}
        <Link href="/reseller/b2b-orders" className="block">
          <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid="card-b2b">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-pending-b2b">
                    {stats?.b2b?.pendingOrders ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Ordini B2B</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Utility */}
        <Link href="/reseller/utility/practices" className="block">
          <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid="card-utility">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-active-practices">
                    {stats?.utility?.activePractices ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Pratiche Utility</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Rete */}
        <Link href="/reseller/repair-centers" className="block">
          <Card className="h-full hover-elevate cursor-pointer transition-all" data-testid="card-network-stats">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Network className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-network-centers">
                    {stats?.network?.repairCenters ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Centri Riparazione</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions - Cleaner Grid */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {quickActions.map((action, index) => {
              const content = (
                <Button 
                  variant="ghost" 
                  className="w-full h-auto flex-col gap-2 py-4 px-2 hover:bg-muted/80" 
                  onClick={action.onClick}
                  data-testid={`button-quick-${index}`}
                >
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                  <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
                </Button>
              );
              
              return action.href ? (
                <Link key={index} href={action.href}>{content}</Link>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Charts & Recent Repairs Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts - 2 columns */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Riparazioni per Stato</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : repairsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={repairsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  Nessun dato
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stato Lavori</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-52 w-full" />
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                  Nessun dato
                </div>
              )}
              {pieData.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {pieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                      <div 
                        className="h-2.5 w-2.5 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Repairs - 1 column */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
            <CardTitle className="text-base">Ultime Riparazioni</CardTitle>
            <Link href="/reseller/repairs">
              <Button variant="ghost" size="sm" className="text-xs">
                Vedi tutte
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pb-4">
            {recentRepairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Nessuna riparazione</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRepairs.map((repair) => (
                  <Link key={repair.id} href={`/reseller/repairs/${repair.id}`}>
                    <div
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                      data-testid={`row-repair-${repair.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium font-mono text-sm truncate">{repair.orderNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {repair.deviceType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {format(new Date(repair.createdAt), "dd/MM", { locale: it })}
                        </span>
                        {getStatusBadge(repair.status)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <CustomerWizardDialog 
        open={customerDialogOpen} 
        onOpenChange={setCustomerDialogOpen}
        onSuccess={() => setCustomerDialogOpen(false)}
      />
      <RepairIntakeWizard 
        open={acceptanceDialogOpen} 
        onOpenChange={setAcceptanceDialogOpen}
        onSuccess={() => setAcceptanceDialogOpen(false)}
      />
    </div>
  );
}
