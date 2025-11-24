import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Users, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Wrench } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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

export default function ResellerDashboard() {
  const { data: stats, isLoading } = useQuery<ResellerStats>({
    queryKey: ["/api/stats"],
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const kpiCards = [
    {
      title: "Ordini Totali",
      value: stats?.overview.totalOrders ?? 0,
      icon: ShoppingCart,
      subtitle: `${stats?.overview.completedOrders ?? 0} completati`,
    },
    {
      title: "Riparazioni Attive",
      value: (stats?.repairsByStatus.pending ?? 0) + (stats?.repairsByStatus.in_progress ?? 0),
      icon: Clock,
      subtitle: `${stats?.repairsByStatus.in_progress ?? 0} in lavorazione`,
    },
    {
      title: "Clienti",
      value: stats?.overview.totalCustomers ?? 0,
      icon: Users,
      subtitle: "Clienti gestiti",
    },
    {
      title: "Fatturato",
      value: stats ? formatCurrency(stats.overview.totalRevenue) : "€0.00",
      icon: TrendingUp,
      subtitle: "Da ordini completati",
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
      <div className="flex items-center justify-between">
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

      {/* Chart */}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/reseller/new-repair">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-6 hover-elevate" data-testid="button-quick-new-repair">
              <Wrench className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Nuova Riparazione</div>
                <div className="text-xs text-muted-foreground">Crea richiesta riparazione</div>
              </div>
            </Button>
          </Link>
          <Link href="/reseller/orders">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-6 hover-elevate" data-testid="button-quick-orders">
              <ShoppingCart className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">I Miei Ordini</div>
                <div className="text-xs text-muted-foreground">Visualizza tutti gli ordini</div>
              </div>
            </Button>
          </Link>
          <Link href="/reseller/customers">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-6 hover-elevate" data-testid="button-quick-customers">
              <Users className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Gestisci Clienti</div>
                <div className="text-xs text-muted-foreground">Visualizza e gestisci clienti</div>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
