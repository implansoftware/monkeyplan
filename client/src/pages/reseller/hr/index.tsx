import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users,
  Clock,
  CalendarDays,
  FileText,
  AlertCircle,
  TrendingUp,
  UserCheck,
  ClipboardList,
  Briefcase,
  Receipt,
  Bell,
  ChevronRight,
  Activity,
  Calendar,
  Thermometer,
  FileSpreadsheet
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HrDashboardStats {
  pendingLeaveRequests: number;
  pendingExpenses: number;
  todayClockEvents: number;
  pendingAbsences: number;
}

export default function HrDashboard() {
  const { data: stats, isLoading } = useQuery<HrDashboardStats>({
    queryKey: ["/api/reseller/hr/dashboard"],
  });

  const quickActions = [
    {
      title: "Presenze",
      description: "Gestione timbrature e orari",
      icon: Clock,
      href: "/reseller/hr/attendance",
      color: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Ferie e Permessi",
      description: "Richieste ferie, permessi, ROL",
      icon: CalendarDays,
      href: "/reseller/hr/leave-requests",
      color: "from-emerald-500/10 to-emerald-600/5",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Malattie",
      description: "Certificati e assenze malattia",
      icon: Thermometer,
      href: "/reseller/hr/sick-leave",
      color: "from-red-500/10 to-red-600/5",
      iconColor: "text-red-600 dark:text-red-400"
    },
    {
      title: "Rimborsi Spese",
      description: "Note spese e trasferte",
      icon: Receipt,
      href: "/reseller/hr/expenses",
      color: "from-amber-500/10 to-amber-600/5",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Profili Orario",
      description: "Configurazione orari lavoro",
      icon: Briefcase,
      href: "/reseller/hr/work-profiles",
      color: "from-purple-500/10 to-purple-600/5",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Calendario Team",
      description: "Visualizzazione assenze team",
      icon: Calendar,
      href: "/reseller/hr/calendar",
      color: "from-cyan-500/10 to-cyan-600/5",
      iconColor: "text-cyan-600 dark:text-cyan-400"
    },
    {
      title: "Comunicazioni",
      description: "Notifiche e messaggi HR",
      icon: Bell,
      href: "/reseller/hr/notifications",
      color: "from-indigo-500/10 to-indigo-600/5",
      iconColor: "text-indigo-600 dark:text-indigo-400"
    },
    {
      title: "Registro Audit",
      description: "Storico modifiche HR",
      icon: FileSpreadsheet,
      href: "/reseller/hr/audit-logs",
      color: "from-slate-500/10 to-slate-600/5",
      iconColor: "text-slate-600 dark:text-slate-400"
    }
  ];

  return (
    <div className="space-y-6" data-testid="page-hr-dashboard">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-hr-title">Gestione Risorse Umane</h1>
                <p className="text-muted-foreground">Presenze, ferie, permessi e amministrazione personale</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/team">
              <Button variant="outline" data-testid="button-back-to-team">
                <Users className="h-4 w-4 mr-2" />
                Torna al Team
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden" data-testid="card-pending-leave">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Ferie in Attesa</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-pending-leave-count">{stats?.pendingLeaveRequests || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-pending-expenses">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Rimborsi in Attesa</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-pending-expenses-count">{stats?.pendingExpenses || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-today-clocking">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Timbrature Oggi</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-today-clocking-count">{stats?.todayClockEvents || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-pending-absences">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Assenze da Gestire</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-pending-absences-count">{stats?.pendingAbsences || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Moduli HR</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card 
                className="h-full hover-elevate cursor-pointer transition-all border"
                data-testid={`card-hr-module-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-lg`} />
                <CardContent className="relative p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-background/80 flex items-center justify-center ${action.iconColor}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{action.title}</h3>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Attivit Recenti
            </CardTitle>
            <CardDescription>Ultime azioni nel modulo HR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessuna attivit recente</p>
              <p className="text-sm">Le attivit HR appariranno qui</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-quick-stats">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Riepilogo Mensile
            </CardTitle>
            <CardDescription>Statistiche del mese corrente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Presenze registrate</span>
                </div>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Giorni ferie richiesti</span>
                </div>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-600" />
                  <span className="text-sm">Totale rimborsi</span>
                </div>
                <Badge variant="secondary">-</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
