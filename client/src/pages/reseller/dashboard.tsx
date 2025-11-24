import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Users, Wrench, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";

type ResellerStats = {
  totalOrders: number;
  activeRepairs: number;
  totalCustomers: number;
  pendingRepairs: number;
};

export default function ResellerDashboard() {
  const { data: stats, isLoading } = useQuery<ResellerStats>({
    queryKey: ["/api/reseller/stats"],
  });

  const statCards = [
    {
      title: "Ordini Totali",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Riparazioni Attive",
      value: stats?.activeRepairs ?? 0,
      icon: Wrench,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Clienti",
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "In Attesa",
      value: stats?.pendingRepairs ?? 0,
      icon: Clock,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Dashboard Rivenditore</h1>
          <p className="text-muted-foreground">
            Panoramica delle tue attività
          </p>
        </div>
        <Link href="/reseller/new-repair">
          <Button data-testid="button-new-repair">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Riparazione
          </Button>
        </Link>
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
          <CardTitle>Azioni Rapide</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/reseller/new-repair">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-6" data-testid="button-quick-new-repair">
              <Wrench className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">Nuova Riparazione</div>
                <div className="text-xs text-muted-foreground">Crea richiesta riparazione</div>
              </div>
            </Button>
          </Link>
          <Link href="/reseller/orders">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-6" data-testid="button-quick-orders">
              <ShoppingCart className="h-8 w-8" />
              <div className="text-center">
                <div className="font-medium">I Miei Ordini</div>
                <div className="text-xs text-muted-foreground">Visualizza tutti gli ordini</div>
              </div>
            </Button>
          </Link>
          <Link href="/reseller/customers">
            <Button variant="outline" className="w-full h-auto flex-col gap-2 p-6" data-testid="button-quick-customers">
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
