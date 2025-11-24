import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Clock, CheckCircle, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type RepairCenterStats = {
  assignedRepairs: number;
  inProgressRepairs: number;
  completedToday: number;
  inventoryItems: number;
};

export default function RepairCenterDashboard() {
  const { data: stats, isLoading } = useQuery<RepairCenterStats>({
    queryKey: ["/api/repair-center/stats"],
  });

  const statCards = [
    {
      title: "Lavorazioni Assegnate",
      value: stats?.assignedRepairs ?? 0,
      icon: Wrench,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "In Lavorazione",
      value: stats?.inProgressRepairs ?? 0,
      icon: Clock,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Completate Oggi",
      value: stats?.completedToday ?? 0,
      icon: CheckCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Articoli Magazzino",
      value: stats?.inventoryItems ?? 0,
      icon: Package,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard Centro Riparazione</h1>
        <p className="text-muted-foreground">
          Gestisci le lavorazioni e il magazzino del tuo centro
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} data-testid={`card-stat-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`flex h-9 w-9 items-center justify-center rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lavorazioni Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Nessuna lavorazione recente
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
