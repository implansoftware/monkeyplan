import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { DiagnosisFormDialog } from "@/components/DiagnosisFormDialog";
import { QuoteFormDialog } from "@/components/QuoteFormDialog";
import { PartsOrderDialog } from "@/components/PartsOrderDialog";
import { RepairLogDialog } from "@/components/RepairLogDialog";
import { TestChecklistDialog } from "@/components/TestChecklistDialog";
import { DeliveryDialog } from "@/components/DeliveryDialog";
import { DataRecoveryDialog } from "@/components/DataRecoveryDialog";
import { AppointmentBookingDialog } from "@/components/AppointmentBookingDialog";
import { PatternLock } from "@/components/PatternLock";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench, Euro, FileText, Paperclip, Calendar, Package, ClipboardList,
  ClipboardCheck, PackageCheck, Play, CheckCircle, Stethoscope, Receipt,
  Download, User, ArrowRight, Circle, CheckCircle2, AlertCircle, AlertTriangle, Gift, Shield, SkipForward,
  HardDrive, Building2, Clock, Truck, Loader2, XCircle, CalendarCheck, ArrowLeft, ShoppingBag
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { computeSLASeverity } from "@/components/SLABadge";
import { useRoute, useLocation } from "wouter";

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
  skipDiagnosis: boolean;
  skipDiagnosisReason: string | null;
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

type DeliveryAppointment = {
  id: string;
  repairOrderId: string;
  repairCenterId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

type RepairCenter = {
  id: string;
  name: string;
  resellerId: string | null;
};

type SuggestedAccessory = {
  id: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  imageUrl: string | null;
  specs: {
    accessoryType: string | null;
    color: string | null;
    material: string | null;
  } | null;
  deviceCompatibilities: Array<{
    brandName: string | null;
    modelName: string | null;
  }>;
};

interface RepairDetailPageProps {
  routePattern: string;
  backPath: string;
}

export default function RepairDetailPage({ routePattern, backPath }: RepairDetailPageProps) {
  const [match, params] = useRoute(routePattern);
  const [, setLocation] = useLocation();
  const repairOrderId = (params as { id?: string })?.id;
  
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
  const [skipDiagnosisDialogOpen, setSkipDiagnosisDialogOpen] = useState(false);
  const [skipDiagnosisReason, setSkipDiagnosisReason] = useState("");
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
    enabled: !!repairOrderId,
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
    enabled: !!repairOrderId,
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
    enabled: !!repairOrderId,
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
    enabled: !!repairOrderId,
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
    enabled: !!repair?.customerId,
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
    enabled: !!repairOrderId,
    retry: false,
  });

  const { data: appointment } = useQuery<DeliveryAppointment | null>({
    queryKey: ["/api/repair-orders", repairOrderId, "appointment"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairOrderId}/appointment`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        return null;
      }
      return response.json();
    },
    enabled: !!repairOrderId,
    retry: false,
  });

  const repairCentersEndpoint = user?.role === 'reseller' 
    ? "/api/reseller/repair-centers" 
    : "/api/admin/repair-centers";
  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: [repairCentersEndpoint],
    enabled: user?.role === 'reseller' || user?.role === 'admin',
  });

  const updateRepairCenterMutation = useMutation({
    mutationFn: async (repairCenterId: string | null) => {
      return await apiRequest("PATCH", `/api/repair-orders/${repairOrderId}`, { repairCenterId });
    },
    onSuccess: () => {
      toast({ title: "Centro di riparazione aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

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
    enabled: !!repairOrderId,
    retry: false,
  });

  // Suggested accessories for pickup (only when status is pronto_ritiro)
  const { data: suggestedAccessories = [], isLoading: accessoriesLoading } = useQuery<SuggestedAccessory[]>({
    queryKey: ["/api/repairs", repairOrderId, "suggested-accessories"],
    queryFn: async () => {
      const response = await fetch(`/api/repairs/${repairOrderId}/suggested-accessories`, {
        credentials: "include",
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!repairOrderId && repair?.status === 'pronto_ritiro',
    staleTime: 60000,
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

  // Determine the correct API endpoint based on user role
  const getSkipDiagnosisEndpoint = () => {
    switch (user?.role) {
      case 'admin':
      case 'admin_staff':
        return `/api/admin/repairs/${repairOrderId}/skip-diagnosis`;
      case 'reseller':
      case 'reseller_staff':
        return `/api/reseller/repairs/${repairOrderId}/skip-diagnosis`;
      case 'repair_center':
        return `/api/repair-center/repairs/${repairOrderId}/skip-diagnosis`;
      default:
        return `/api/admin/repairs/${repairOrderId}/skip-diagnosis`;
    }
  };

  const skipDiagnosisMutation = useMutation({
    mutationFn: async (reason?: string) => {
      // Refetch current repair state to ensure we have fresh data
      const freshResponse = await fetch(`/api/repair-orders/${repairOrderId}`, {
        credentials: "include",
      });
      if (!freshResponse.ok) {
        throw new Error("Errore nel verificare lo stato attuale");
      }
      const freshRepair = await freshResponse.json();
      
      // Verify status is still 'ingressato' before proceeding
      if (freshRepair.status !== 'ingressato') {
        throw new Error(`Lo stato è cambiato a '${freshRepair.status}'. Aggiorna la pagina.`);
      }
      
      return await apiRequest("POST", getSkipDiagnosisEndpoint(), { reason });
    },
    onSuccess: () => {
      toast({ title: "Diagnosi saltata", description: "Si procede direttamente al preventivo" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      setSkipDiagnosisDialogOpen(false);
      setSkipDiagnosisReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
      // Invalidate to refresh the UI with current state
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      setSkipDiagnosisDialogOpen(false);
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
      case "cancelled": return <Badge variant="destructive" data-testid={`status-${status}`}>Annullato</Badge>;
      case "pending": return <Badge variant="secondary" data-testid={`status-${status}`}>In attesa</Badge>;
      case "in_progress": return <Badge data-testid={`status-${status}`}>In lavorazione</Badge>;
      case "waiting_parts": return <Badge variant="outline" data-testid={`status-${status}`}>In attesa pezzi</Badge>;
      case "completed": return <Badge variant="outline" data-testid={`status-${status}`}>Completata</Badge>;
      case "delivered": return <Badge variant="outline" data-testid={`status-${status}`}>Consegnata</Badge>;
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

  const workflowSteps = [
    { key: 'ingressato', label: 'Ingresso', icon: Package, num: 1 },
    { key: 'in_diagnosi', label: 'Diagnosi', icon: Stethoscope, num: 2 },
    { key: 'preventivo_emesso', label: 'Preventivo', icon: Receipt, num: 3 },
    { key: 'preventivo_accettato', label: 'Accettato', icon: CheckCircle, num: 4 },
    { key: 'attesa_ricambi', label: 'Ricambi', icon: Package, num: 5 },
    { key: 'in_riparazione', label: 'Riparazione', icon: Wrench, num: 6 },
    { key: 'in_test', label: 'Collaudo', icon: ClipboardCheck, num: 7 },
    { key: 'pronto_ritiro', label: 'Pronto', icon: PackageCheck, num: 8 },
    { key: 'consegnato', label: 'Consegnato', icon: Truck, num: 9 },
  ];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      diagnosis: "Diagnosi",
      quote: "Preventivo",
      repair: "Riparazione",
      testing: "Collaudo",
      delivery: "Consegna",
    };
    return labels[status] || status;
  };

  const getCurrentStepIndex = (status: string) => {
    const index = workflowSteps.findIndex(step => step.key === status);
    if (index !== -1) return index;
    if (status === 'preventivo_rifiutato') return 3;
    return 0;
  };

  const getSLADisplay = () => {
    if (!slaState?.status || !slaState?.stateEnteredAt) return null;
    const { severity, minutesInState, phase } = computeSLASeverity(slaState.status, slaState.stateEnteredAt);

    if (!minutesInState || !phase) return null;

    const hours = Math.floor(minutesInState / 60);
    const minutes = minutesInState % 60;
    const timeStr = hours > 0 
      ? `${hours}h ${minutes}min`
      : `${minutes} min`;
    
    const phaseLabel = getStatusLabel(phase);
    
    if (severity === 'late') {
      return (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Scaduto - {phaseLabel}: {timeStr}</span>
        </div>
      );
    }
    
    if (severity === 'urgent') {
      return (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <Clock className="h-4 w-4" />
          <span>Urgente - {phaseLabel}: {timeStr}</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Clock className="h-4 w-4" />
        <span>In Tempo - {phaseLabel}: {timeStr}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{error?.message || "Riparazione non trovata"}</p>
        <Button onClick={() => setLocation(backPath)} className="mt-4" data-testid="button-back-error">
          Torna alla Lista
        </Button>
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(repair.status);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(backPath)}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate" data-testid="text-page-title">
            Dettaglio Riparazione
          </h1>
          <p className="text-muted-foreground" data-testid="text-order-number">
            Ordine #{repair.orderNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(repair.status)}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Tempo SLA</span>
            {getSLADisplay()}
          </div>
        </div>

        {canViewWorkflow && (
          <Card data-testid="card-workflow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Flusso di Lavoro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {workflowSteps.slice(0, 5).map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;
                  
                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                        isCurrent 
                          ? 'border-primary bg-primary/10' 
                          : isCompleted 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                            : 'border-muted bg-muted/30'
                      }`}
                      data-testid={`workflow-step-${step.key}`}
                    >
                      <div className={`rounded-full p-2 ${
                        isCurrent 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-xs mt-1 text-center ${
                        isCurrent ? 'font-medium' : ''
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {workflowSteps.slice(5).map((step, index) => {
                  const actualIndex = index + 5;
                  const isCompleted = actualIndex < currentStepIndex;
                  const isCurrent = actualIndex === currentStepIndex;
                  const Icon = step.icon;
                  
                  return (
                    <div
                      key={step.key}
                      className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                        isCurrent 
                          ? 'border-primary bg-primary/10' 
                          : isCompleted 
                            ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                            : 'border-muted bg-muted/30'
                      }`}
                      data-testid={`workflow-step-${step.key}`}
                    >
                      <div className={`rounded-full p-2 ${
                        isCurrent 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-xs mt-1 text-center ${
                        isCurrent ? 'font-medium' : ''
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {canManageWorkflow && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    PROSSIMO PASSO
                  </p>
                  
                  {repair.status === 'ingressato' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        Il dispositivo è stato <strong>ingressato</strong>. Inizia la <strong>diagnosi tecnica</strong>.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setDiagnosisDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-start-diagnosis"
                        >
                          <Stethoscope className="mr-2 h-4 w-4" />
                          Inizia Diagnosi
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSkipDiagnosisDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-skip-diagnosis"
                        >
                          <SkipForward className="mr-2 h-4 w-4" />
                          Salta Diagnosi
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'in_diagnosi' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {repair.skipDiagnosis ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <SkipForward className="h-4 w-4" />
                            <span>Diagnosi saltata{repair.skipDiagnosisReason ? `: ${repair.skipDiagnosisReason}` : ''}</span>
                          </div>
                          <p className="text-sm">
                            <strong>Crea il preventivo</strong> per il cliente.
                          </p>
                        </div>
                      ) : diagnosis ? (
                        <p className="text-sm">
                          <strong>Diagnosi completata!</strong> Ora <strong>crea il preventivo</strong> per il cliente.
                        </p>
                      ) : (
                        <p className="text-sm">
                          Diagnosi in corso. <strong>Completa la diagnosi</strong> e poi <strong>crea il preventivo</strong> per il cliente.
                        </p>
                      )}
                      <div className="flex gap-2">
                        {!repair.skipDiagnosis && (
                          <Button
                            variant="outline"
                            onClick={() => setDiagnosisDialogOpen(true)}
                            className="flex-1"
                            data-testid="button-edit-diagnosis"
                          >
                            <Stethoscope className="mr-2 h-4 w-4" />
                            {diagnosis ? 'Modifica Diagnosi' : 'Completa Diagnosi'}
                          </Button>
                        )}
                        <Button
                          onClick={() => setQuoteDialogOpen(true)}
                          className="flex-1"
                          disabled={!diagnosis && !repair.skipDiagnosis}
                          data-testid="button-create-quote"
                        >
                          <Receipt className="mr-2 h-4 w-4" />
                          Crea Preventivo
                        </Button>
                      </div>
                      {(diagnosis || repair.skipDiagnosis) && (
                        <div className="pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-muted-foreground"
                            onClick={() => setSkipQuoteDialogOpen(true)}
                            data-testid="button-skip-quote"
                          >
                            <SkipForward className="mr-2 h-4 w-4" />
                            Salta Preventivo (Garanzia/Omaggio)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {repair.status === 'preventivo_emesso' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        <strong>Preventivo inviato</strong> al cliente. In attesa di risposta.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => updateQuoteStatusMutation.mutate('rejected')}
                          disabled={updateQuoteStatusMutation.isPending}
                          className="flex-1"
                          data-testid="button-reject-quote"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rifiutato
                        </Button>
                        <Button
                          onClick={() => updateQuoteStatusMutation.mutate('accepted')}
                          disabled={updateQuoteStatusMutation.isPending}
                          className="flex-1"
                          data-testid="button-accept-quote"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Accettato
                        </Button>
                      </div>
                    </div>
                  )}

                  {(repair.status === 'preventivo_accettato' || (repair.quoteBypassReason && repair.status === 'in_diagnosi')) && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {repair.quoteBypassReason && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          {repair.quoteBypassReason === 'garanzia' ? (
                            <><Shield className="h-4 w-4" /> Riparazione in Garanzia</>
                          ) : (
                            <><Gift className="h-4 w-4" /> Riparazione Omaggio</>
                          )}
                        </div>
                      )}
                      <p className="text-sm">
                        {repair.quoteBypassReason 
                          ? "Preventivo saltato. Ordina i ricambi o avvia la riparazione."
                          : "Preventivo accettato! Ordina i ricambi necessari o avvia la riparazione."
                        }
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setPartsDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-order-parts"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Ordina Ricambi
                        </Button>
                        <Button
                          onClick={() => startRepairMutation.mutate()}
                          disabled={startRepairMutation.isPending}
                          className="flex-1"
                          data-testid="button-start-repair"
                        >
                          {startRepairMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Avvia Riparazione
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'attesa_ricambi' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        <strong>In attesa dei ricambi.</strong> Quando arrivano, avvia la riparazione.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setPartsDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-manage-parts"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Gestisci Ricambi
                        </Button>
                        <Button
                          onClick={() => startRepairMutation.mutate()}
                          disabled={startRepairMutation.isPending}
                          className="flex-1"
                          data-testid="button-start-repair-parts"
                        >
                          {startRepairMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="mr-2 h-4 w-4" />
                          )}
                          Avvia Riparazione
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'in_riparazione' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        <strong>Riparazione in corso.</strong> Registra le attività e passa al collaudo.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={() => setPartsDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-order-parts-repair"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Ordina Ricambi
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setLogsDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-repair-log"
                        >
                          <ClipboardList className="mr-2 h-4 w-4" />
                          Registra Attività
                        </Button>
                        <Button
                          onClick={() => setTestDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-start-test"
                        >
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Avvia Collaudo
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'in_test' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        <strong>Collaudo in corso.</strong> Completa i test e segna come pronto.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setTestDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-continue-test"
                        >
                          <ClipboardCheck className="mr-2 h-4 w-4" />
                          Gestisci Collaudo
                        </Button>
                        <Button
                          onClick={() => readyForPickupMutation.mutate()}
                          disabled={readyForPickupMutation.isPending}
                          className="flex-1"
                          data-testid="button-ready-pickup"
                        >
                          {readyForPickupMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <PackageCheck className="mr-2 h-4 w-4" />
                          )}
                          Pronto per Ritiro
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'pronto_ritiro' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        Dispositivo pronto per il ritiro. <strong>Prenota un appuntamento</strong> o <strong>completa la consegna</strong> quando il cliente arriva.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setAppointmentDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-book-appointment"
                        >
                          <CalendarCheck className="mr-2 h-4 w-4" />
                          Prenota Appuntamento
                        </Button>
                        <Button
                          onClick={() => setDeliveryDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-complete-delivery"
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Completa Consegna
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Suggested Accessories for pickup */}
                  {repair.status === 'pronto_ritiro' && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                        <ShoppingBag className="h-3 w-3" />
                        ACCESSORI CONSIGLIATI PER IL CLIENTE
                      </p>
                      {accessoriesLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Caricamento accessori compatibili...
                        </div>
                      )}
                      {!accessoriesLoading && suggestedAccessories.length === 0 && (
                        <p className="text-sm text-muted-foreground p-3 text-center">
                          Nessun accessorio compatibile trovato per questo dispositivo.
                        </p>
                      )}
                      <div className="grid gap-3">
                        {suggestedAccessories.slice(0, 4).map((accessory) => (
                          <div
                            key={accessory.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
                            data-testid={`card-suggested-accessory-${accessory.id}`}
                          >
                            {accessory.imageUrl ? (
                              <img
                                src={accessory.imageUrl}
                                alt={accessory.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{accessory.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {accessory.specs?.accessoryType && (
                                  <Badge variant="secondary" className="text-xs">
                                    {accessory.specs.accessoryType}
                                  </Badge>
                                )}
                                {accessory.specs?.color && (
                                  <span>{accessory.specs.color}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">
                                {(accessory.unitPrice / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                              </p>
                            </div>
                          </div>
                        ))}
                        {suggestedAccessories.length > 4 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{suggestedAccessories.length - 4} altri accessori compatibili
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {repair.status === 'consegnato' && (
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <strong>Riparazione completata e consegnata!</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-3">DOCUMENTI</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/repair-orders/${repairOrderId}/intake-document`, '_blank')}
                    disabled={!acceptance}
                    data-testid="button-download-acceptance"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Accettazione
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/repair-orders/${repairOrderId}/diagnosis-document`, '_blank')}
                    disabled={!diagnosis}
                    data-testid="button-download-diagnosis"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Diagnosi
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/repair-orders/${repairOrderId}/quote-document`, '_blank')}
                    disabled={!quote}
                    data-testid="button-download-quote"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Preventivo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-device">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Dispositivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <p className="font-medium">{repair.deviceType}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Marca</span>
                  <p className="font-medium">{repair.brand || "-"}</p>
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Modello</span>
                <p className="font-medium">{repair.deviceModel}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Problema</span>
                <p className="font-medium">{repair.issueDescription}</p>
              </div>
              {(repair.imei || repair.serial) && (
                <div className="grid grid-cols-2 gap-4">
                  {repair.imei && (
                    <div>
                      <span className="text-sm text-muted-foreground">IMEI</span>
                      <p className="font-medium font-mono text-sm">{repair.imei}</p>
                    </div>
                  )}
                  {repair.serial && (
                    <div>
                      <span className="text-sm text-muted-foreground">Seriale</span>
                      <p className="font-medium font-mono text-sm">{repair.serial}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {(user?.role === 'admin' || user?.role === 'reseller') && (
            <Card data-testid="card-repair-center">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Centro di Riparazione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={repair.repairCenterId || "unassigned"}
                  onValueChange={(value) => updateRepairCenterMutation.mutate(value === "unassigned" ? null : value)}
                  disabled={updateRepairCenterMutation.isPending}
                >
                  <SelectTrigger data-testid="select-repair-center">
                    <SelectValue placeholder="Seleziona centro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assegnato</SelectItem>
                    {repairCenters.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {acceptance && (
            <Card data-testid="card-acceptance">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Dati Accettazione
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {acceptance.declaredDefects && acceptance.declaredDefects.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Guasti Dichiarati</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {acceptance.declaredDefects.map((defect, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {defect}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {acceptance.aestheticCondition && (
                  <div>
                    <span className="text-sm text-muted-foreground">Condizione Estetica</span>
                    <p className="font-medium">{acceptance.aestheticCondition}</p>
                  </div>
                )}
                {acceptance.aestheticNotes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Note Estetiche</span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{acceptance.aestheticNotes}</p>
                  </div>
                )}
                {acceptance.accessories && acceptance.accessories.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Accessori Inclusi</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {acceptance.accessories.map((acc, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {acc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {acceptance.hasLockCode && (
                  <div className="space-y-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground font-medium">Codici di Sblocco</span>
                    {acceptance.lockCode && (
                      <div>
                        <span className="text-xs text-muted-foreground">PIN/Password:</span>
                        <p className="font-mono text-sm" data-testid="text-lock-code">{acceptance.lockCode}</p>
                      </div>
                    )}
                    {acceptance.lockPattern && (
                      <div>
                        <span className="text-xs text-muted-foreground">Sequenza Pattern:</span>
                        <div className="mt-1">
                          <PatternLock value={acceptance.lockPattern} readOnly />
                        </div>
                      </div>
                    )}
                    {!acceptance.lockCode && !acceptance.lockPattern && (
                      <p className="text-sm text-muted-foreground italic">
                        Cliente ha indicato presenza codice ma non fornito
                      </p>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Data Accettazione</span>
                  <p className="font-medium">{format(new Date(acceptance.acceptedAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {customer && (
            <Card data-testid="card-customer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Nome</span>
                  <p className="font-medium">{customer.fullName || customer.username}</p>
                </div>
                {customer.email && (
                  <div>
                    <span className="text-sm text-muted-foreground">Email</span>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                )}
                {customer.phone && (
                  <div>
                    <span className="text-sm text-muted-foreground">Telefono</span>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {quote && (
            <Card data-testid="card-quote">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Preventivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Numero</span>
                  <span className="font-mono text-sm">{quote.quoteNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Totale</span>
                  <span className="font-medium">{formatCurrency(quote.totalAmount, true)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stato</span>
                  <Badge variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'outline'}>
                    {quote.status === 'pending' ? 'In Attesa' : quote.status === 'accepted' ? 'Accettato' : 'Rifiutato'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card data-testid="card-attachments">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Allegati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentUploader
              repairOrderId={repairOrderId!}
              canUpload={canUpload}
              canDelete={canDelete}
            />
          </CardContent>
        </Card>

        {diagnosis && diagnosis.dataRecoveryRequested && (
          <Card data-testid="card-data-recovery">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Recupero Dati
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataRecoveryLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : dataRecoveryJob ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stato</span>
                    <Badge>{dataRecoveryJob.status}</Badge>
                  </div>
                  {dataRecoveryJob.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground">Note</span>
                      <p className="text-sm">{dataRecoveryJob.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Il cliente ha richiesto il recupero dati
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setDataRecoveryDialogOpen(true)}
                    data-testid="button-start-data-recovery"
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    Gestisci Recupero Dati
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {appointment && (
          <Card data-testid="card-appointment">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                Appuntamento Consegna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {format(new Date(appointment.date), "EEEE d MMMM yyyy", { locale: it })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {appointment.startTime} - {appointment.endTime}
                  </p>
                </div>
                <Badge variant={appointment.status === 'confirmed' ? 'default' : 'outline'}>
                  {appointment.status === 'confirmed' ? 'Confermato' : 'In Attesa'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {repair.notes && (
          <Card data-testid="card-notes">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{repair.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <DiagnosisFormDialog
        open={diagnosisDialogOpen}
        onOpenChange={setDiagnosisDialogOpen}
        repairOrderId={repairOrderId!}
        repairOrder={{ deviceTypeId: repair.deviceTypeId }}
        existingDiagnosis={diagnosis}
      />

      <QuoteFormDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        repairOrderId={repairOrderId!}
      />

      <PartsOrderDialog
        open={partsDialogOpen}
        onOpenChange={setPartsDialogOpen}
        repairOrderId={repairOrderId!}
      />

      <RepairLogDialog
        open={logsDialogOpen}
        onOpenChange={setLogsDialogOpen}
        repairOrderId={repairOrderId!}
      />

      <TestChecklistDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        repairOrderId={repairOrderId!}
      />

      <DeliveryDialog
        open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        repairOrderId={repairOrderId!}
      />

      <DataRecoveryDialog
        open={dataRecoveryDialogOpen}
        onOpenChange={setDataRecoveryDialogOpen}
        repairOrderId={repairOrderId!}
      />

      {repair.repairCenterId && (
        <AppointmentBookingDialog
          open={appointmentDialogOpen}
          onOpenChange={setAppointmentDialogOpen}
          repairOrderId={repairOrderId!}
          repairCenterId={repair.repairCenterId}
          orderNumber={repair.orderNumber}
        />
      )}

      <Dialog open={skipDiagnosisDialogOpen} onOpenChange={setSkipDiagnosisDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salta Diagnosi</DialogTitle>
            <DialogDescription>
              Conferma per saltare la diagnosi tecnica e procedere direttamente al preventivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo (opzionale)</label>
              <Input
                placeholder="Es: Problema già noto, cliente abituale..."
                value={skipDiagnosisReason}
                onChange={(e) => setSkipDiagnosisReason(e.target.value)}
                data-testid="input-skip-diagnosis-reason"
              />
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Saltando la diagnosi, il preventivo verrà creato senza dati diagnostici.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDiagnosisDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => skipDiagnosisMutation.mutate(skipDiagnosisReason || undefined)}
              disabled={skipDiagnosisMutation.isPending}
              data-testid="button-confirm-skip-diagnosis"
            >
              {skipDiagnosisMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SkipForward className="mr-2 h-4 w-4" />
              )}
              Conferma e Salta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skipQuoteDialogOpen} onOpenChange={setSkipQuoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salta Preventivo</DialogTitle>
            <DialogDescription>
              Seleziona il motivo per cui il preventivo viene saltato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={skipQuoteReason === 'garanzia' ? 'default' : 'outline'}
                onClick={() => setSkipQuoteReason('garanzia')}
                className="h-20 flex flex-col items-center justify-center gap-2"
                data-testid="button-skip-warranty"
              >
                <Shield className="h-6 w-6" />
                <span>Garanzia</span>
              </Button>
              <Button
                variant={skipQuoteReason === 'omaggio' ? 'default' : 'outline'}
                onClick={() => setSkipQuoteReason('omaggio')}
                className="h-20 flex flex-col items-center justify-center gap-2"
                data-testid="button-skip-gift"
              >
                <Gift className="h-6 w-6" />
                <span>Omaggio</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipQuoteDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => skipQuoteReason && skipQuoteMutation.mutate(skipQuoteReason)}
              disabled={!skipQuoteReason || skipQuoteMutation.isPending}
              data-testid="button-confirm-skip"
            >
              {skipQuoteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
