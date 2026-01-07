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
  Calendar,
  User
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
  timestamp: string;
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
  const [newEvent, setNewEvent] = useState({ eventType: "entrata", userId: "", notes: "" });
  const { toast } = useToast();

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const { data: clockEvents = [], isLoading } = useQuery<ClockEvent[]>({
    queryKey: ["/api/reseller/hr/clock-events", { startDate: startOfDay.toISOString(), endDate: endOfDay.toISOString() }],
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-slate-100 dark:from-blue-500/10 dark:via-blue-500/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-attendance-title">Gestione Presenze</h1>
                <p className="text-muted-foreground">Timbrature e registrazione orari</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/hr">
              <Button variant="outline" data-testid="button-back-to-hr">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna a HR
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover-elevate transition-all"
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
          className="cursor-pointer hover-elevate transition-all"
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
          className="cursor-pointer hover-elevate transition-all"
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
          className="cursor-pointer hover-elevate transition-all"
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

      <Card data-testid="card-clock-events-list">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Timbrature di Oggi
              </CardTitle>
              <CardDescription>{format(today, "EEEE d MMMM yyyy", { locale: it })}</CardDescription>
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
              <Button variant="outline" onClick={() => setDialogOpen(true)} data-testid="button-add-manual">
                <Plus className="h-4 w-4 mr-2" />
                Manuale
              </Button>
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
              <p>Nessuna timbratura registrata oggi</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const eventInfo = eventTypeLabels[event.eventType] || { label: event.eventType, icon: Clock, color: "bg-gray-500" };
                  const EventIcon = eventInfo.icon;
                  return (
                    <TableRow key={event.id} data-testid={`row-clock-event-${event.id}`}>
                      <TableCell className="font-medium">
                        {format(new Date(event.timestamp), "HH:mm:ss")}
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
    </div>
  );
}
