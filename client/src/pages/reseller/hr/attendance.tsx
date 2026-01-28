import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import {
  Clock,
  Plus,
  Search,
  MapPin,
  ArrowLeft,
  LogIn,
  LogOut,
  Coffee,
  Utensils,
  Filter,
  Calendar as CalendarIcon,
  User,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { EntityFilterSelector, EntityType, useEntityFilter } from "@/components/hr/entity-filter-selector";

interface ClockEvent {
  id: string;
  userId: string;
  eventType: 'entrata' | 'uscita' | 'pausa_inizio' | 'pausa_fine';
  eventTime: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  user?: {
    fullName: string;
  };
}

interface StaffMember {
  id: string;
  fullName: string;
}

const eventTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  entrata: { label: "Entrata", icon: LogIn, color: "bg-emerald-500" },
  uscita: { label: "Uscita", icon: LogOut, color: "bg-red-500" },
  pausa_inizio: { label: "Inizio Pausa", icon: Coffee, color: "bg-amber-500" },
  pausa_fine: { label: "Fine Pausa", icon: Utensils, color: "bg-blue-500" },
};

export default function HrAttendance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entityType, setEntityType] = useState<EntityType>("own");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const { buildQueryParams, isReadOnly } = useEntityFilter();
  const [newEvent, setNewEvent] = useState({ eventType: "entrata", userId: "", notes: "" });
  const [editingEvent, setEditingEvent] = useState<ClockEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ eventType: "", eventTime: "", notes: "" });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { toast } = useToast();

  const readOnly = isReadOnly(entityType, selectedEntityId);

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

  const baseParams = `startDate=${encodeURIComponent(startOfDay.toISOString())}&endDate=${encodeURIComponent(endOfDay.toISOString())}`;
  const entityParams = entityType !== "own" && selectedEntityId ? `&entityType=${entityType}&entityId=${selectedEntityId}` : "";
  const clockEventsUrl = `/api/reseller/hr/clock-events?${baseParams}${entityParams}`;
  
  const { data: clockEvents = [], isLoading } = useQuery<ClockEvent[]>({
    queryKey: ["/api/reseller/hr/clock-events", entityType, selectedEntityId, selectedDate.toDateString()],
    queryFn: async () => {
      const res = await fetch(clockEventsUrl);
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/reseller/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { eventType: string; userId?: string; notes?: string; latitude?: number; longitude?: number }) => {
      return apiRequest("POST", "/api/reseller/hr/clock-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/clock-events"] });
      setDialogOpen(false);
      setNewEvent({ eventType: "entrata", userId: "", notes: "" });
      toast({ title: "Timbratura registrata", description: "La timbratura è stata salvata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { eventType?: string; eventTime?: string; notes?: string } }) => {
      return apiRequest("PATCH", `/api/reseller/hr/clock-events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/clock-events"] });
      setEditDialogOpen(false);
      setEditingEvent(null);
      toast({ title: "Timbratura aggiornata", description: "La modifica è stata salvata." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const openEditDialog = (event: ClockEvent) => {
    setEditingEvent(event);
    setEditForm({
      eventType: event.eventType,
      eventTime: format(new Date(event.eventTime), "HH:mm"),
      notes: event.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingEvent) return;
    const eventDate = new Date(editingEvent.eventTime);
    const [hours, minutes] = editForm.eventTime.split(':').map(Number);
    eventDate.setHours(hours, minutes, 0, 0);
    
    editMutation.mutate({
      id: editingEvent.id,
      data: {
        eventType: editForm.eventType,
        eventTime: eventDate.toISOString(),
        notes: editForm.notes || undefined
      }
    });
  };

  const filteredEvents = clockEvents.filter(event => {
    if (selectedUser !== "all" && event.userId !== selectedUser) return false;
    return true;
  });

  const handleClockNow = async (eventType: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          createMutation.mutate({
            eventType,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          createMutation.mutate({ eventType });
        }
      );
    } else {
      createMutation.mutate({ eventType });
    }
  };

  return (
    <div className="space-y-6" data-testid="page-hr-attendance">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-attendance-title">Gestione Presenze</h1>
                <p className="text-white/80">Timbrature e registrazione orari</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/hr">
              <Button variant="secondary" data-testid="button-back-to-hr">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna a HR
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <EntityFilterSelector
            entityType={entityType}
            setEntityType={setEntityType}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
        </div>
        {readOnly && (
          <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
            <Eye className="h-4 w-4" />
            <span>Modalità sola lettura - Visualizzazione dati esterni</span>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover-elevate transition-all rounded-2xl"
            onClick={() => handleClockNow('entrata')}
            data-testid="card-clock-in"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <LogIn className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">Timbra Entrata</p>
                <p className="text-xs text-muted-foreground">Registra ingresso</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate transition-all rounded-2xl"
            onClick={() => handleClockNow('uscita')}
            data-testid="card-clock-out"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-medium">Timbra Uscita</p>
                <p className="text-xs text-muted-foreground">Registra uscita</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate transition-all rounded-2xl"
            onClick={() => handleClockNow('pausa_inizio')}
            data-testid="card-break-start"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Coffee className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Inizio Pausa</p>
                <p className="text-xs text-muted-foreground">Inizia pausa</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover-elevate transition-all rounded-2xl"
            onClick={() => handleClockNow('pausa_fine')}
            data-testid="card-break-end"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Fine Pausa</p>
                <p className="text-xs text-muted-foreground">Termina pausa</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-2xl" data-testid="card-clock-events-list">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                {isToday ? "Timbrature di Oggi" : "Timbrature del Giorno"}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1">
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
            </div>
            <div className="flex gap-2">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-48" data-testid="select-user-filter">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tutti i dipendenti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i dipendenti</SelectItem>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!readOnly && (
                <Button variant="outline" onClick={() => setDialogOpen(true)} data-testid="button-add-manual">
                  <Plus className="h-4 w-4 mr-2" />
                  Manuale
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{isToday ? "Nessuna timbratura registrata oggi" : `Nessuna timbratura per il ${format(selectedDate, "d MMMM yyyy", { locale: it })}`}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Note</TableHead>
                  {!readOnly && <TableHead className="w-[80px]">Azioni</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const eventInfo = eventTypeLabels[event.eventType] || { label: event.eventType, icon: Clock, color: "bg-gray-500" };
                  const EventIcon = eventInfo.icon;
                  return (
                    <TableRow key={event.id} data-testid={`row-clock-event-${event.id}`}>
                      <TableCell className="font-medium">
                        {format(new Date(event.eventTime), "HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <EventIcon className="h-3 w-3" />
                          {eventInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{event.user?.fullName || '-'}</TableCell>
                      <TableCell>
                        {event.latitude && event.longitude ? (
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            GPS
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{event.notes || '-'}</TableCell>
                      {!readOnly && (
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => openEditDialog(event)} data-testid={`button-edit-clock-${event.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrazione Manuale</DialogTitle>
            <DialogDescription>Inserisci una timbratura manuale per un dipendente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo Timbratura</Label>
              <Select value={newEvent.eventType} onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v })}>
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrata">Entrata</SelectItem>
                  <SelectItem value="uscita">Uscita</SelectItem>
                  <SelectItem value="pausa_inizio">Inizio Pausa</SelectItem>
                  <SelectItem value="pausa_fine">Fine Pausa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dipendente</Label>
              <Select value={newEvent.userId} onValueChange={(v) => setNewEvent({ ...newEvent, userId: v })}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder="Motivazione timbratura manuale..."
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => createMutation.mutate(newEvent)}
              disabled={!newEvent.userId || createMutation.isPending}
              data-testid="button-save-manual"
            >
              {createMutation.isPending ? "Salvataggio..." : "Registra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Timbratura</DialogTitle>
            <DialogDescription>Modifica i dettagli della timbratura</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo Timbratura</Label>
              <Select value={editForm.eventType} onValueChange={(v) => setEditForm({ ...editForm, eventType: v })}>
                <SelectTrigger data-testid="select-edit-event-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrata">Entrata</SelectItem>
                  <SelectItem value="uscita">Uscita</SelectItem>
                  <SelectItem value="pausa_inizio">Inizio Pausa</SelectItem>
                  <SelectItem value="pausa_fine">Fine Pausa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Orario</Label>
              <input
                type="time"
                value={editForm.eventTime}
                onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                data-testid="input-edit-time"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Note..."
                data-testid="input-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending} data-testid="button-save-edit">
              {editMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
