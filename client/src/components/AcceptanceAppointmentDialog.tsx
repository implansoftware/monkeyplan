import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarPlus, Loader2, CheckCircle2, Clock, MapPin,
  Smartphone, User, Phone, Mail
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addDays, isBefore, startOfToday } from "date-fns";
import { it } from "date-fns/locale";

interface AcceptanceAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (appointment: any) => void;
  prefilledRepairCenterId?: string;
}

const acceptanceAppointmentSchema = z.object({
  repairCenterId: z.string().min(1, "Seleziona un centro di riparazione"),
  date: z.string().min(1, "Seleziona una data"),
  startTime: z.string().min(1, "Seleziona un orario"),
  endTime: z.string().optional(),
  deviceType: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().optional(),
  issueDescription: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email("Email non valida").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type AcceptanceAppointmentData = z.infer<typeof acceptanceAppointmentSchema>;

export function AcceptanceAppointmentDialog({
  open,
  onOpenChange,
  onSuccess,
  prefilledRepairCenterId,
}: AcceptanceAppointmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [step, setStep] = useState<"select-center" | "select-slot" | "details" | "confirm">("select-center");

  const form = useForm<AcceptanceAppointmentData>({
    resolver: zodResolver(acceptanceAppointmentSchema),
    defaultValues: {
      repairCenterId: prefilledRepairCenterId || "",
      date: "",
      startTime: "",
      endTime: "",
      deviceType: "",
      deviceBrand: "",
      deviceModel: "",
      issueDescription: "",
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      notes: "",
    },
  });

  const selectedRepairCenterId = form.watch("repairCenterId");
  const selectedDate = form.watch("date");

  const { data: repairCenters = [] } = useQuery<any[]>({
    queryKey: ["/api/repair-centers"],
    enabled: user?.role !== "customer",
  });

  const { data: slotsData, isLoading: isLoadingSlots } = useQuery<{ slots: any[]; isClosed?: boolean; reason?: string }>({
    queryKey: ["/api/repair-centers", selectedRepairCenterId, "slots", selectedDate],
    queryFn: async () => {
      if (!selectedRepairCenterId || !selectedDate) return { slots: [], isClosed: true };
      const res = await fetch(`/api/repair-centers/${selectedRepairCenterId}/slots?date=${selectedDate}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch slots");
      return res.json();
    },
    enabled: !!selectedRepairCenterId && !!selectedDate,
  });
  const availableSlots = slotsData?.slots || [];

  const { data: deviceTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/device-types"],
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AcceptanceAppointmentData) => {
      const response = await apiRequest("POST", "/api/acceptance-appointments", {
        ...data,
        type: "acceptance", // Force acceptance type
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/acceptance-appointments"] });
      toast({
        title: "Appuntamento prenotato",
        description: `Appuntamento per il ${format(new Date(data.date), "d MMMM yyyy", { locale: it })} alle ${data.startTime}`,
      });
      onSuccess?.(data);
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare l'appuntamento",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    setStep("select-center");
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === "select-center") {
      if (!selectedRepairCenterId) {
        toast({
          title: "Attenzione",
          description: "Seleziona un centro di riparazione",
          variant: "destructive",
        });
        return;
      }
      setStep("select-slot");
    } else if (step === "select-slot") {
      const startTime = form.getValues("startTime");
      if (!selectedDate || !startTime) {
        toast({
          title: "Attenzione",
          description: "Seleziona data e orario",
          variant: "destructive",
        });
        return;
      }
      setStep("details");
    } else if (step === "details") {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "select-slot") setStep("select-center");
    else if (step === "details") setStep("select-slot");
    else if (step === "confirm") setStep("details");
  };

  const handleSubmit = async () => {
    const data = form.getValues();
    if (!data.endTime) {
      const startHour = parseInt(data.startTime.split(":")[0]);
      const startMinute = parseInt(data.startTime.split(":")[1]);
      const endHour = startHour + Math.floor((startMinute + 30) / 60);
      const endMinute = (startMinute + 30) % 60;
      data.endTime = `${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`;
    }
    createAppointmentMutation.mutate(data);
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = startOfToday();
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i);
      dates.push({
        value: format(date, "yyyy-MM-dd"),
        label: format(date, "EEEE d MMMM", { locale: it }),
      });
    }
    return dates;
  };

  const selectedRepairCenter = repairCenters.find((c: any) => c.id === selectedRepairCenterId);

  const renderSelectCenterStep = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="repairCenterId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centro di Riparazione *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-repair-center">
                  <SelectValue placeholder="Seleziona un centro..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {repairCenters.map((center: any) => (
                  <SelectItem key={center.id} value={center.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{center.name}</span>
                      {center.address && (
                        <span className="text-muted-foreground text-sm"> - {center.address}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedRepairCenter && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">{selectedRepairCenter.name}</div>
                {selectedRepairCenter.address && (
                  <div className="text-sm text-muted-foreground">{selectedRepairCenter.address}</div>
                )}
                {selectedRepairCenter.phone && (
                  <div className="text-sm text-muted-foreground">Tel: {selectedRepairCenter.phone}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSelectSlotStep = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-date">
                  <SelectValue placeholder="Seleziona una data..." />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {generateDateOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedDate && (
        <FormField
          control={form.control}
          name="startTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Orario *</FormLabel>
              {isLoadingSlots ? (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Caricamento disponibilità...</span>
                </div>
              ) : slotsData?.isClosed ? (
                <div className="text-amber-600 py-2">
                  {slotsData.reason || "Centro chiuso in questa data"}
                </div>
              ) : availableSlots.filter((s: any) => s.available).length === 0 ? (
                <div className="text-muted-foreground py-2">
                  Nessuno slot disponibile per questa data
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.filter((slot: any) => slot.available).map((slot: any) => (
                    <Button
                      key={slot.startTime}
                      type="button"
                      variant={field.value === slot.startTime ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        field.onChange(slot.startTime);
                        form.setValue("endTime", slot.endTime);
                      }}
                      data-testid={`slot-${slot.startTime.replace(":", "")}`}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {slot.startTime}
                    </Button>
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        Informazioni opzionali per preparare meglio l'appuntamento
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="deviceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo dispositivo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-device-type">
                    <SelectValue placeholder="Seleziona..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {deviceTypes.map((dt: any) => (
                    <SelectItem key={dt.id} value={dt.name}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deviceBrand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Es. Apple, Samsung..."
                  data-testid="input-device-brand"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="deviceModel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Modello</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="Es. iPhone 14 Pro, Galaxy S23..."
                data-testid="input-device-model"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="issueDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrizione problema</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Descrivi brevemente il problema..."
                rows={3}
                data-testid="input-issue-description"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      <div className="text-sm font-medium">Dati cliente (opzionali)</div>

      <FormField
        control={form.control}
        name="customerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nome cliente</FormLabel>
            <FormControl>
              <Input 
                {...field} 
                placeholder="Nome e cognome"
                data-testid="input-customer-name"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="customerPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefono</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="+39..."
                  data-testid="input-customer-phone"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="email"
                  placeholder="email@esempio.com"
                  data-testid="input-customer-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Note aggiuntive</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Altre informazioni utili..."
                rows={2}
                data-testid="input-notes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderConfirmStep = () => {
    const data = form.getValues();
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Riepilogo appuntamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{selectedRepairCenter?.name}</div>
                <div className="text-sm text-muted-foreground">{selectedRepairCenter?.address}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {data.date && format(new Date(data.date), "EEEE d MMMM yyyy", { locale: it })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Ore {data.startTime} - {data.endTime}
                </div>
              </div>
            </div>

            {(data.deviceType || data.deviceBrand || data.deviceModel) && (
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {[data.deviceType, data.deviceBrand, data.deviceModel].filter(Boolean).join(" - ")}
                  </div>
                  {data.issueDescription && (
                    <div className="text-sm text-muted-foreground">{data.issueDescription}</div>
                  )}
                </div>
              </div>
            )}

            {data.customerName && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{data.customerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {[data.customerPhone, data.customerEmail].filter(Boolean).join(" - ")}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-md bg-muted p-4 text-sm">
          <p className="font-medium mb-1">Cosa succede dopo?</p>
          <p className="text-muted-foreground">
            L'appuntamento verrà registrato e potrai presentarti al centro di riparazione 
            nella data e ora selezionate. Al momento dell'arrivo, verrà creato l'ordine di riparazione.
          </p>
        </div>
      </div>
    );
  };

  const getStepTitle = () => {
    switch (step) {
      case "select-center": return "Passo 1/4 - Seleziona centro";
      case "select-slot": return "Passo 2/4 - Scegli data e ora";
      case "details": return "Passo 3/4 - Dettagli";
      case "confirm": return "Passo 4/4 - Conferma";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Prenota appuntamento - {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {step === "select-center" && "Seleziona il centro di riparazione dove portare il dispositivo"}
            {step === "select-slot" && "Scegli la data e l'orario per l'appuntamento"}
            {step === "details" && "Aggiungi dettagli sul dispositivo e sul cliente"}
            {step === "confirm" && "Controlla i dati e conferma l'appuntamento"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            {step === "select-center" && renderSelectCenterStep()}
            {step === "select-slot" && renderSelectSlotStep()}
            {step === "details" && renderDetailsStep()}
            {step === "confirm" && renderConfirmStep()}

            <Separator />

            <div className="flex justify-between gap-2">
              {step !== "select-center" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  Indietro
                </Button>
              )}
              
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  data-testid="button-cancel"
                >
                  Annulla
                </Button>
                
                {step !== "confirm" ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    data-testid="button-next"
                  >
                    Avanti
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createAppointmentMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createAppointmentMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Prenotazione...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Conferma prenotazione
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
