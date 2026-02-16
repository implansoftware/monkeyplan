import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RepairOrder, User } from "@shared/schema";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { 
  CalendarCheck, Clock, CheckCircle, Loader2, 
  Calendar as CalendarIcon, RefreshCw, Wrench, User as UserIcon
} from "lucide-react";
import { format, isBefore, startOfToday } from "date-fns";
import { it } from "date-fns/locale";

interface AppointmentCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairCenterId: string;
  onSuccess?: () => void;
}

type TimeSlot = {
  startTime: string;
  endTime: string;
  available: number;
  total: number;
};

type SlotsResponse = {
  closed: boolean;
  reason?: string;
  slots: TimeSlot[];
};

export function AppointmentCreateDialog({
  open,
  onOpenChange,
  repairCenterId,
  onSuccess,
}: AppointmentCreateDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedOrderId("");
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setNotes("");
    }
  }, [open]);

  const { data: repairs = [], isLoading: loadingRepairs } = useQuery<RepairOrder[]>({
    queryKey: ["/api/reseller/repairs"],
    enabled: open,
  });

  const { data: customers = [] } = useQuery<User[]>({
    queryKey: ["/api/reseller/customers"],
    enabled: open,
  });

  const repairsWithoutAppointment = repairs.filter(r => 
    r.repairCenterId === repairCenterId && 
    r.status !== 'consegnato' &&
    r.status !== 'preventivo_rifiutato'
  );

  const selectedOrder = repairs.find(r => r.id === selectedOrderId);
  const selectedCustomer = selectedOrder ? customers.find(c => c.id === selectedOrder.customerId) : null;

  const { data: slotsData, isLoading: loadingSlots, refetch: refetchSlots } = useQuery<SlotsResponse>({
    queryKey: ["/api/reseller/appointments/available-slots", repairCenterId, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return { closed: true, slots: [] };
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(`/api/reseller/appointments/available-slots?repairCenterId=${repairCenterId}&date=${dateStr}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
    enabled: open && !!selectedDate && !!repairCenterId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedSlot || !selectedOrderId) throw new Error("Missing required fields");
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      return await apiRequest("POST", "/api/reseller/appointments", {
        repairOrderId: selectedOrderId,
        repairCenterId,
        customerId: selectedOrder?.customerId || null,
        date: dateStr,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Appuntamento creato",
        description: t("appointment.createdSuccessfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-centers", repairCenterId, "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repairs"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("appointment.cannotCreate"),
        variant: "destructive",
      });
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.available > 0) {
      setSelectedSlot(slot);
    }
  };

  const handleCreate = () => {
    createMutation.mutate();
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfToday());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Nuovo Appuntamento Consegna
          </DialogTitle>
          <DialogDescription>
            Crea un nuovo appuntamento per la consegna di un dispositivo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Ordine di Riparazione</Label>
            {loadingRepairs ? (
              <Skeleton className="h-10 w-full mt-1" />
            ) : repairsWithoutAppointment.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md mt-1">
                Nessun ordine disponibile per questo centro
              </div>
            ) : (
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger className="mt-1" data-testid="select-repair-order">
                  <SelectValue placeholder={t("parts.selectOrder")} />
                </SelectTrigger>
                <SelectContent>
                  {repairsWithoutAppointment.map((repair) => {
                    const customer = customers.find(c => c.id === repair.customerId);
                    return (
                      <SelectItem key={repair.id} value={repair.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          <span className="font-mono">{repair.orderNumber}</span>
                          {customer && (
                            <span className="text-muted-foreground">
                              - {customer.fullName || customer.username}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedOrder && (
            <Card className="bg-muted/30">
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-2 bg-background rounded-lg">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{selectedOrder.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.deviceType} - {selectedOrder.deviceModel || 'N/D'}
                    </p>
                  </div>
                  {selectedCustomer && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <UserIcon className="h-4 w-4" />
                      <span>{selectedCustomer.fullName || selectedCustomer.username}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedOrderId && (
            <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {t("appointment.selectDate")}
                </h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  locale={it}
                  className="rounded-md border"
                  data-testid="calendar-appointment-date"
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
                ) : slotsData?.closed ? (
                  <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                    {slotsData.reason || t("appointment.closedOnDate")}
                  </div>
                ) : !slotsData?.slots.length ? (
                  <div className="text-sm text-muted-foreground p-4 text-center border rounded-md">
                    Nessuno slot disponibile in questa data
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {slotsData.slots.map((slot) => (
                      <Button
                        key={slot.startTime}
                        variant={selectedSlot?.startTime === slot.startTime ? "default" : "outline"}
                        className={`justify-between ${slot.available === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={slot.available === 0}
                        onClick={() => handleSlotSelect(slot)}
                        data-testid={`button-slot-${slot.startTime}`}
                      >
                        <span>{slot.startTime}</span>
                        <Badge variant={slot.available > 0 ? "secondary" : "destructive"} className="ml-2">
                          {slot.available}/{slot.total}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedSlot && selectedDate && (
            <div className="space-y-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="py-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="font-medium">
                        {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
                      </span>
                      <span className="text-muted-foreground mx-2">alle</span>
                      <span className="font-medium">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div>
                <Label className="text-sm font-medium">{t("common.notesOptional")}</Label>
                <Textarea
                  placeholder={t("appointment.addNotesForAppointment")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none mt-1"
                  rows={2}
                  data-testid="input-appointment-notes"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-create"
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedOrderId || !selectedDate || !selectedSlot || createMutation.isPending}
            data-testid="button-confirm-create"
          >
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <CalendarCheck className="mr-2 h-4 w-4" />
            Crea Appuntamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
