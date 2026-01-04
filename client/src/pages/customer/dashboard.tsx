import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Ticket, CheckCircle, Clock, Building2, Store, Phone, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type CustomerStats = {
  overview: {
    totalTickets: number;
    openTickets: number;
    totalRepairs: number;
    activeRepairs: number;
  };
  ticketsByStatus: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  repairsByStatus: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  assignedCenter?: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
  } | null;
  assignedReseller?: {
    id: string;
    name: string;
    businessName?: string;
    phone?: string;
    logoUrl?: string;
    address?: string;
  } | null;
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function CustomerDashboard() {
  const { data: stats, isLoading } = useQuery<CustomerStats>({
    queryKey: ["/api/stats"],
  });

  const kpiCards = [
    {
      title: "Riparazioni Totali",
      value: stats?.overview.totalRepairs ?? 0,
      icon: Wrench,
      subtitle: `${stats?.overview.activeRepairs ?? 0} in corso`,
    },
    {
      title: "Riparazioni Attive",
      value: stats?.overview.activeRepairs ?? 0,
      icon: Clock,
      subtitle: "In lavorazione",
    },
    {
      title: "Riparazioni Completate",
      value: stats?.repairsByStatus.completed ?? 0,
      icon: CheckCircle,
      subtitle: "Terminate con successo",
    },
    {
      title: "Ticket Aperti",
      value: stats?.overview.openTickets ?? 0,
      icon: Ticket,
      subtitle: `${stats?.overview.totalTickets ?? 0} totali`,
    },
  ];

  const ticketsChartData = stats ? [
    { name: "Aperti", value: stats.ticketsByStatus.open, fill: COLORS[0] },
    { name: "In Corso", value: stats.ticketsByStatus.in_progress, fill: COLORS[1] },
    { name: "Risolti", value: stats.ticketsByStatus.resolved, fill: COLORS[2] },
    { name: "Chiusi", value: stats.ticketsByStatus.closed, fill: COLORS[3] },
  ] : [];

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
          <h1 className="text-2xl font-semibold mb-2">Le Mie Riparazioni</h1>
          <p className="text-muted-foreground">
            Monitora lo stato delle tue riparazioni e ticket
          </p>
        </div>
        <Link href="/customer/tickets">
          <Button data-testid="button-new-ticket">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Ticket
          </Button>
        </Link>
      </div>

      {/* Assignment Info */}
      {(stats?.assignedCenter || stats?.assignedReseller) && (
        <Card data-testid="card-assignment-info">
          <CardHeader>
            <CardTitle className="text-lg">I Tuoi Riferimenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats?.assignedReseller && (
                <div className="flex items-start gap-4 p-4 rounded-md bg-muted/50">
                  {stats.assignedReseller.logoUrl ? (
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={stats.assignedReseller.logoUrl} alt="Logo rivenditore" />
                      <AvatarFallback><Store className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-muted-foreground">Rivenditore</p>
                    <p className="font-semibold text-lg" data-testid="text-assigned-reseller">
                      {stats.assignedReseller.businessName || stats.assignedReseller.name}
                    </p>
                    {stats.assignedReseller.phone && (
                      <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${stats.assignedReseller.phone}`} className="hover:text-foreground">
                          {stats.assignedReseller.phone}
                        </a>
                      </p>
                    )}
                    {stats.assignedReseller.address && (
                      <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {stats.assignedReseller.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {stats?.assignedCenter && (
                <div className="flex items-start gap-4 p-4 rounded-md bg-muted/50">
                  {stats.assignedCenter.logoUrl ? (
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={stats.assignedCenter.logoUrl} alt="Logo centro" />
                      <AvatarFallback><Building2 className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-muted-foreground">Centro Riparazioni</p>
                    <p className="font-semibold text-lg" data-testid="text-assigned-center">
                      {stats.assignedCenter.name}
                    </p>
                    {stats.assignedCenter.phone && (
                      <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <a href={`tel:${stats.assignedCenter.phone}`} className="hover:text-foreground">
                          {stats.assignedCenter.phone}
                        </a>
                      </p>
                    )}
                    {stats.assignedCenter.address && (
                      <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {stats.assignedCenter.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle>Tickets per Stato</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : ticketsChartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={ticketsChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : null}
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
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Nessun ticket aperto
              </div>
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
            ) : repairsChartData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={repairsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                Nessuna riparazione trovata
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
