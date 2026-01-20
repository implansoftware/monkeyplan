import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, RefreshCw, MapPin, ArrowRight, ArrowLeft, Pencil, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventType: "entry",
    userId: "",
    eventTime: format(new Date(), "HH:mm"),
    notes: ""
  });
  const { toast } = useToast();

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const startOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const endOfDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59);

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };
  
  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const queryParams = new URLSearchParams();
  queryParams.set("startDate", startOfDay.toISOString());
  queryParams.set("endDate", endOfDay.toISOString());
  if (entityType !== "all" && selectedEntityId) {
    queryParams.set("entityType", entityType);
    queryParams.set("entityId", selectedEntityId);
  }
  const queryString = queryParams.toString();

  const { data: events = [], isLoading, refetch } = useQuery<ClockEvent[]>({
    queryKey: ["/api/admin/hr/clock-events", queryString, selectedDate.toDateString()],
    queryFn: async () => {
      const url = `/api/admin/hr/clock-events?${queryString}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  interface EntityUser {
    id: string;
    fullName: string;
    role: string;
  }

  const { data: entityUsers = [] } = useQuery<EntityUser[]>({
    queryKey: ["/api/admin/hr/users", entityType, selectedEntityId],
    queryFn: async () => {
      if (entityType === "all" || !selectedEntityId) return [];
      const res = await fetch(`/api/admin/hr/users?entityType=${entityType}&entityId=${selectedEntityId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: entityType !== "all" && !!selectedEntityId
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

  const createMutation = useMutation({
    mutationFn: async (data: { userId: string; eventType: string; eventTime: string; notes: string }) => {
      const now = new Date();
      const [hours, minutes] = data.eventTime.split(":").map(Number);
      now.setHours(hours, minutes, 0, 0);
      
      return apiRequest("POST", "/api/admin/hr/clock-events", {
        userId: data.userId,
        eventType: data.eventType,
        eventTime: now.toISOString(),
        notes: data.notes || null,
        entityType,
        entityId: selectedEntityId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hr/clock-events"] });
      setCreateDialogOpen(false);
      setNewEvent({ eventType: "entry", userId: "", eventTime: format(new Date(), "HH:mm"), notes: "" });
      toast({ title: "Timbratura creata", description: "La timbratura è stata salvata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
        <div className="flex items-center gap-2">
          {entityType !== "all" && selectedEntityId && (
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-clock-event">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Timbratura
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <AdminEntityFilterSelector
            entityType={entityType}
            setEntityType={setEntityType}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
          <div className="flex items-center gap-2 pt-2 border-t">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">{isToday ? "Oggi" : "Data selezionata"}:</span>
            <Button size="icon" variant="ghost" onClick={goToPreviousDay} data-testid="button-prev-day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal" data-testid="button-date-picker">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setDatePickerOpen(false);
                    }
                  }}
                  initialFocus
                  locale={it}
                />
              </PopoverContent>
            </Popover>
            <Button size="icon" variant="ghost" onClick={goToNextDay} data-testid="button-next-day">
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isToday && (
              <Button variant="secondary" size="sm" onClick={goToToday} data-testid="button-go-today">
                Oggi
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{isToday ? "Nessuna timbratura registrata oggi" : `Nessuna timbratura per il ${format(selectedDate, "d MMMM yyyy", { locale: it })}`}</p>
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Timbratura</DialogTitle>
            <DialogDescription>
              Crea una timbratura per un dipendente dell'entità selezionata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dipendente</Label>
              <Select value={newEvent.userId} onValueChange={(v) => setNewEvent({ ...newEvent, userId: v })}>
                <SelectTrigger data-testid="select-create-user">
                  <SelectValue placeholder="Seleziona dipendente..." />
                </SelectTrigger>
                <SelectContent>
                  {entityUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.fullName} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo Evento</Label>
              <Select value={newEvent.eventType} onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v })}>
                <SelectTrigger data-testid="select-create-event-type">
                  <SelectValue />
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
                value={newEvent.eventTime}
                onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
                data-testid="input-create-event-time"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                data-testid="textarea-create-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => createMutation.mutate(newEvent)} 
              disabled={!newEvent.userId || createMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createMutation.isPending ? "Salvataggio..." : "Crea Timbratura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
