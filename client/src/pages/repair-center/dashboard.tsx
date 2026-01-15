import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Users, TrendingUp, Package, AlertCircle, ChevronRight, LayoutDashboard, Warehouse } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Wrench, UserPlus, CalendarPlus, PackageOpen, 
  Truck, Receipt, Ticket
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RepairOrder, Invoice } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";
import { OperationalTaskList } from "@/components/OperationalTaskList";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import { useDashboardPreferences } from "@/components/dashboard/useDashboardPreferences";

type RepairCenterStats = {
  overview: {
    totalRepairs: number;
    activeRepairs: number;
    completedRepairs: number;
    totalCustomers: number;
    totalRevenue: number;
    assignedTickets: number;
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
  warehouse: {
    totalStock: number;
    lowStockItems: number;
  };
  b2b: {
    pendingOrders: number;
    totalOrders: number;
  };
  assignedReseller?: {
    id: string;
    fullName: string | null;
    ragioneSociale: string | null;
    logoUrl: string | null;
  };
};

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function RepairCenterDashboard() {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [acceptanceDialogOpen, setAcceptanceDialogOpen] = useState(false);

  // Dashboard customization preferences
  const { layout: dashboardLayout, saveLayout, isSaving: isSavingLayout } = useDashboardPreferences("repair_center");

  const isWidgetVisible = useCallback((widgetId: string) => {
    const widget = dashboardLayout.widgets.find(w => w.id === widgetId);
    return widget?.visible !== false;
  }, [dashboardLayout.widgets]);

  const { data: stats, isLoading } = useQuery<RepairCenterStats>({
    queryKey: ["/api/stats"],
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const { data: repairs = [] } = useQuery<RepairOrder[]>({
    queryKey: ["/api/repair-center/repairs"],
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
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: "In Attesa", color: "#94a3b8" },
      ingressato: { label: "Ingressato", color: "#6366f1" },
      in_diagnosi: { label: "In Diagnosi", color: "#8b5cf6" },
      preventivo_emesso: { label: "Prev. Emesso", color: "#f59e0b" },
      preventivo_accettato: { label: "Prev. OK", color: "#22c55e" },
      preventivo_rifiutato: { label: "Prev. Rifiutato", color: "#ef4444" },
      attesa_ricambi: { label: "Attesa Ricambi", color: "#f97316" },
      in_riparazione: { label: "In Riparazione", color: "#3b82f6" },
      in_test: { label: "In Test", color: "#06b6d4" },
      pronto_ritiro: { label: "Pronto", color: "#10b981" },
      consegnato: { label: "Consegnato", color: "#64748b" },
      cancelled: { label: "Annullato", color: "#dc2626" },
    };
    const config = statusMap[status] || { label: status, color: "#94a3b8" };
    return (
      <Badge 
        className="font-normal border-0"
        style={{ backgroundColor: config.color + "20", color: config.color }}
      >
        {config.label}
      </Badge>
    );
  };

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

  return (
    <div className="space-y-6" data-testid="page-repair-center-dashboard">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Centro Riparazione
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DashboardCustomizer
              role="repair_center"
              currentLayout={dashboardLayout}
              onSave={saveLayout}
              isSaving={isSavingLayout}
            />
          <Button onClick={() => setAcceptanceDialogOpen(true)} className="shadow-lg shadow-primary/25" data-testid="button-new-repair">
            <PackageOpen className="h-4 w-4 mr-2" />
            Nuova Lavorazione
          </Button>
          </div>
        </div>
      </div>

      {/* Assigned Reseller Banner */}
      {stats?.assignedReseller && (
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
          <Avatar className="h-12 w-12 rounded-lg border-2 border-blue-200 dark:border-blue-700">
            {stats.assignedReseller.logoUrl ? (
              <AvatarImage src={stats.assignedReseller.logoUrl} alt={stats.assignedReseller.ragioneSociale || stats.assignedReseller.fullName || ''} className="object-contain" />
            ) : null}
            <AvatarFallback className="rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
              {getInitials(stats.assignedReseller.ragioneSociale || stats.assignedReseller.fullName || 'N/A')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">Fai parte della rete</p>
            <p className="font-semibold text-foreground truncate" data-testid="text-assigned-reseller-name">
              {stats.assignedReseller.ragioneSociale || stats.assignedReseller.fullName}
            </p>
          </div>
        </div>
      )}

      {/* Alerts */}
      {(overdueInvoices.length > 0 || pendingInvoices.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {overdueInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{overdueInvoices.length} fatture scadute</p>
                <p className="text-xs text-muted-foreground">Richiedono attenzione immediata</p>
              </div>
              <Link href="/repair-center/invoices">
                <Button size="sm" variant="outline" className="border-destructive/30 hover:bg-destructive/10">
                  Visualizza
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
          {pendingInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-3 p-4 rounded-xl border bg-muted/30">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{pendingInvoices.length} fatture in sospeso</p>
                <p className="text-xs text-muted-foreground">In attesa di pagamento</p>
              </div>
              <Link href="/repair-center/invoices">
                <Button size="sm" variant="ghost">
                  Visualizza
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-repairs">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Riparazioni Attive</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold tabular-nums" data-testid="text-active-repairs">
                    {stats?.overview?.activeRepairs ?? 0}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {stats?.overview?.totalRepairs ?? 0} totali
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-customers">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Clienti</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400" data-testid="text-customers">
                    {stats?.overview?.totalCustomers ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Assegnati al centro</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-revenue">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Fatturato</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-24" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400" data-testid="text-revenue">
                    {formatCurrency(stats?.overview?.totalRevenue ?? 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Da riparazioni</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-stock">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Stock</p>
                {isLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400" data-testid="text-stock">
                    {stats?.warehouse?.totalStock ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.warehouse?.lowStockItems ? (
                    <span className="text-amber-600 dark:text-amber-400">{stats?.warehouse?.lowStockItems} sotto scorta</span>
                  ) : "Articoli in magazzino"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Warehouse className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/repair-center/repairs" className="block group">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/50" data-testid="card-completed-repairs">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Completate</p>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-completed-repairs">
                    {stats?.overview?.completedRepairs ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/repair-center/b2b-orders" className="block group">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/50" data-testid="card-b2b">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Ordini B2B</p>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-pending-b2b">
                    {stats?.b2b?.pendingOrders ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/repair-center/tickets" className="block group">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/50" data-testid="card-tickets">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Ticket</p>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-tickets">
                    {stats?.overview?.assignedTickets ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/repair-center/customers" className="block group">
          <Card className="h-full transition-all hover:shadow-md hover:border-primary/50" data-testid="card-customers-link">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-cyan-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Lista Clienti</p>
                  <p className="text-xl font-bold tabular-nums" data-testid="text-customers-count">
                    {stats?.overview?.totalCustomers ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-base font-semibold">Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <Button 
              className="h-auto py-4 px-3 flex flex-col items-center gap-2 shadow-md shadow-primary/20"
              onClick={() => setAcceptanceDialogOpen(true)}
              data-testid="button-quick-new-repair"
            >
              <PackageOpen className="h-5 w-5" />
              <span className="text-xs font-medium">Nuova Lavorazione</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30"
              onClick={() => setCustomerDialogOpen(true)}
              data-testid="button-quick-customer"
            >
              <UserPlus className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-medium">Nuovo Cliente</span>
            </Button>
            <Link href="/repair-center/appointments">
              <Button variant="outline" className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30" data-testid="button-quick-appointment">
                <CalendarPlus className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-medium">Appuntamento</span>
              </Button>
            </Link>
            <Link href="/repair-center/warehouses">
              <Button variant="outline" className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30" data-testid="button-quick-warehouse">
                <Warehouse className="h-5 w-5 text-violet-500" />
                <span className="text-xs font-medium">Magazzino</span>
              </Button>
            </Link>
            <Link href="/repair-center/b2b-catalog">
              <Button variant="outline" className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30" data-testid="button-quick-b2b">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                <span className="text-xs font-medium">Ordine B2B</span>
              </Button>
            </Link>
            <Link href="/repair-center/suppliers">
              <Button variant="outline" className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30" data-testid="button-quick-suppliers">
                <Truck className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-medium">Fornitori</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t">
            <Link href="/repair-center/tickets">
              <Button variant="ghost" size="sm" className="w-full h-auto py-2 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" data-testid="button-quick-tickets">
                <Ticket className="h-4 w-4" />
                <span className="text-[10px]">Ticket</span>
              </Button>
            </Link>
            <Link href="/repair-center/invoices">
              <Button variant="ghost" size="sm" className="w-full h-auto py-2 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" data-testid="button-quick-invoices">
                <Receipt className="h-4 w-4" />
                <span className="text-[10px]">Fatture</span>
              </Button>
            </Link>
            <Link href="/repair-center/customers">
              <Button variant="ghost" size="sm" className="w-full h-auto py-2 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" data-testid="button-quick-customers">
                <Users className="h-4 w-4" />
                <span className="text-[10px]">Clienti</span>
              </Button>
            </Link>
            <Link href="/repair-center/repairs">
              <Button variant="ghost" size="sm" className="w-full h-auto py-2 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground" data-testid="button-quick-repairs">
                <Wrench className="h-4 w-4" />
                <span className="text-[10px]">Tutte Rip.</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Operational Tasks */}
      <OperationalTaskList maxItems={6} />

      {/* Charts & Recent Repairs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Riparazioni per Stato</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : repairsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={repairsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                  <Wrench className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Nessun dato disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Stato Lavori</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <div 
                          className="h-2.5 w-2.5 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">Nessun dato disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3 border-b bg-muted/30">
            <CardTitle className="text-sm font-semibold">Ultime Riparazioni</CardTitle>
            <Link href="/repair-center/repairs">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Tutte
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentRepairs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium mb-1">Nessuna riparazione</p>
                <p className="text-xs text-muted-foreground">Inizia creando una nuova lavorazione</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentRepairs.map((repair, index) => (
                  <Link href={`/repair-center/repairs/${repair.id}`} key={repair.id}>
                    <div 
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      data-testid={`recent-repair-${repair.id}`}
                    >
                      <div className={`w-1 h-10 rounded-full ${repair.status === 'consegnato' ? 'bg-slate-400' : 'bg-primary'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">{repair.orderNumber || repair.id.substring(0, 8)}</span>
                          {getStatusBadge(repair.status)}
                        </div>
                        <p className="text-sm truncate mt-0.5">
                          {repair.brand && <span className="font-medium">{repair.brand}</span>}
                          {repair.deviceModel && <span className="text-muted-foreground"> {repair.deviceModel}</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(repair.createdAt), "dd/MM", { locale: it })}
                        </p>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 ml-auto" />
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
      />
    </div>
  );
}
