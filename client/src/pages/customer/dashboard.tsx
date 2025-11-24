import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";

type CustomerStats = {
  totalRepairs: number;
  activeRepairs: number;
  completedRepairs: number;
  openTickets: number;
};

export default function CustomerDashboard() {
  const { data: stats, isLoading } = useQuery<CustomerStats>({
    queryKey: ["/api/customer/stats"],
  });

  const statCards = [
    {
      title: "Riparazioni Totali",
      value: stats?.totalRepairs ?? 0,
      icon: Wrench,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "In Corso",
      value: stats?.activeRepairs ?? 0,
      icon: Clock,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Completate",
      value: stats?.completedRepairs ?? 0,
      icon: CheckCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Ticket Aperti",
      value: stats?.openTickets ?? 0,
      icon: MessageSquare,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Le Mie Riparazioni</h1>
          <p className="text-muted-foreground">
            Monitora lo stato delle tue riparazioni
          </p>
        </div>
        <Link href="/customer/tickets">
          <Button data-testid="button-new-ticket">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Ticket
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
          <CardTitle>Riparazioni Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            Nessuna riparazione trovata
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
