import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Users,
  Clock,
  CalendarDays,
  Receipt,
  Briefcase,
  Calendar,
  Thermometer,
  ArrowLeft
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HrDashboardStats {
  pendingLeaveRequests: number;
  pendingExpenses: number;
  todayClockEvents: number;
  pendingSickLeaves: number;
}

export default function RepairCenterHrDashboard() {
  const { data: stats, isLoading } = useQuery<HrDashboardStats>({
    queryKey: ["/api/repair-center/hr/dashboard"],
  });

  const quickActions = [
    {
      title: "Presenze",
      description: "Gestione timbrature e orari",
      icon: Clock,
      href: "/repair-center/hr/attendance",
      color: "from-blue-500/10 to-blue-600/5",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Ferie e Permessi",
      description: "Richieste ferie, permessi, ROL",
      icon: CalendarDays,
      href: "/repair-center/hr/leave-requests",
      color: "from-emerald-500/10 to-emerald-600/5",
      iconColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Malattie",
      description: "Certificati e assenze malattia",
      icon: Thermometer,
      href: "/repair-center/hr/sick-leave",
      color: "from-red-500/10 to-red-600/5",
      iconColor: "text-red-600 dark:text-red-400"
    },
    {
      title: "Rimborsi Spese",
      description: "Note spese e trasferte",
      icon: Receipt,
      href: "/repair-center/hr/expenses",
      color: "from-amber-500/10 to-amber-600/5",
      iconColor: "text-amber-600 dark:text-amber-400"
    },
    {
      title: "Profili Orario",
      description: "Configurazione orari lavoro",
      icon: Briefcase,
      href: "/repair-center/hr/work-profiles",
      color: "from-purple-500/10 to-purple-600/5",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Calendario Team",
      description: "Visualizzazione assenze team",
      icon: Calendar,
      href: "/repair-center/hr/calendar",
      color: "from-cyan-500/10 to-cyan-600/5",
      iconColor: "text-cyan-600 dark:text-cyan-400"
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-rc-hr-dashboard">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Users className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-hr-title">Risorse Umane</h1>
              <p className="text-emerald-100">Presenze, ferie, permessi e amministrazione personale</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/repair-center">
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" data-testid="button-back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna alla Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden" data-testid="card-pending-leave">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Ferie in Attesa</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold" data-testid="text-pending-leave-count">{stats?.pendingLeaveRequests || 0}</p>
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
                  <p className="text-2xl sm:text-3xl font-bold" data-testid="text-pending-expenses-count">{stats?.pendingExpenses || 0}</p>
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
                  <p className="text-2xl sm:text-3xl font-bold" data-testid="text-today-clocking-count">{stats?.todayClockEvents || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-pending-sick">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Malattie Attive</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl sm:text-3xl font-bold" data-testid="text-pending-sick-count">{stats?.pendingSickLeaves || 0}</p>
                )}
              </div>
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Thermometer className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 h-full" data-testid={`card-action-${action.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
