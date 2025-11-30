import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Users, TrendingUp, Clock, FileText, Package, AlertTriangle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, Wrench, Ticket } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { RepairOrder, Invoice } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type ResellerStats = {
  overview: {
    totalOrders: number;
    completedOrders: number;
    totalCustomers: number;
    totalRevenue: number;
  };
  repairsByStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function ResellerDashboard() {
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
      ingressato: { label: "Ingressato", variant: "secondary" },
      in_diagnosi: { label: "In Diagnosi", variant: "secondary" },
      attesa_preventivo: { label: "Attesa Prev.", variant: "outline" },
      preventivo_approvato: { label: "Prev. OK", variant: "default" },
      preventivo_rifiutato: { label: "Prev. Rifiutato", variant: "destructive" },
      attesa_ricambi: { label: "Attesa Ricambi", variant: "outline" },
      in_riparazione: { label: "In Riparazione", variant: "default" },
      in_test: { label: "In Test", variant: "default" },
      pronto_ritiro: { label: "Pronto", variant: "default" },
      consegnato: { label: "Consegnato", variant: "secondary" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const kpiCards = [
    {
      title: "Ordini Totali",
      value: stats?.overview.totalOrders ?? 0,
      icon: ShoppingCart,
      subtitle: `${stats?.overview.completedOrders ?? 0} completati`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Riparazioni Attive",
      value: (stats?.repairsByStatus.pending ?? 0) + (stats?.repairsByStatus.in_progress ?? 0),
      icon: Clock,
      subtitle: `${stats?.repairsByStatus.in_progress ?? 0} in lavorazione`,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Clienti",
      value: stats?.overview.totalCustomers ?? 0,
      icon: Users,
      subtitle: "Clienti gestiti",
      color: "text-green-600",
      bg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Fatturato",
      value: stats ? formatCurrency(stats.overview.totalRevenue) : "€0.00",
      icon: TrendingUp,
      subtitle: "Da ordini completati",
      color: "text-yellow-600",
      bg: "bg-yellow-100 dark:bg-yellow-900/30",
    },
  ];

  const repairsChartData = stats ? [
    { name: "Pendenti", value: stats.repairsByStatus.pending },
    { name: "In Corso", value: stats.repairsByStatus.in_progress },
    { name: "Completate", value: stats.repairsByStatus.completed },
    { name: "Annullate", value: stats.repairsByStatus.cancelled },
  ] : [];

  const pieData = stats ? [
    { name: "Pendenti", value: stats.repairsByStatus.pending },
    { name: "In Corso", value: stats.repairsByStatus.in_progress },
    { name: "Completate", value: stats.repairsByStatus.completed },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6" data-testid="page-reseller-dashboard">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Dashboard Rivenditore</h1>
          <p className="text-muted-foreground">
            Panoramica delle tue attività e ordini
          </p>
        </div>
        <Link href="/reseller/new-repair">
          <Button data-testid="button-new-repair">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Riparazione
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card key={index} data-testid={`card-kpi-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid={`text-kpi-${index}`}>
                    {card.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      {(overdueInvoices.length > 0 || pendingInvoices.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {overdueInvoices.length > 0 && (
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium">Fatture Scadute</p>
                    <p className="text-sm text-muted-foreground">
                      {overdueInvoices.length} fatture da saldare
                    </p>
                  </div>
                  <Link href="/reseller/invoices" className="ml-auto">
                    <Button size="sm" variant="outline">Visualizza</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
          {pendingInvoices.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Fatture in Sospeso</p>
                    <p className="text-sm text-muted-foreground">
                      {pendingInvoices.length} fatture da pagare
                    </p>
                  </div>
                  <Link href="/reseller/invoices" className="ml-auto">
                    <Button size="sm" variant="outline">Visualizza</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Riparazioni per Stato</CardTitle>
            <CardDescription>Distribuzione delle riparazioni</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={repairsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stato Lavori</CardTitle>
            <CardDescription>Panoramica riparazioni attive</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Repairs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-1">
          <div>
            <CardTitle>Ultime Riparazioni</CardTitle>
            <CardDescription>Le tue riparazioni più recenti</CardDescription>
          </div>
          <Link href="/reseller/orders">
            <Button variant="outline" size="sm">Vedi tutte</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentRepairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessuna riparazione trovata</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRepairs.map((repair) => (
                <div
                  key={repair.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`row-repair-${repair.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium font-mono text-sm">{repair.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {repair.deviceType} - {repair.deviceModel || 'N/D'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(repair.createdAt), "dd MMM", { locale: it })}
                    </span>
                    {getStatusBadge(repair.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/reseller/new-repair">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover-elevate" data-testid="button-quick-new-repair">
              <Wrench className="h-6 w-6" />
              <span className="text-sm font-medium">Nuova Riparazione</span>
            </Button>
          </Link>
          <Link href="/reseller/orders">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover-elevate" data-testid="button-quick-orders">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm font-medium">I Miei Ordini</span>
            </Button>
          </Link>
          <Link href="/reseller/customers">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover-elevate" data-testid="button-quick-customers">
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Gestisci Clienti</span>
            </Button>
          </Link>
          <Link href="/reseller/tickets">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-4 hover-elevate" data-testid="button-quick-tickets">
              <Ticket className="h-6 w-6" />
              <span className="text-sm font-medium">Ticket Assistenza</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
