import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  HardDrive, 
  Building2, 
  User, 
  Truck, 
  Clock, 
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

interface ExternalLab {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string | null;
  email: string;
  contactPerson: string | null;
  supportsApiIntegration: boolean;
  avgTurnaroundDays: number | null;
  baseCost: number | null;
}

interface StaffUser {
  id: string;
  username: string;
  role: string;
}

interface DataRecoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repairOrderId: string;
  deviceDescription?: string;
  onSuccess?: () => void;
}

export function DataRecoveryDialog({ 
  open, 
  onOpenChange, 
  repairOrderId,
  deviceDescription,
  onSuccess 
}: DataRecoveryDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"choose" | "internal" | "external">("choose");
  const [selectedLabId, setSelectedLabId] = useState<string>("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>("");
  const [notes, setNotes] = useState("");

  // Fetch external labs
  const { data: externalLabs = [], isLoading: labsLoading } = useQuery<ExternalLab[]>({
    queryKey: ["/api/external-labs"],
    enabled: open && step === "external",
  });

  // Fetch staff users for internal assignment
  const { data: staffUsers = [], isLoading: staffLoading } = useQuery<StaffUser[]>({
    queryKey: ["/api/users/staff"],
    enabled: open && step === "internal",
  });

  // Create data recovery job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: {
      handlingType: "internal" | "external";
      assignedToUserId?: string | null;
      externalLabId?: string | null;
      internalNotes?: string | null;
    }) => {
      return await apiRequest(`/api/repair-orders/${repairOrderId}/data-recovery`, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          triggerType: "manual",
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Recupero dati avviato",
        description: step === "internal" 
          ? "Il recupero dati è stato assegnato al tecnico" 
          : "Il recupero dati è stato inviato al laboratorio esterno",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "data-recovery"] });
      onOpenChange(false);
      onSuccess?.();
      resetDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile avviare il recupero dati",
        variant: "destructive",
      });
    },
  });

  const resetDialog = () => {
    setStep("choose");
    setSelectedLabId("");
    setSelectedTechnicianId("");
    setNotes("");
  };

  const handleSubmitInternal = () => {
    if (!selectedTechnicianId) {
      toast({
        title: "Seleziona un tecnico",
        description: "Devi selezionare un tecnico per il recupero dati interno",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate({
      handlingType: "internal",
      assignedToUserId: selectedTechnicianId,
      internalNotes: notes || null,
    });
  };

  const handleSubmitExternal = () => {
    if (!selectedLabId) {
      toast({
        title: "Seleziona un laboratorio",
        description: "Devi selezionare un laboratorio esterno",
        variant: "destructive",
      });
      return;
    }
    createJobMutation.mutate({
      handlingType: "external",
      externalLabId: selectedLabId,
      internalNotes: notes || null,
    });
  };

  const selectedLab = externalLabs.find(lab => lab.id === selectedLabId);

  const formatCost = (cents: number | null) => {
    if (!cents) return "N/D";
    return `€${(cents / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetDialog();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-blue-500" />
            Avvia Recupero Dati
          </DialogTitle>
          <DialogDescription>
            {deviceDescription || "Seleziona come gestire il recupero dati per questo dispositivo"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {step === "choose" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scegli se gestire il recupero dati internamente o inviarlo a un laboratorio esterno convenzionato.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Internal Recovery Option */}
                <Card 
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                  onClick={() => setStep("internal")}
                  data-testid="option-internal"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                        <User className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">Recupero Interno</CardTitle>
                    <CardDescription>
                      Il recupero dati viene gestito da un tecnico del nostro laboratorio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Controllo diretto sul processo
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Tempi di risposta più rapidi
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Comunicazione diretta con il cliente
                      </li>
                    </ul>
                    <div className="mt-4 flex items-center gap-1 text-primary font-medium">
                      Seleziona <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>

                {/* External Recovery Option */}
                <Card 
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                  onClick={() => setStep("external")}
                  data-testid="option-external"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <CardTitle className="text-lg">Laboratorio Esterno</CardTitle>
                    <CardDescription>
                      Il dispositivo viene inviato a un laboratorio specializzato convenzionato
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        Attrezzature specializzate
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        Maggiore percentuale di successo
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500" />
                        Tracking automatico spedizione
                      </li>
                    </ul>
                    <div className="mt-4 flex items-center gap-1 text-primary font-medium">
                      Seleziona <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {step === "internal" && (
            <div className="space-y-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep("choose")}
                data-testid="button-back"
              >
                ← Torna alla scelta
              </Button>

              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Recupero Dati Interno</h3>
                  <p className="text-sm text-muted-foreground">
                    Assegna il recupero dati a un tecnico del laboratorio
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="technician" className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Tecnico Assegnato *
                  </Label>
                  {staffLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Caricamento tecnici...
                    </div>
                  ) : (
                    <Select value={selectedTechnicianId} onValueChange={setSelectedTechnicianId}>
                      <SelectTrigger id="technician" data-testid="select-technician">
                        <SelectValue placeholder="Seleziona un tecnico" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffUsers.filter(u => u.role === "repair_center" || u.role === "admin").map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.username} ({user.role === "admin" ? "Admin" : "Tecnico"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-1">
                    Note Interne (opzionale)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Aggiungi note per il tecnico..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="input-notes"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSubmitInternal}
                  disabled={!selectedTechnicianId || createJobMutation.isPending}
                  data-testid="button-submit-internal"
                >
                  {createJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creazione...
                    </>
                  ) : (
                    <>
                      <HardDrive className="mr-2 h-4 w-4" />
                      Avvia Recupero Interno
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === "external" && (
            <div className="space-y-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep("choose")}
                data-testid="button-back-external"
              >
                ← Torna alla scelta
              </Button>

              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">Laboratorio Esterno</h3>
                  <p className="text-sm text-muted-foreground">
                    Seleziona un laboratorio convenzionato per il recupero dati
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Laboratorio *
                </Label>
                
                {labsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Caricamento laboratori...
                  </div>
                ) : externalLabs.length === 0 ? (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-5 w-5" />
                    <span>Nessun laboratorio esterno configurato. Contatta l'amministratore.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {externalLabs.map((lab) => {
                      const isSelected = selectedLabId === lab.id;
                      return (
                        <Card 
                          key={lab.id}
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20" 
                              : "hover:border-muted-foreground/50"
                          }`}
                          onClick={() => setSelectedLabId(lab.id)}
                          data-testid={`lab-${lab.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{lab.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {lab.code}
                                  </Badge>
                                  {lab.supportsApiIntegration && (
                                    <Badge variant="secondary" className="text-xs">
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      API
                                    </Badge>
                                  )}
                                </div>
                                <div className="mt-2 text-sm text-muted-foreground space-y-1">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    {lab.address}, {lab.city}
                                  </div>
                                  {lab.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3" />
                                      {lab.phone}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {lab.email}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{lab.avgTurnaroundDays || "?"} giorni</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>Da {formatCost(lab.baseCost)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? "border-blue-500 bg-blue-500" : "border-muted-foreground"
                              }`}>
                                {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="external-notes" className="flex items-center gap-1">
                    Note Interne (opzionale)
                  </Label>
                  <Textarea
                    id="external-notes"
                    placeholder="Aggiungi note per il laboratorio..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="input-external-notes"
                  />
                </div>
              </div>

              {selectedLab && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Riepilogo Invio</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Laboratorio: <span className="text-foreground">{selectedLab.name}</span></li>
                    <li>• Città: <span className="text-foreground">{selectedLab.city}</span></li>
                    <li>• Tempo stimato: <span className="text-foreground">{selectedLab.avgTurnaroundDays || "N/D"} giorni</span></li>
                    <li>• Costo base: <span className="text-foreground">{formatCost(selectedLab.baseCost)}</span></li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Verranno generati automaticamente il documento di invio e l'etichetta logistica
                  </p>
                </div>
              )}

              <Separator />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-external"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleSubmitExternal}
                  disabled={!selectedLabId || createJobMutation.isPending}
                  data-testid="button-submit-external"
                >
                  {createJobMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creazione...
                    </>
                  ) : (
                    <>
                      <Truck className="mr-2 h-4 w-4" />
                      Invia a Laboratorio
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
