import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { DiagnosisFormDialog } from "@/components/DiagnosisFormDialog";
import { QuoteFormDialog } from "@/components/QuoteFormDialog";
import { PartsOrderDialog } from "@/components/PartsOrderDialog";
import { RepairLogDialog } from "@/components/RepairLogDialog";
import { TestChecklistDialog } from "@/components/TestChecklistDialog";
import { DeliveryDialog } from "@/components/DeliveryDialog";
import { DataRecoveryDialog } from "@/components/DataRecoveryDialog";
import { AppointmentBookingDialog } from "@/components/AppointmentBookingDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench, Euro, FileText, Paperclip, Calendar, Package, ClipboardList,
  ClipboardCheck, PackageCheck, Play, CheckCircle, Stethoscope, Receipt,
  Download, User, ArrowRight, Circle, CheckCircle2, AlertCircle, AlertTriangle, Gift, Shield, SkipForward,
  HardDrive, Building2, Clock, Truck, Loader2, XCircle, CalendarCheck
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { computeSLASeverity } from "@/components/SLABadge";

type RepairQuote = {
  id: string;
  repairOrderId: string;
  quoteNumber: string;
  parts: any;
  laborCost: number;
  totalAmount: number;
  status: string;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
};

type RepairOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  resellerId: string | null;
  repairCenterId: string | null;
  deviceType: string;
  deviceTypeId: string | null;
  deviceModel: string;
  brand: string | null;
  imei: string | null;
  serial: string | null;
  imeiNotReadable: boolean;
  imeiNotPresent: boolean;
  serialOnly: boolean;
  issueDescription: string;
  status: string;
  priority: string | null;
  estimatedCost: number | null;
  finalCost: number | null;
  notes: string | null;
  ingressatoAt: string | null;
  quoteBypassReason: 'garanzia' | 'omaggio' | null;
  quoteBypassedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RepairAcceptance = {
  id: string;
  repairOrderId: string;
  declaredDefects: string[] | null;
  aestheticCondition: string | null;
  aestheticNotes: string | null;
  aestheticPhotosMandatory: boolean;
  accessories: string[] | null;
  lockCode: string | null;
  lockPattern: string | null;
  hasLockCode: boolean | null;
  accessoriesRemoved: boolean | null;
  acceptedBy: string;
  acceptedAt: string;
};

type Customer = {
  id: string;
  username: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  fiscalCode: string | null;
  vatNumber: string | null;
};

interface RepairOrderDetailDrawerProps {
  repairOrderId: string | null;
  open: boolean;
  onClose: () => void;
}

export function RepairOrderDetailDrawer({
  repairOrderId,
  open,
  onClose,
}: RepairOrderDetailDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [diagnosisDialogOpen, setDiagnosisDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [skipQuoteDialogOpen, setSkipQuoteDialogOpen] = useState(false);
  const [skipQuoteReason, setSkipQuoteReason] = useState<'garanzia' | 'omaggio' | null>(null);
  const [dataRecoveryDialogOpen, setDataRecoveryDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);

  const { data: repair, isLoading, error } = useQuery<RepairOrder>({
    queryKey: ["/api/repair-orders", repairOrderId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      const response = await fetch(`/api/repair-orders/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Riparazione non trovata");
        if (response.status === 403) throw new Error("Accesso negato");
        throw new Error("Errore nel caricamento");
      }
      return response.json();
    },
    enabled: !!repairOrderId && open,
    retry: false,
  });

  const { data: slaState } = useQuery<{ status: string; stateEnteredAt: string; currentState: any }>({
    queryKey: ["/api/repairs", repairOrderId, "sla-state"],
    queryFn: async () => {
      const response = await fetch(`/api/repairs/${repairOrderId}/sla-state`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!repairOrderId && open,
    staleTime: 60000,
  });

  const { data: quote } = useQuery<RepairQuote>({
    queryKey: ["/api/repair-orders", repairOrderId, "quote"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairOrderId}/quote`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Errore nel caricamento preventivo");
      }
      return response.json();
    },
    enabled: !!repairOrderId && open,
    retry: false,
  });

  const { data: acceptance } = useQuery<RepairAcceptance | null>({
    queryKey: ["/api/repair-orders", repairOrderId, "acceptance"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairOrderId}/acceptance`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Errore nel caricamento dati accettazione");
      }
      return response.json();
    },
    enabled: !!repairOrderId && open,
    retry: false,
  });

  const { data: customer } = useQuery<Customer | null>({
    queryKey: ["/api/users", repair?.customerId],
    queryFn: async () => {
      if (!repair?.customerId) return null;
      const response = await fetch(`/api/users/${repair.customerId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        return null;
      }
      return response.json();
    },
    enabled: !!repair?.customerId && open,
    retry: false,
  });

  const { data: diagnosis } = useQuery<any>({
    queryKey: ["/api/repair-orders", repairOrderId, "diagnostics"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairOrderId}/diagnostics`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        return null;
      }
      return response.json();
    },
    enabled: !!repairOrderId && open,
    retry: false,
  });

  // Data Recovery Job query
  const { data: dataRecoveryJob, isLoading: dataRecoveryLoading } = useQuery<any>({
    queryKey: ["/api/repair-orders", repairOrderId, "data-recovery"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairOrderId}/data-recovery`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        return null;
      }
      return response.json();
    },
    enabled: !!repairOrderId && open,
    retry: false,
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/repair-orders/${repairOrderId}/quote`, { status });
    },
    onSuccess: () => {
      toast({ title: "Stato preventivo aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Calculate permissions based on user role and repair order ownership
  const canUpload = repair && user ? (
    user.role === 'admin' ||
    (user.role === 'customer' && repair.customerId === user.id) ||
    (user.role === 'reseller' && repair.resellerId === user.id) ||
    (user.role === 'repair_center' && repair.repairCenterId === user.repairCenterId)
  ) : false;

  const canDelete = repair && user ? (
    user.role === 'admin' ||
    (user.role === 'repair_center' && repair.repairCenterId === user.repairCenterId)
  ) : false;

  const canManageWorkflow = user ? (
    user.role === 'admin' || user.role === 'repair_center' || user.role === 'reseller'
  ) : false;

  const canViewWorkflow = user ? (
    user.role === 'admin' || user.role === 'repair_center' || user.role === 'reseller'
  ) : false;

  const startRepairMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/start-repair`);
    },
    onSuccess: () => {
      toast({ title: "Riparazione avviata" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const readyForPickupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/ready-for-pickup`);
    },
    onSuccess: () => {
      toast({ title: "Dispositivo pronto per il ritiro" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const skipQuoteMutation = useMutation({
    mutationFn: async (reason: 'garanzia' | 'omaggio') => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/skip-quote`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Preventivo saltato", description: "La riparazione procede senza preventivo" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      setSkipQuoteDialogOpen(false);
      setSkipQuoteReason(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ingressato": return <Badge variant="secondary" data-testid={`status-${status}`}>Ingressato</Badge>;
      case "in_diagnosi": return <Badge variant="outline" data-testid={`status-${status}`}>In Diagnosi</Badge>;
      case "preventivo_emesso": return <Badge variant="outline" data-testid={`status-${status}`}>Preventivo Emesso</Badge>;
      case "preventivo_accettato": return <Badge data-testid={`status-${status}`}>Preventivo Accettato</Badge>;
      case "preventivo_rifiutato": return <Badge variant="destructive" data-testid={`status-${status}`}>Preventivo Rifiutato</Badge>;
      case "attesa_ricambi": return <Badge variant="outline" data-testid={`status-${status}`}>Attesa Ricambi</Badge>;
      case "in_riparazione": return <Badge data-testid={`status-${status}`}>In Riparazione</Badge>;
      case "in_test": return <Badge data-testid={`status-${status}`}>In Test</Badge>;
      case "pronto_ritiro": return <Badge data-testid={`status-${status}`}>Pronto Ritiro</Badge>;
      case "consegnato": return <Badge variant="outline" data-testid={`status-${status}`}>Consegnato</Badge>;
      case "annullato": return <Badge variant="destructive" data-testid={`status-${status}`}>Annullato</Badge>;
      // Legacy stati
      case "pending": return <Badge variant="secondary" data-testid={`status-${status}`}>In attesa</Badge>;
      case "in_progress": return <Badge data-testid={`status-${status}`}>In lavorazione</Badge>;
      case "waiting_parts": return <Badge variant="outline" data-testid={`status-${status}`}>In attesa pezzi</Badge>;
      case "completed": return <Badge variant="outline" data-testid={`status-${status}`}>Completata</Badge>;
      case "delivered": return <Badge variant="outline" data-testid={`status-${status}`}>Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive" data-testid={`status-${status}`}>Annullata</Badge>;
      default: return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null | undefined, inCents: boolean = false) => {
    if (amount === null || amount === undefined) return "Da definire";
    const value = inCents ? amount / 100 : amount;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-repair-detail">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">Dettaglio Riparazione</DialogTitle>
          {repair && (
            <DialogDescription data-testid="text-order-number">
              Ordine #{repair.orderNumber}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : repair ? (
          <div className="space-y-6 mt-6">
            {/* Status and SLA */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Stato</span>
                {getStatusBadge(repair.status)}
              </div>
              
              {/* SLA Indicator */}
              {!['consegnato', 'annullato', 'cancelled'].includes(repair.status) && (() => {
                const statusEnteredAt = slaState?.stateEnteredAt || repair.createdAt;
                const { severity, minutesInState, phase } = computeSLASeverity(repair.status, statusEnteredAt);
                
                if (!severity || severity === "completed" || severity === "unknown") return null;
                
                const phaseLabels: Record<string, string> = {
                  diagnosis: "Diagnosi",
                  quote: "Preventivo", 
                  parts: "Ricambi",
                  test: "Test",
                  delivery: "Consegna",
                };
                
                const formatMinutes = (mins: number | null) => {
                  if (mins === null) return "";
                  if (mins >= 1440) {
                    const days = Math.floor(mins / 1440);
                    const hours = Math.floor((mins % 1440) / 60);
                    return `${days} giorni ${hours}h`;
                  }
                  if (mins >= 60) {
                    const hours = Math.floor(mins / 60);
                    const minutes = mins % 60;
                    return `${hours}h ${minutes}m`;
                  }
                  return `${mins} min`;
                };
                
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Tempo SLA</span>
                    <Badge 
                      variant="outline" 
                      className={
                        severity === "urgent" 
                          ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 gap-1 animate-pulse"
                          : severity === "late"
                          ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 gap-1"
                          : "bg-green-500/10 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 gap-1"
                      }
                    >
                      {severity === "urgent" ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : severity === "late" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      <span>
                        {severity === "urgent" ? "Urgente" : severity === "late" ? "In Ritardo" : "In Tempo"}
                        {minutesInState !== null && phase && ` - ${phaseLabels[phase] || phase}: ${formatMinutes(minutesInState)}`}
                      </span>
                    </Badge>
                  </div>
                );
              })()}
            </div>

            {/* Workflow Progress - Visual Timeline */}
            {canViewWorkflow && (
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Flusso di Lavoro
                    {!canManageWorkflow && (
                      <Badge variant="outline" className="ml-2 text-xs">Sola lettura</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Visual Progress Steps - Grid Layout for better visibility */}
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {(() => {
                      const quoteSkipped = !!repair.quoteBypassReason;
                      const bypassLabel = repair.quoteBypassReason === 'garanzia' ? 'Garanzia' : 
                                         repair.quoteBypassReason === 'omaggio' ? 'Omaggio' : '';
                      const BypassIcon = repair.quoteBypassReason === 'garanzia' ? Shield : Gift;
                      
                      const steps = [
                        { key: 'ingressato', label: 'Ingresso', icon: Package, num: 1 },
                        { key: 'in_diagnosi', label: 'Diagnosi', icon: Stethoscope, num: 2 },
                        { 
                          key: 'preventivo_emesso', 
                          label: quoteSkipped ? bypassLabel : 'Preventivo', 
                          icon: quoteSkipped ? BypassIcon : Receipt, 
                          num: 3,
                          skipped: quoteSkipped
                        },
                        { 
                          key: 'preventivo_accettato', 
                          label: quoteSkipped ? 'Saltato' : 'Accettato', 
                          icon: quoteSkipped ? SkipForward : CheckCircle2, 
                          num: 4,
                          skipped: quoteSkipped
                        },
                        { key: 'attesa_ricambi', label: 'Ricambi', icon: Package, num: 5 },
                        { key: 'in_riparazione', label: 'Riparazione', icon: Wrench, num: 6 },
                        { key: 'in_test', label: 'Collaudo', icon: ClipboardCheck, num: 7 },
                        { key: 'pronto_ritiro', label: 'Pronto', icon: CheckCircle, num: 8 },
                        { key: 'consegnato', label: 'Consegnato', icon: PackageCheck, num: 9 },
                      ];
                      
                      return steps.map((step) => {
                        const statusOrder = ['ingressato', 'in_diagnosi', 'preventivo_emesso', 'preventivo_accettato', 'attesa_ricambi', 'in_riparazione', 'in_test', 'pronto_ritiro', 'consegnato'];
                        const currentIndex = statusOrder.indexOf(repair.status);
                        const stepIndex = statusOrder.indexOf(step.key);
                        const isCompleted = stepIndex <= currentIndex;
                        const isCurrent = step.key === repair.status;
                        const isSkipped = 'skipped' in step && step.skipped;
                        const StepIcon = step.icon;
                        
                        return (
                          <div 
                            key={step.key} 
                            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                              isSkipped && isCompleted ? 'bg-amber-500/10' :
                              isCurrent ? 'bg-green-500/20 ring-2 ring-green-500 scale-105' :
                              isCompleted ? 'bg-green-500/10' :
                              'bg-muted/30'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${
                              isSkipped && isCompleted ? 'bg-amber-500 text-white' :
                              isCompleted ? 'bg-green-500 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {isCompleted ? (
                                isSkipped ? <SkipForward className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-xs font-bold">{step.num}</span>
                              )}
                            </div>
                            <StepIcon className={`h-4 w-4 mb-0.5 ${
                              isSkipped && isCompleted ? 'text-amber-500' :
                              isCompleted ? 'text-green-500' :
                              'text-muted-foreground'
                            }`} />
                            <span className={`text-center leading-tight text-[10px] ${
                              isSkipped && isCompleted ? 'font-bold text-amber-600 dark:text-amber-400' :
                              isCurrent ? 'font-bold text-green-600 dark:text-green-400' :
                              isCompleted ? 'text-green-600 dark:text-green-400 font-medium' :
                              'text-muted-foreground'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  <Separator />

                  {/* Next Action - The Main CTA */}
                  {canManageWorkflow && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">PROSSIMO PASSO</span>
                    </div>
                    
                    {/* Status: ingressato - Need to do diagnosis */}
                    {repair.status === 'ingressato' && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          Il dispositivo è stato ricevuto. <strong>Esegui la diagnosi</strong> per identificare i problemi.
                        </p>
                        <Button
                          onClick={() => setDiagnosisDialogOpen(true)}
                          className="w-full gap-2"
                          size="lg"
                          data-testid="button-diagnosis"
                        >
                          <Stethoscope className="h-5 w-5" />
                          Inizia Diagnosi
                        </Button>
                      </div>
                    )}

                    {/* Status: in_diagnosi - Need to complete diagnosis or create quote */}
                    {repair.status === 'in_diagnosi' && (
                      <div className={`${diagnosis ? 'bg-green-500/10 border-green-500/20' : 'bg-primary/10 border-primary/20'} border rounded-lg p-4 space-y-3`}>
                        <p className="text-sm">
                          {diagnosis ? (
                            <>
                              <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
                              <strong>Diagnosi completata!</strong> Ora <strong>crea il preventivo</strong> per il cliente.
                            </>
                          ) : (
                            <>
                              Diagnosi in corso. <strong>Completa la diagnosi</strong> e poi <strong>crea il preventivo</strong> per il cliente.
                            </>
                          )}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setDiagnosisDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-diagnosis-edit"
                          >
                            <Stethoscope className="h-4 w-4" />
                            {diagnosis ? 'Modifica Diagnosi' : 'Completa Diagnosi'}
                          </Button>
                          <Button
                            onClick={() => setQuoteDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-quote"
                          >
                            <Receipt className="h-4 w-4" />
                            Crea Preventivo
                          </Button>
                        </div>
                        {/* Skip Quote Button - only visible when diagnosis is complete */}
                        {diagnosis && (
                          <div className="pt-2 border-t border-border/50">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSkipQuoteDialogOpen(true)}
                              className="w-full gap-2 text-muted-foreground hover:text-foreground"
                              data-testid="button-skip-quote"
                            >
                              <SkipForward className="h-4 w-4" />
                              Salta Preventivo (Garanzia/Omaggio)
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status: preventivo_emesso - Waiting for customer response */}
                    {repair.status === 'preventivo_emesso' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          Preventivo inviato al cliente. <strong>Registra la risposta del cliente</strong> o modifica il preventivo.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => updateQuoteStatusMutation.mutate('accepted')}
                            disabled={updateQuoteStatusMutation.isPending}
                            className="gap-2"
                            data-testid="button-quote-accept"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Accetta
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => updateQuoteStatusMutation.mutate('rejected')}
                            disabled={updateQuoteStatusMutation.isPending}
                            className="gap-2"
                            data-testid="button-quote-reject"
                          >
                            <XCircle className="h-4 w-4" />
                            Rifiuta
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setQuoteDialogOpen(true)}
                          className="w-full gap-2"
                          data-testid="button-quote-edit"
                        >
                          <Receipt className="h-4 w-4" />
                          Modifica Preventivo
                        </Button>
                      </div>
                    )}

                    {/* Status: preventivo_accettato - Can order parts or start repair */}
                    {repair.status === 'preventivo_accettato' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          Preventivo accettato dal cliente. <strong>Ordina i ricambi</strong> se necessario, oppure <strong>avvia la riparazione</strong>.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setPartsDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-parts-order"
                          >
                            <Package className="h-4 w-4" />
                            Ordina Ricambi
                          </Button>
                          <Button
                            onClick={() => startRepairMutation.mutate()}
                            disabled={startRepairMutation.isPending}
                            className="gap-2"
                            data-testid="button-start-repair"
                          >
                            <Play className="h-4 w-4" />
                            Avvia Riparazione
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: attesa_ricambi - Waiting for parts */}
                    {repair.status === 'attesa_ricambi' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          In attesa dei ricambi. Quando arrivano, <strong>registra la ricezione</strong> e poi <strong>avvia la riparazione</strong>.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setPartsDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-parts-manage"
                          >
                            <Package className="h-4 w-4" />
                            Gestisci Ricambi
                          </Button>
                          <Button
                            onClick={() => startRepairMutation.mutate()}
                            disabled={startRepairMutation.isPending}
                            className="gap-2"
                            data-testid="button-start-repair"
                          >
                            <Play className="h-4 w-4" />
                            Avvia Riparazione
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: in_riparazione - Repair in progress */}
                    {repair.status === 'in_riparazione' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          Riparazione in corso. <strong>Registra le attività</strong> svolte. Quando finisci, <strong>esegui il collaudo</strong>.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setLogsDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-repair-logs"
                          >
                            <ClipboardList className="h-4 w-4" />
                            Log Attività
                          </Button>
                          <Button
                            onClick={() => setTestDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-test-checklist"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Vai al Collaudo
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: in_test - Testing in progress */}
                    {repair.status === 'in_test' && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          Collaudo in corso. <strong>Completa tutti i test</strong>. Quando tutto funziona, <strong>segna come pronto</strong>.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setTestDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-test-checklist"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            Checklist Test
                          </Button>
                          <Button
                            onClick={() => readyForPickupMutation.mutate()}
                            disabled={readyForPickupMutation.isPending}
                            className="gap-2"
                            data-testid="button-ready-pickup"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Pronto per Ritiro
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: pronto_ritiro - Ready for delivery */}
                    {repair.status === 'pronto_ritiro' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          Dispositivo pronto per il ritiro. <strong>Prenota un appuntamento</strong> o <strong>completa la consegna</strong> quando il cliente arriva.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!repair.repairCenterId) {
                                toast({
                                  title: "Centro riparazione non assegnato",
                                  description: "Questo ordine non ha un centro riparazione assegnato. Contatta l'amministratore.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setAppointmentDialogOpen(true);
                            }}
                            className="gap-2"
                            data-testid="button-book-appointment"
                          >
                            <CalendarCheck className="h-4 w-4" />
                            Prenota Appuntamento
                          </Button>
                          <Button
                            onClick={() => setDeliveryDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-delivery"
                          >
                            <PackageCheck className="h-4 w-4" />
                            Completa Consegna
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: consegnato - Completed */}
                    {repair.status === 'consegnato' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Riparazione completata e consegnata al cliente.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setDeliveryDialogOpen(true)}
                          className="w-full gap-2"
                          data-testid="button-view-delivery"
                        >
                          <PackageCheck className="h-4 w-4" />
                          Visualizza Dettagli Consegna
                        </Button>
                      </div>
                    )}

                    {/* Status: annullato - Cancelled */}
                    {repair.status === 'annullato' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          Ordine annullato.
                        </p>
                      </div>
                    )}
                  </div>
                  )}

                  <Separator />

                  {/* Documents Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Documenti</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/repair-orders/${repair.id}/intake-document`, '_blank')}
                        className="gap-1 text-xs"
                        data-testid="button-intake-document"
                      >
                        <Download className="h-3 w-3" />
                        Accettazione
                      </Button>
                      {!['ingressato'].includes(repair.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/repair-orders/${repair.id}/diagnosis-document`, '_blank')}
                          className="gap-1 text-xs"
                          data-testid="button-diagnosis-document"
                        >
                          <Download className="h-3 w-3" />
                          Diagnosi
                        </Button>
                      )}
                      {!['ingressato', 'in_diagnosi'].includes(repair.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/repair-orders/${repair.id}/quote-document`, '_blank')}
                          className="gap-1 text-xs"
                          data-testid="button-quote-document"
                        >
                          <Download className="h-3 w-3" />
                          Preventivo
                        </Button>
                      )}
                      {repair.status === 'consegnato' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/repair-orders/${repair.id}/delivery-document`, '_blank')}
                          className="gap-1 text-xs"
                          data-testid="button-delivery-document"
                        >
                          <Download className="h-3 w-3" />
                          Consegna
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Device Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Wrench className="h-4 w-4" />
                Dispositivo
              </div>
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="text-sm font-medium" data-testid="text-device-type">{repair.deviceType}</p>
                  </div>
                  {repair.brand && (
                    <div>
                      <p className="text-sm text-muted-foreground">Marca</p>
                      <p className="text-sm font-medium" data-testid="text-device-brand">{repair.brand}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modello</p>
                  <p className="text-sm font-medium" data-testid="text-device-model">{repair.deviceModel}</p>
                </div>
                {/* IMEI/Seriale */}
                {(repair.imei || repair.serial || repair.imeiNotReadable || repair.imeiNotPresent || repair.serialOnly) && (
                  <div className="grid grid-cols-2 gap-3">
                    {repair.imei && (
                      <div>
                        <p className="text-sm text-muted-foreground">IMEI</p>
                        <p className="text-sm font-mono" data-testid="text-device-imei">{repair.imei}</p>
                      </div>
                    )}
                    {repair.serial && (
                      <div>
                        <p className="text-sm text-muted-foreground">Seriale</p>
                        <p className="text-sm font-mono" data-testid="text-device-serial">{repair.serial}</p>
                      </div>
                    )}
                    {repair.imeiNotReadable && (
                      <div>
                        <p className="text-sm text-muted-foreground">IMEI</p>
                        <p className="text-sm text-amber-600" data-testid="text-imei-not-readable">Non leggibile</p>
                      </div>
                    )}
                    {repair.imeiNotPresent && (
                      <div>
                        <p className="text-sm text-muted-foreground">IMEI</p>
                        <p className="text-sm text-amber-600" data-testid="text-imei-not-present">Non presente</p>
                      </div>
                    )}
                    {repair.serialOnly && !repair.imei && (
                      <div>
                        <p className="text-sm text-muted-foreground">Note</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-serial-only">Solo seriale presente</p>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Problema</p>
                  <p className="text-sm" data-testid="text-issue-description">{repair.issueDescription}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Info */}
            {customer && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    Cliente
                  </div>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome</p>
                        <p className="text-sm font-medium" data-testid="text-customer-name">{customer.fullName || customer.username}</p>
                      </div>
                      {customer.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Telefono</p>
                          <p className="text-sm" data-testid="text-customer-phone">{customer.phone}</p>
                        </div>
                      )}
                    </div>
                    {customer.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-sm" data-testid="text-customer-email">{customer.email}</p>
                      </div>
                    )}
                    {customer.address && (
                      <div>
                        <p className="text-sm text-muted-foreground">Indirizzo</p>
                        <p className="text-sm" data-testid="text-customer-address">{customer.address}</p>
                      </div>
                    )}
                    {(customer.fiscalCode || customer.vatNumber) && (
                      <div className="grid grid-cols-2 gap-3">
                        {customer.fiscalCode && (
                          <div>
                            <p className="text-sm text-muted-foreground">Codice Fiscale</p>
                            <p className="text-sm font-mono" data-testid="text-customer-fiscal">{customer.fiscalCode}</p>
                          </div>
                        )}
                        {customer.vatNumber && (
                          <div>
                            <p className="text-sm text-muted-foreground">P.IVA</p>
                            <p className="text-sm font-mono" data-testid="text-customer-vat">{customer.vatNumber}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Acceptance Info */}
            {acceptance && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ClipboardCheck className="h-4 w-4" />
                    Dati Accettazione
                  </div>
                  <div className="grid gap-3">
                    {/* Declared Defects */}
                    {acceptance.declaredDefects && acceptance.declaredDefects.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Guasti Dichiarati</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {acceptance.declaredDefects.map((defect, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-defect-${idx}`}>
                              {defect}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Aesthetic Condition */}
                    {acceptance.aestheticCondition && (
                      <div>
                        <p className="text-sm text-muted-foreground">Condizione Estetica</p>
                        <p className="text-sm" data-testid="text-aesthetic-condition">{acceptance.aestheticCondition}</p>
                      </div>
                    )}
                    {acceptance.aestheticNotes && (
                      <div>
                        <p className="text-sm text-muted-foreground">Note Estetiche</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-aesthetic-notes">{acceptance.aestheticNotes}</p>
                      </div>
                    )}
                    {/* Accessories */}
                    {acceptance.accessories && acceptance.accessories.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Accessori Inclusi</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {acceptance.accessories.map((acc, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-accessory-${idx}`}>
                              {acc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Lock Code */}
                    {acceptance.hasLockCode && acceptance.lockCode && (
                      <div>
                        <p className="text-sm text-muted-foreground">Codice Sblocco</p>
                        <p className="text-sm font-mono" data-testid="text-lock-code">{acceptance.lockCode}</p>
                      </div>
                    )}
                    {acceptance.hasLockCode && acceptance.lockPattern && (
                      <div>
                        <p className="text-sm text-muted-foreground">Pattern Sblocco</p>
                        <p className="text-sm font-mono" data-testid="text-lock-pattern">{acceptance.lockPattern}</p>
                      </div>
                    )}
                    {/* Acceptance Date */}
                    <div>
                      <p className="text-sm text-muted-foreground">Data Accettazione</p>
                      <p className="text-sm" data-testid="text-acceptance-date">
                        {format(new Date(acceptance.acceptedAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}


            {/* Quote Info */}
            {quote && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Receipt className="h-4 w-4" />
                    Preventivo
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Numero</p>
                      <p className="text-sm font-mono" data-testid="text-quote-number">{quote.quoteNumber}</p>
                    </div>
                    
                    {/* Parts list */}
                    {quote.parts && (() => {
                      try {
                        const parts = typeof quote.parts === 'string' ? JSON.parse(quote.parts) : quote.parts;
                        if (Array.isArray(parts) && parts.length > 0) {
                          return (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Ricambi</p>
                              <div className="space-y-1 text-sm">
                                {parts.map((part: { name: string; quantity: number; unitPrice: number; price?: number }, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <span>{part.name} x{part.quantity}</span>
                                    <span className="font-medium">{formatCurrency(Number(part.price || part.unitPrice * part.quantity))}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      } catch (e) {
                        return null;
                      }
                    })()}
                    
                    {/* Labor cost */}
                    {Number(quote.laborCost) > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Manodopera</p>
                        <p className="text-sm font-medium" data-testid="text-labor-cost">
                          {formatCurrency(Number(quote.laborCost))}
                        </p>
                      </div>
                    )}
                    
                    <Separator className="my-1" />
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Totale</p>
                      <p className="text-lg font-bold text-primary" data-testid="text-quote-total">
                        {formatCurrency(Number(quote.totalAmount))}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Stato Preventivo</p>
                      {canManageWorkflow ? (
                        <Select
                          value={quote.status}
                          onValueChange={(value) => updateQuoteStatusMutation.mutate(value)}
                          disabled={updateQuoteStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-full" data-testid="select-quote-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Bozza</SelectItem>
                            <SelectItem value="sent">Inviato</SelectItem>
                            <SelectItem value="accepted">Accettato</SelectItem>
                            <SelectItem value="rejected">Rifiutato</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge 
                          variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'secondary'}
                          data-testid="badge-quote-status"
                        >
                          {quote.status === 'draft' && 'Bozza'}
                          {quote.status === 'sent' && 'Inviato'}
                          {quote.status === 'accepted' && 'Accettato'}
                          {quote.status === 'rejected' && 'Rifiutato'}
                        </Badge>
                      )}
                    </div>
                    {quote.validUntil && (
                      <div>
                        <p className="text-sm text-muted-foreground">Valido fino al</p>
                        <p className="text-sm" data-testid="text-quote-valid-until">
                          {format(new Date(quote.validUntil), "dd/MM/yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {repair.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    Note
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">
                    {repair.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Dates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                Date
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Creata</p>
                  <p className="text-sm" data-testid="text-created-at">
                    {format(new Date(repair.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aggiornata</p>
                  <p className="text-sm" data-testid="text-updated-at">
                    {format(new Date(repair.updatedAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Data Recovery Section - Show when diagnosis has unrepairable outcome or job exists */}
            {(diagnosis?.outcome === 'irriparabile' || diagnosis?.outcome === 'non_conveniente' || dataRecoveryJob) && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <HardDrive className="h-4 w-4 text-blue-500" />
                    Recupero Dati
                  </div>
                  
                  {dataRecoveryLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Caricamento...
                    </div>
                  ) : dataRecoveryJob ? (
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {dataRecoveryJob.handlingType === 'internal' ? (
                              <User className="h-4 w-4 text-green-500" />
                            ) : (
                              <Building2 className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium">
                              {dataRecoveryJob.handlingType === 'internal' ? 'Recupero Interno' : 'Laboratorio Esterno'}
                            </span>
                          </div>
                          <Badge variant={
                            dataRecoveryJob.status === 'completed' ? 'default' :
                            dataRecoveryJob.status === 'failed' ? 'destructive' :
                            dataRecoveryJob.status === 'cancelled' ? 'secondary' :
                            'outline'
                          }>
                            {dataRecoveryJob.status === 'pending' && 'In Attesa'}
                            {dataRecoveryJob.status === 'assigned' && 'Assegnato'}
                            {dataRecoveryJob.status === 'in_progress' && 'In Lavorazione'}
                            {dataRecoveryJob.status === 'awaiting_shipment' && 'In Attesa Spedizione'}
                            {dataRecoveryJob.status === 'shipped' && 'Spedito'}
                            {dataRecoveryJob.status === 'at_lab' && 'Al Laboratorio'}
                            {dataRecoveryJob.status === 'completed' && 'Completato'}
                            {dataRecoveryJob.status === 'partial' && 'Parziale'}
                            {dataRecoveryJob.status === 'failed' && 'Fallito'}
                            {dataRecoveryJob.status === 'cancelled' && 'Annullato'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Job: <span className="font-mono">{dataRecoveryJob.jobNumber}</span></p>
                          {dataRecoveryJob.externalLab && (
                            <p>Laboratorio: {dataRecoveryJob.externalLab.name}</p>
                          )}
                          {dataRecoveryJob.assignedUser && (
                            <p>Assegnato a: {dataRecoveryJob.assignedUser.fullName || dataRecoveryJob.assignedUser.username}</p>
                          )}
                        </div>
                        
                        {/* Timeline of events */}
                        {dataRecoveryJob.events && dataRecoveryJob.events.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timeline</p>
                            <div className="space-y-1">
                              {dataRecoveryJob.events.slice(0, 3).map((event: any) => (
                                <div key={event.id} className="flex items-center gap-2 text-xs">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {format(new Date(event.createdAt), "dd/MM HH:mm")}
                                  </span>
                                  <span>{event.title}</span>
                                </div>
                              ))}
                              {dataRecoveryJob.events.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  + altri {dataRecoveryJob.events.length - 3} eventi
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Download documents button for external handling */}
                        {dataRecoveryJob.handlingType === 'external' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/data-recovery/${dataRecoveryJob.id}/shipping-document`, '_blank')}
                              className="gap-1 text-xs"
                              data-testid="button-download-shipping-doc"
                            >
                              <Download className="h-3 w-3" />
                              Documento Invio
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/data-recovery/${dataRecoveryJob.id}/label`, '_blank')}
                              className="gap-1 text-xs"
                              data-testid="button-download-label"
                            >
                              <Truck className="h-3 w-3" />
                              Etichetta
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        {diagnosis?.outcome === 'irriparabile' 
                          ? 'Dispositivo dichiarato irriparabile. Vuoi proporre il recupero dati al cliente?'
                          : 'Riparazione non conveniente. Vuoi proporre il recupero dati al cliente?'
                        }
                      </p>
                      {canManageWorkflow && (
                        <Button
                          onClick={() => setDataRecoveryDialogOpen(true)}
                          className="w-full gap-2"
                          data-testid="button-start-data-recovery"
                        >
                          <HardDrive className="h-4 w-4" />
                          Avvia Recupero Dati
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Paperclip className="h-4 w-4" />
                Allegati
              </div>
              <AttachmentUploader
                repairOrderId={repair.id}
                canUpload={canUpload}
                canDelete={canDelete}
              />
            </div>

            {/* Dialogs */}
            {repairOrderId && (
              <>
                <DiagnosisFormDialog
                  open={diagnosisDialogOpen}
                  onOpenChange={setDiagnosisDialogOpen}
                  repairOrderId={repairOrderId}
                  repairOrder={repair ? { deviceTypeId: repair.deviceTypeId } as any : undefined}
                  existingDiagnosis={diagnosis}
                  onSuccess={(outcome) => {
                    queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
                    queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "diagnostics"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "data-recovery"] });
                    if (outcome === 'irriparabile' || outcome === 'non_conveniente') {
                      setTimeout(() => {
                        toast({
                          title: "Recupero Dati Suggerito",
                          description: "Il dispositivo è stato dichiarato " + (outcome === 'irriparabile' ? 'irriparabile' : 'non conveniente da riparare') + ". Vuoi proporre il recupero dati al cliente?",
                        });
                        setDataRecoveryDialogOpen(true);
                      }, 500);
                    }
                  }}
                />
                <QuoteFormDialog
                  open={quoteDialogOpen}
                  onOpenChange={setQuoteDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <PartsOrderDialog
                  open={partsDialogOpen}
                  onOpenChange={setPartsDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <RepairLogDialog
                  open={logsDialogOpen}
                  onOpenChange={setLogsDialogOpen}
                  repairOrderId={repairOrderId}
                />
                <TestChecklistDialog
                  open={testDialogOpen}
                  onOpenChange={setTestDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <DeliveryDialog
                  open={deliveryDialogOpen}
                  onOpenChange={setDeliveryDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <DataRecoveryDialog
                  open={dataRecoveryDialogOpen}
                  onOpenChange={setDataRecoveryDialogOpen}
                  repairOrderId={repairOrderId}
                  deviceDescription={repair ? `${repair.brand || ''} ${repair.deviceModel}`.trim() : undefined}
                  onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
                    queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "data-recovery"] });
                  }}
                />
                {repair.repairCenterId && (
                  <AppointmentBookingDialog
                    open={appointmentDialogOpen}
                    onOpenChange={setAppointmentDialogOpen}
                    repairOrderId={repairOrderId}
                    repairCenterId={repair.repairCenterId}
                    orderNumber={repair.orderNumber}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                  />
                )}
                
                {/* Skip Quote Dialog */}
                <Dialog open={skipQuoteDialogOpen} onOpenChange={setSkipQuoteDialogOpen}>
                  <DialogContent className="max-w-md" data-testid="dialog-skip-quote">
                    <DialogHeader>
                      <DialogTitle>Salta Preventivo</DialogTitle>
                      <DialogDescription>
                        Seleziona il motivo per cui vuoi saltare il preventivo. Questa azione non può essere annullata.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Info box showing next step based on diagnosis */}
                      <div className={`rounded-lg p-3 text-sm ${
                        diagnosis?.requiresExternalParts 
                          ? 'bg-amber-500/10 border border-amber-500/30' 
                          : 'bg-blue-500/10 border border-blue-500/30'
                      }`}>
                        <div className="flex items-center gap-2 font-medium mb-1">
                          {diagnosis?.requiresExternalParts ? (
                            <>
                              <Package className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-600 dark:text-amber-400">Richiede Ricambi</span>
                            </>
                          ) : (
                            <>
                              <Wrench className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400">Riparazione Diretta</span>
                            </>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {diagnosis?.requiresExternalParts 
                            ? "Dopo la conferma, lo stato passerà ad 'Attesa Ricambi' per permettere l'ordine dei pezzi."
                            : "Dopo la conferma, lo stato passerà direttamente a 'In Riparazione'."}
                        </p>
                        {!diagnosis?.requiresExternalParts && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Se servono ricambi, annulla e modifica la diagnosi spuntando "Richiede Ricambi Esterni".
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Scegli il motivo:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant={skipQuoteReason === 'garanzia' ? 'default' : 'outline'}
                          className="h-24 flex flex-col gap-2"
                          onClick={() => setSkipQuoteReason('garanzia')}
                          data-testid="button-reason-garanzia"
                        >
                          <Shield className="h-8 w-8" />
                          <span className="font-semibold">Garanzia</span>
                        </Button>
                        <Button
                          variant={skipQuoteReason === 'omaggio' ? 'default' : 'outline'}
                          className="h-24 flex flex-col gap-2"
                          onClick={() => setSkipQuoteReason('omaggio')}
                          data-testid="button-reason-omaggio"
                        >
                          <Gift className="h-8 w-8" />
                          <span className="font-semibold">Omaggio</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSkipQuoteDialogOpen(false);
                          setSkipQuoteReason(null);
                        }}
                        data-testid="button-cancel-skip"
                      >
                        Annulla
                      </Button>
                      <Button
                        onClick={() => skipQuoteReason && skipQuoteMutation.mutate(skipQuoteReason)}
                        disabled={!skipQuoteReason || skipQuoteMutation.isPending}
                        data-testid="button-confirm-skip"
                      >
                        {skipQuoteMutation.isPending ? 'Conferma...' : 'Conferma'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        ) : error ? (
          <div className="mt-6 text-center text-destructive" data-testid="error-repair-load">
            {error.message}
          </div>
        ) : (
          <div className="mt-6 text-center text-muted-foreground">
            Riparazione non trovata
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
