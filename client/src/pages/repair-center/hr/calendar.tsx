import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Calendar, ArrowLeft, ChevronLeft, ChevronRight, CalendarDays, Thermometer, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { it } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  userId: string;
  eventType: 'leave' | 'sick' | 'expense' | 'clock';
  title: string;
  startDate: string;
  endDate?: string;
  status: string;
  user?: { fullName: string };
}

const eventTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  leave: { label: "Ferie", icon: CalendarDays, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  sick: { label: "Malattia", icon: Thermometer, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  expense: { label: "Trasferta", icon: Receipt, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  clock: { label: "Presenza", icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" }
};

export default function RepairCenterHrCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/repair-center/hr/calendar", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      return day >= eventStart && day <= eventEnd;
    });
  };

  const firstDayOfWeek = (startDate.getDay() + 6) % 7;

  return (
    <div className="space-y-6" data-testid="page-rc-hr-calendar">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/5 via-cyan-500/10 to-slate-100 dark:from-cyan-500/10 dark:via-cyan-500/5 dark:to-slate-900 p-6 border">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Calendario Team</h1>
                <p className="text-muted-foreground">Visualizzazione assenze e presenze</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard HR
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>{format(currentMonth, "MMMM yyyy", { locale: it })}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
              Oggi
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4 flex-wrap">
            {Object.entries(eventTypeConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center gap-1">
                  <div className={`h-3 w-3 rounded ${config.bgColor}`} />
                  <span className="text-sm text-muted-foreground">{config.label}</span>
                </div>
              );
            })}
          </div>

          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-muted/50">
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium border-b">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] border-b border-r bg-muted/20" />
                ))}
                {days.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[100px] border-b border-r p-1 ${isToday ? "bg-primary/5" : ""}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => {
                          const config = eventTypeConfig[event.eventType] || eventTypeConfig.clock;
                          return (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${config.bgColor} ${config.color}`}
                              title={`${event.user?.fullName}: ${event.title}`}
                            >
                              {event.user?.fullName?.split(" ")[0] || ""}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 3} altri
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
    </div>
  );
}
