import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench, Ticket, CheckCircle, Store, Phone, MapPin, ShoppingBag, Smartphone,
  Send, ArrowRight, Package, Euro, FileText, Shield, RotateCcw, ChevronRight,
  Activity,
} from "lucide-react";
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
  usePageTitle(t("customerPages.dashboardCliente"));
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery<CustomerStats>({
    queryKey: ["/api/stats"],
  });

  const { data: repairs = [] } = useQuery<any[]>({
    queryKey: ["/api/customer/repairs"],
  });

  const { data: serviceOrders = [] } = useQuery<any[]>({
    queryKey: ["/api/customer/service-orders"],
  });

  const firstName = user?.fullName?.split(" ")[0] || user?.username || t("customers.customer");

  // Correct status label map using existing translation keys
  const repairStatusMap: Record<string, { label: string; color: string }> = {
    pending:               { label: t("repairs.status.pending"),       color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    ingressato:            { label: t("repairs.status.received"),      color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    in_diagnosi:           { label: t("repairs.status.inDiagnosis"),   color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    preventivo_emesso:     { label: t("repairs.status.quoteIssued"),   color: "bg-violet-500/15 text-violet-700 dark:text-violet-400" },
    preventivo_accettato:  { label: t("repairs.status.quoteAccepted"), color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    preventivo_rifiutato:  { label: t("repairs.status.quoteRejected"), color: "bg-red-500/15 text-red-700 dark:text-red-400" },
    attesa_ricambi:        { label: t("repairs.status.waitingParts"),  color: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
    in_riparazione:        { label: t("repairs.status.inRepair"),      color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    in_test:               { label: t("repairs.status.inTest"),        color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    pronto_ritiro:         { label: t("repairs.status.readyForPickup"),color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    consegnato:            { label: t("repairs.status.delivered"),     color: "bg-muted text-muted-foreground" },
    cancelled:             { label: t("repairs.status.cancelled"),     color: "bg-red-500/15 text-red-700 dark:text-red-400" },
    // service order statuses
    accepted:              { label: t("standalone.accepted"),          color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
    scheduled:             { label: t("customerPages.scheduledLabel"), color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    in_progress:           { label: t("repairs.status.inProgress"),   color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
    completed:             { label: t("repairs.status.completed"),     color: "bg-muted text-muted-foreground" },
  };

  const REMOTE_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    pending:          { label: t("b2b.status.pending"),       variant: "secondary" },
    accepted:         { label: t("remoteRequests.accepted"),  variant: "default" },
    quoted:           { label: t("remote.preventivoInviato"), variant: "outline" },
    quote_accepted:   { label: t("customerPages.quoteAccepted"), variant: "default" },
    quote_declined:   { label: t("customerPages.quoteDeclined"), variant: "destructive" },
    awaiting_shipment:{ label: t("b2b.inAttesaSpedizione"),   variant: "secondary" },
    in_transit:       { label: t("shipping.inTransit"),       variant: "outline" },
    received:         { label: t("repairs.status.received"),  variant: "default" },
    in_repair:        { label: t("repairs.status.inRepair"),  variant: "default" },
  };

  // Build recent activity: merge repairs + service orders, sort by date, keep top 5
  const recentActivity = [
    ...repairs.map((r: any) => ({
      type: "repair" as const,
      id: r.id,
      title: [r.brand, r.model].filter(Boolean).join(" ") || r.deviceType || t("customerPages.leMieRiparazioni"),
      subtitle: r.orderNumber ? `#${r.orderNumber}` : `#${r.id.slice(0, 8).toUpperCase()}`,
      status: r.status,
      date: r.updatedAt || r.createdAt,
      href: "/customer/repairs",
    })),
    ...serviceOrders.map((o: any) => ({
      type: "service" as const,
      id: o.id,
      title: (o as any).serviceItem?.name || t("sidebar.items.myOrders"),
      subtitle: o.orderNumber ? `#${o.orderNumber}` : `#${o.id.slice(0, 8).toUpperCase()}`,
      status: o.status,
      date: o.updatedAt || o.createdAt,
      href: "/customer/service-orders",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const navLinks = [
    { label: t("sidebar.items.serviceCatalog"), desc: t("customerPages.scopriIServiziDisponibili"), icon: Wrench, href: "/customer/service-catalog", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
    { label: t("sidebar.items.myOrders"), desc: t("customerPages.ordiniDiServizioEInterventi"), icon: FileText, href: "/customer/service-orders", color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
    { label: t("sidebar.items.salesOrders"), desc: t("customerPages.acquistiOnlineESpedizioni"), icon: ShoppingBag, href: "/customer/orders", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
    { label: t("sidebar.items.returns"), desc: t("customerPages.gestisciResiERimborsi"), icon: RotateCcw, href: "/customer/sales-returns", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  ];

  return (
    <div className="space-y-5 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-welcome">
            {t("dashboard.hello")}, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("customerPages.personalAreaSummary")}
          </p>
        </div>
        {user?.resellerId && (
          <Link href={`/shop/${user.resellerId}`}>
            <Button variant="outline" size="sm" data-testid="button-go-to-shop">
              <ShoppingBag className="h-4 w-4 mr-2" />
              {t("customerPages.goToShop")}
            </Button>
          </Link>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("customerPages.acquistaServizio"), icon: ShoppingBag, href: "/customer/service-catalog", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
          { label: t("customerPages.leMieRiparazioni"), icon: Wrench, href: "/customer/repairs", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
          { label: t("customerPages.richiediRiparazione"), icon: Send, href: "/customer/remote-requests", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
          { label: t("sidebar.items.myWarranties"), icon: Shield, href: "/customer/warranties", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="cursor-pointer h-full" data-testid={`card-action-${action.href.split("/").pop()}`}>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-4 px-3 text-center">
                <div className={`h-9 w-9 rounded-md flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium leading-tight">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-4 pb-3"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))
        ) : (
          <>
            <Link href="/customer/repairs">
              <Card className="cursor-pointer" data-testid="card-stat-repairs-active">
                <CardContent className="flex items-center gap-3 pt-4 pb-3">
                  <div className="h-9 w-9 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Wrench className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none" data-testid="text-stat-repairs">{stats?.overview.activeRepairs ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("customerPages.riparazioniAttive")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/customer/tickets">
              <Card className="cursor-pointer" data-testid="card-stat-tickets">
                <CardContent className="flex items-center gap-3 pt-4 pb-3">
                  <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Ticket className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none" data-testid="text-stat-tickets">{stats?.overview.openTickets ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("customerPages.ticketAperti")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/customer/remote-requests">
              <Card className="cursor-pointer" data-testid="card-stat-remote">
                <CardContent className="flex items-center gap-3 pt-4 pb-3">
                  <div className="h-9 w-9 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Send className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none" data-testid="text-stat-remote">{stats?.remoteRequests?.active ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("customerPages.richiesteRemote")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/customer/repairs">
              <Card className="cursor-pointer" data-testid="card-stat-completed">
                <CardContent className="flex items-center gap-3 pt-4 pb-3">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-bold leading-none" data-testid="text-stat-completed">{stats?.repairsByStatus.completed ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("customerPages.completate")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {/* Main: 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT — main column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card data-testid="card-recent-activity">
              <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  {t("customerPages.recentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {recentActivity.map((item) => {
                    const statusInfo = repairStatusMap[item.status] || { label: item.status, color: "bg-muted text-muted-foreground" };
                    const isRepair = item.type === "repair";
                    return (
                      <Link key={`${item.type}-${item.id}`} href={item.href}>
                        <div className="flex items-center gap-3 py-2.5 cursor-pointer" data-testid={`activity-item-${item.id}`}>
                          <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${isRepair ? "bg-emerald-500/10" : "bg-blue-500/10"}`}>
                            {isRepair
                              ? <Wrench className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              : <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {format(new Date(item.date), "d MMM", { locale: it })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Remote Requests */}
          {stats?.activeRemoteRequests && stats.activeRemoteRequests.length > 0 && (
            <Card data-testid="card-active-remote-requests">
              <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                <CardTitle className="text-base">{t("customerPages.richiesteRemoteAttive")}</CardTitle>
                <Link href="/customer/remote-requests">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-remote">
                    {t("common.viewAll")} <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y divide-border">
                  {stats.activeRemoteRequests.slice(0, 3).map((req) => {
                    const sc = REMOTE_STATUS_CONFIG[req.status] || { label: req.status, variant: "secondary" as const };
                    return (
                      <Link key={req.id} href="/customer/remote-requests" data-testid={`link-remote-request-${req.id}`}>
                        <div className="flex items-center justify-between gap-3 py-2.5 cursor-pointer" data-testid={`card-remote-request-${req.id}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-md bg-violet-500/10 flex items-center justify-center shrink-0">
                              <Smartphone className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate" data-testid={`text-remote-number-${req.id}`}>{req.requestNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(req.createdAt), "d MMM yyyy", { locale: it })}
                                {req.centerName && ` · ${req.centerName}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {req.quoteAmount != null && req.quoteAmount > 0 && (
                              <span className="text-sm font-medium flex items-center gap-0.5" data-testid={`text-remote-quote-${req.id}`}>
                                <Euro className="h-3 w-3" />{(req.quoteAmount / 100).toFixed(2)}
                              </span>
                            )}
                            <Badge variant="secondary" className="text-xs" data-testid={`badge-remote-devices-${req.id}`}>
                              <Package className="h-3 w-3 mr-1" />{req.deviceCount}
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

          {/* Empty state when nothing to show */}
          {recentActivity.length === 0 && !(stats?.activeRemoteRequests?.length) && (
            <Card data-testid="card-empty-activity">
              <CardContent className="py-10 flex flex-col items-center gap-3 text-center text-muted-foreground">
                <Activity className="h-8 w-8 opacity-30" />
                <p className="text-sm">{t("customerPages.noRecentActivity")}</p>
                <Link href="/customer/service-catalog">
                  <Button size="sm" variant="outline">{t("customerPages.acquistaServizio")}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT — sidebar */}
        <div className="space-y-4">

          {/* Repair Status Summary */}
          {(stats?.overview.totalRepairs ?? 0) > 0 && (
            <Card data-testid="card-repair-summary">
              <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                <CardTitle className="text-sm font-medium">{t("customerPages.statoRiparazioni")}</CardTitle>
                <Link href="/customer/repairs">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" data-testid="button-view-all-repairs">
                    {t("common.viewAll")} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: t("b2b.status.pending"), value: stats?.repairsByStatus.pending ?? 0, dot: "bg-amber-500" },
                    { label: t("customerPages.inCorso"), value: stats?.repairsByStatus.in_progress ?? 0, dot: "bg-blue-500" },
                    { label: t("customerPages.completate"), value: stats?.repairsByStatus.completed ?? 0, dot: "bg-emerald-500" },
                    { label: t("invoices.annullate"), value: stats?.repairsByStatus.cancelled ?? 0, dot: "bg-muted-foreground" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <div className={`h-2 w-2 rounded-full ${item.dot} shrink-0`} />
                      <div>
                        <p className="text-base font-bold leading-none">{item.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <Card data-testid="card-navigation">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t("sidebar.sections.services")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-0.5">
                {navLinks.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors" data-testid={`link-nav-${item.href.split("/").pop()}`}>
                      <div className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${item.color}`}>
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm flex-1 min-w-0 truncate">{item.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Reseller */}
          {stats?.assignedReseller && (
            <Card data-testid="card-reseller-info">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  {stats.assignedReseller.logoUrl ? (
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={stats.assignedReseller.logoUrl} alt={t("customerPages.logoRivenditore")} />
                      <AvatarFallback><Store className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("roles.reseller")}</p>
                    <p className="font-semibold text-sm truncate" data-testid="text-assigned-reseller">
                      {stats.assignedReseller.businessName || stats.assignedReseller.name}
                    </p>
                    {stats.assignedReseller.phone && (
                      <a href={`tel:${stats.assignedReseller.phone}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5" data-testid="link-reseller-phone">
                        <Phone className="h-3 w-3" />{stats.assignedReseller.phone}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assigned Center */}
          {stats?.assignedCenter && (
            <Card data-testid="card-center-info">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{t("sidebar.sections.repairCenter")}</p>
                    <p className="font-semibold text-sm truncate" data-testid="text-assigned-center">
                      {stats.assignedCenter.name}
                    </p>
                    {stats.assignedCenter.phone && (
                      <a href={`tel:${stats.assignedCenter.phone}`} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-0.5" data-testid="link-center-phone">
                        <Phone className="h-3 w-3" />{stats.assignedCenter.phone}
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
              <CardHeader className="flex flex-row items-center justify-between gap-1 pb-2">
                <CardTitle className="text-sm font-medium">{t("common.ticket")}</CardTitle>
                <Link href="/customer/tickets">
                  <Button variant="ghost" size="sm" className="h-7" data-testid="button-view-tickets">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1.5">
                  {[
                    { label: t("customerPages.aperti"), value: stats?.ticketsByStatus.open ?? 0, dot: "bg-amber-500" },
                    { label: t("customerPages.inCorso"), value: stats?.ticketsByStatus.in_progress ?? 0, dot: "bg-blue-500" },
                    { label: t("customerPages.resolved"), value: stats?.ticketsByStatus.resolved ?? 0, dot: "bg-emerald-500" },
                  ].filter(i => i.value > 0).map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${item.dot}`} />
                        <span className="text-muted-foreground text-xs">{item.label}</span>
                      </div>
                      <span className="font-medium text-xs">{item.value}</span>
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
