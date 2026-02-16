import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Wrench, Ticket, CheckCircle, Clock, Building2, Store, Phone, MapPin, ShoppingBag, Smartphone, Send, ArrowRight, Package, Euro, FileText, Shield, RotateCcw, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { usePageTitle } from "@/hooks/use-page-title";

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


export default function CustomerDashboard() {
  const { t } = useTranslation();
  const REMOTE_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    pending: { label: t("b2b.status.pending"), variant: "secondary" },
    accepted: { label: t("remoteRequests.accepted"), variant: "default" },
    quoted: { label: t("remote.preventivoInviato"), variant: "outline" },
    quote_accepted: { label: "Preventivo accettato", variant: "default" },
    quote_declined: { label: "Preventivo rifiutato", variant: "destructive" },
    awaiting_shipment: { label: t("b2b.inAttesaSpedizione"), variant: "secondary" },
    in_transit: { label: t("shipping.inTransit"), variant: "outline" },
    received: { label: t("repairs.status.received"), variant: "default" },
    in_repair: { label: t("repairs.status.inRepair"), variant: "default" },
  };
  usePageTitle(t("customerPages.dashboardCliente"));
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery<CustomerStats>({
    queryKey: ["/api/stats"],
  });

  const firstName = user?.fullName?.split(" ")[0] || user?.username || "Cliente";

  const quickActions = [
    { label: t("customerPages.acquistaServizio"), icon: ShoppingBag, href: "/customer/service-catalog", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: t("customerPages.leMieRiparazioni"), icon: Wrench, href: "/customer/repairs", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: t("customerPages.richiediRiparazione"), icon: Send, href: "/customer/remote-requests", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
    { label: t("sidebar.items.myWarranties"), icon: Shield, href: "/customer/warranties", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-welcome">
            Ciao, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ecco un riepilogo della tua area personale
          </p>
        </div>
        {user?.resellerId && (
          <Link href={`/shop/${user.resellerId}`}>
            <Button variant="outline" size="sm" data-testid="button-go-to-shop">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Vai allo Shop
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="cursor-pointer transition-colors h-full" data-testid={`card-action-${action.label.toLowerCase().replace(/\s+/g, "-")}`}>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-5 px-3 text-center">
                <div className={`h-10 w-10 rounded-md flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/customer/repairs">
          <Card className="cursor-pointer transition-colors" data-testid="card-stat-repairs-active">
            <CardContent className="pt-5 pb-4">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-stat-repairs">{stats?.overview.activeRepairs ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t("customerPages.riparazioniAttive")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/customer/tickets">
          <Card className="cursor-pointer transition-colors" data-testid="card-stat-tickets">
            <CardContent className="pt-5 pb-4">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-stat-tickets">{stats?.overview.openTickets ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t("customerPages.ticketAperti")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/customer/remote-requests">
          <Card className="cursor-pointer transition-colors" data-testid="card-stat-remote">
            <CardContent className="pt-5 pb-4">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Send className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-stat-remote">{stats?.remoteRequests?.active ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{t("customerPages.richiesteRemote")}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href="/customer/repairs">
          <Card className="cursor-pointer transition-colors" data-testid="card-stat-completed">
            <CardContent className="pt-5 pb-4">
              {isLoading ? <Skeleton className="h-12 w-full" /> : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-stat-completed">{stats?.repairsByStatus.completed ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Completate</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content: 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Activity / Remote Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Remote Requests */}
          {stats?.activeRemoteRequests && stats.activeRemoteRequests.length > 0 && (
            <Card data-testid="card-active-remote-requests">
              <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
                <CardTitle className="text-base">{t("customerPages.richiesteRemoteAttive")}</CardTitle>
                <Link href="/customer/remote-requests">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-remote">
                    Vedi tutte
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {stats.activeRemoteRequests.slice(0, 4).map((req) => {
                    const sc = REMOTE_STATUS_CONFIG[req.status] || { label: req.status, variant: "secondary" as const };
                    return (
                      <Link key={req.id} href="/customer/remote-requests" data-testid={`link-remote-request-${req.id}`}>
                        <div className="flex items-center justify-between gap-3 p-3 rounded-md border cursor-pointer transition-colors" data-testid={`card-remote-request-${req.id}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                              <Smartphone className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" data-testid={`text-remote-number-${req.id}`}>{req.requestNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(req.createdAt), "d MMM yyyy", { locale: it })}
                                {req.centerName && ` — ${req.centerName}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {req.quoteAmount != null && req.quoteAmount > 0 && (
                              <span className="text-sm font-medium flex items-center gap-0.5" data-testid={`text-remote-quote-${req.id}`}>
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

          {/* Repair Progress Summary */}
          {(stats?.overview.totalRepairs ?? 0) > 0 && (
            <Card data-testid="card-repair-summary">
              <CardHeader className="flex flex-row items-center justify-between gap-1 pb-3">
                <CardTitle className="text-base">{t("customerPages.statoRiparazioni")}</CardTitle>
                <Link href="/customer/repairs">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-repairs">
                    Vedi tutte
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: t("b2b.status.pending"), value: stats?.repairsByStatus.pending ?? 0, color: "bg-amber-500" },
                    { label: t("customerPages.inCorso"), value: stats?.repairsByStatus.in_progress ?? 0, color: "bg-blue-500" },
                    { label: t("customerPages.completate"), value: stats?.repairsByStatus.completed ?? 0, color: "bg-emerald-500" },
                    { label: t("invoices.annullate"), value: stats?.repairsByStatus.cancelled ?? 0, color: "bg-muted-foreground" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-md bg-muted/50">
                      <div className={`h-2.5 w-2.5 rounded-full ${item.color} shrink-0`} />
                      <div>
                        <p className="text-lg font-bold leading-none">{item.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Shortcuts */}
          <Card data-testid="card-navigation">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("sidebar.sections.services")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                {[
                  { label: t("sidebar.items.serviceCatalog"), desc: t("customerPages.scopriIServiziDisponibili"), icon: Wrench, href: "/customer/service-catalog", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
                  { label: t("sidebar.items.myOrders"), desc: t("customerPages.ordiniDiServizioEInterventi"), icon: FileText, href: "/customer/service-orders", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
                  { label: t("sidebar.items.salesOrders"), desc: t("customerPages.acquistiOnlineESpedizioni"), icon: ShoppingBag, href: "/customer/orders", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
                  { label: t("sidebar.items.returns"), desc: t("customerPages.gestisciResiERimborsi"), icon: RotateCcw, href: "/customer/sales-returns", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
                ].map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors hover:bg-muted/50" data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Contact Info Sidebar */}
        <div className="space-y-4">
          {/* Assigned Reseller */}
          {stats?.assignedReseller && (
            <Card data-testid="card-reseller-info">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  {stats.assignedReseller.logoUrl ? (
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={stats.assignedReseller.logoUrl} alt={t("customerPages.logoRivenditore")} />
                      <AvatarFallback><Store className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("roles.reseller")}</p>
                    <p className="font-semibold text-sm truncate" data-testid="text-assigned-reseller">
                      {stats.assignedReseller.businessName || stats.assignedReseller.name}
                    </p>
                    {stats.assignedReseller.phone && (
                      <a href={`tel:${stats.assignedReseller.phone}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1" data-testid="link-reseller-phone">
                        <Phone className="h-3 w-3" />
                        {stats.assignedReseller.phone}
                      </a>
                    )}
                    {stats.assignedReseller.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" data-testid="text-reseller-address">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{stats.assignedReseller.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Center */}
          {stats?.assignedCenter && (
            <Card data-testid="card-center-info">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-3">
                  {stats.assignedCenter.logoUrl ? (
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={stats.assignedCenter.logoUrl} alt={t("settings.logoCentro")} />
                      <AvatarFallback><Building2 className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Centro Riparazioni</p>
                    <p className="font-semibold text-sm truncate" data-testid="text-assigned-center">
                      {stats.assignedCenter.name}
                    </p>
                    {stats.assignedCenter.phone && (
                      <a href={`tel:${stats.assignedCenter.phone}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1" data-testid="link-center-phone">
                        <Phone className="h-3 w-3" />
                        {stats.assignedCenter.phone}
                      </a>
                    )}
                    {stats.assignedCenter.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5" data-testid="text-center-address">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{stats.assignedCenter.address}</span>
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ticket Summary */}
          {(stats?.overview.totalTickets ?? 0) > 0 && (
            <Card data-testid="card-ticket-summary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between gap-1">
                  Ticket
                  <Link href="/customer/tickets">
                    <Button variant="ghost" size="sm" data-testid="button-view-tickets">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {[
                    { label: t("customerPages.aperti"), value: stats?.ticketsByStatus.open ?? 0, dot: "bg-amber-500" },
                    { label: t("customerPages.inCorso"), value: stats?.ticketsByStatus.in_progress ?? 0, dot: "bg-blue-500" },
                    { label: "Risolti", value: stats?.ticketsByStatus.resolved ?? 0, dot: "bg-emerald-500" },
                  ].filter(i => i.value > 0).map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                        <span className="text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                  {[stats?.ticketsByStatus.open, stats?.ticketsByStatus.in_progress, stats?.ticketsByStatus.resolved].every(v => (v ?? 0) === 0) && (
                    <p className="text-xs text-muted-foreground">{t("customerPages.nessunTicketAttivo")}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
