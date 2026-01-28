import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarCheck, Clock, Settings, Calendar as CalendarIcon,
  CheckCircle, XCircle, Loader2, RefreshCw, User, Wrench, Plus, Trash2
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, startOfToday } from "date-fns";
import { it } from "date-fns/locale";

type Appointment = {
  id: string;
  repairOrderId: string;
  repairCenterId: string;
  resellerId: string | null;
  customerId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  confirmedAt: string | null;
  confirmedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
};

type Availability = {
  id: string;
  repairCenterId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  isClosed: boolean;
};

type Blackout = {
  id: string;
  repairCenterId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
};

const weekdayNames = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Prenotato", variant: "secondary" },
  confirmed: { label: "Confermato", variant: "default" },
  cancelled: { label: "Annullato", variant: "destructive" },
  completed: { label: "Completato", variant: "outline" },
  no_show: { label: "Non presentato", variant: "destructive" },
};

const defaultAvailability: Omit<Availability, "id" | "repairCenterId">[] = [
  { weekday: 0, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: true },
  { weekday: 1, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 2, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 3, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 4, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 5, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 6, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: true },
];

export default function RepairCenterAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const repairCenterId = user?.repairCenterId;

  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<Omit<Availability, "id" | "repairCenterId">[]>(defaultAvailability);
  const [blackoutDialogOpen, setBlackoutDialogOpen] = useState(false);
  const [newBlackout, setNewBlackout] = useState({ date: "", reason: "" });
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { data: appointments, isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/repair-centers", repairCenterId, "appointments"],
    queryFn: async () => {
      if (!repairCenterId) return [];
      const res = await fetch(`/api/repair-centers/${repairCenterId}/appointments`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
    enabled: !!repairCenterId,
  });

  const { data: availability, isLoading: loadingAvailability } = useQuery<Availability[]>({
    queryKey: ["/api/repair-centers", repairCenterId, "availability"],
    queryFn: async () => {
      if (!repairCenterId) return [];
      const res = await fetch(`/api/repair-centers/${repairCenterId}/availability`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!repairCenterId,
  });

  useEffect(() => {
    if (availability && availability.length > 0) {
      setLocalAvailability(availability.map((a: Availability) => ({
        weekday: a.weekday,
        startTime: a.startTime,
        endTime: a.endTime,
        slotDurationMinutes: a.slotDurationMinutes,
        capacityPerSlot: a.capacityPerSlot,
        isClosed: a.isClosed,
      })));
    }
  }, [availability]);

  const { data: blackouts, isLoading: loadingBlackouts } = useQuery<Blackout[]>({
    queryKey: ["/api/repair-centers", repairCenterId, "blackouts"],
    queryFn: async () => {
      if (!repairCenterId) return [];
      const res = await fetch(`/api/repair-centers/${repairCenterId}/blackouts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch blackouts");
      return res.json();
    },
    enabled: !!repairCenterId,
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      if (!repairCenterId) throw new Error("No repair center");
      return await apiRequest("POST", `/api/repair-centers/${repairCenterId}/availability`, {
        availability: localAvailability,
      });
    },
    onSuccess: () => {
      toast({ title: "Disponibilità salvata", description: "Gli orari sono stati aggiornati" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", repairCenterId, "availability"] });
      setEditingAvailability(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createBlackoutMutation = useMutation({
    mutationFn: async () => {
      if (!repairCenterId) throw new Error("No repair center");
      return await apiRequest("POST", `/api/repair-centers/${repairCenterId}/blackouts`, {
        date: newBlackout.date,
        reason: newBlackout.reason || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Chiusura aggiunta", description: "La data di chiusura è stata aggiunta" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", repairCenterId, "blackouts"] });
      setBlackoutDialogOpen(false);
      setNewBlackout({ date: "", reason: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: async (blackoutId: string) => {
      if (!repairCenterId) throw new Error("No repair center");
      return await apiRequest("DELETE", `/api/repair-centers/${repairCenterId}/blackouts/${blackoutId}`);
    },
    onSuccess: () => {
      toast({ title: "Chiusura rimossa", description: "La data di chiusura è stata rimossa" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", repairCenterId, "blackouts"] });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Appuntamento aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", repairCenterId, "appointments"] });
      setAppointmentDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateLocalAvailability = (weekday: number, field: string, value: any) => {
    setLocalAvailability(prev =>
      prev.map(a =>
        a.weekday === weekday ? { ...a, [field]: value } : a
      )
    );
  };

  const appointmentsForSelectedDate = appointments?.filter(a =>
    a.date === format(selectedDate, "yyyy-MM-dd")
  ) || [];

  const hasBlackoutOnDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return blackouts?.some(b => b.date === dateStr) || false;
  };

  const getAppointmentCountForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return appointments?.filter(a => a.date === dateStr && a.status !== 'cancelled').length || 0;
  };

  if (!repairCenterId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Centro riparazione non configurato</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <CalendarIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Appuntamenti</h1>
              <p className="text-emerald-100">Gestisci gli appuntamenti per il ritiro dei dispositivi</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar" className="gap-2" data-testid="tab-calendar">
            <CalendarIcon className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2" data-testid="tab-settings">
            <Settings className="h-4 w-4" />
            Impostazioni
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="grid lg:grid-cols-[350px_1fr] gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Seleziona Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  locale={it}
                  className="rounded-md border"
                  modifiers={{
                    hasAppointments: (date) => getAppointmentCountForDate(date) > 0,
                    blackout: (date) => hasBlackoutOnDate(date),
                  }}
                  modifiersClassNames={{
                    hasAppointments: "bg-primary/20 font-bold",
                    blackout: "bg-destructive/20 line-through",
                  }}
                  data-testid="appointments-calendar"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Appuntamenti del {format(selectedDate, "d MMMM yyyy", { locale: it })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : appointmentsForSelectedDate.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nessun appuntamento in questa data</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointmentsForSelectedDate
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((appointment) => {
                        const statusInfo = statusLabels[appointment.status] || { label: appointment.status, variant: "secondary" as const };
                        return (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover-elevate cursor-pointer"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setAppointmentDetailOpen(true);
                            }}
                            data-testid={`appointment-${appointment.id}`}
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex flex-col items-center justify-center w-14 h-14 rounded-md bg-muted text-center">
                                <span className="text-lg font-bold">{appointment.startTime}</span>
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  <Wrench className="h-4 w-4" />
                                  Ordine
                                </div>
                                {appointment.notes && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{appointment.notes}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Orari di Apertura
                </CardTitle>
                {!editingAvailability ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingAvailability(true)}
                    data-testid="button-edit-availability"
                  >
                    Modifica
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAvailability(false);
                        if (availability && availability.length > 0) {
                          setLocalAvailability(availability.map(a => ({
                            weekday: a.weekday,
                            startTime: a.startTime,
                            endTime: a.endTime,
                            slotDurationMinutes: a.slotDurationMinutes,
                            capacityPerSlot: a.capacityPerSlot,
                            isClosed: a.isClosed,
                          })));
                        }
                      }}
                      data-testid="button-cancel-availability"
                    >
                      Annulla
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveAvailabilityMutation.mutate()}
                      disabled={saveAvailabilityMutation.isPending}
                      data-testid="button-save-availability"
                    >
                      {saveAvailabilityMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salva
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingAvailability ? (
                <div className="space-y-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {localAvailability.sort((a, b) => a.weekday - b.weekday).map((day) => (
                    <div key={day.weekday} className="flex flex-wrap items-center gap-4 py-2 border-b last:border-0">
                      <div className="w-24 font-medium">{weekdayNames[day.weekday]}</div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Switch
                          checked={!day.isClosed}
                          onCheckedChange={(checked) => updateLocalAvailability(day.weekday, "isClosed", !checked)}
                          disabled={!editingAvailability}
                          data-testid={`switch-day-${day.weekday}`}
                        />
                        <span className="text-sm text-muted-foreground">
                          {day.isClosed ? "Chiuso" : "Aperto"}
                        </span>
                      </div>

                      {!day.isClosed && (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <Input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => updateLocalAvailability(day.weekday, "startTime", e.target.value)}
                              disabled={!editingAvailability}
                              className="w-28"
                              data-testid={`input-start-${day.weekday}`}
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => updateLocalAvailability(day.weekday, "endTime", e.target.value)}
                              disabled={!editingAvailability}
                              className="w-28"
                              data-testid={`input-end-${day.weekday}`}
                            />
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 ml-auto">
                            <Label className="text-xs text-muted-foreground">Slot:</Label>
                            <Select
                              value={String(day.slotDurationMinutes)}
                              onValueChange={(v) => updateLocalAvailability(day.weekday, "slotDurationMinutes", Number(v))}
                              disabled={!editingAvailability}
                            >
                              <SelectTrigger className="w-20" data-testid={`select-duration-${day.weekday}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="15">15m</SelectItem>
                                <SelectItem value="30">30m</SelectItem>
                                <SelectItem value="45">45m</SelectItem>
                                <SelectItem value="60">60m</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Label className="text-xs text-muted-foreground">Max:</Label>
                            <Select
                              value={String(day.capacityPerSlot)}
                              onValueChange={(v) => updateLocalAvailability(day.weekday, "capacityPerSlot", Number(v))}
                              disabled={!editingAvailability}
                            >
                              <SelectTrigger className="w-16" data-testid={`select-capacity-${day.weekday}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Date di Chiusura Straordinaria
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlackoutDialogOpen(true)}
                  data-testid="button-add-blackout"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBlackouts ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !blackouts || blackouts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Nessuna data di chiusura programmata</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blackouts.sort((a, b) => a.date.localeCompare(b.date)).map((blackout) => (
                    <div
                      key={blackout.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium">
                          {format(new Date(blackout.date), "EEEE d MMMM yyyy", { locale: it })}
                        </div>
                        {blackout.reason && (
                          <p className="text-sm text-muted-foreground">{blackout.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBlackoutMutation.mutate(blackout.id)}
                        disabled={deleteBlackoutMutation.isPending}
                        data-testid={`button-delete-blackout-${blackout.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={blackoutDialogOpen} onOpenChange={setBlackoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Chiusura Straordinaria</DialogTitle>
            <DialogDescription>
              Aggiungi una data in cui il centro sarà chiuso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={newBlackout.date}
                onChange={(e) => setNewBlackout(prev => ({ ...prev, date: e.target.value }))}
                data-testid="input-blackout-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo (opzionale)</Label>
              <Input
                placeholder="es. Ferie estive"
                value={newBlackout.reason}
                onChange={(e) => setNewBlackout(prev => ({ ...prev, reason: e.target.value }))}
                data-testid="input-blackout-reason"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setBlackoutDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => createBlackoutMutation.mutate()}
              disabled={!newBlackout.date || createBlackoutMutation.isPending}
              data-testid="button-save-blackout"
            >
              {createBlackoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDetailOpen} onOpenChange={setAppointmentDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dettagli Appuntamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.date), "d MMMM yyyy", { locale: it })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Orario</Label>
                  <p className="font-medium">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Stato</Label>
                <div className="mt-1">
                  <Badge variant={statusLabels[selectedAppointment.status]?.variant || "secondary"}>
                    {statusLabels[selectedAppointment.status]?.label || selectedAppointment.status}
                  </Badge>
                </div>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <Label className="text-muted-foreground">Note</Label>
                  <p className="text-sm">{selectedAppointment.notes}</p>
                </div>
              )}

              <Separator />

              {selectedAppointment.status === 'scheduled' && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => updateAppointmentMutation.mutate({ id: selectedAppointment.id, status: 'confirmed' })}
                    disabled={updateAppointmentMutation.isPending}
                    data-testid="button-confirm-apt"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Conferma
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => updateAppointmentMutation.mutate({ id: selectedAppointment.id, status: 'cancelled' })}
                    disabled={updateAppointmentMutation.isPending}
                    data-testid="button-cancel-apt"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Annulla
                  </Button>
                </div>
              )}

              {selectedAppointment.status === 'confirmed' && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => updateAppointmentMutation.mutate({ id: selectedAppointment.id, status: 'completed' })}
                    disabled={updateAppointmentMutation.isPending}
                    data-testid="button-complete-apt"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completato
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateAppointmentMutation.mutate({ id: selectedAppointment.id, status: 'no_show' })}
                    disabled={updateAppointmentMutation.isPending}
                    data-testid="button-noshow-apt"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Non Presentato
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
