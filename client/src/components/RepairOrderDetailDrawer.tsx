import { useTranslation } from "react-i18next";
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
import { it } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { computeSLASeverity } from "@/components/SLABadge";
import { PatternLock } from "@/components/PatternLock";

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
  const { t } = useTranslation();
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
        if (response.status === 404) throw new Error(t("repair.notFound"));
        if (response.status === 403) throw new Error(t("permissions.accessDenied"));
        throw new Error(t("common.loadError"));
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
        throw new Error(t("repair.quoteLoadError"));
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
        throw new Error(t("repair.acceptanceDataLoadError"));
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
    enabled: !!repairOrderId && open,
    retry: false,
  });

  // Repair Centers query (for resellers and admins to change assignment)
  const repairCentersEndpoint = user?.role === 'reseller' 
    ? "/api/reseller/repair-centers" 
    : "/api/admin/repair-centers";
  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: [repairCentersEndpoint],
    enabled: open && (user?.role === 'reseller' || user?.role === 'admin'),
  });

  // Mutation to update repair center
  const updateRepairCenterMutation = useMutation({
    mutationFn: async (repairCenterId: string | null) => {
      return await apiRequest("PATCH", `/api/repair-orders/${repairOrderId}`, { repairCenterId });
    },
    onSuccess: () => {
      toast({ title: t("repair.repairCenterUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
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
      toast({ title: t("repair.quoteStatusUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("repair.repairStarted") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const readyForPickupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/ready-for-pickup`);
    },
    onSuccess: () => {
      toast({ title: t("repair.deviceReadyForPickup") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const skipQuoteMutation = useMutation({
    mutationFn: async (reason: 'garanzia' | 'omaggio') => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/skip-quote`, { reason });
    },
    onSuccess: () => {
      toast({ title: t("repair.quoteSkipped"), description: t("repair.repairProceedsWithoutQuote") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      setSkipQuoteDialogOpen(false);
      setSkipQuoteReason(null);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ingressato": return <Badge variant="secondary" data-testid={`status-${status}`}>{t("repair.statusIntake")}</Badge>;
      case "in_diagnosi": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repair.statusDiagnosis")}</Badge>;
      case "preventivo_emesso": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repair.statusQuoteIssued")}</Badge>;
      case "preventivo_accettato": return <Badge data-testid={`status-${status}`}>{t("repair.statusQuoteAccepted")}</Badge>;
      case "preventivo_rifiutato": return <Badge variant="destructive" data-testid={`status-${status}`}>{t("repair.statusQuoteRejected")}</Badge>;
      case "attesa_ricambi": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repair.statusWaitingParts")}</Badge>;
      case "in_riparazione": return <Badge data-testid={`status-${status}`}>{t("repair.statusRepairing")}</Badge>;
      case "in_test": return <Badge data-testid={`status-${status}`}>{t("repair.statusTesting")}</Badge>;
      case "pronto_ritiro": return <Badge data-testid={`status-${status}`}>{t("repair.statusReadyPickup")}</Badge>;
      case "consegnato": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repair.delivered")}</Badge>;
      case "cancelled": return <Badge variant="destructive" data-testid={`status-${status}`}>{t("common.cancelled")}</Badge>;
      // Legacy stati
      case "pending": return <Badge variant="secondary" data-testid={`status-${status}`}>{t("common.pending")}</Badge>;
      case "in_progress": return <Badge data-testid={`status-${status}`}>{t("kanban.inProgress")}</Badge>;
      case "waiting_parts": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repair.statusWaitingParts")}</Badge>;
      case "completed": return <Badge variant="outline" data-testid={`status-${status}`}>{t("common.completed")}</Badge>;
      case "delivered": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repair.delivered")}</Badge>;
      default: return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null | undefined, inCents: boolean = false) => {
    if (amount === null || amount === undefined) return t("common.toBeDecided");
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
          <DialogTitle data-testid="text-dialog-title">{t("repair.repairDetail")}</DialogTitle>
          {repair && (
            <DialogDescription data-testid="text-order-number">
              {t("repair.orderNumber", { number: repair.orderNumber })}
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
                <span className="text-sm font-medium text-muted-foreground">{t("common.status")}</span>
                {getStatusBadge(repair.status)}
              </div>
              
              {/* SLA Indicator */}
              {!['consegnato', 'cancelled'].includes(repair.status) && (() => {
                const statusEnteredAt = slaState?.stateEnteredAt || repair.createdAt;
                const { severity, minutesInState, phase } = computeSLASeverity(repair.status, statusEnteredAt);
                
                if (!severity || severity === "completed" || severity === "unknown") return null;
                
                const phaseLabels: Record<string, string> = {
                  diagnosis: t("repair.diagnosis"),
                  quote: t("repair.quote"), 
                  parts: t("parts.parts"),
                  test: t("repair.testing"),
                  delivery: t("delivery.delivery"),
                };
                
                const formatMinutes = (mins: number | null) => {
                  if (mins === null) return "";
                  if (mins >= 1440) {
                    const days = Math.floor(mins / 1440);
                    const hours = Math.floor((mins % 1440) / 60);
                    return t("sla.daysHours", { days, hours });
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
                    <span className="text-sm font-medium text-muted-foreground">{t("sla.slaTime")}</span>
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
                        {severity === "urgent" ? t("sla.urgent") : severity === "late" ? t("sla.late") : t("sla.inTime")}
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
                    {t("repair.workflow")}
                    {!canManageWorkflow && (
                      <Badge variant="outline" className="ml-2 text-xs">{t("common.readOnly")}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Visual Progress Steps - Grid Layout for better visibility */}
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    {(() => {
                      const quoteSkipped = !!repair.quoteBypassReason;
                      const bypassLabel = repair.quoteBypassReason === 'garanzia' ? t("repair.warranty") : 
                                         repair.quoteBypassReason === 'omaggio' ? t("repair.complimentary") : '';
                      const BypassIcon = repair.quoteBypassReason === 'garanzia' ? Shield : Gift;
                      
                      const steps = [
                        { key: 'ingressato', label: t("repair.intake"), icon: Package, num: 1 },
                        { key: 'in_diagnosi', label: t("repair.diagnosis"), icon: Stethoscope, num: 2 },
                        { 
                          key: 'preventivo_emesso', 
                          label: quoteSkipped ? bypassLabel : t("repair.quote"), 
                          icon: quoteSkipped ? BypassIcon : Receipt, 
                          num: 3,
                          skipped: quoteSkipped
                        },
                        { 
                          key: 'preventivo_accettato', 
                          label: quoteSkipped ? t("common.skipped") : t("common.accepted"), 
                          icon: quoteSkipped ? SkipForward : CheckCircle2, 
                          num: 4,
                          skipped: quoteSkipped
                        },
                        { key: 'attesa_ricambi', label: t("parts.parts"), icon: Package, num: 5 },
                        { key: 'in_riparazione', label: t("repair.repair"), icon: Wrench, num: 6 },
                        { key: 'in_test', label: t("repair.testing"), icon: ClipboardCheck, num: 7 },
                        { key: 'pronto_ritiro', label: t("repair.ready"), icon: CheckCircle, num: 8 },
                        { key: 'consegnato', label: t("repair.delivered"), icon: PackageCheck, num: 9 },
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
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm">{t("repair.nextStep")}</span>
                    </div>
                    
                    {/* Status: ingressato - Need to do diagnosis */}
                    {repair.status === 'ingressato' && (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          {t("repair.deviceReceivedDoDiagnosis")}
                        </p>
                        <Button
                          onClick={() => setDiagnosisDialogOpen(true)}
                          className="w-full gap-2"
                          size="lg"
                          data-testid="button-diagnosis"
                        >
                          <Stethoscope className="h-5 w-5" />
                          {t("repair.startDiagnosis")}
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
                              <strong>{t("diagnosis.diagnosisCompleted")}</strong> {t("repair.nowCreateQuote")}
                            </>
                          ) : (
                            <>
                              {t("repair.diagnosisInProgressDesc")}
                            </>
                          )}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setDiagnosisDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-diagnosis-edit"
                          >
                            <Stethoscope className="h-4 w-4" />
                            {diagnosis ? t("diagnosis.editDiagnosis") : t("diagnosis.completeDiagnosis")}
                          </Button>
                          <Button
                            onClick={() => setQuoteDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-quote"
                          >
                            <Receipt className="h-4 w-4" />
                            {t("quote.createQuote")}
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
                              {t("repair.skipQuoteWarrantyComplimentary")}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status: preventivo_emesso - Waiting for customer response */}
                    {repair.status === 'preventivo_emesso' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          {t("repair.quoteSentToCustomerDesc")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            onClick={() => updateQuoteStatusMutation.mutate('accepted')}
                            disabled={updateQuoteStatusMutation.isPending}
                            className="gap-2"
                            data-testid="button-quote-accept"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {t("common.accept")}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => updateQuoteStatusMutation.mutate('rejected')}
                            disabled={updateQuoteStatusMutation.isPending}
                            className="gap-2"
                            data-testid="button-quote-reject"
                          >
                            <XCircle className="h-4 w-4" />
                            {t("common.reject")}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setQuoteDialogOpen(true)}
                          className="w-full gap-2"
                          data-testid="button-quote-edit"
                        >
                          <Receipt className="h-4 w-4" />
                          {t("repair.editQuote")}
                        </Button>
                      </div>
                    )}

                    {/* Status: preventivo_accettato - Can order parts or start repair */}
                    {repair.status === 'preventivo_accettato' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          {t("repair.quoteAcceptedDesc")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setPartsDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-parts-order"
                          >
                            <Package className="h-4 w-4" />
                            {t("parts.orderParts")}
                          </Button>
                          <Button
                            onClick={() => startRepairMutation.mutate()}
                            disabled={startRepairMutation.isPending}
                            className="gap-2"
                            data-testid="button-start-repair"
                          >
                            <Play className="h-4 w-4" />
                            {t("repair.startRepair")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: attesa_ricambi - Waiting for parts */}
                    {repair.status === 'attesa_ricambi' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          {t("repair.waitingForPartsDesc")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setPartsDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-parts-manage"
                          >
                            <Package className="h-4 w-4" />
                            {t("parts.manageParts")}
                          </Button>
                          <Button
                            onClick={() => startRepairMutation.mutate()}
                            disabled={startRepairMutation.isPending}
                            className="gap-2"
                            data-testid="button-start-repair"
                          >
                            <Play className="h-4 w-4" />
                            {t("repair.startRepair")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: in_riparazione - Repair in progress */}
                    {repair.status === 'in_riparazione' && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          {t("repair.repairInProgressDesc")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setLogsDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-repair-logs"
                          >
                            <ClipboardList className="h-4 w-4" />
                            {t("repair.activityLog")}
                          </Button>
                          <Button
                            onClick={() => setTestDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-test-checklist"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            {t("repair.goToTesting")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: in_test - Testing in progress */}
                    {repair.status === 'in_test' && (
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm">
                          {t("repair.testingInProgressDesc")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setTestDialogOpen(true)}
                            className="gap-2"
                            data-testid="button-test-checklist"
                          >
                            <ClipboardCheck className="h-4 w-4" />
                            {t("repair.testChecklist")}
                          </Button>
                          <Button
                            onClick={() => readyForPickupMutation.mutate()}
                            disabled={readyForPickupMutation.isPending}
                            className="gap-2"
                            data-testid="button-ready-pickup"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {t("repair.readyForPickup")}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Status: pronto_ritiro - Ready for delivery */}
                    {repair.status === 'pronto_ritiro' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                        {appointment && appointment.status !== 'cancelled' ? (
                          <>
                            <div className="flex flex-wrap items-center gap-2 text-green-600 dark:text-green-400">
                              <CalendarCheck className="h-4 w-4" />
                              <span className="font-medium text-sm">{t("appointment.booked")}</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-md p-3 space-y-2">
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {format(new Date(appointment.date), "EEEE d MMMM yyyy", { locale: it })}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{t("appointment.hours")} {appointment.startTime} - {appointment.endTime}</span>
                              </div>
                              {appointment.notes && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {t("common.notes")}: {appointment.notes}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setAppointmentDialogOpen(true)}
                                className="gap-2"
                                data-testid="button-reschedule-appointment"
                              >
                                <CalendarCheck className="h-4 w-4" />
                                {t("common.edit")}
                              </Button>
                              <Button
                                onClick={() => setDeliveryDialogOpen(true)}
                                className="gap-2"
                                data-testid="button-delivery"
                              >
                                <PackageCheck className="h-4 w-4" />
                                {t("delivery.completeDelivery")}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-sm">
                              {t("repair.deviceReadyBookOrComplete")}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  if (!repair.repairCenterId) {
                                    toast({
                                      title: t("repair.repairCenterNotAssigned"),
                                      description: t("repair.contactAdminForCenter"),
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
                                {t("repair.bookAppointment")}
                              </Button>
                              <Button
                                onClick={() => setDeliveryDialogOpen(true)}
                                className="gap-2"
                                data-testid="button-delivery"
                              >
                                <PackageCheck className="h-4 w-4" />
                                {t("delivery.completeDelivery")}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* Status: consegnato - Completed */}
                    {repair.status === 'consegnato' && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {t("repair.repairCompletedDelivered")}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setDeliveryDialogOpen(true)}
                          className="w-full gap-2"
                          data-testid="button-view-delivery"
                        >
                          <PackageCheck className="h-4 w-4" />
                          {t("repair.viewDeliveryDetails")}
                        </Button>
                      </div>
                    )}

                    {/* Status: cancelled - Cancelled */}
                    {repair.status === 'cancelled' && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                          {t("repair.orderCancelled")}
                        </p>
                      </div>
                    )}
                  </div>
                  )}

                  <Separator />

                  {/* Documents Section */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("common.documents")}</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/repair-orders/${repair.id}/intake-document`, '_blank')}
                        className="gap-1 text-xs"
                        data-testid="button-intake-document"
                      >
                        <Download className="h-3 w-3" />
                        {t("repair.acceptance")}
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
                          {t("repair.diagnosis")}
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
                          {t("repair.quote")}
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
                          {t("delivery.delivery")}
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
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <Wrench className="h-4 w-4" />
                {t("repair.device")}
              </div>
              <div className="grid gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("common.type")}</p>
                    <p className="text-sm font-medium" data-testid="text-device-type">{repair.deviceType}</p>
                  </div>
                  {repair.brand && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.brand")}</p>
                      <p className="text-sm font-medium" data-testid="text-device-brand">{repair.brand}</p>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.model")}</p>
                  <p className="text-sm font-medium" data-testid="text-device-model">{repair.deviceModel}</p>
                </div>
                {/* IMEI/Seriale */}
                {(repair.imei || repair.serial || repair.imeiNotReadable || repair.imeiNotPresent || repair.serialOnly) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {repair.imei && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("repair.imei")}</p>
                        <p className="text-sm font-mono" data-testid="text-device-imei">{repair.imei}</p>
                      </div>
                    )}
                    {repair.serial && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.serialNumber")}</p>
                        <p className="text-sm font-mono" data-testid="text-device-serial">{repair.serial}</p>
                      </div>
                    )}
                    {repair.imeiNotReadable && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("repair.imei")}</p>
                        <p className="text-sm text-amber-600" data-testid="text-imei-not-readable">{t("repair.imeiNotReadable")}</p>
                      </div>
                    )}
                    {repair.imeiNotPresent && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("repair.imei")}</p>
                        <p className="text-sm text-amber-600" data-testid="text-imei-not-present">{t("repair.imeiNotPresent")}</p>
                      </div>
                    )}
                    {repair.serialOnly && !repair.imei && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.notes")}</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-serial-only">{t("repair.serialOnlyPresent")}</p>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t("repair.problem")}</p>
                  <p className="text-sm" data-testid="text-issue-description">{repair.issueDescription}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Info */}
            {customer && (
              <>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <User className="h-4 w-4" />
                    {t("common.customer")}
                  </div>
                  <div className="grid gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.name")}</p>
                        <p className="text-sm font-medium" data-testid="text-customer-name">{customer.fullName || customer.username}</p>
                      </div>
                      {customer.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">{t("common.phone")}</p>
                          <p className="text-sm" data-testid="text-customer-phone">{customer.phone}</p>
                        </div>
                      )}
                    </div>
                    {customer.email && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.email")}</p>
                        <p className="text-sm" data-testid="text-customer-email">{customer.email}</p>
                      </div>
                    )}
                    {customer.address && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.addressLabel")}</p>
                        <p className="text-sm" data-testid="text-customer-address">{customer.address}</p>
                      </div>
                    )}
                    {(customer.fiscalCode || customer.vatNumber) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {customer.fiscalCode && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t("fiscal.fiscalCode")}</p>
                            <p className="text-sm font-mono" data-testid="text-customer-fiscal">{customer.fiscalCode}</p>
                          </div>
                        )}
                        {customer.vatNumber && (
                          <div>
                            <p className="text-sm text-muted-foreground">{t("fiscal.vatNumber")}</p>
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

            {/* Repair Center Assignment (for resellers and admins) */}
            {(user?.role === 'reseller' || user?.role === 'admin') && (
              <>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4" />
                    {t("repair.repairCenter")}
                  </div>
                  <div className="grid gap-3">
                    <Select
                      value={repair.repairCenterId || "unassigned"}
                      onValueChange={(value) => {
                        const newCenterId = value === "unassigned" ? null : value;
                        updateRepairCenterMutation.mutate(newCenterId);
                      }}
                      disabled={updateRepairCenterMutation.isPending}
                    >
                      <SelectTrigger className="w-full" data-testid="select-repair-center">
                        <SelectValue placeholder={t("repair.selectCenter")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">{t("repair.unassigned")}</SelectItem>
                        {repairCenters.map((rc) => (
                          <SelectItem key={rc.id} value={rc.id}>
                            {rc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updateRepairCenterMutation.isPending && (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t("common.updating")}
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
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <ClipboardCheck className="h-4 w-4" />
                    {t("repair.acceptanceData")}
                  </div>
                  <div className="grid gap-3">
                    {/* Declared Defects */}
                    {acceptance.declaredDefects && acceptance.declaredDefects.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("repair.declaredDefects")}</p>
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
                        <p className="text-sm text-muted-foreground">{t("repair.cosmeticCondition")}</p>
                        <p className="text-sm" data-testid="text-aesthetic-condition">{acceptance.aestheticCondition}</p>
                      </div>
                    )}
                    {acceptance.aestheticNotes && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("repair.aestheticNotes")}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-aesthetic-notes">{acceptance.aestheticNotes}</p>
                      </div>
                    )}
                    {/* Accessories */}
                    {acceptance.accessories && acceptance.accessories.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("repair.includedAccessories")}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {acceptance.accessories.map((acc, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-accessory-${idx}`}>
                              {acc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Lock Code Section */}
                    {acceptance.hasLockCode && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground font-medium">{t("repair.unlockCodes")}</p>
                        {acceptance.lockCode && (
                          <div>
                            <p className="text-xs text-muted-foreground">{t("repair.pinPassword")}:</p>
                            <p className="text-sm font-mono" data-testid="text-lock-code">{acceptance.lockCode}</p>
                          </div>
                        )}
                        {acceptance.lockPattern && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t("repair.patternSequence")}:</p>
                            <PatternLock 
                              value={acceptance.lockPattern} 
                              readOnly 
                            />
                            <p className="sr-only" data-testid="text-lock-pattern">{acceptance.lockPattern}</p>
                          </div>
                        )}
                        {!acceptance.lockCode && !acceptance.lockPattern && (
                          <p className="text-sm text-muted-foreground italic">
                            {t("repair.lockCodeIndicatedNotProvided")}
                          </p>
                        )}
                      </div>
                    )}
                    {/* Acceptance Date */}
                    <div>
                      <p className="text-sm text-muted-foreground">{t("repair.acceptanceDate")}</p>
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
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <Receipt className="h-4 w-4" />
                    {t("repair.quote")}
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.number")}</p>
                      <p className="text-sm font-mono" data-testid="text-quote-number">{quote.quoteNumber}</p>
                    </div>
                    
                    {/* Parts list */}
                    {quote.parts && (() => {
                      try {
                        const parts = typeof quote.parts === 'string' ? JSON.parse(quote.parts) : quote.parts;
                        if (Array.isArray(parts) && parts.length > 0) {
                          return (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">{t("parts.parts")}</p>
                              <div className="space-y-1 text-sm">
                                {parts.map((part: { name: string; quantity: number; unitPrice: number; price?: number }, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center">
                                    <span>{part.name} x{part.quantity}</span>
                                    <span className="font-medium">{formatCurrency(Number(part.price || part.unitPrice * part.quantity), true)}</span>
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
                        <p className="text-sm text-muted-foreground">{t("quote.laborCost")}</p>
                        <p className="text-sm font-medium" data-testid="text-labor-cost">
                          {formatCurrency(Number(quote.laborCost), true)}
                        </p>
                      </div>
                    )}
                    
                    <Separator className="my-1" />
                    
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">{t("common.total")}</p>
                      <p className="text-lg font-bold text-primary" data-testid="text-quote-total">
                        {formatCurrency(Number(quote.totalAmount), true)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t("repair.quoteStatus")}</p>
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
                            <SelectItem value="draft">{t("common.draft")}</SelectItem>
                            <SelectItem value="sent">{t("common.sent")}</SelectItem>
                            <SelectItem value="accepted">{t("common.accepted")}</SelectItem>
                            <SelectItem value="rejected">{t("common.rejected")}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge 
                          variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'secondary'}
                          data-testid="badge-quote-status"
                        >
                          {quote.status === 'draft' && t("common.draft")}
                          {quote.status === 'sent' && t("common.sent")}
                          {quote.status === 'accepted' && t("common.accepted")}
                          {quote.status === 'rejected' && t("common.rejected")}
                        </Badge>
                      )}
                    </div>
                    {quote.validUntil && (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("quote.validUntil")}</p>
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
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    {t("common.notes")}
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
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                {t("common.dates")}
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.created")}</p>
                  <p className="text-sm" data-testid="text-created-at">
                    {format(new Date(repair.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.updated")}</p>
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
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <HardDrive className="h-4 w-4 text-blue-500" />
                    {t("dataRecovery.dataRecovery")}
                  </div>
                  
                  {dataRecoveryLoading ? (
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </div>
                  ) : dataRecoveryJob ? (
                    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            {dataRecoveryJob.handlingType === 'internal' ? (
                              <User className="h-4 w-4 text-green-500" />
                            ) : (
                              <Building2 className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium">
                              {dataRecoveryJob.handlingType === 'internal' ? t("dataRecovery.internalRecovery") : t("dataRecovery.externalLab")}
                            </span>
                          </div>
                          <Badge variant={
                            dataRecoveryJob.status === 'completed' ? 'default' :
                            dataRecoveryJob.status === 'failed' ? 'destructive' :
                            dataRecoveryJob.status === 'cancelled' ? 'secondary' :
                            'outline'
                          }>
                            {dataRecoveryJob.status === 'pending' && t("common.pending")}
                            {dataRecoveryJob.status === 'assigned' && t("common.assigned")}
                            {dataRecoveryJob.status === 'in_progress' && t("common.inProgress")}
                            {dataRecoveryJob.status === 'awaiting_shipment' && t("dataRecovery.awaitingShipment")}
                            {dataRecoveryJob.status === 'shipped' && t("shipping.shipped")}
                            {dataRecoveryJob.status === 'at_lab' && t("dataRecovery.atLab")}
                            {dataRecoveryJob.status === 'completed' && t("common.completed")}
                            {dataRecoveryJob.status === 'partial' && t("common.partial")}
                            {dataRecoveryJob.status === 'failed' && t("common.failed")}
                            {dataRecoveryJob.status === 'cancelled' && t("common.cancelled")}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>{t("dataRecovery.job")}: <span className="font-mono">{dataRecoveryJob.jobNumber}</span></p>
                          {dataRecoveryJob.externalLab && (
                            <p>{t("dataRecovery.laboratory")}: {dataRecoveryJob.externalLab.name}</p>
                          )}
                          {dataRecoveryJob.assignedUser && (
                            <p>{t("common.assignedTo")}: {dataRecoveryJob.assignedUser.fullName || dataRecoveryJob.assignedUser.username}</p>
                          )}
                        </div>
                        
                        {/* Timeline of events */}
                        {dataRecoveryJob.events && dataRecoveryJob.events.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timeline</p>
                            <div className="space-y-1">
                              {dataRecoveryJob.events.slice(0, 3).map((event: any) => (
                                <div key={event.id} className="flex flex-wrap items-center gap-2 text-xs">
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
                              {t("dataRecovery.shipmentDocument")}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/data-recovery/${dataRecoveryJob.id}/label`, '_blank')}
                              className="gap-1 text-xs"
                              data-testid="button-download-label"
                            >
                              <Truck className="h-3 w-3" />
                              {t("dataRecovery.label")}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        {diagnosis?.outcome === 'irriparabile' 
                          ? t("dataRecovery.deviceIrrepairableOffer")
                          : t("dataRecovery.repairNotConvenientOffer")
                        }
                      </p>
                      {canManageWorkflow && (
                        <Button
                          onClick={() => setDataRecoveryDialogOpen(true)}
                          className="w-full gap-2"
                          data-testid="button-start-data-recovery"
                        >
                          <HardDrive className="h-4 w-4" />
                          {t("dataRecovery.startDataRecovery")}
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
              <div className="flex flex-wrap items-center gap-2 font-medium">
                <Paperclip className="h-4 w-4" />
                {t("common.attachments")}
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
                          title: t("dataRecovery.dataRecoverySuggested"),
                          description: t("repair.deviceDeclared") + " " + (outcome === 'irriparabile' ? t("repair.irreparable") : t("repair.notConvenient")) + ". " + t("dataRecovery.offerToCustomer"),
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
                      <DialogTitle>{t("repair.skipQuote")}</DialogTitle>
                      <DialogDescription>
                        {t("repair.selectReasonSkipQuote")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {/* Info box showing next step based on diagnosis */}
                      <div className={`rounded-lg p-3 text-sm ${
                        diagnosis?.requiresExternalParts 
                          ? 'bg-amber-500/10 border border-amber-500/30' 
                          : 'bg-blue-500/10 border border-blue-500/30'
                      }`}>
                        <div className="flex flex-wrap items-center gap-2 font-medium mb-1">
                          {diagnosis?.requiresExternalParts ? (
                            <>
                              <Package className="h-4 w-4 text-amber-500" />
                              <span className="text-amber-600 dark:text-amber-400">{t("repair.requiresParts")}</span>
                            </>
                          ) : (
                            <>
                              <Wrench className="h-4 w-4 text-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400">{t("repair.directRepair")}</span>
                            </>
                          )}
                        </div>
                        <p className="text-muted-foreground">
                          {diagnosis?.requiresExternalParts 
                            ? t("repair.afterConfirmWaitParts")
                            : t("repair.afterConfirmDirectRepair")}
                        </p>
                        {!diagnosis?.requiresExternalParts && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("repair.ifNeedPartsModifyDiagnosis")}
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {t("repair.chooseReason")}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          variant={skipQuoteReason === 'garanzia' ? 'default' : 'outline'}
                          className="h-24 flex flex-col gap-2"
                          onClick={() => setSkipQuoteReason('garanzia')}
                          data-testid="button-reason-garanzia"
                        >
                          <Shield className="h-8 w-8" />
                          <span className="font-semibold">{t("repair.warranty")}</span>
                        </Button>
                        <Button
                          variant={skipQuoteReason === 'omaggio' ? 'default' : 'outline'}
                          className="h-24 flex flex-col gap-2"
                          onClick={() => setSkipQuoteReason('omaggio')}
                          data-testid="button-reason-omaggio"
                        >
                          <Gift className="h-8 w-8" />
                          <span className="font-semibold">{t("repair.complimentary")}</span>
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
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={() => skipQuoteReason && skipQuoteMutation.mutate(skipQuoteReason)}
                        disabled={!skipQuoteReason || skipQuoteMutation.isPending}
                        data-testid="button-confirm-skip"
                      >
                        {skipQuoteMutation.isPending ? t("common.confirming") : t("common.confirm")}
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
            {t("repair.repairNotFound")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
