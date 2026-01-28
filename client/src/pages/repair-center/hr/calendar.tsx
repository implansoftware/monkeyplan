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
  userId: string;
  userName: string;
  type: string;
  startDate: string;
  endDate: string;
}

const eventTypeConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  vacation: { label: "Ferie", icon: CalendarDays, color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  permit: { label: "Permesso", icon: CalendarDays, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  rol: { label: "ROL", icon: CalendarDays, color: "text-cyan-600", bgColor: "bg-cyan-100 dark:bg-cyan-900/30" },
  sick: { label: "Malattia", icon: Thermometer, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" },
  expense: { label: "Trasferta", icon: Receipt, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
};

export default function RepairCenterHrCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/repair-center/hr/calendar", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
    queryFn: async () => {
      const response = await fetch(`/api/repair-center/hr/calendar?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to fetch calendar data");
      return response.json();
    }
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Calendario</h1>
              <p className="text-emerald-100">Visualizzazione assenze e presenze</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg">
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
                <div key={key} className="flex flex-wrap items-center gap-1">
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
                        {dayEvents.slice(0, 3).map((event, idx) => {
                          const config = eventTypeConfig[event.type] || eventTypeConfig.vacation;
                          return (
                            <div
                              key={`${event.userId}-${event.type}-${idx}`}
                              className={`text-xs px-1 py-0.5 rounded truncate ${config.bgColor} ${config.color}`}
                              title={`${event.userName}: ${config.label}`}
                            >
                              {event.userName?.split(" ")[0] || ""}
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
