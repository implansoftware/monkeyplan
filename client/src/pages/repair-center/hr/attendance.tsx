import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import {
  Clock,
  Plus,
  MapPin,
  ArrowLeft,
  LogIn,
  LogOut,
  Coffee,
  Utensils,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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


export default function RepairCenterHrAttendance() {
  const { t } = useTranslation();
  const eventTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    entrata: { label: t("warehouse.inbound"), icon: LogIn, color: "bg-emerald-500" },
    uscita: { label: t("warehouse.outbound"), icon: LogOut, color: "bg-red-500" },
    pausa_inizio: { label: t("hr.breakStart"), icon: Coffee, color: "bg-amber-500" },
    pausa_fine: { label: t("hr.breakEnd"), icon: Utensils, color: "bg-blue-500" },
  };
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ eventType: "entrata", userId: "", notes: "" });
  const [editingEvent, setEditingEvent] = useState<ClockEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ eventType: "", eventTime: "", notes: "" });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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

  const clockEventsUrl = `/api/repair-center/hr/clock-events?startDate=${encodeURIComponent(startOfDay.toISOString())}&endDate=${encodeURIComponent(endOfDay.toISOString())}`;
  
  const { data: clockEvents = [], isLoading } = useQuery<ClockEvent[]>({
    queryKey: ["/api/repair-center/hr/clock-events", selectedDate.toDateString()],
    queryFn: async () => {
      const res = await fetch(clockEventsUrl);
      if (!res.ok) throw new Error(t("common.loadingError"));
      return res.json();
    },
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/repair-center/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { eventType: string; userId?: string; notes?: string; latitude?: number; longitude?: number }) => {
      return apiRequest("POST", "/api/repair-center/hr/clock-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/clock-events"] });
      setDialogOpen(false);
      setNewEvent({ eventType: "entrata", userId: "", notes: "" });
      toast({ title: t("hr.clockRegistered"), description: t("hr.clockCreatedDesc") });
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { eventType?: string; eventTime?: string; notes?: string } }) => {
      return apiRequest("PATCH", `/api/repair-center/hr/clock-events/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/clock-events"] });
      setEditDialogOpen(false);
      setEditingEvent(null);
      toast({ title: t("hr.clockUpdated"), description: t("hr.laModificaStataSalvata") });
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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
    <div className="space-y-4 sm:space-y-6" data-testid="page-rc-hr-attendance">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{t("sidebar.items.attendance")}</h1>
              <p className="text-emerald-100">{t("hr.clockAndTimeTracking")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("hr.dashboardHR")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>{t("hr.quickClocks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(eventTypeLabels).map(([key, { label, icon: Icon, color }]) => (
              <Button
                key={key}
                variant="outline"
                className="h-20 flex-col gap-2"
                onClick={() => handleClockNow(key)}
                disabled={createMutation.isPending}
              >
                <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span>{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex flex-wrap items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              {isToday ? t("hr.todayAttendance") : t("hr.dayAttendance")}
            </CardTitle>
            <div className="flex gap-2 items-center">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder={t("hr.tuttiGliUtenti")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("hr.tuttiGliUtenti")}</SelectItem>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("common.new")}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="icon" variant="ghost" onClick={goToPreviousDay} data-testid="button-prev-day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-0 justify-start text-left font-normal" data-testid="button-date-picker">
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
                {t("common.today")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{isToday ? t("hr.noClockToday") : `${t("hr.noClockForDate")} ${format(selectedDate, "d MMMM yyyy", { locale: it })}`}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.employee")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("hr.time")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("warehouse.location")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.note")}</TableHead>
                  <TableHead className="w-[80px]">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const typeInfo = eventTypeLabels[event.eventType];
                  const Icon = typeInfo?.icon || Clock;
                  return (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.user?.fullName || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {typeInfo?.label || event.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(event.eventTime), "HH:mm", { locale: it })}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {event.latitude && event.longitude ? (
                          <Badge variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            GPS
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{event.notes || "-"}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(event)} data-testid={`button-edit-clock-${event.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hr.nuovaTimbraturaManuale")}</DialogTitle>
            <DialogDescription>{t("hr.insertClockForTeamMember")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("hr.eventType")}</label>
              <Select value={newEvent.eventType} onValueChange={(v) => setNewEvent({ ...newEvent, eventType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("hr.employee")}</label>
              <Select value={newEvent.userId} onValueChange={(v) => setNewEvent({ ...newEvent, userId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("hr.selezionaDipendente")} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("hr.notesOptional")}</label>
              <Textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder={t("utility.additionalNotes")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("profile.cancel")}</Button>
            <Button
              onClick={() => createMutation.mutate({ eventType: newEvent.eventType, userId: newEvent.userId || undefined, notes: newEvent.notes || undefined })}
              disabled={createMutation.isPending}
            >
              {t("hr.register")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hr.editClock")}</DialogTitle>
            <DialogDescription>{t("hr.modificaIDettagliDellaTimbratura")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("hr.eventType")}</label>
              <Select value={editForm.eventType} onValueChange={(v) => setEditForm({ ...editForm, eventType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{t("hr.time")}</label>
              <input
                type="time"
                value={editForm.eventTime}
                onChange={(e) => setEditForm({ ...editForm, eventTime: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("hr.notesOptional")}</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder={t("utility.additionalNotes")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{t("profile.cancel")}</Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending}>
              {t("team.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
