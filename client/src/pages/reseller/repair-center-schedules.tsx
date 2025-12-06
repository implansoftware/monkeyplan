import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle, XCircle, Loader2, RefreshCw, Building, Plus, Trash2, Save
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, startOfToday } from "date-fns";
import { it } from "date-fns/locale";
import type { RepairCenter } from "@shared/schema";

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

const defaultAvailability: Omit<Availability, "id" | "repairCenterId">[] = [
  { weekday: 0, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: true },
  { weekday: 1, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 2, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 3, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 4, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 5, startTime: "09:00", endTime: "18:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: false },
  { weekday: 6, startTime: "09:00", endTime: "13:00", slotDurationMinutes: 30, capacityPerSlot: 3, isClosed: true },
];

export default function ResellerRepairCenterSchedules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [localAvailability, setLocalAvailability] = useState<Omit<Availability, "id" | "repairCenterId">[]>(defaultAvailability);
  const [blackoutDialogOpen, setBlackoutDialogOpen] = useState(false);
  const [newBlackout, setNewBlackout] = useState({ date: "", reason: "" });

  const { data: centers = [], isLoading: loadingCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
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

  useEffect(() => {
    if (availability && availability.length > 0) {
      const mapped = weekdayNames.map((_, weekday) => {
        const existing = availability.find(a => a.weekday === weekday);
        if (existing) {
          return {
            weekday: existing.weekday,
            startTime: existing.startTime,
            endTime: existing.endTime,
            slotDurationMinutes: existing.slotDurationMinutes,
            capacityPerSlot: existing.capacityPerSlot,
            isClosed: existing.isClosed,
          };
        }
        return defaultAvailability[weekday];
      });
      setLocalAvailability(mapped);
    } else {
      setLocalAvailability(defaultAvailability);
    }
  }, [availability]);

  const saveAvailabilityMutation = useMutation({
    mutationFn: async (data: Omit<Availability, "id" | "repairCenterId">[]) => {
      if (!selectedCenterId) throw new Error("No center selected");
      const res = await apiRequest("POST", `/api/repair-centers/${selectedCenterId}/availability`, {
        availability: data,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "availability"] });
      setEditingAvailability(false);
      toast({ title: "Orari salvati", description: "Gli orari di apertura sono stati aggiornati." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createBlackoutMutation = useMutation({
    mutationFn: async (data: { date: string; reason: string }) => {
      if (!selectedCenterId) throw new Error("No center selected");
      const res = await apiRequest("POST", `/api/repair-centers/${selectedCenterId}/blackouts`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "blackouts"] });
      setBlackoutDialogOpen(false);
      setNewBlackout({ date: "", reason: "" });
      toast({ title: "Chiusura aggiunta", description: "La data di chiusura è stata registrata." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteBlackoutMutation = useMutation({
    mutationFn: async (blackoutId: string) => {
      if (!selectedCenterId) throw new Error("No center selected");
      await apiRequest("DELETE", `/api/repair-centers/${selectedCenterId}/blackouts/${blackoutId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", selectedCenterId, "blackouts"] });
      toast({ title: "Chiusura rimossa" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateLocalAvailability = (weekday: number, field: keyof Omit<Availability, "id" | "repairCenterId">, value: any) => {
    setLocalAvailability(prev => prev.map(item => 
      item.weekday === weekday ? { ...item, [field]: value } : item
    ));
  };

  const selectedCenter = centers.find(c => c.id === selectedCenterId);

  if (loadingCenters) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (centers.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun Centro Riparazione</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Non hai ancora creato nessun centro riparazione. Vai alla sezione "Centri Riparazione" per crearne uno.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Gestione Orari Centri</h1>
          <p className="text-muted-foreground">Configura gli orari di apertura e le chiusure dei tuoi centri riparazione</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Seleziona Centro Riparazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCenterId || ""}
            onValueChange={(value) => setSelectedCenterId(value)}
          >
            <SelectTrigger data-testid="select-repair-center">
              <SelectValue placeholder="Seleziona un centro..." />
            </SelectTrigger>
            <SelectContent>
              {centers.map((center) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name} - {center.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCenterId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {selectedCenter?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="availability">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="availability" data-testid="tab-availability">
                  <Settings className="h-4 w-4 mr-2" />
                  Orari Settimanali
                </TabsTrigger>
                <TabsTrigger value="blackouts" data-testid="tab-blackouts">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Giorni Chiusura
                </TabsTrigger>
              </TabsList>

              <TabsContent value="availability" className="space-y-4 mt-4">
                {loadingAvailability ? (
                  <div className="space-y-2">
                    {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        Configura gli orari di apertura per ogni giorno della settimana
                      </p>
                      {editingAvailability ? (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingAvailability(false)}
                            data-testid="button-cancel-availability"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Annulla
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveAvailabilityMutation.mutate(localAvailability)}
                            disabled={saveAvailabilityMutation.isPending}
                            data-testid="button-save-availability"
                          >
                            {saveAvailabilityMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-1" />
                            )}
                            Salva
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAvailability(true)}
                          data-testid="button-edit-availability"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Modifica
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {localAvailability.map((day) => (
                        <div
                          key={day.weekday}
                          className={`flex items-center gap-4 p-3 rounded-lg border ${
                            day.isClosed ? "bg-muted/50" : ""
                          }`}
                        >
                          <div className="w-24 font-medium">
                            {weekdayNames[day.weekday]}
                          </div>

                          {editingAvailability ? (
                            <>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={!day.isClosed}
                                  onCheckedChange={(checked) => 
                                    updateLocalAvailability(day.weekday, "isClosed", !checked)
                                  }
                                  data-testid={`switch-day-${day.weekday}`}
                                />
                                <span className="text-sm">
                                  {day.isClosed ? "Chiuso" : "Aperto"}
                                </span>
                              </div>

                              {!day.isClosed && (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Dalle</Label>
                                    <Input
                                      type="time"
                                      value={day.startTime}
                                      onChange={(e) => 
                                        updateLocalAvailability(day.weekday, "startTime", e.target.value)
                                      }
                                      className="w-24"
                                      data-testid={`input-start-time-${day.weekday}`}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Alle</Label>
                                    <Input
                                      type="time"
                                      value={day.endTime}
                                      onChange={(e) => 
                                        updateLocalAvailability(day.weekday, "endTime", e.target.value)
                                      }
                                      className="w-24"
                                      data-testid={`input-end-time-${day.weekday}`}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Slot (min)</Label>
                                    <Input
                                      type="number"
                                      value={day.slotDurationMinutes}
                                      onChange={(e) => 
                                        updateLocalAvailability(day.weekday, "slotDurationMinutes", parseInt(e.target.value) || 30)
                                      }
                                      className="w-16"
                                      min={15}
                                      max={120}
                                      data-testid={`input-slot-duration-${day.weekday}`}
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-xs">Capacità</Label>
                                    <Input
                                      type="number"
                                      value={day.capacityPerSlot}
                                      onChange={(e) => 
                                        updateLocalAvailability(day.weekday, "capacityPerSlot", parseInt(e.target.value) || 1)
                                      }
                                      className="w-16"
                                      min={1}
                                      max={20}
                                      data-testid={`input-capacity-${day.weekday}`}
                                    />
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {day.isClosed ? (
                                <Badge variant="secondary">Chiuso</Badge>
                              ) : (
                                <div className="flex items-center gap-4 text-sm">
                                  <span>{day.startTime} - {day.endTime}</span>
                                  <span className="text-muted-foreground">
                                    Slot: {day.slotDurationMinutes} min
                                  </span>
                                  <span className="text-muted-foreground">
                                    Capacità: {day.capacityPerSlot}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="blackouts" className="space-y-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    Gestisci le chiusure straordinarie (ferie, festività, manutenzione)
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setBlackoutDialogOpen(true)}
                    data-testid="button-add-blackout"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Aggiungi Chiusura
                  </Button>
                </div>

                {loadingBlackouts ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : blackouts && blackouts.length > 0 ? (
                  <div className="space-y-2">
                    {blackouts.map((blackout) => (
                      <div
                        key={blackout.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(blackout.date), "EEEE d MMMM yyyy", { locale: it })}
                          </span>
                          {blackout.reason && (
                            <Badge variant="outline">{blackout.reason}</Badge>
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nessuna chiusura programmata</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Dialog open={blackoutDialogOpen} onOpenChange={setBlackoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Giorno di Chiusura</DialogTitle>
            <DialogDescription>
              Aggiungi una data di chiusura straordinaria per {selectedCenter?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blackout-date">Data</Label>
              <Input
                id="blackout-date"
                type="date"
                value={newBlackout.date}
                onChange={(e) => setNewBlackout(prev => ({ ...prev, date: e.target.value }))}
                min={format(new Date(), "yyyy-MM-dd")}
                data-testid="input-blackout-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blackout-reason">Motivo (opzionale)</Label>
              <Input
                id="blackout-reason"
                placeholder="Es: Ferie, Festività, Manutenzione"
                value={newBlackout.reason}
                onChange={(e) => setNewBlackout(prev => ({ ...prev, reason: e.target.value }))}
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
                onClick={() => createBlackoutMutation.mutate(newBlackout)}
                disabled={!newBlackout.date || createBlackoutMutation.isPending}
                data-testid="button-confirm-blackout"
              >
                {createBlackoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Aggiungi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
