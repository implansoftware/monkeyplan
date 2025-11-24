import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Ticket, AlertTriangle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type RepairCenterStats = {
  overview: {
    assignedRepairs: number;
    completedRepairs: number;
    assignedTickets: number;
  };
  repairsByStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  lowStockProducts: Array<{
    id: string;
    productId: string;
    repairCenterId: string;
    quantity: number;
    updatedAt: string;
    product?: {
      id: string;
      name: string;
      sku: string;
      category: string;
      unitPrice: number;
    };
  }>;
};

export default function RepairCenterDashboard() {
  const { data: stats, isLoading } = useQuery<RepairCenterStats>({
    queryKey: ["/api/stats"],
  });

  const kpiCards = [
    {
      title: "Riparazioni Assegnate",
      value: stats?.overview.assignedRepairs ?? 0,
      icon: Wrench,
      subtitle: `${stats?.overview.completedRepairs ?? 0} completate`,
    },
    {
      title: "In Lavorazione",
      value: stats?.repairsByStatus.in_progress ?? 0,
      icon: BarChart3,
      subtitle: `${stats?.repairsByStatus.pending ?? 0} pendenti`,
    },
    {
      title: "Ticket Assegnati",
      value: stats?.overview.assignedTickets ?? 0,
      icon: Ticket,
      subtitle: "Richieste supporto",
    },
    {
      title: "Prodotti Scorte Basse",
      value: stats?.lowStockProducts?.length ?? 0,
      icon: AlertTriangle,
      subtitle: "Riordino necessario",
    },
  ];

  const repairsChartData = stats ? [
    { name: "Pendenti", value: stats.repairsByStatus.pending },
    { name: "In Corso", value: stats.repairsByStatus.in_progress },
    { name: "Completate", value: stats.repairsByStatus.completed },
    { name: "Annullate", value: stats.repairsByStatus.cancelled },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard Centro Riparazione</h1>
        <p className="text-muted-foreground">
          Gestisci le lavorazioni e il magazzino del tuo centro
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Allerta Scorte Basse
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantità</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.lowStockProducts.slice(0, 5).map((item) => (
                    <TableRow key={item.id} data-testid={`row-low-stock-${item.id}`}>
                      <TableCell className="font-medium">
                        {item.product?.name || "N/A"}
                      </TableCell>
                      <TableCell>{item.product?.sku || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.quantity === 0 ? "destructive" : "secondary"}>
                          {item.quantity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Tutte le scorte sono sufficienti
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
