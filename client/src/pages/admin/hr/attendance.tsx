import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, RefreshCw, MapPin, ArrowRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { AdminEntityFilterSelector, AdminEntityType } from "@/components/hr/admin-entity-filter-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClockEvent {
  id: string;
  userId: string;
  type: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

const typeColors: Record<string, string> = {
  clock_in: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  clock_out: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  break_start: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  break_end: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const statusLabels: Record<string, string> = {
  clock_in: "Entrata",
  clock_out: "Uscita",
  break_start: "Inizio Pausa",
  break_end: "Fine Pausa",
};

const typeIcons: Record<string, JSX.Element> = {
  clock_in: <ArrowRight className="h-3 w-3" />,
  clock_out: <ArrowLeft className="h-3 w-3" />,
  break_start: <Clock className="h-3 w-3" />,
  break_end: <Clock className="h-3 w-3" />,
};

export default function AdminAttendancePage() {
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");

  const queryParams = new URLSearchParams();
  if (entityType !== "all" && selectedEntityId) {
    queryParams.set("entityType", entityType);
    queryParams.set("entityId", selectedEntityId);
  }
  const queryString = queryParams.toString();

  const { data: events = [], isLoading, refetch } = useQuery<ClockEvent[]>({
    queryKey: ["/api/admin/hr/clock-events", queryString],
    queryFn: async () => {
      const url = queryString 
        ? `/api/admin/hr/clock-events?${queryString}` 
        : "/api/admin/hr/clock-events";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Presenze (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizzazione globale di tutte le timbrature
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
      </div>

      <Card>
        <CardHeader>
          <AdminEntityFilterSelector
            entityType={entityType}
            setEntityType={setEntityType}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna timbratura registrata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data/Ora</TableHead>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.id} data-testid={`row-clock-event-${evt.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{evt.user?.fullName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{evt.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[evt.type]}>
                        <span className="flex items-center gap-1">
                          {typeIcons[evt.type]}
                          {statusLabels[evt.type] || evt.type}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {format(new Date(evt.timestamp), "dd/MM/yyyy", { locale: it })}
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(evt.timestamp), "HH:mm:ss", { locale: it })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {evt.latitude && evt.longitude ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href={`https://maps.google.com/?q=${evt.latitude},${evt.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Mappa
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {evt.notes || "-"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
