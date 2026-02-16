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
import { useTranslation } from "react-i18next";

interface HrDashboardStats {
  pendingLeaveRequests: number;
  pendingExpenses: number;
  todayClockEvents: number;
  pendingAbsences: number;
}

export default function HrDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading } = useQuery<HrDashboardStats>({
    queryKey: ["/api/reseller/hr/dashboard"],
  });

  const quickActions = [
    {
      title: t("hr.attendance"),
      description: "Gestione timbrature e orari",
      icon: Clock,
      href: "/reseller/hr/attendance",
      color: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: t("sidebar.items.leaveRequests"),
      description: "Richieste ferie, permessi, ROL",
      icon: CalendarDays,
      href: "/reseller/hr/leave-requests",
      color: "from-emerald-500/10 to-emerald-600/5",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: t("sidebar.items.sickLeave"),
      description: "Certificati e assenze malattia",
      icon: Thermometer,
      href: "/reseller/hr/sick-leave",
      color: "from-red-500/10 to-red-600/5",
      iconColor: "text-red-600 dark:text-red-400"
    },
    {
      title: t("sidebar.items.expenseReimbursement"),
      description: "Note spese e trasferte",
      icon: Receipt,
      href: "/reseller/hr/expenses",
      color: "from-amber-500/10 to-amber-600/5",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: t("sidebar.items.workProfiles"),
      description: "Configurazione orari lavoro",
      icon: Briefcase,
      href: "/reseller/hr/work-profiles",
      color: "from-purple-500/10 to-purple-600/5",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: t("sidebar.items.teamCalendar"),
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-hr-title">Gestione Risorse Umane</h1>
                <p className="text-white/80">Presenze, ferie, permessi e amministrazione personale</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/team">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white backdrop-blur-sm" data-testid="button-back-to-team">
                <Users className="h-4 w-4 mr-2" />
                Torna al Team
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden rounded-2xl hover-elevate" data-testid="card-pending-leave">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40" />
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
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl hover-elevate" data-testid="card-pending-expenses">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40" />
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
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl hover-elevate" data-testid="card-today-clocking">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40" />
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
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl hover-elevate" data-testid="card-pending-absences">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/40" />
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
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                <AlertCircle className="h-6 w-6 text-white" />
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
                className="h-full hover-elevate cursor-pointer transition-all border rounded-2xl"
                data-testid={`card-hr-module-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-2xl`} />
                <CardContent className="relative p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-background/80 flex items-center justify-center ${action.iconColor}`}>
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
        <Card className="rounded-2xl" data-testid="card-recent-activity">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-t-2xl">
            <CardTitle className="flex flex-wrap items-center gap-2">
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

        <Card className="rounded-2xl" data-testid="card-quick-stats">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-t-2xl">
            <CardTitle className="flex flex-wrap items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Riepilogo Mensile
            </CardTitle>
            <CardDescription>Statistiche del mese corrente</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Presenze registrate</span>
                </div>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Giorni ferie richiesti</span>
                </div>
                <Badge variant="secondary">-</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl">
                <div className="flex flex-wrap items-center gap-2">
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
