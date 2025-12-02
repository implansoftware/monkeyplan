import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Users, Wrench, Ticket, TrendingUp, Package, Building } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

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
    in_progress: number;
    completed: number;
    cancelled: number;
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

  const ticketsChartData = stats?.ticketsByStatus ? [
    { name: "Aperti", value: stats.ticketsByStatus.open || 0, fill: COLORS[0] },
    { name: "In Corso", value: stats.ticketsByStatus.in_progress || 0, fill: COLORS[1] },
    { name: "Chiusi", value: stats.ticketsByStatus.closed || 0, fill: COLORS[2] },
  ] : [];

  const repairsChartData = stats?.repairsByStatus ? [
    { name: "Pendenti", value: stats.repairsByStatus.pending || 0 },
    { name: "In Corso", value: stats.repairsByStatus.in_progress || 0 },
    { name: "Completate", value: stats.repairsByStatus.completed || 0 },
    { name: "Annullate", value: stats.repairsByStatus.cancelled || 0 },
  ] : [];

  const kpiCards = [
    {
      title: "Fatturato Totale",
      value: stats?.overview ? formatCurrency(stats.overview.totalRevenue || 0) : "€0.00",
      icon: TrendingUp,
      subtitle: `${stats?.overview?.paidInvoices ?? 0} fatture pagate`,
    },
    {
      title: "Riparazioni Totali",
      value: stats?.overview?.totalRepairs ?? 0,
      icon: Wrench,
      subtitle: `${stats?.overview?.activeRepairs ?? 0} in corso`,
    },
    {
      title: "Ticket Totali",
      value: stats?.overview?.totalTickets ?? 0,
      icon: Ticket,
      subtitle: `${stats?.overview?.openTickets ?? 0} aperti`,
    },
    {
      title: "Tempo Medio Riparazione",
      value: stats?.overview ? `${(stats.overview.avgRepairTime || 0).toFixed(1)} giorni` : "0 giorni",
      icon: Building,
      subtitle: `${stats?.overview?.completedRepairs ?? 0} completate`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard Amministratore</h1>
        <p className="text-muted-foreground">
          Panoramica completa della piattaforma MonkeyPlan
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, index) => (
          <Card key={index} data-testid={`card-kpi-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
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
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
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
