import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Clock, Euro, Wrench, FileText, Paperclip, 
  CheckCircle, XCircle, Calendar, AlertTriangle, History,
  Phone, MapPin, User, Stethoscope, ClipboardCheck, Package,
  Building2, Timer, AlertOctagon, Sparkles
} from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { format, formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { useAuth } from "@/hooks/use-auth";
import { getStatusConfig } from "@/lib/repair-status-config";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { RepairOrder, RepairQuote, DeliveryAppointment } from "@shared/schema";

interface RepairCenterInfo {
  id: string;
  fullName: string;
  phone: string | null;
  address: string | null;
}

interface RepairOrderWithDetails extends RepairOrder {
  customerName?: string;
  repairCenterName?: string;
  quoteTotalAmount?: number | null;
  repairCenterInfo?: RepairCenterInfo | null;
}

interface RepairAcceptance {
  id: string;
  repairOrderId: string;
  declaredDefects: string[] | null;
  aestheticCondition: string | null;
  aestheticNotes: string | null;
  accessories: string[] | null;
  lockCode: string | null;
  hasLockCode: boolean | null;
  acceptedBy: string;
  acceptedAt: string;
}

interface RepairDiagnostics {
  id: string;
  repairOrderId: string;
  technicalDiagnosis: string;
  damagedComponents: string[] | null;
  estimatedRepairTime: number | null;
  diagnosisNotes: string | null;
  diagnosisOutcome: string | null;
  createdAt: string;
}

interface RepairLog {
  id: string;
  repairOrderId: string;
  technicianId: string;
  action: string;
  notes: string | null;
  createdAt: string;
  technicianName?: string;
}

interface StateHistoryEntry {
  id: string;
  repairOrderId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  notes: string | null;
  createdAt: string;
  changedByName?: string;
}


export default function CustomerRepairDetail() {
  const [, params] = useRoute("/customer/repairs/:id");
  const [, setLocation] = useLocation();
  const repairId = params?.id;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: repair, isLoading } = useQuery<RepairOrderWithDetails>({
    queryKey: ["/api/customer/repairs", repairId],
    queryFn: async () => {
      const response = await fetch(`/api/customer/repairs/${repairId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Riparazione non trovata");
        if (response.status === 403) throw new Error("Accesso negato");
        throw new Error("Errore nel caricamento");
      }
      return response.json();
    },
    enabled: !!repairId,
    retry: false,
  });

  const customerId = user?.id;

  const { data: quote } = useQuery<RepairQuote>({
    queryKey: ["/api/repair-orders", repairId, "quote"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairId}/quote`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!repairId,
  });

  const quotes = quote ? [quote] : [];

  const { data: stateHistory = [] } = useQuery<StateHistoryEntry[]>({
    queryKey: ["/api/repairs", repairId, "state-history"],
    queryFn: async () => {
      const response = await fetch(`/api/repairs/${repairId}/state-history`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!repairId,
  });

  const { data: appointments = [] } = useQuery<DeliveryAppointment[]>({
    queryKey: ["/api/delivery-appointments", repairId],
    queryFn: async () => {
      const response = await fetch(`/api/delivery-appointments?repairOrderId=${repairId}`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!repairId,
  });

  const { data: acceptance } = useQuery<RepairAcceptance | null>({
    queryKey: ["/api/repair-orders", repairId, "acceptance"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairId}/acceptance`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!repairId,
  });

  const { data: diagnostics } = useQuery<RepairDiagnostics | null>({
    queryKey: ["/api/repair-orders", repairId, "diagnostics"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairId}/diagnostics`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!repairId,
  });

  const { data: repairLogs = [] } = useQuery<RepairLog[]>({
    queryKey: ["/api/repair-orders", repairId, "logs"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairId}/logs`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!repairId,
  });

  
  const acceptQuoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/repair-orders/${repairId}/quote/accept`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/repairs", repairId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/repairs"] });
      toast({
        title: "Preventivo accettato",
        description: "La riparazione procederà secondo il preventivo approvato.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile accettare il preventivo",
        variant: "destructive",
      });
    },
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/repair-orders/${repairId}/quote/reject`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/repairs", repairId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/repairs"] });
      toast({
        title: "Preventivo rifiutato",
        description: "Il preventivo è stato rifiutato.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile rifiutare il preventivo",
        variant: "destructive",
      });
    },
  });

  const canUpload = repair && user ? repair.customerId === user.id : false;
  const canDelete = false;

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    return (
      <Badge className={`${config.bgColor} ${config.color} ${config.borderColor} border`}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return "Da definire";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getProgressSteps = (status: string) => {
    const steps = [
      { key: "ingressato", label: "Ricevuto", icon: CheckCircle },
      { key: "in_diagnosi", label: "Diagnosi", icon: Wrench },
      { key: "preventivo", label: "Preventivo", icon: Euro },
      { key: "in_riparazione", label: "Riparazione", icon: Wrench },
      { key: "pronto_ritiro", label: "Pronto", icon: CheckCircle },
    ];

    const statusOrder: Record<string, number> = {
      pending: 0,
      ingressato: 1,
      in_diagnosi: 2,
      preventivo_emesso: 3,
      preventivo_accettato: 3,
      preventivo_rifiutato: 3,
      attesa_ricambi: 4,
      waiting_parts: 4,
      in_riparazione: 4,
      in_progress: 4,
      in_test: 4,
      pronto_ritiro: 5,
      completed: 5,
      consegnato: 6,
      delivered: 6,
    };

    const currentStep = statusOrder[status] ?? 0;
    return { steps, currentStep };
  };

  const pendingQuote = quote?.status === "sent" ? quote : null;
  const activeAppointment = appointments.find(a => a.status === "scheduled" || a.status === "confirmed");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Riparazione non trovata</p>
        <Button onClick={() => setLocation("/customer/repairs")} className="mt-4">
          Torna alle Riparazioni
        </Button>
      </div>
    );
  }

  const { steps, currentStep } = getProgressSteps(repair.status);
  const isCancelled = ["cancelled", "annullato"].includes(repair.status);
  const isCompleted = ["consegnato", "delivered"].includes(repair.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/customer/repairs")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">Riparazione #{repair.orderNumber}</h1>
            {getStatusBadge(repair.status)}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Creata {formatDistanceToNow(new Date(repair.createdAt), { addSuffix: true, locale: it })}
          </p>
        </div>
      </div>

      {pendingQuote && repair.status === "preventivo_emesso" && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">Preventivo in attesa di approvazione</h3>
                <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                  È stato emesso un preventivo per la tua riparazione. Puoi accettarlo per procedere o rifiutarlo.
                </p>
                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-sm text-orange-700 dark:text-orange-300">Importo totale:</span>
                    <span className="text-xl font-bold text-orange-900 dark:text-orange-100 ml-2">
                      {formatCurrency(pendingQuote.totalAmount)}
                    </span>
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      onClick={() => rejectQuoteMutation.mutate()}
                      disabled={rejectQuoteMutation.isPending}
                      data-testid="button-reject-quote"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rifiuta
                    </Button>
                    <Button
                      onClick={() => acceptQuoteMutation.mutate()}
                      disabled={acceptQuoteMutation.isPending}
                      data-testid="button-accept-quote"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accetta Preventivo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeAppointment && repair.status === "pronto_ritiro" && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Calendar className="h-6 w-6 text-green-600 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-100">Appuntamento per il ritiro</h3>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  È stato fissato un appuntamento per il ritiro del tuo dispositivo.
                </p>
                <div className="mt-3 flex items-center gap-4 flex-wrap text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {format(new Date(activeAppointment.date), "EEEE d MMMM yyyy", { locale: it })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      {activeAppointment.startTime} - {activeAppointment.endTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCancelled && !isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Avanzamento Riparazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                {steps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      index < currentStep 
                        ? "bg-primary text-primary-foreground" 
                        : index === currentStep 
                          ? "bg-primary/20 text-primary border-2 border-primary"
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center ${
                      index <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative h-2 bg-muted rounded-full mt-4">
                <div 
                  className="absolute h-2 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Informazioni Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo Dispositivo</p>
                <p className="font-medium capitalize">{repair.deviceType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modello</p>
                <p className="font-medium">{repair.deviceModel}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Problema Segnalato</p>
              <p className="text-sm mt-1 p-3 bg-muted rounded-md">{repair.issueDescription}</p>
            </div>
            {repair.serial && (
              <div>
                <p className="text-sm text-muted-foreground">Numero Seriale</p>
                <p className="font-mono text-sm">{repair.serial}</p>
              </div>
            )}
            {repair.imei && (
              <div>
                <p className="text-sm text-muted-foreground">IMEI</p>
                <p className="font-mono text-sm">{repair.imei}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Informazioni Costi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotes.length > 0 ? (
              <div className="space-y-3">
                {quotes.map((q) => (
                  <div key={q.id} className={`p-3 rounded-lg border ${
                    q.status === "accepted" 
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                      : q.status === "rejected"
                        ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                        : "bg-muted"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Preventivo #{q.quoteNumber}</span>
                      <Badge variant={
                        q.status === "accepted" ? "default" :
                        q.status === "rejected" ? "destructive" : "secondary"
                      }>
                        {q.status === "accepted" ? "Accettato" :
                         q.status === "rejected" ? "Rifiutato" : "In attesa"}
                      </Badge>
                    </div>
                    
                    {q.parts && Array.isArray(q.parts) && q.parts.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-2">Ricambi:</p>
                        <div className="space-y-1">
                          {q.parts.map((part: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{part.name || part.description}</span>
                              <span className="font-medium">{formatCurrency(part.price || part.cost)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {q.laborCost > 0 && (
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Manodopera</span>
                        <span className="font-medium">{formatCurrency(q.laborCost)}</span>
                      </div>
                    )}
                    
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Totale</span>
                      <span className="text-xl font-bold">{formatCurrency(q.totalAmount)}</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Emesso il {format(new Date(q.createdAt), "d MMM yyyy", { locale: it })}
                    </p>
                    
                    {q.notes && (
                      <p className="text-sm text-muted-foreground mt-2 p-2 bg-background rounded">
                        {q.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Costo Stimato</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(repair.estimatedCost)}</p>
                </div>
                {repair.finalCost && (
                  <div>
                    <p className="text-sm text-muted-foreground">Costo Finale</p>
                    <p className="text-2xl font-bold">{formatCurrency(repair.finalCost)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {acceptance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Dati Accettazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {acceptance.declaredDefects && acceptance.declaredDefects.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Guasti Dichiarati</p>
                  <div className="flex flex-wrap gap-2">
                    {acceptance.declaredDefects.map((defect, idx) => (
                      <Badge key={idx} variant="secondary">{defect}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {acceptance.aestheticCondition && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Condizione Estetica</p>
                  <p className="font-medium capitalize">{acceptance.aestheticCondition}</p>
                  {acceptance.aestheticNotes && (
                    <p className="text-sm text-muted-foreground mt-1">{acceptance.aestheticNotes}</p>
                  )}
                </div>
              )}
              
              {acceptance.accessories && acceptance.accessories.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Accessori Consegnati</p>
                  <div className="flex flex-wrap gap-2">
                    {acceptance.accessories.map((acc, idx) => (
                      <Badge key={idx} variant="outline">
                        <Package className="h-3 w-3 mr-1" />
                        {acc}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Data Accettazione</p>
                <p className="font-medium">
                  {format(new Date(acceptance.acceptedAt), "d MMMM yyyy, HH:mm", { locale: it })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {diagnostics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Diagnosi Tecnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Diagnosi</p>
                <p className="p-3 bg-muted rounded-md text-sm">{diagnostics.technicalDiagnosis}</p>
              </div>
              
              {diagnostics.diagnosisOutcome && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Esito Diagnosi</p>
                  <Badge variant={
                    diagnostics.diagnosisOutcome === "riparabile" ? "default" :
                    diagnostics.diagnosisOutcome === "non_conveniente" ? "secondary" : "destructive"
                  }>
                    {diagnostics.diagnosisOutcome === "riparabile" ? "Riparabile" :
                     diagnostics.diagnosisOutcome === "non_conveniente" ? "Non Conveniente" : "Irriparabile"}
                  </Badge>
                </div>
              )}
              
              {diagnostics.damagedComponents && diagnostics.damagedComponents.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Componenti Danneggiati</p>
                  <div className="flex flex-wrap gap-2">
                    {diagnostics.damagedComponents.map((comp, idx) => (
                      <Badge key={idx} variant="destructive" className="text-xs">
                        <AlertOctagon className="h-3 w-3 mr-1" />
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {diagnostics.estimatedRepairTime && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tempo Stimato Riparazione</p>
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {diagnostics.estimatedRepairTime < 1 
                        ? `${Math.round(diagnostics.estimatedRepairTime * 60)} minuti`
                        : `${diagnostics.estimatedRepairTime} ${diagnostics.estimatedRepairTime === 1 ? "ora" : "ore"}`
                      }
                    </span>
                  </div>
                </div>
              )}
              
              {diagnostics.diagnosisNotes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Note del Tecnico</p>
                  <p className="text-sm p-3 bg-muted rounded-md">{diagnostics.diagnosisNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {repair.repairCenterInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Centro di Riparazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nome</p>
                <p className="font-medium">{repair.repairCenterInfo.fullName}</p>
              </div>
              {repair.repairCenterInfo.phone && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Telefono</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${repair.repairCenterInfo.phone}`} className="font-medium hover:underline">
                      {repair.repairCenterInfo.phone}
                    </a>
                  </div>
                </div>
              )}
              {repair.repairCenterInfo.address && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Indirizzo</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{repair.repairCenterInfo.address}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {repairLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Registro Attività
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repairLogs.map((log) => (
                <div key={log.id} className="flex gap-4 pb-3 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-xs text-muted-foreground">
                        {log.createdAt ? format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: it }) : "-"}
                      </span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{log.notes}</p>
                    )}
                    {log.technicianName && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3 inline mr-1" />
                        {log.technicianName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stateHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Cronologia Stati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stateHistory.map((entry, index) => {
                const toConfig = getStatusConfig(entry.toStatus);
                return (
                  <div key={entry.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${toConfig.bgColor} border-2 ${toConfig.borderColor}`} />
                      {index < stateHistory.length - 1 && (
                        <div className="w-0.5 flex-1 bg-muted mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${toConfig.bgColor} ${toConfig.color} ${toConfig.borderColor} border text-xs`}>
                          {toConfig.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {entry.createdAt ? format(new Date(entry.createdAt), "d MMM yyyy, HH:mm", { locale: it }) : "-"}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {repair.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{repair.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Allegati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentUploader
            repairOrderId={repair.id}
            canUpload={canUpload}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli Ordine</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Numero Ordine</p>
              <p className="font-semibold">#{repair.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Creazione</p>
              <p className="font-medium">{format(new Date(repair.createdAt), "d MMMM yyyy", { locale: it })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ultimo Aggiornamento</p>
              <p className="font-medium">{format(new Date(repair.updatedAt), "d MMMM yyyy, HH:mm", { locale: it })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priorità</p>
              <Badge variant={repair.priority === "urgent" ? "destructive" : "secondary"}>
                {repair.priority === "urgent" ? "Urgente" : 
                 repair.priority === "high" ? "Alta" : 
                 repair.priority === "low" ? "Bassa" : "Normale"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
