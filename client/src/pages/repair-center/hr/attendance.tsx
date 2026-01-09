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
  Utensils
} from "lucide-react";
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

const eventTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  entrata: { label: "Entrata", icon: LogIn, color: "bg-emerald-500" },
  uscita: { label: "Uscita", icon: LogOut, color: "bg-red-500" },
  pausa_inizio: { label: "Inizio Pausa", icon: Coffee, color: "bg-amber-500" },
  pausa_fine: { label: "Fine Pausa", icon: Utensils, color: "bg-blue-500" },
};

export default function RepairCenterHrAttendance() {
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ eventType: "entrata", userId: "", notes: "" });
  const { toast } = useToast();

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const clockEventsUrl = `/api/repair-center/hr/clock-events?startDate=${encodeURIComponent(startOfDay.toISOString())}&endDate=${encodeURIComponent(endOfDay.toISOString())}`;
  
  const { data: clockEvents = [], isLoading } = useQuery<ClockEvent[]>({
    queryKey: [clockEventsUrl],
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/repair-center/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { eventType: string; userId?: string; notes?: string; latitude?: number; longitude?: number }) => {
      return apiRequest("POST", "/api/repair-center/hr/clock-events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [clockEventsUrl] });
      setDialogOpen(false);
      setNewEvent({ eventType: "entrata", userId: "", notes: "" });
      toast({ title: "Timbratura registrata", description: "La timbratura è stata salvata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

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
    <div className="space-y-6" data-testid="page-rc-hr-attendance">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-slate-100 dark:from-blue-500/10 dark:via-blue-500/5 dark:to-slate-900 p-6 border">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestione Presenze</h1>
                <p className="text-muted-foreground">Timbrature e registrazione orari</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard HR
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>Timbrature Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle>Timbrature di Oggi</CardTitle>
          <div className="flex gap-2 items-center">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tutti gli utenti" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli utenti</SelectItem>
                {staffMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova
            </Button>
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
              Nessuna timbratura registrata oggi
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Orario</TableHead>
                  <TableHead>Posizione</TableHead>
                  <TableHead>Note</TableHead>
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
                      <TableCell>
                        {event.latitude && event.longitude ? (
                          <Badge variant="secondary" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            GPS
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{event.notes || "-"}</TableCell>
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
            <DialogTitle>Nuova Timbratura Manuale</DialogTitle>
            <DialogDescription>Inserisci una timbratura per un membro del team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tipo Evento</label>
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
              <label className="text-sm font-medium">Dipendente</label>
              <Select value={newEvent.userId} onValueChange={(v) => setNewEvent({ ...newEvent, userId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                placeholder="Note aggiuntive..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button
              onClick={() => createMutation.mutate({ eventType: newEvent.eventType, userId: newEvent.userId || undefined, notes: newEvent.notes || undefined })}
              disabled={createMutation.isPending}
            >
              Registra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
