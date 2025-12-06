import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarCheck, Clock, CheckCircle, XCircle, Loader2, 
  Calendar as CalendarIcon, RefreshCw
} from "lucide-react";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { it } from "date-fns/locale";

interface AppointmentBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  repairCenterId: string;
  orderNumber: string;
  onSuccess?: () => void;
}

type TimeSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
};

type SlotsResponse = {
  slots: TimeSlot[];
  isClosed: boolean;
  reason?: string;
};

type Appointment = {
  id: string;
  repairOrderId: string;
  repairCenterId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  scheduled: { label: "Prenotato", variant: "secondary" },
  confirmed: { label: "Confermato", variant: "default" },
  cancelled: { label: "Annullato", variant: "destructive" },
  completed: { label: "Completato", variant: "outline" },
  no_show: { label: "Non presentato", variant: "destructive" },
};

export function AppointmentBookingDialog({
  open,
  onOpenChange,
  repairOrderId,
  repairCenterId,
  orderNumber,
  onSuccess,
}: AppointmentBookingDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");

  const { data: existingAppointment, isLoading: loadingAppointment } = useQuery<Appointment | null>({
    queryKey: ["/api/repair-orders", repairOrderId, "appointment"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${repairOrderId}/appointment`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch appointment");
      return res.json();
    },
    enabled: open,
  });

  const { data: slotsData, isLoading: loadingSlots, refetch: refetchSlots } = useQuery<SlotsResponse>({
    queryKey: ["/api/repair-centers", repairCenterId, "slots", selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return { slots: [], isClosed: true };
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(`/api/repair-centers/${repairCenterId}/slots?date=${dateStr}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
    enabled: open && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedSlot) throw new Error("Missing date or slot");
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/appointment`, {
        date: dateStr,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Appuntamento prenotato",
        description: "L'appuntamento è stato prenotato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "appointment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setNotes("");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile prenotare l'appuntamento",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return await apiRequest("PATCH", `/api/appointments/${appointmentId}`, {
        status: "cancelled",
        cancelReason: "Annullato dall'utente",
      });
    },
    onSuccess: () => {
      toast({
        title: "Appuntamento annullato",
        description: "L'appuntamento è stato annullato",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "appointment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile annullare l'appuntamento",
        variant: "destructive",
      });
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.available) {
      setSelectedSlot(slot);
    }
  };

  const handleBook = () => {
    bookMutation.mutate();
  };

  const handleCancel = () => {
    if (existingAppointment) {
      cancelMutation.mutate(existingAppointment.id);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfToday());
  };

  if (loadingAppointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Appuntamento Consegna</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (existingAppointment && existingAppointment.status !== 'cancelled') {
    const statusInfo = statusLabels[existingAppointment.status] || { label: existingAppointment.status, variant: "secondary" as const };
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Appuntamento Consegna
            </DialogTitle>
            <DialogDescription>
              Ordine {orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stato</span>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {format(new Date(existingAppointment.date), "EEEE d MMMM yyyy", { locale: it })}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Orario</span>
                  <span className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {existingAppointment.startTime} - {existingAppointment.endTime}
                  </span>
                </div>
                
                {existingAppointment.notes && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">Note</span>
                    <p className="text-sm">{existingAppointment.notes}</p>
                  </div>
                )}
                
                {existingAppointment.confirmedAt && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confermato il</span>
                    <span>{format(new Date(existingAppointment.confirmedAt), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-2 mt-4">
            {existingAppointment.status === 'scheduled' && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                data-testid="button-cancel-appointment"
              >
                {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <XCircle className="mr-2 h-4 w-4" />
                Annulla Appuntamento
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-appointment">
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Prenota Appuntamento Consegna
          </DialogTitle>
          <DialogDescription>
            Ordine {orderNumber} - Seleziona data e orario per il ritiro del dispositivo
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Seleziona una data
            </h4>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              locale={it}
              className="rounded-md border"
              data-testid="calendar-date-picker"
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Orari disponibili
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchSlots()}
                  className="h-6 w-6 p-0"
                  data-testid="button-refresh-slots"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </h4>
            
            {!selectedDate ? (
              <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                Seleziona una data per vedere gli orari disponibili
              </div>
            ) : loadingSlots ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : slotsData?.isClosed ? (
              <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                {slotsData.reason || "Chiuso in questa data"}
              </div>
            ) : !slotsData?.slots.length ? (
              <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                {slotsData?.reason || "Nessuno slot disponibile in questa data"}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {slotsData.slots.map((slot) => (
                  <Button
                    key={slot.startTime}
                    variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                    className={`justify-center ${!slot.available ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={!slot.available}
                    onClick={() => handleSlotSelect(slot)}
                    data-testid={`button-slot-${slot.startTime}`}
                  >
                    {slot.startTime}
                    {!slot.available && (
                      <XCircle className="ml-1 h-3 w-3 text-destructive" />
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {selectedSlot && (
          <div className="mt-4 space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="py-3">
                <div className="flex items-center gap-4 text-sm">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="font-medium">
                      {format(selectedDate!, "EEEE d MMMM yyyy", { locale: it })}
                    </span>
                    <span className="text-muted-foreground mx-2">alle</span>
                    <span className="font-medium">{selectedSlot.startTime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div>
              <label className="text-sm font-medium block mb-2">Note (opzionale)</label>
              <Textarea
                placeholder="Aggiungi note per l'appuntamento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
                data-testid="input-appointment-notes"
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-booking"
          >
            Annulla
          </Button>
          <Button
            onClick={handleBook}
            disabled={!selectedDate || !selectedSlot || bookMutation.isPending}
            data-testid="button-confirm-booking"
          >
            {bookMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CalendarCheck className="mr-2 h-4 w-4" />
            Conferma Prenotazione
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
