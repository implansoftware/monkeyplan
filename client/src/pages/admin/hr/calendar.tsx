import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, User, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { AdminEntityFilterSelector, AdminEntityType } from "@/components/hr/admin-entity-filter-selector";

interface CalendarEvent {
  userId: string;
  userName: string;
  type: string;
  startDate: string;
  endDate: string;
}

const eventTypeColors: Record<string, string> = {
  vacation: "bg-blue-500",
  permit: "bg-purple-500",
  rol: "bg-indigo-500",
  sick: "bg-red-500",
  other: "bg-gray-500",
};

const eventTypeLabels: Record<string, string> = {
  vacation: "Ferie",
  permit: "Permesso",
  rol: "ROL",
  sick: "Malattia",
  other: "Altro",
};

export default function AdminCalendarPage() {
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const queryParams = new URLSearchParams();
  if (entityType !== "all" && selectedEntityId) {
    queryParams.set("entityType", entityType);
    queryParams.set("entityId", selectedEntityId);
  }
  queryParams.set("startDate", monthStart.toISOString());
  queryParams.set("endDate", monthEnd.toISOString());
  const queryString = queryParams.toString();

  const { data: events = [], isLoading, refetch } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/admin/hr/calendar", queryString],
    queryFn: async () => {
      const url = `/api/admin/hr/calendar?${queryString}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter(evt => {
      const start = new Date(evt.startDate);
      const end = evt.endDate ? new Date(evt.endDate) : start;
      return day >= start && day <= end;
    });
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Calendario (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizzazione globale di tutti gli eventi
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <AdminEntityFilterSelector
            entityType={entityType}
            setEntityType={setEntityType}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
          
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
              Mese Precedente
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, "MMMM yyyy", { locale: it })}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
              Mese Successivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map(day => (
                <div key={day} className="text-center font-medium text-sm py-2 text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {daysInMonth.map(day => {
                const dayEvents = getEventsForDay(day);
                const dayOfWeek = day.getDay();
                const isFirstDay = day.getDate() === 1;
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] border rounded-md p-1
                      ${isToday(day) ? "bg-primary/10 border-primary" : ""}
                      ${isFirstDay ? `col-start-${dayOfWeek === 0 ? 7 : dayOfWeek}` : ""}
                    `}
                    style={isFirstDay ? { gridColumnStart: dayOfWeek === 0 ? 7 : dayOfWeek } : undefined}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday(day) ? "text-primary" : ""}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((evt, idx) => (
                        <div
                          key={`${evt.userId}-${evt.type}-${evt.startDate}-${idx}`}
                          className={`text-xs p-1 rounded truncate text-white ${eventTypeColors[evt.type] || eventTypeColors.other}`}
                          title={`${eventTypeLabels[evt.type] || evt.type} - ${evt.userName}`}
                        >
                          {evt.userName}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 3} altri
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legenda Eventi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {Object.entries(eventTypeLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${eventTypeColors[key]}`} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
