import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Users, Wrench, Ticket, FileText, Building, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type DashboardStats = {
  totalUsers: number;
  totalRepairCenters: number;
  activeRepairs: number;
  openTickets: number;
  pendingInvoices: number;
  monthlyRevenue: number;
};

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      title: "Utenti Totali",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Centri di Riparazione",
      value: stats?.totalRepairCenters ?? 0,
      icon: Building,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Riparazioni Attive",
      value: stats?.activeRepairs ?? 0,
      icon: Wrench,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Ticket Aperti",
      value: stats?.openTickets ?? 0,
      icon: Ticket,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
    {
      title: "Fatture in Sospeso",
      value: stats?.pendingInvoices ?? 0,
      icon: FileText,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10",
    },
    {
      title: "Fatturato Mensile",
      value: stats?.monthlyRevenue ? `€${(stats.monthlyRevenue / 100).toFixed(2)}` : "€0.00",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Panoramica generale della piattaforma MonkeyPlan
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="text-2xl font-bold" data-testid={`text-stat-value-${index}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Nessuna attività recente
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riparazioni Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Nessuna riparazione recente
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
