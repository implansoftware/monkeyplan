import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Users, TrendingUp, FileText, Package, AlertCircle, Zap, ArrowRightLeft, Network, ChevronRight, ExternalLink } from "lucide-react";
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

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Panoramica delle attività
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAcceptanceDialogOpen(true)} data-testid="button-new-repair">
            <PackageOpen className="h-4 w-4 mr-2" />
            Nuova Lavorazione
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(overdueInvoices.length > 0 || pendingInvoices.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {overdueInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{overdueInvoices.length} fatture scadute</p>
              </div>
              <Link href="/reseller/invoices">
                <Button size="sm" variant="outline">Visualizza</Button>
              </Link>
            </div>
          )}
          {pendingInvoices.length > 0 && (
            <div className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{pendingInvoices.length} fatture in sospeso</p>
              </div>
              <Link href="/reseller/invoices">
                <Button size="sm" variant="ghost">Visualizza</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-kpi-repairs">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Riparazioni Attive</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <p className="text-3xl font-semibold tabular-nums" data-testid="text-active-repairs">
                    {stats?.overview?.activeRepairs ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{stats?.overview?.totalRepairs ?? 0} totali</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-customers">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Clienti</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <p className="text-3xl font-semibold tabular-nums" data-testid="text-customers">
                    {stats?.overview?.totalCustomers ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Gestiti</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-revenue">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fatturato</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-semibold tabular-nums" data-testid="text-revenue">
                    {formatCurrency(stats?.overview?.totalRevenue ?? 0)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Riparazioni</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-stock">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stock</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <p className="text-3xl font-semibold tabular-nums" data-testid="text-stock">
                    {stats?.warehouse?.totalStock ?? 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {stats?.warehouse?.lowStockItems ? `${stats.warehouse.lowStockItems} sotto scorta` : "Articoli"}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Warehouse className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/reseller/transfer-requests" className="block group">
          <Card className="h-full transition-colors hover:border-primary/50" data-testid="card-interscambio">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Interscambio</p>
                  <p className="text-lg font-semibold tabular-nums" data-testid="text-pending-transfers">
                    {stats?.interscambio?.pendingRequests ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reseller/b2b-orders" className="block group">
          <Card className="h-full transition-colors hover:border-primary/50" data-testid="card-b2b">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Ordini B2B</p>
                  <p className="text-lg font-semibold tabular-nums" data-testid="text-pending-b2b">
                    {stats?.b2b?.pendingOrders ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reseller/utility/practices" className="block group">
          <Card className="h-full transition-colors hover:border-primary/50" data-testid="card-utility">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Pratiche Utility</p>
                  <p className="text-lg font-semibold tabular-nums" data-testid="text-active-practices">
                    {stats?.utility?.activePractices ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reseller/repair-centers" className="block group">
          <Card className="h-full transition-colors hover:border-primary/50" data-testid="card-network-stats">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Network className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Centri Riparazione</p>
                  <p className="text-lg font-semibold tabular-nums" data-testid="text-network-centers">
                    {stats?.network?.repairCenters ?? 0}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2">
            <Button 
              variant="outline" 
              className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal"
              onClick={() => setCustomerDialogOpen(true)}
              data-testid="button-quick-customer"
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span>Nuovo Cliente</span>
            </Button>
            <Link href="/reseller/appointments">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-appointment">
                <CalendarPlus className="h-4 w-4 text-muted-foreground" />
                <span>Appuntamento</span>
              </Button>
            </Link>
            <Link href="/reseller/warehouses">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-warehouse">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                <span>Magazzino</span>
              </Button>
            </Link>
            <Link href="/reseller/b2b-catalog">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-b2b">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span>Ordine B2B</span>
              </Button>
            </Link>
            <Link href="/reseller/suppliers">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-suppliers">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Fornitori</span>
              </Button>
            </Link>
            <Link href="/reseller/transfer-requests">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-interscambio">
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <span>Interscambio</span>
              </Button>
            </Link>
            <Link href="/reseller/utility/practices">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-practices">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span>Pratiche</span>
              </Button>
            </Link>
            <Link href="/reseller/repair-centers">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-centers">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Centri Rip.</span>
              </Button>
            </Link>
            <Link href="/reseller/invoices">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-invoices">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span>Fatture</span>
              </Button>
            </Link>
            <Link href="/reseller/repairs">
              <Button variant="outline" className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1.5 text-xs font-normal" data-testid="button-quick-repairs">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <span>Tutte Rip.</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Charts & Recent Repairs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Riparazioni per Stato</CardTitle>
            </CardHeader>
            <CardContent>
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
                        borderRadius: '6px',
                        fontSize: '12px'
                      }} 
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Stato Lavori</CardTitle>
            </CardHeader>
            <CardContent>
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
                          borderRadius: '6px',
                          fontSize: '12px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Nessun dato disponibile
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
            <CardTitle className="text-sm font-medium">Ultime Riparazioni</CardTitle>
            <Link href="/reseller/repairs">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                Tutte
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pb-3">
            {recentRepairs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nessuna riparazione</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentRepairs.map((repair) => (
                  <Link key={repair.id} href={`/reseller/repairs/${repair.id}`}>
                    <div
                      className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                      data-testid={`row-repair-${repair.id}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium font-mono truncate">{repair.orderNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">{repair.deviceType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
