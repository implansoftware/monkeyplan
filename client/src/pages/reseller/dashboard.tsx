import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Chart data
  const repairsChartData = stats?.repairsByStatus ? [
    { name: "Ingressato", value: stats.repairsByStatus.ingressato },
    { name: "Diagnosi", value: stats.repairsByStatus.in_diagnosi },
    { name: "Prev.", value: stats.repairsByStatus.preventivo_emesso },
    { name: "In Rip.", value: stats.repairsByStatus.in_riparazione },
    { name: "Pronto", value: stats.repairsByStatus.pronto_ritiro },
    { name: "Conseg.", value: stats.repairsByStatus.consegnato },
  ].filter(d => d.value > 0) : [];

  const pieData = stats?.repairsByStatus ? [
    { name: "In Lavorazione", value: (stats.repairsByStatus.ingressato || 0) + (stats.repairsByStatus.in_diagnosi || 0) + (stats.repairsByStatus.in_riparazione || 0) },
    { name: "In Attesa", value: (stats.repairsByStatus.preventivo_emesso || 0) + (stats.repairsByStatus.attesa_ricambi || 0) },
    { name: "Completate", value: stats.repairsByStatus.consegnato || 0 },
    { name: "Pronte", value: stats.repairsByStatus.pronto_ritiro || 0 },
  ].filter(d => d.value > 0) : [];

  const quickActions = [
    { icon: PackageOpen, label: "Nuova Lavorazione", bg: "bg-gradient-to-br from-orange-500 to-amber-600", onClick: () => setAcceptanceDialogOpen(true) },
    { icon: UserPlus, label: "Nuovo Cliente", bg: "bg-gradient-to-br from-blue-500 to-cyan-600", onClick: () => setCustomerDialogOpen(true) },
    { icon: CalendarPlus, label: "Appuntamento", bg: "bg-gradient-to-br from-green-500 to-emerald-600", href: "/reseller/appointments" },
    { icon: Warehouse, label: "Magazzino", bg: "bg-gradient-to-br from-amber-500 to-yellow-600", href: "/reseller/warehouses" },
    { icon: ArrowRightLeft, label: "Interscambio", bg: "bg-gradient-to-br from-purple-500 to-violet-600", href: "/reseller/transfer-requests" },
    { icon: ShoppingCart, label: "Ordine B2B", bg: "bg-gradient-to-br from-blue-600 to-indigo-700", href: "/reseller/b2b-catalog" },
    { icon: Zap, label: "Pratiche Utility", bg: "bg-gradient-to-br from-indigo-500 to-purple-600", href: "/reseller/utility/practices" },
    { icon: Building2, label: "Centri Rip.", bg: "bg-gradient-to-br from-violet-500 to-fuchsia-600", href: "/reseller/repair-centers" },
    { icon: Truck, label: "Fornitori", bg: "bg-gradient-to-br from-teal-500 to-cyan-600", href: "/reseller/suppliers" },
    { icon: Receipt, label: "Fatture", bg: "bg-gradient-to-br from-rose-500 to-pink-600", href: "/reseller/invoices" },
  ];

  return (
    <div className="space-y-6" data-testid="page-reseller-dashboard">
      {/* Header with gradient background */}
      <div className="relative -mx-6 -mt-6 px-6 pt-6 pb-8 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Panoramica delle tue attività
        </p>
      </div>

      {/* Alerts */}
      {(overdueInvoices.length > 0 || pendingInvoices.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {overdueInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-200 dark:border-red-800">
              <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Fatture Scadute</p>
                <p className="text-sm text-muted-foreground">{overdueInvoices.length} da saldare</p>
              </div>
              <Link href="/reseller/invoices">
                <Button size="sm">Vedi</Button>
              </Link>
            </div>
          )}
          {pendingInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-200 dark:border-amber-800">
              <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/30">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">Fatture in Sospeso</p>
                <p className="text-sm text-muted-foreground">{pendingInvoices.length} da pagare</p>
              </div>
              <Link href="/reseller/invoices">
                <Button size="sm" variant="outline">Vedi</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main KPI Cards - Colorful Gradients */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Riparazioni Attive - Blue */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Riparazioni Attive</p>
              {isLoading ? (
                <Skeleton className="h-10 w-16 mt-2 bg-white/20" />
              ) : (
                <p className="text-4xl font-bold mt-2" data-testid="text-active-repairs">
                  {stats?.overview?.activeRepairs ?? 0}
                </p>
              )}
              <p className="text-xs text-blue-200 mt-1">{stats?.overview?.totalRepairs ?? 0} totali</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wrench className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Clienti - Green */}
        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 p-5 text-white shadow-lg shadow-green-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-100">Clienti</p>
              {isLoading ? (
                <Skeleton className="h-10 w-16 mt-2 bg-white/20" />
              ) : (
                <p className="text-4xl font-bold mt-2" data-testid="text-customers">
                  {stats?.overview?.totalCustomers ?? 0}
                </p>
              )}
              <p className="text-xs text-green-200 mt-1">Clienti gestiti</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Fatturato - Yellow/Amber */}
        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-amber-100">Fatturato</p>
              {isLoading ? (
                <Skeleton className="h-10 w-24 mt-2 bg-white/20" />
              ) : (
                <p className="text-3xl font-bold mt-2" data-testid="text-revenue">
                  {formatCurrency(stats?.overview?.totalRevenue ?? 0)}
                </p>
              )}
              <p className="text-xs text-amber-200 mt-1">Da riparazioni</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Stock - Purple */}
        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-5 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-100">Stock Magazzino</p>
              {isLoading ? (
                <Skeleton className="h-10 w-16 mt-2 bg-white/20" />
              ) : (
                <p className="text-4xl font-bold mt-2" data-testid="text-stock">
                  {stats?.warehouse?.totalStock ?? 0}
                </p>
              )}
              <p className="text-xs text-purple-200 mt-1">
                {stats?.warehouse?.lowStockItems ? `${stats.warehouse.lowStockItems} sotto scorta` : "Articoli"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row - With colored left borders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/reseller/transfer-requests" className="block">
          <Card className="h-full hover-elevate cursor-pointer border-l-4 border-l-purple-500" data-testid="card-interscambio">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/30">
                  <ArrowRightLeft className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-pending-transfers">
                    {stats?.interscambio?.pendingRequests ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Interscambio</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reseller/b2b-orders" className="block">
          <Card className="h-full hover-elevate cursor-pointer border-l-4 border-l-blue-500" data-testid="card-b2b">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-pending-b2b">
                    {stats?.b2b?.pendingOrders ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Ordini B2B</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reseller/utility/practices" className="block">
          <Card className="h-full hover-elevate cursor-pointer border-l-4 border-l-indigo-500" data-testid="card-utility">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-active-practices">
                    {stats?.utility?.activePractices ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Pratiche Utility</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reseller/repair-centers" className="block">
          <Card className="h-full hover-elevate cursor-pointer border-l-4 border-l-violet-500" data-testid="card-network-stats">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/30">
                  <Network className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-2xl font-bold" data-testid="text-network-centers">
                    {stats?.network?.repairCenters ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Centri Riparazione</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions - Colorful Tiles */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickActions.map((action, index) => {
            const content = (
              <button 
                onClick={action.onClick}
                className={`w-full ${action.bg} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
                data-testid={`button-quick-${index}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{action.label}</span>
                </div>
              </button>
            );
            
            return action.href ? (
              <Link key={index} href={action.href}>{content}</Link>
            ) : (
              <div key={index}>{content}</div>
            );
          })}
        </div>
      </div>

      {/* Charts & Recent Repairs Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts - 2 columns */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-t-4 border-t-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Riparazioni per Stato
              </CardTitle>
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

          <Card className="border-t-4 border-t-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Stato Lavori
              </CardTitle>
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

        {/* Recent Repairs */}
        <Card className="border-t-4 border-t-amber-500">
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              Ultime Riparazioni
            </CardTitle>
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
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      data-testid={`row-repair-${repair.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Wrench className="h-4 w-4 text-amber-600" />
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
