import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Calendar,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Thermometer,
  Briefcase,
  Building2,
  Wrench,
  Filter
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";

interface CalendarEvent {
  userId: string;
  userName: string;
  type: string;
  startDate: string;
  endDate: string;
}

interface CalendarEntity {
  type: "reseller" | "repair_center";
  id: string;
  name: string;
  parentId: string | null;
}

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  vacation: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  permit: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  sick: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  rol: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
};

export default function HrCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEntity, setSelectedEntity] = useState<string>("all");
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const { data: entities = [] } = useQuery<CalendarEntity[]>({
    queryKey: ["/api/reseller/hr/calendar/entities"],
    queryFn: async () => {
      const res = await fetch("/api/reseller/hr/calendar/entities", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getFilterParams = () => {
    if (selectedEntity === "all") return "";
    const [type, id] = selectedEntity.split(":");
    return `&entityType=${encodeURIComponent(type)}&entityId=${encodeURIComponent(id)}`;
  };

  const { data: calendarData = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/reseller/hr/calendar", monthStart.toISOString(), monthEnd.toISOString(), selectedEntity],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/hr/calendar?startDate=${encodeURIComponent(monthStart.toISOString())}&endDate=${encodeURIComponent(monthEnd.toISOString())}${getFilterParams()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Errore nel caricamento del calendario");
      return res.json();
    },
  });

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return calendarData.filter(event => {
      const start = format(new Date(event.startDate), "yyyy-MM-dd");
      const end = format(new Date(event.endDate), "yyyy-MM-dd");
      return dateStr >= start && dateStr <= end;
    });
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const dayLabels = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

  return (
    <div className="space-y-6" data-testid="page-hr-calendar">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/5 via-cyan-500/10 to-slate-100 dark:from-cyan-500/10 dark:via-cyan-500/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-calendar-title">Calendario Team</h1>
                <p className="text-muted-foreground">Visualizzazione assenze e ferie del team</p>
              </div>
            </div>
          </div>
          <Link href="/reseller/hr">
            <Button variant="outline" data-testid="button-back-to-hr">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna a HR
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <Badge variant="secondary" className="gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            Ferie
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Permessi
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Malattia
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            ROL
          </Badge>
        </div>

        {entities.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedEntity} onValueChange={setSelectedEntity} data-testid="select-entity-filter">
              <SelectTrigger className="w-[250px]" data-testid="trigger-entity-filter">
                <SelectValue placeholder="Filtra per entità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="option-all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Tutti (gerarchia completa)
                  </div>
                </SelectItem>
                {entities.filter(e => e.type === "reseller").length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sub-Reseller</div>
                    {entities.filter(e => e.type === "reseller").map(entity => (
                      <SelectItem key={entity.id} value={`reseller:${entity.id}`} data-testid={`option-reseller-${entity.id}`}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-500" />
                          {entity.name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {entities.filter(e => e.type === "repair_center").length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Centri Riparazione</div>
                    {entities.filter(e => e.type === "repair_center").map(entity => (
                      <SelectItem key={entity.id} value={`repair_center:${entity.id}`} data-testid={`option-repair-center-${entity.id}`}>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-orange-500" />
                          {entity.name}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Card data-testid="card-calendar">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday} data-testid="button-today">
                Oggi
              </Button>
            </div>
            <CardTitle className="text-xl" data-testid="text-current-month">
              {format(currentDate, "MMMM yyyy", { locale: it })}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-muted/50">
                {dayLabels.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium border-b">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-24 p-1 border-b border-r bg-muted/20" />
                ))}
                {daysInMonth.map((day) => {
                  const events = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-24 p-1 border-b border-r ${
                        !isCurrentMonth ? "bg-muted/30" : ""
                      } ${isTodayDate ? "bg-primary/5" : ""}`}
                      data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <div className={`text-sm mb-1 p-1 ${
                        isTodayDate 
                          ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center" 
                          : "text-muted-foreground"
                      }`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {events.slice(0, 3).map((event, idx) => {
                          const colors = eventTypeColors[event.type] || eventTypeColors.vacation;
                          return (
                            <div
                              key={idx}
                              className={`text-xs px-1 py-0.5 rounded truncate ${colors.bg} ${colors.text}`}
                              title={`${event.userName} - ${event.type}`}
                            >
                              {event.userName.split(' ')[0]}
                            </div>
                          );
                        })}
                        {events.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{events.length - 3} altri
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-upcoming-vacations">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              Ferie Prossime
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarData.filter(e => e.type === 'vacation').slice(0, 3).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna ferie programmata</p>
            ) : (
              <div className="space-y-2">
                {calendarData.filter(e => e.type === 'vacation').slice(0, 3).map((event, idx) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span>{event.userName}</span>
                    <span className="text-muted-foreground">{format(new Date(event.startDate), "dd/MM")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-active-sick">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-red-600" />
              Malattie in Corso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {calendarData.filter(e => e.type === 'sick').length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna malattia in corso</p>
            ) : (
              <div className="space-y-2">
                {calendarData.filter(e => e.type === 'sick').slice(0, 3).map((event, idx) => (
                  <div key={idx} className="text-sm flex justify-between">
                    <span>{event.userName}</span>
                    <Badge variant="destructive" className="text-xs">In malattia</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-team-availability">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Disponibilità Oggi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const todayEvents = getEventsForDay(new Date());
              const absentCount = todayEvents.length;
              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Assenti oggi</span>
                    <Badge variant={absentCount > 0 ? "secondary" : "outline"}>{absentCount}</Badge>
                  </div>
                  {todayEvents.slice(0, 2).map((event, idx) => (
                    <div key={idx} className="text-xs text-muted-foreground">
                      {event.userName} ({event.type})
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
