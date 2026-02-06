import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Ticket, CheckCircle, Clock, Building2, Store, Phone, MapPin, LayoutDashboard, Plus, ShoppingBag, Smartphone, Send, ArrowRight, Package, Truck, Euro } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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
  remoteRequests?: {
    total: number;
    active: number;
    pending: number;
    quoted: number;
    awaitingShipment: number;
    inTransit: number;
    inRepair: number;
    completed: number;
  };
  activeRemoteRequests?: Array<{
    id: string;
    requestNumber: string;
    status: string;
    createdAt: string;
    centerName: string | null;
    deviceCount: number;
    quoteAmount: number | null;
    quoteDescription: string | null;
  }>;
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function CustomerDashboard() {
  const { user } = useAuth();
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
    {
      title: "Richieste Remote",
      value: stats?.remoteRequests?.active ?? 0,
      icon: Send,
      subtitle: `${stats?.remoteRequests?.total ?? 0} totali`,
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Le Mie Riparazioni</h1>
              <p className="text-white/80 text-sm">
                Monitora lo stato delle tue riparazioni e ticket
              </p>
            </div>
          </div>
          <Link href="/customer/tickets">
            <Button data-testid="button-new-ticket">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Ticket
            </Button>
          </Link>
        </div>
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
                    {user?.resellerId && (
                      <Link href={`/shop/${user.resellerId}`}>
                        <Button size="sm" className="mt-3" data-testid="button-go-to-shop">
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Vai allo Shop
                        </Button>
                      </Link>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

      {/* Active Remote Requests */}
      {stats?.activeRemoteRequests && stats.activeRemoteRequests.length > 0 && (
        <Card data-testid="card-active-remote-requests">
          <CardHeader className="flex flex-row items-center justify-between gap-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5 text-muted-foreground" />
              Richieste Remote Attive
            </CardTitle>
            <Link href="/customer/remote-requests">
              <Button variant="outline" size="sm" data-testid="button-view-all-remote">
                Vedi tutte
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.activeRemoteRequests.map((req) => {
                const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
                  pending: { label: "In attesa", variant: "secondary" },
                  accepted: { label: "Accettata", variant: "default" },
                  quoted: { label: "Preventivo inviato", variant: "outline" },
                  quote_accepted: { label: "Preventivo accettato", variant: "default" },
                  quote_declined: { label: "Preventivo rifiutato", variant: "destructive" },
                  awaiting_shipment: { label: "In attesa spedizione", variant: "secondary" },
                  in_transit: { label: "In transito", variant: "outline" },
                  received: { label: "Ricevuto", variant: "default" },
                  in_repair: { label: "In riparazione", variant: "default" },
                };
                const sc = statusConfig[req.status] || { label: req.status, variant: "secondary" as const };
                return (
                  <Link key={req.id} href="/customer/remote-requests" data-testid={`link-remote-request-${req.id}`}>
                    <div className="flex items-center justify-between gap-4 p-3 rounded-md border hover-elevate cursor-pointer" data-testid={`card-remote-request-${req.id}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" data-testid={`text-remote-number-${req.id}`}>{req.requestNumber}</p>
                          <p className="text-xs text-muted-foreground" data-testid={`text-remote-date-${req.id}`}>
                            {format(new Date(req.createdAt), "d MMM yyyy", { locale: it })}
                            {req.centerName && ` — ${req.centerName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {req.quoteAmount != null && req.quoteAmount > 0 && (
                          <span className="text-sm font-medium flex items-center gap-1" data-testid={`text-remote-quote-${req.id}`}>
                            <Euro className="h-3 w-3" />
                            {(req.quoteAmount / 100).toFixed(2)}
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs" data-testid={`badge-remote-devices-${req.id}`}>
                          <Package className="h-3 w-3 mr-1" />
                          {req.deviceCount}
                        </Badge>
                        <Badge variant={sc.variant} className="text-xs" data-testid={`badge-remote-status-${req.id}`}>
                          {sc.label}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
