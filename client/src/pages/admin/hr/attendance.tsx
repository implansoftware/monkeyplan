import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, RefreshCw, MapPin, ArrowRight, ArrowLeft, Pencil } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { AdminEntityFilterSelector, AdminEntityType } from "@/components/hr/admin-entity-filter-selector";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
  eventType: string;
  eventTime: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  status: string;
  notes?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
  } | null;
}

const typeColors: Record<string, string> = {
  entry: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  exit: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  break_start: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  break_end: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const typeLabels: Record<string, string> = {
  entry: "Entrata",
  exit: "Uscita",
  break_start: "Inizio Pausa",
  break_end: "Fine Pausa",
};

const typeIcons: Record<string, JSX.Element> = {
  entry: <ArrowRight className="h-3 w-3" />,
  exit: <ArrowLeft className="h-3 w-3" />,
  break_start: <Clock className="h-3 w-3" />,
  break_end: <Clock className="h-3 w-3" />,
};

export default function AdminAttendancePage() {
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClockEvent | null>(null);
  const [editForm, setEditForm] = useState({
    eventType: "",
    eventTime: "",
    notes: ""
  });
  const { toast } = useToast();

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

  const editMutation = useMutation({
    mutationFn: async (data: { id: string; eventType: string; eventTime: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/hr/clock-events/${data.id}`, {
        eventType: data.eventType,
        eventTime: data.eventTime,
        notes: data.notes || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hr/clock-events", queryString] });
      setEditDialogOpen(false);
      setEditingEvent(null);
      toast({ title: "Timbratura aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  });

  const openEditDialog = (event: ClockEvent) => {
    setEditingEvent(event);
    const eventDate = new Date(event.eventTime);
    const timeString = format(eventDate, "HH:mm");
    setEditForm({
      eventType: event.eventType,
      eventTime: timeString,
      notes: event.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingEvent) return;
    const originalDate = new Date(editingEvent.eventTime);
    const [hours, minutes] = editForm.eventTime.split(":").map(Number);
    originalDate.setHours(hours, minutes, 0, 0);
    
    editMutation.mutate({
      id: editingEvent.id,
      eventType: editForm.eventType,
      eventTime: originalDate.toISOString(),
      notes: editForm.notes
    });
  };

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
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.id} data-testid={`row-clock-event-${evt.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{evt.user?.fullName || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeColors[evt.eventType] || "bg-gray-100 text-gray-800"}>
                        <span className="flex items-center gap-1">
                          {typeIcons[evt.eventType]}
                          {typeLabels[evt.eventType] || evt.eventType}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">
                          {format(new Date(evt.eventTime), "dd/MM/yyyy", { locale: it })}
                        </p>
                        <p className="text-muted-foreground">
                          {format(new Date(evt.eventTime), "HH:mm:ss", { locale: it })}
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
                      <Badge variant="outline">
                        {evt.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(evt)}
                        data-testid={`button-edit-clock-event-${evt.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Timbratura</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della timbratura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo Evento</Label>
              <Select
                value={editForm.eventType}
                onValueChange={(value) => setEditForm({ ...editForm, eventType: value })}
              >
                <SelectTrigger data-testid="select-edit-event-type">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrata</SelectItem>
                  <SelectItem value="exit">Uscita</SelectItem>
                  <SelectItem value="break_start">Inizio Pausa</SelectItem>
                  <SelectItem value="break_end">Fine Pausa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Orario</Label>
              <Input
                type="time"
                value={editForm.eventTime}
                onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })}
                data-testid="input-edit-event-time"
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending} data-testid="button-save-edit">
              {editMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
