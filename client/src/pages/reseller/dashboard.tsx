import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Users, TrendingUp, FileText, Package, AlertCircle, Zap, ArrowRightLeft, Network, ChevronRight, ExternalLink, LayoutDashboard, Store, Briefcase, Euro, Clock, Stethoscope, AlertTriangle, PackageX, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Wrench, UserPlus, Building2, CalendarPlus, PackageOpen, 
  Truck, Receipt, Warehouse
} from "lucide-react";
import { Tooltip as TooltipUI, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RepairOrder, Invoice } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { RepairIntakeWizard } from "@/components/RepairIntakeWizard";
import { OperationalTaskList } from "@/components/OperationalTaskList";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DashboardCustomizer } from "@/components/dashboard/DashboardCustomizer";
import { useDashboardPreferences } from "@/components/dashboard/useDashboardPreferences";

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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ResellerDashboard() {
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [acceptanceDialogOpen, setAcceptanceDialogOpen] = useState(false);
  const { user } = useAuth();
  const isResellerStaff = user?.role === 'reseller_staff';
  const hasParentReseller = !!(user as any)?.parentResellerId;
  // Staff should see their reseller, sub-resellers should see parent reseller
  const shouldShowResellerBanner = isResellerStaff || hasParentReseller;

  // Dashboard customization preferences
  const { layout: dashboardLayout, saveLayout, isSaving: isSavingLayout } = useDashboardPreferences("reseller");

  const isWidgetVisible = useCallback((widgetId: string) => {
    const widget = dashboardLayout.widgets.find(w => w.id === widgetId);
    return widget?.visible !== false;
  }, [dashboardLayout.widgets]);

  const getWidgetOrder = useCallback((widgetId: string) => {
    const widget = dashboardLayout.widgets.find(w => w.id === widgetId);
    return widget?.order ?? 999;
  }, [dashboardLayout.widgets]);

  const { data: parentReseller } = useQuery<{ id: string; fullName: string; logoUrl: string | null; ragioneSociale: string | null }>({
    queryKey: ["/api/my-parent-reseller"],
    enabled: shouldShowResellerBanner,
  });

  const { data: stats, isLoading } = useQuery<ResellerStats>({
    queryKey: ["/api/stats"],
  });

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const { data: repairs = [] } = useQuery<RepairOrder[]>({
    queryKey: ["/api/reseller/repairs"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: salesData } = useQuery<{
    summary: {
      totalSales: number;
      totalAmount: number;
      bySource: { ecommerce: number; pos: number; utility: number; b2b: number };
      countBySource: { ecommerce: number; pos: number; utility: number; b2b: number };
    };
  }>({
    queryKey: ["/api/reseller/sales"],
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
  
  // Calculate urgent items for the dashboard
  const diagnosisPendingRepairs = useMemo(() => {
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    return repairs.filter(r => 
      r.status === 'in_diagnosi' && 
      new Date(r.createdAt) < sixDaysAgo
    );
  }, [repairs]);
  
  const quotePendingRepairs = useMemo(() => {
    return repairs.filter(r => r.status === 'preventivo_emesso');
  }, [repairs]);
  
  const todayRepairs = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return repairs.filter(r => new Date(r.createdAt) >= today);
  }, [repairs]);

  // Calculate today's revenue from sales
  const todayRevenue = useMemo(() => {
    return salesData?.summary?.totalAmount || 0;
  }, [salesData]);
  
  // Count total urgencies
  const totalUrgencies = useMemo(() => {
    let count = 0;
    if (diagnosisPendingRepairs.length > 0) count++;
    if ((stats?.warehouse?.lowStockItems || 0) > 0) count++;
    if ((stats?.b2b?.pendingOrders || 0) > 0) count++;
    if (overdueInvoices.length > 0) count++;
    if (quotePendingRepairs.length > 0) count++;
    return count;
  }, [diagnosisPendingRepairs, stats, overdueInvoices, quotePendingRepairs]);

  // Find dominant sales source for visual highlighting
  const dominantSalesSource = useMemo(() => {
    const sources = salesData?.summary?.bySource;
    if (!sources) return null;
    const entries = [
      { key: 'ecommerce', value: sources.ecommerce || 0 },
      { key: 'pos', value: sources.pos || 0 },
      { key: 'utility', value: sources.utility || 0 },
      { key: 'b2b', value: sources.b2b || 0 },
    ];
    const max = entries.reduce((a, b) => a.value > b.value ? a : b);
    return max.value > 0 ? max.key : null;
  }, [salesData]);

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
    <div className="space-y-6" data-testid="page-reseller-dashboard">
      {/* Hero Header - Control Room Style */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    Ciao{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(), "EEEE d MMMM", { locale: it })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DashboardCustomizer
                role="reseller"
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
          
          {/* Today's Summary Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-primary/10">
            <TooltipUI>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border text-sm" data-testid="pill-repairs">
                  <Wrench className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold tabular-nums">{stats?.overview?.activeRepairs ?? 0}</span>
                  <span className="text-muted-foreground text-xs">riparazioni</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Riparazioni attive in corso</TooltipContent>
            </TooltipUI>
            
            <TooltipUI>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border text-sm" data-testid="pill-revenue">
                  <Euro className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-semibold tabular-nums">{formatCurrency(todayRevenue)}</span>
                  <span className="text-muted-foreground text-xs">totale</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Totale vendite periodo corrente</TooltipContent>
            </TooltipUI>
            
            {totalUrgencies > 0 && (
              <TooltipUI>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-sm" data-testid="pill-urgencies">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">{totalUrgencies}</span>
                    <span className="text-amber-600 dark:text-amber-500 text-xs">urgenze</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Elementi che richiedono attenzione</TooltipContent>
              </TooltipUI>
            )}
          </div>
        </div>
      </div>

      {/* Parent Reseller Banner */}
      {parentReseller && (
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
          <Avatar className="h-12 w-12 rounded-lg border-2 border-blue-200 dark:border-blue-700">
            {parentReseller.logoUrl ? (
              <AvatarImage src={parentReseller.logoUrl} alt={parentReseller.ragioneSociale || parentReseller.fullName} className="object-contain" />
            ) : null}
            <AvatarFallback className="rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold">
              {getInitials(parentReseller.ragioneSociale || parentReseller.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">Fai parte della rete</p>
            <p className="font-semibold text-foreground truncate" data-testid="text-parent-reseller-name">
              {parentReseller.ragioneSociale || parentReseller.fullName}
            </p>
          </div>
          <Network className="h-6 w-6 text-blue-500/50" />
        </div>
      )}

      {/* Urgent Actions Block - Priority Section */}
      {isWidgetVisible("urgent-actions") && (diagnosisPendingRepairs.length > 0 || (stats?.warehouse?.lowStockItems || 0) > 0 || (stats?.b2b?.pendingOrders || 0) > 0 || overdueInvoices.length > 0 || quotePendingRepairs.length > 0) && (
        <Card className="border-amber-200 dark:border-amber-800 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20" data-testid="card-urgent-actions">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Richiede Attenzione</CardTitle>
                <p className="text-xs text-muted-foreground">Elementi che necessitano azione</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {diagnosisPendingRepairs.length > 0 && (
                <Link href="/reseller/repairs?status=in_diagnosi" className="block" data-testid="link-urgent-diagnosi">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50 hover-elevate">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400" data-testid="text-urgent-diagnosi-count">{diagnosisPendingRepairs.length}</p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 truncate">Diagnosi in attesa (6+ giorni)</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-red-400 shrink-0" />
                  </div>
                </Link>
              )}
              
              {quotePendingRepairs.length > 0 && (
                <Link href="/reseller/repairs?status=preventivo_emesso" className="block" data-testid="link-urgent-preventivi">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 hover-elevate">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                      <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400" data-testid="text-urgent-preventivi-count">{quotePendingRepairs.length}</p>
                      <p className="text-xs text-amber-600/80 dark:text-amber-400/80 truncate">Preventivi in attesa risposta</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-amber-400 shrink-0" />
                  </div>
                </Link>
              )}
              
              {(stats?.warehouse?.lowStockItems || 0) > 0 && (
                <Link href="/reseller/products?lowStock=true" className="block" data-testid="link-urgent-lowstock">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200/50 dark:border-orange-800/50 hover-elevate">
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center shrink-0">
                      <PackageX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-400" data-testid="text-urgent-lowstock-count">{stats?.warehouse?.lowStockItems}</p>
                      <p className="text-xs text-orange-600/80 dark:text-orange-400/80 truncate">Prodotti sotto scorta</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-orange-400 shrink-0" />
                  </div>
                </Link>
              )}
              
              {(stats?.b2b?.pendingOrders || 0) > 0 && (
                <Link href="/reseller/rc-b2b-orders" className="block" data-testid="link-urgent-b2b">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 hover-elevate">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400" data-testid="text-urgent-b2b-count">{stats?.b2b?.pendingOrders}</p>
                      <p className="text-xs text-blue-600/80 dark:text-blue-400/80 truncate">Ordini B2B da gestire</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-blue-400 shrink-0" />
                  </div>
                </Link>
              )}
              
              {overdueInvoices.length > 0 && (
                <Link href="/reseller/invoices?status=overdue" className="block" data-testid="link-urgent-invoices">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/50 dark:border-red-800/50 hover-elevate">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-2xl font-bold text-red-700 dark:text-red-400" data-testid="text-urgent-invoices-count">{overdueInvoices.length}</p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 truncate">Fatture scadute</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-red-400 shrink-0" />
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main KPI Cards - Dynamically ordered */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: "stats-repairs", render: () => (
            <Card key="stats-repairs" className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-repairs">
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
          )},
          { id: "stats-users", render: () => (
            <Card key="stats-users" className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-customers">
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
                    <p className="text-xs text-muted-foreground mt-1">Gestiti attivamente</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )},
          { id: "stats-invoices", render: () => (
            <Card key="stats-invoices" className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-revenue">
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
          )},
          { id: "stats-inventory", render: () => (
            <Card key="stats-inventory" className="relative overflow-hidden group hover:shadow-md transition-shadow" data-testid="card-kpi-stock">
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
                        <span className="text-amber-600 dark:text-amber-400">{stats.warehouse.lowStockItems} sotto scorta</span>
                      ) : "Articoli in magazzino"}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Warehouse className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )},
        ]
          .filter(w => isWidgetVisible(w.id))
          .sort((a, b) => getWidgetOrder(a.id) - getWidgetOrder(b.id))
          .map(w => w.render())}
      </div>

      {/* Secondary Metrics - Dynamically ordered */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: "stats-tickets", render: () => (
            <Link key="stats-tickets" href="/reseller/transfer-requests" className="block group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50" data-testid="card-interscambio">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <ArrowRightLeft className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Interscambio</p>
                      <p className="text-xl font-bold tabular-nums" data-testid="text-pending-transfers">
                        {stats?.interscambio?.pendingRequests ?? 0}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )},
          { id: "stats-b2b-orders", render: () => (
            <Link key="stats-b2b-orders" href="/reseller/b2b-orders" className="block group">
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
          )},
          { id: "stats-pos", render: () => (
            <Link key="stats-pos" href="/reseller/utility/practices" className="block group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50" data-testid="card-utility">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Pratiche Utility</p>
                      <p className="text-xl font-bold tabular-nums" data-testid="text-active-practices">
                        {stats?.utility?.activePractices ?? 0}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )},
          { id: "stats-network", render: () => (
            <Link key="stats-network" href="/reseller/repair-centers" className="block group">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50" data-testid="card-network-stats">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Network className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Centri Riparazione</p>
                      <p className="text-xl font-bold tabular-nums" data-testid="text-network-centers">
                        {stats?.network?.repairCenters ?? 0}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )},
        ]
          .filter(w => isWidgetVisible(w.id))
          .sort((a, b) => getWidgetOrder(a.id) - getWidgetOrder(b.id))
          .map(w => w.render())}
      </div>

      {/* Sales Overview */}
      {isWidgetVisible("activity-sales") && (
      <Card className="overflow-hidden" data-testid="card-sales-overview">
        <CardHeader className="pb-3 border-b bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/30 dark:to-blue-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 text-white flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Panoramica Vendite</CardTitle>
                <p className="text-xs text-muted-foreground">Aggregato da tutte le fonti</p>
              </div>
            </div>
            <Link href="/reseller/sales">
              <Button variant="outline" size="sm" data-testid="button-view-sales">
                Dettagli
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Euro className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Totale</span>
              </div>
              <p className="text-2xl font-bold" data-testid="text-sales-total">
                {formatCurrency(salesData?.summary?.totalAmount || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{salesData?.summary?.totalSales || 0} transazioni</p>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${
                dominantSalesSource === 'ecommerce' 
                  ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20' 
                  : (salesData?.summary?.bySource?.ecommerce || 0) === 0
                    ? 'bg-muted/30 border-border/50'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/50'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingCart className={`h-3 w-3 ${(salesData?.summary?.bySource?.ecommerce || 0) === 0 ? 'text-muted-foreground/50' : 'text-blue-600'}`} />
                <span className="text-xs text-muted-foreground">E-commerce</span>
                {dominantSalesSource === 'ecommerce' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Top</Badge>}
              </div>
              <p className={`text-lg font-bold tabular-nums ${(salesData?.summary?.bySource?.ecommerce || 0) === 0 ? 'text-muted-foreground/50' : 'text-blue-600'}`} data-testid="text-sales-ecommerce">
                {formatCurrency(salesData?.summary?.bySource?.ecommerce || 0)}
              </p>
              <p className="text-xs text-muted-foreground">{salesData?.summary?.countBySource?.ecommerce || 0} ordini</p>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${
                dominantSalesSource === 'pos' 
                  ? 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 ring-2 ring-green-500/20' 
                  : (salesData?.summary?.bySource?.pos || 0) === 0
                    ? 'bg-muted/30 border-border/50'
                    : 'bg-green-50 dark:bg-green-950/30 border-green-200/50 dark:border-green-800/50'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <Store className={`h-3 w-3 ${(salesData?.summary?.bySource?.pos || 0) === 0 ? 'text-muted-foreground/50' : 'text-green-600'}`} />
                <span className="text-xs text-muted-foreground">POS</span>
                {dominantSalesSource === 'pos' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Top</Badge>}
              </div>
              <p className={`text-lg font-bold tabular-nums ${(salesData?.summary?.bySource?.pos || 0) === 0 ? 'text-muted-foreground/50' : 'text-green-600'}`} data-testid="text-sales-pos">
                {formatCurrency(salesData?.summary?.bySource?.pos || 0)}
              </p>
              <p className="text-xs text-muted-foreground">{salesData?.summary?.countBySource?.pos || 0} vendite</p>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${
                dominantSalesSource === 'utility' 
                  ? 'bg-yellow-100 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-500/20' 
                  : (salesData?.summary?.bySource?.utility || 0) === 0
                    ? 'bg-muted/30 border-border/50'
                    : 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200/50 dark:border-yellow-800/50'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <Zap className={`h-3 w-3 ${(salesData?.summary?.bySource?.utility || 0) === 0 ? 'text-muted-foreground/50' : 'text-yellow-600'}`} />
                <span className="text-xs text-muted-foreground">Utility</span>
                {dominantSalesSource === 'utility' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Top</Badge>}
              </div>
              <p className={`text-lg font-bold tabular-nums ${(salesData?.summary?.bySource?.utility || 0) === 0 ? 'text-muted-foreground/50' : 'text-yellow-600'}`} data-testid="text-sales-utility">
                {formatCurrency(salesData?.summary?.bySource?.utility || 0)}
              </p>
              <p className="text-xs text-muted-foreground">{salesData?.summary?.countBySource?.utility || 0} pratiche</p>
            </div>
            
            <div className={`p-3 rounded-lg border transition-all ${
                dominantSalesSource === 'b2b' 
                  ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20' 
                  : (salesData?.summary?.bySource?.b2b || 0) === 0
                    ? 'bg-muted/30 border-border/50'
                    : 'bg-purple-50 dark:bg-purple-950/30 border-purple-200/50 dark:border-purple-800/50'
              }`}>
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className={`h-3 w-3 ${(salesData?.summary?.bySource?.b2b || 0) === 0 ? 'text-muted-foreground/50' : 'text-purple-600'}`} />
                <span className="text-xs text-muted-foreground">B2B</span>
                {dominantSalesSource === 'b2b' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Top</Badge>}
              </div>
              <p className={`text-lg font-bold tabular-nums ${(salesData?.summary?.bySource?.b2b || 0) === 0 ? 'text-muted-foreground/50' : 'text-purple-600'}`} data-testid="text-sales-b2b">
                {formatCurrency(salesData?.summary?.bySource?.b2b || 0)}
              </p>
              <p className="text-xs text-muted-foreground">{salesData?.summary?.countBySource?.b2b || 0} ordini</p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Quick Actions - Grouped by Context */}
      {isWidgetVisible("management-quick-actions") && (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-base font-semibold">Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Primary CTA */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => setAcceptanceDialogOpen(true)}
              data-testid="button-quick-new-repair"
            >
              <PackageOpen className="h-4 w-4 mr-2" />
              Nuova Lavorazione
            </Button>
          </div>
          
          {/* Grouped Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Riparazioni */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="h-3 w-3" />
                Riparazioni
              </p>
              <div className="space-y-1">
                <Link href="/reseller/repairs" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-repairs">
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Tutte le lavorazioni
                  </Button>
                </Link>
                <Link href="/reseller/appointments" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-appointment">
                    <CalendarPlus className="h-3.5 w-3.5 mr-2 text-blue-500" />
                    Nuovo appuntamento
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Clienti */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                Clienti
              </p>
              <div className="space-y-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setCustomerDialogOpen(true)}
                  data-testid="button-quick-customer"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                  Nuovo cliente
                </Button>
                <Link href="/reseller/repair-centers" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-centers">
                    <Building2 className="h-3.5 w-3.5 mr-2" />
                    Centri riparazione
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Magazzino */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Package className="h-3 w-3" />
                Magazzino
              </p>
              <div className="space-y-1">
                <Link href="/reseller/warehouses" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-warehouse">
                    <Warehouse className="h-3.5 w-3.5 mr-2 text-violet-500" />
                    Gestione magazzino
                  </Button>
                </Link>
                <Link href="/reseller/transfer-requests" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-interscambio">
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-2" />
                    Interscambio
                  </Button>
                </Link>
                <Link href="/reseller/b2b-catalog" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-b2b">
                    <ShoppingCart className="h-3.5 w-3.5 mr-2 text-orange-500" />
                    Ordine B2B
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Fatturazione */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Fatturazione
              </p>
              <div className="space-y-1">
                <Link href="/reseller/invoices" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-invoices">
                    <Receipt className="h-3.5 w-3.5 mr-2" />
                    Fatture
                  </Button>
                </Link>
                <Link href="/reseller/suppliers" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-suppliers">
                    <Truck className="h-3.5 w-3.5 mr-2 text-amber-500" />
                    Fornitori
                  </Button>
                </Link>
                <Link href="/reseller/utility/practices" className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start" data-testid="button-quick-practices">
                    <Zap className="h-3.5 w-3.5 mr-2 text-yellow-500" />
                    Pratiche utility
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Operational Tasks */}
      {isWidgetVisible("activity-repairs") && (
        <OperationalTaskList maxItems={6} />
      )}

      {/* Charts & Recent Repairs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {isWidgetVisible("chart-repairs-status") && (
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
                      <RechartsTooltip 
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
          )}

          {isWidgetVisible("chart-work-status") && (
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
                        <RechartsTooltip 
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
          )}
        </div>

        {isWidgetVisible("activity-recent-repairs") && (
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-semibold">Ultime Riparazioni</CardTitle>
              <Link href="/reseller/repairs">
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
                    <Link href={`/reseller/repairs/${repair.id}`} key={repair.id}>
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
        )}
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
