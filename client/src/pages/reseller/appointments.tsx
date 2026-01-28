import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RepairCenter } from "@shared/schema";
import { AppointmentCreateDialog } from "@/components/AppointmentCreateDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  CheckCircle, XCircle, Loader2, User, Wrench, Plus, Trash2, Building, Phone, Mail
} from "lucide-react";
import { format, startOfToday } from "date-fns";
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
  repairOrder?: {
    id: string;
    orderNumber: string;
    deviceType: string;
    brand: string | null;
    deviceModel: string | null;
    issueDescription: string | null;
    status: string;
  } | null;
  customer?: {
    id: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
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

export default function ResellerAppointments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCenterId, setSelectedCenterId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<Omit<Availability, "id" | "repairCenterId">[]>(defaultAvailability);
  const [blackoutDialogOpen, setBlackoutDialogOpen] = useState(false);
  const [newBlackout, setNewBlackout] = useState({ date: "", reason: "" });
  const [appointmentDetailOpen, setAppointmentDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: repairCenters = [], isLoading: loadingCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  useEffect(() => {
    if (repairCenters.length > 0 && !selectedCenterId) {
      setSelectedCenterId(repairCenters[0].id);
    }
  }, [repairCenters, selectedCenterId]);

  const { data: appointments, isLoading: loadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/repair-centers", selectedCenterId, "appointments"],
    queryFn: async () => {
      if (!selectedCenterId) return [];
      const res = await fetch(`/api/repair-centers/${selectedCenterId}/appointments`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return res.json();
    },
    enabled: !!selectedCenterId,
  });

  const { data: availability, isLoading: loadingAvailability } = useQuery<Availability[]>({
    queryKey: ["/api/repair-centers", selectedCenterId, "availability"],
    queryFn: async () => {
      if (!selectedCenterId) return [];
      const res = await fetch(`/api/repair-centers/${selectedCenterId}/availability`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch availability");
      return res.json();
    },
    enabled: !!selectedCenterId,
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
    } else if (selectedCenterId) {
      setLocalAvailability(defaultAvailability);
    }
  }, [availability, selectedCenterId]);

  const { data: blackouts, isLoading: loadingBlackouts } = useQuery<Blackout[]>({
    queryKey: ["/api/repair-centers", selectedCenterId, "blackouts"],
    queryFn: async () => {
      if (!selectedCenterId) return [];
      const res = await fetch(`/api/repair-centers/${selectedCenterId}/blackouts`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch blackouts");
      return res.json();
    },
    enabled: !!selectedCenterId,
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCenterId) throw new Error("No repair center selected");
      return await apiRequest("POST", `/api/repair-centers/${selectedCenterId}/availability`, {
        availability: localAvailability,
      });
    },
    onSuccess: () => {
      toast({ title: "Disponibilità salvata", description: "Gli orari sono stati aggiornati" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "availability"] });
      setEditingAvailability(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createBlackoutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCenterId) throw new Error("No repair center selected");
      return await apiRequest("POST", `/api/repair-centers/${selectedCenterId}/blackouts`, {
        date: newBlackout.date,
        reason: newBlackout.reason || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Chiusura aggiunta", description: "La data di chiusura è stata aggiunta" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "blackouts"] });
      setBlackoutDialogOpen(false);
      setNewBlackout({ date: "", reason: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: async (blackoutId: string) => {
      if (!selectedCenterId) throw new Error("No repair center selected");
      return await apiRequest("DELETE", `/api/repair-centers/${selectedCenterId}/blackouts/${blackoutId}`);
    },
    onSuccess: () => {
      toast({ title: "Chiusura rimossa", description: "La data di chiusura è stata rimossa" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "blackouts"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "appointments"] });
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

  const selectedCenter = repairCenters.find(c => c.id === selectedCenterId);

  if (loadingCenters) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (repairCenters.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nessun centro riparazione associato</p>
            <p className="text-sm text-muted-foreground mt-2">
              Crea un centro riparazione dalla sezione "Centri Riparazione"
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayAppointments = appointments?.filter(a => 
    a.date === format(startOfToday(), "yyyy-MM-dd") && a.status !== 'cancelled'
  ).length || 0;
  
  const confirmedAppointments = appointments?.filter(a => a.status === 'confirmed').length || 0;
  const scheduledAppointments = appointments?.filter(a => a.status === 'scheduled').length || 0;

  return (
    <div className="space-y-6" data-testid="page-reseller-appointments">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Appuntamenti</h1>
                <p className="text-sm text-white/80">
                  Gestisci gli appuntamenti dei tuoi centri
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
              <SelectTrigger className="w-full sm:w-56 bg-white/20 backdrop-blur-sm border-white/30 text-white" data-testid="select-repair-center">
                <Building className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Seleziona centro" />
              </SelectTrigger>
              <SelectContent>
                {repairCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              disabled={!selectedCenterId}
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg"
              data-testid="button-new-appointment"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Appuntamento
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Appuntamenti Oggi</p>
                <p className="text-3xl font-bold tabular-nums">{todayAppointments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(startOfToday(), "d MMMM yyyy", { locale: it })}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <CalendarIcon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Confermati</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{confirmedAppointments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Appuntamenti confermati
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">In Attesa</p>
                <p className="text-3xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{scheduledAppointments}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Da confermare
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedCenterId && (
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
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center justify-center w-14 h-14 rounded-md bg-muted text-center">
                                  <span className="text-lg font-bold">{appointment.startTime}</span>
                                </div>
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    <Wrench className="h-4 w-4" />
                                    {appointment.repairOrder?.orderNumber || "Ordine"}
                                  </div>
                                  {appointment.repairOrder?.deviceType && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {appointment.repairOrder.deviceType}
                                      {appointment.repairOrder.brand && ` - ${appointment.repairOrder.brand}`}
                                      {appointment.repairOrder.deviceModel && ` ${appointment.repairOrder.deviceModel}`}
                                    </p>
                                  )}
                                  {appointment.customer?.fullName && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {appointment.customer.fullName}
                                    </p>
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Orari di Apertura - {selectedCenter?.name}
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
                          } else {
                            setLocalAvailability(defaultAvailability);
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
                        
                        <div className="flex items-center gap-2">
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
                            <div className="flex items-center gap-2">
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
                            
                            <div className="flex items-center gap-2 ml-auto">
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
                <div className="flex items-center justify-between flex-wrap gap-2">
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
                          <span className="font-medium">
                            {format(new Date(blackout.date), "EEEE d MMMM yyyy", { locale: it })}
                          </span>
                          {blackout.reason && (
                            <span className="text-sm text-muted-foreground ml-2">
                              - {blackout.reason}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
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
      )}

      <Dialog open={blackoutDialogOpen} onOpenChange={setBlackoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Chiusura Straordinaria</DialogTitle>
            <DialogDescription>
              Seleziona una data in cui il centro rimarrà chiuso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={newBlackout.date}
                onChange={(e) => setNewBlackout(prev => ({ ...prev, date: e.target.value }))}
                data-testid="input-blackout-date"
              />
            </div>
            <div>
              <Label>Motivo (opzionale)</Label>
              <Input
                value={newBlackout.reason}
                onChange={(e) => setNewBlackout(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Es: Ferie estive"
                data-testid="input-blackout-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setBlackoutDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button
                onClick={() => createBlackoutMutation.mutate()}
                disabled={!newBlackout.date || createBlackoutMutation.isPending}
                data-testid="button-confirm-blackout"
              >
                {createBlackoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aggiungi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={appointmentDetailOpen} onOpenChange={setAppointmentDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dettaglio Appuntamento</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              {selectedAppointment.repairOrder && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Ordine {selectedAppointment.repairOrder.orderNumber}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dispositivo: </span>
                      <span>{selectedAppointment.repairOrder.deviceType}</span>
                    </div>
                    {selectedAppointment.repairOrder.brand && (
                      <div>
                        <span className="text-muted-foreground">Marca: </span>
                        <span>{selectedAppointment.repairOrder.brand}</span>
                      </div>
                    )}
                    {selectedAppointment.repairOrder.deviceModel && (
                      <div>
                        <span className="text-muted-foreground">Modello: </span>
                        <span>{selectedAppointment.repairOrder.deviceModel}</span>
                      </div>
                    )}
                  </div>
                  {selectedAppointment.repairOrder.issueDescription && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Problema: </span>
                      <span>{selectedAppointment.repairOrder.issueDescription}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedAppointment.customer && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{selectedAppointment.customer.fullName || "Cliente"}</span>
                  </div>
                  <div className="text-sm space-y-0.5">
                    {selectedAppointment.customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{selectedAppointment.customer.phone}</span>
                      </div>
                    )}
                    {selectedAppointment.customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span>{selectedAppointment.customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p className="font-medium">
                    {format(new Date(selectedAppointment.date), "d MMMM yyyy", { locale: it })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Orario</Label>
                  <p className="font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
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
                  <p>{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                {selectedAppointment.status === "scheduled" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => updateAppointmentMutation.mutate({ 
                        id: selectedAppointment.id, 
                        status: "confirmed" 
                      })}
                      disabled={updateAppointmentMutation.isPending}
                      data-testid="button-confirm-appointment"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Conferma
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateAppointmentMutation.mutate({ 
                        id: selectedAppointment.id, 
                        status: "cancelled" 
                      })}
                      disabled={updateAppointmentMutation.isPending}
                      data-testid="button-cancel-appointment"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Annulla
                    </Button>
                  </>
                )}
                {selectedAppointment.status === "confirmed" && (
                  <Button
                    onClick={() => updateAppointmentMutation.mutate({ 
                      id: selectedAppointment.id, 
                      status: "completed" 
                    })}
                    disabled={updateAppointmentMutation.isPending}
                    data-testid="button-complete-appointment"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Segna come Completato
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AppointmentCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        repairCenterId={selectedCenterId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "appointments"] });
        }}
      />
    </div>
  );
}
