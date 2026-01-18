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
  HardDrive, Building2, Clock, Truck, Loader2, XCircle, CalendarCheck, ArrowLeft, ShoppingBag, Smartphone, Tag
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
  customer?: Customer | null;
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
  username?: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  fiscalCode: string | null;
  vatNumber: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
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
  address: string | null;
  city: string | null;
  cap: string | null;
  provincia: string | null;
  phone: string | null;
  email: string | null;
  ownerName?: string;
  isActive: boolean;
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

type WarrantyProduct = {
  id: string;
  resellerId: string | null;
  name: string;
  description: string | null;
  durationMonths: number;
  priceInCents: number;
  coverageType: "basic" | "extended" | "full";
  isActive: boolean;
};

type RepairWarranty = {
  id: string;
  repairOrderId: string;
  warrantyProductId: string;
  status: "offered" | "accepted" | "declined" | "expired";
  priceSnapshot: number;
  durationMonthsSnapshot: number;
  coverageTypeSnapshot: string;
  productNameSnapshot: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
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

  // Use unified endpoint that includes sub-reseller centers for franchising/GDO
  // Also load for repair_center role so they can see their own center details
  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
    enabled: user?.role === 'reseller' || user?.role === 'reseller_staff' || user?.role === 'admin' || user?.role === 'repair_center',
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

  // Warranty products available for offering
  const { data: warrantyProducts = [], isLoading: warrantyProductsLoading } = useQuery<WarrantyProduct[]>({
    queryKey: ["/api/warranty-products", repairOrderId],
    queryFn: async () => {
      const url = repairOrderId ? `/api/warranty-products?repairOrderId=${repairOrderId}` : "/api/warranty-products";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch warranty products");
      return res.json();
    },
    enabled: !!repairOrderId && repair?.status === 'pronto_ritiro' && user?.role !== 'customer',
  });

  // Existing warranty for this repair
  const { data: repairWarranty, isLoading: warrantyLoading } = useQuery<RepairWarranty | null>({
    queryKey: ["/api/repairs", repairOrderId, "warranty"],
    queryFn: async () => {
      const response = await fetch(`/api/repairs/${repairOrderId}/warranty`, {
        credentials: "include",
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!repairOrderId,
  });

  // Offer warranty mutation
  const offerWarrantyMutation = useMutation({
    mutationFn: async (warrantyProductId: string) => {
      return await apiRequest("POST", `/api/repairs/${repairOrderId}/warranty`, { warrantyProductId });
    },
    onSuccess: () => {
      toast({ title: "Garanzia offerta", description: "L'offerta di garanzia è stata creata con successo." });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repairOrderId, "warranty"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Accept warranty mutation
  const acceptWarrantyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repairs/${repairOrderId}/warranty/accept`);
    },
    onSuccess: () => {
      toast({ title: "Garanzia accettata", description: "La garanzia è stata attivata con successo." });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repairOrderId, "warranty"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Decline warranty mutation
  const declineWarrantyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repairs/${repairOrderId}/warranty/decline`);
    },
    onSuccess: () => {
      toast({ title: "Garanzia rifiutata", description: "L'offerta di garanzia è stata rifiutata." });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repairOrderId, "warranty"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Suggested devices for replacement (when diagnosis outcome is irriparabile)
  const suggestedDeviceIds = diagnosis?.suggestedDeviceIds || [];
  const { data: suggestedDevices = [] } = useQuery<Array<{
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    imageUrl: string | null;
    unitPrice: number;
  }>>({
    queryKey: ["/api/products/by-ids", suggestedDeviceIds],
    queryFn: async () => {
      if (!suggestedDeviceIds.length) return [];
      // Fetch each product by ID
      const products = await Promise.all(
        suggestedDeviceIds.map(async (id: string) => {
          const res = await fetch(`/api/products/${id}`, { credentials: "include" });
          if (!res.ok) return null;
          const data = await res.json();
          // The endpoint returns { product, inventory, attachments } - extract product
          return data.product || data;
        })
      );
      return products.filter(Boolean);
    },
    enabled: suggestedDeviceIds.length > 0,
    staleTime: 60000,
  });

  // Test checklist query
  const { data: testChecklist } = useQuery<{
    displayTest?: boolean;
    touchTest?: boolean;
    batteryTest?: boolean;
    audioTest?: boolean;
    cameraTest?: boolean;
    connectivityTest?: boolean;
    buttonsTest?: boolean;
    sensorsTest?: boolean;
    chargingTest?: boolean;
    softwareTest?: boolean;
    overallResult?: boolean;
    notes?: string;
    testedAt?: string;
  } | null>({
    queryKey: ["/api/repair-orders", repairOrderId, "test-checklist"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairOrderId}/test-checklist`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 403) return null;
        return null;
      }
      return response.json();
    },
    enabled: !!repairOrderId,
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

  // Customer-specific mutations for quote acceptance/rejection
  const acceptQuoteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/quote/accept`);
    },
    onSuccess: () => {
      toast({ title: "Preventivo accettato", description: "La riparazione procederà come indicato nel preventivo." });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/quote/reject`);
    },
    onSuccess: () => {
      toast({ title: "Preventivo rifiutato", description: "La riparazione è stata annullata." });
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
    (user.role === 'reseller_staff' && repair.resellerId === user.resellerId) ||
    (user.role === 'repair_center' && repair.repairCenterId === user.repairCenterId)
  ) : false;

  const canDelete = repair && user ? (
    user.role === 'admin' ||
    (user.role === 'repair_center' && repair.repairCenterId === user.repairCenterId)
  ) : false;

  const canManageWorkflow = user ? (
    user.role === 'admin' || user.role === 'repair_center' || user.role === 'reseller' || user.role === 'reseller_staff'
  ) : false;

  const canViewWorkflow = user ? (
    user.role === 'admin' || user.role === 'repair_center' || user.role === 'reseller' || user.role === 'reseller_staff' || user.role === 'customer'
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
    if (status === 'preventivo_rifiutato') return 2; // Stay at Preventivo step (index 2)
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
    <div className="space-y-6" data-testid="page-repair-detail">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setLocation(backPath)}
                className="shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                      Lavorazione #{repair.orderNumber}
                    </h1>
                    <p className="text-sm text-muted-foreground" data-testid="text-order-number">
                      {repair.deviceType} - {repair.deviceModel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {getStatusBadge(repair.status)}
              {getSLADisplay()}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {canViewWorkflow && (
          <Card data-testid="card-workflow" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                <span>Flusso di Lavoro</span>
                <Badge variant="outline" className="ml-auto">
                  Fase {currentStepIndex + 1} di {workflowSteps.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Avanzamento</span>
                  <span>{Math.round(((currentStepIndex + 1) / workflowSteps.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                    style={{ width: `${((currentStepIndex + 1) / workflowSteps.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Workflow Steps - Horizontal Stepper */}
              <div className="relative">
                {/* Connection Line */}
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-muted hidden sm:block" />
                <div 
                  className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-emerald-500 to-primary transition-all duration-500 hidden sm:block"
                  style={{ width: `calc(${((currentStepIndex + 1) / workflowSteps.length) * 100}% - 24px)` }}
                />
                
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
                  {workflowSteps.map((step, index) => {
                    // Check if step is truly completed - for diagnosis step, verify diagnosis exists or was skipped
                    let isCompleted = index <= currentStepIndex;
                    const isSkipped = step.key === 'in_diagnosi' && !diagnosis && !repair.skipDiagnosis && index < currentStepIndex;
                    if (isSkipped) {
                      isCompleted = false;
                    }
                    // Check if quote was rejected - show Preventivo step as rejected
                    const isRejected = repair.status === 'preventivo_rifiutato' && step.key === 'preventivo_emesso';
                    if (isRejected) {
                      isCompleted = false;
                    }
                    const isCurrent = index === currentStepIndex + 1 && repair.status !== 'preventivo_rifiutato';
                    const Icon = step.icon;
                    
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center relative group"
                        data-testid={`workflow-step-${step.key}`}
                      >
                        <div className={`relative z-10 h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isRejected
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110 ring-4 ring-red-500/20'
                            : isCurrent 
                              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110 ring-4 ring-primary/20' 
                              : isSkipped
                                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50'
                                : isCompleted 
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                  : 'bg-muted text-muted-foreground'
                        }`}>
                          {isRejected ? (
                            <XCircle className="h-5 w-5" />
                          ) : isSkipped ? (
                            <AlertTriangle className="h-5 w-5" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        <span className={`text-xs mt-2 text-center font-medium ${
                          isRejected
                            ? 'text-red-600 dark:text-red-400'
                            : isCurrent 
                              ? 'text-primary' 
                              : isSkipped
                                ? 'text-amber-600 dark:text-amber-400'
                                : isCompleted 
                                  ? 'text-emerald-600 dark:text-emerald-400' 
                                  : 'text-muted-foreground'
                        }`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {canManageWorkflow && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Prossimo Passo
                    </p>
                  </div>
                  
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
                      <div className="pt-3 border-t">
                        <Button
                          variant="secondary"
                          className="w-full bg-[#ffff00]"
                          onClick={() => setDiagnosisDialogOpen(true)}
                          data-testid="button-add-diagnosis-later"
                        >
                          <Stethoscope className="mr-2 h-4 w-4" />
                          {diagnosis ? 'Modifica Diagnosi' : 'Aggiungi Diagnosi'}
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
                      <div className="pt-3 border-t">
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => setDiagnosisDialogOpen(true)}
                          data-testid="button-add-diagnosis-accepted"
                        >
                          <Stethoscope className="mr-2 h-4 w-4" />
                          {diagnosis ? 'Modifica Diagnosi' : 'Aggiungi Diagnosi'}
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
                        {user?.role === 'customer' ? (
                          <>Il tuo dispositivo è <strong>pronto per il ritiro</strong>. Prenota un appuntamento per venire a ritirarlo.</>
                        ) : (
                          <>Dispositivo pronto per il ritiro. <strong>Prenota un appuntamento</strong> o <strong>completa la consegna</strong> quando il cliente arriva.</>
                        )}
                      </p>
                      
                      {/* Show existing appointment if booked */}
                      {appointment && (
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-200 dark:border-green-800 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <CalendarCheck className="h-4 w-4" />
                            <span className="font-medium">Appuntamento prenotato dal cliente</span>
                          </div>
                          <div className="text-sm">
                            <p>Data: <strong>{appointment.date}</strong></p>
                            <p>Ora: <strong>{appointment.startTime} - {appointment.endTime}</strong></p>
                            {appointment.notes && (
                              <p className="mt-1 text-muted-foreground">Note: {appointment.notes}</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant={user?.role === 'customer' ? 'default' : 'outline'}
                          onClick={() => setAppointmentDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-book-appointment"
                        >
                          <CalendarCheck className="mr-2 h-4 w-4" />
                          {appointment ? 'Gestisci Appuntamento' : 'Prenota Appuntamento'}
                        </Button>
                        {user?.role !== 'customer' && (
                          <Button
                            onClick={() => setDeliveryDialogOpen(true)}
                            className="flex-1"
                            data-testid="button-complete-delivery"
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Completa Consegna
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Suggested Accessories for pickup - only for staff, not customers */}
                  {repair.status === 'pronto_ritiro' && user?.role !== 'customer' && (
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

                  {/* Warranty Offer Section - only for staff, not customers */}
                  {repair.status === 'pronto_ritiro' && user?.role !== 'customer' && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        OFFERTA GARANZIA ESTESA
                      </p>
                      
                      {warrantyLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Caricamento...
                        </div>
                      )}

                      {/* Existing warranty offer status */}
                      {!warrantyLoading && repairWarranty && (
                        <div className={`rounded-lg p-4 space-y-3 ${
                          repairWarranty.status === 'accepted' 
                            ? 'bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800' 
                            : repairWarranty.status === 'declined'
                            ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                            : 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield className={`h-4 w-4 ${
                                repairWarranty.status === 'accepted' ? 'text-emerald-600' :
                                repairWarranty.status === 'declined' ? 'text-red-600' : 'text-blue-600'
                              }`} />
                              <span className="font-medium text-sm">{repairWarranty.productNameSnapshot}</span>
                            </div>
                            <Badge variant={
                              repairWarranty.status === 'accepted' ? 'default' :
                              repairWarranty.status === 'declined' ? 'destructive' : 'secondary'
                            }>
                              {repairWarranty.status === 'offered' ? 'In attesa' :
                               repairWarranty.status === 'accepted' ? 'Accettata' :
                               repairWarranty.status === 'declined' ? 'Rifiutata' : 'Scaduta'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Durata:</span>
                              <p className="font-medium">{repairWarranty.durationMonthsSnapshot} mesi</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Copertura:</span>
                              <p className="font-medium capitalize">{repairWarranty.coverageTypeSnapshot}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Prezzo:</span>
                              <p className="font-medium">
                                {(repairWarranty.priceSnapshot / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                              </p>
                            </div>
                          </div>
                          {repairWarranty.status === 'offered' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => declineWarrantyMutation.mutate()}
                                disabled={declineWarrantyMutation.isPending}
                                className="flex-1"
                                data-testid="button-decline-warranty"
                              >
                                {declineWarrantyMutation.isPending ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <XCircle className="mr-2 h-3 w-3" />
                                )}
                                Rifiuta
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => acceptWarrantyMutation.mutate()}
                                disabled={acceptWarrantyMutation.isPending}
                                className="flex-1"
                                data-testid="button-accept-warranty"
                              >
                                {acceptWarrantyMutation.isPending ? (
                                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="mr-2 h-3 w-3" />
                                )}
                                Accetta
                              </Button>
                            </div>
                          )}
                          {repairWarranty.status === 'accepted' && repairWarranty.startDate && repairWarranty.endDate && (
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                              Valida dal {format(new Date(repairWarranty.startDate), 'dd/MM/yyyy', { locale: it })} al {format(new Date(repairWarranty.endDate), 'dd/MM/yyyy', { locale: it })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Warranty product selection - only if no warranty exists */}
                      {!warrantyLoading && !repairWarranty && (
                        <>
                          {warrantyProductsLoading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Caricamento prodotti garanzia...
                            </div>
                          )}
                          {!warrantyProductsLoading && warrantyProducts.length === 0 && (
                            <p className="text-sm text-muted-foreground p-3 text-center">
                              Nessun prodotto garanzia disponibile.
                            </p>
                          )}
                          <div className="grid gap-2">
                            {warrantyProducts.map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
                                data-testid={`card-warranty-product-${product.id}`}
                              >
                                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm">{product.name}</p>
                                    {!product.resellerId && (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                        Globale
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary" className="text-xs">
                                      {product.durationMonths} mesi
                                    </Badge>
                                    <span className="capitalize">{product.coverageType}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="font-bold text-sm">
                                    {(product.priceInCents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => offerWarrantyMutation.mutate(product.id)}
                                    disabled={offerWarrantyMutation.isPending}
                                    data-testid={`button-offer-warranty-${product.id}`}
                                  >
                                    {offerWarrantyMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      'Offri'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {repair.status === 'preventivo_rifiutato' && (
                    <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 space-y-2 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        <strong>Il cliente ha rifiutato il preventivo.</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Puoi contattare il cliente per negoziare o creare un nuovo preventivo.
                      </p>
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

              {/* Customer quote response section - visible only to customers when quote is pending */}
              {user?.role === 'customer' && repair.status === 'preventivo_emesso' && quote && (
                <div className="mt-4 pt-4 border-t">
                  <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Preventivo in attesa di risposta
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Totale preventivo:</span>
                        <span className="text-lg font-bold">
                          {((quote.totalAmount || 0) / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Accetta il preventivo per procedere con la riparazione, oppure rifiutalo per annullare.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => rejectQuoteMutation.mutate()}
                        disabled={rejectQuoteMutation.isPending || acceptQuoteMutation.isPending}
                        className="flex-1"
                        data-testid="button-customer-reject-quote"
                      >
                        {rejectQuoteMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="mr-2 h-4 w-4" />
                        )}
                        Rifiuta Preventivo
                      </Button>
                      <Button
                        onClick={() => acceptQuoteMutation.mutate()}
                        disabled={acceptQuoteMutation.isPending || rejectQuoteMutation.isPending}
                        className="flex-1"
                        data-testid="button-customer-accept-quote"
                      >
                        {acceptQuoteMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Accetta Preventivo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer appointment booking section - visible only to customers when repair is ready for pickup */}
              {user?.role === 'customer' && repair.status === 'pronto_ritiro' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="font-medium text-green-800 dark:text-green-200">
                        Il tuo dispositivo è pronto per il ritiro!
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Prenota un appuntamento per venire a ritirare il tuo dispositivo presso il centro di riparazione.
                    </p>
                    {appointment ? (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarCheck className="h-4 w-4 text-primary" />
                          <span className="font-medium">Appuntamento prenotato</span>
                        </div>
                        <div className="text-sm">
                          <p>Data: <strong>{appointment.date}</strong></p>
                          <p>Ora: <strong>{appointment.startTime} - {appointment.endTime}</strong></p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAppointmentDialogOpen(true)}
                          className="w-full mt-2"
                          data-testid="button-customer-manage-appointment"
                        >
                          Gestisci Appuntamento
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setAppointmentDialogOpen(true)}
                        className="w-full"
                        data-testid="button-customer-book-appointment"
                      >
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        Prenota Appuntamento per il Ritiro
                      </Button>
                    )}
                  </div>
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
                    onClick={() => window.open(`/api/repair-orders/${repairOrderId}/labels`, '_blank')}
                    disabled={!acceptance}
                    data-testid="button-download-labels"
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    Etichette
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
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/api/repair-orders/${repairOrderId}/delivery-document`, '_blank')}
                    disabled={repair.status !== 'consegnato'}
                    data-testid="button-download-delivery"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Consegna/Garanzia
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-device" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Dispositivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</span>
                  <p className="font-semibold mt-1">{repair.deviceType}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Marca</span>
                  <p className="font-semibold mt-1">{repair.brand || "-"}</p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modello</span>
                <p className="font-semibold mt-1">{repair.deviceModel}</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Problema Segnalato</span>
                <p className="font-medium mt-1 text-sm">{repair.issueDescription}</p>
              </div>
              {(repair.imei || repair.serial) && (
                <div className="grid grid-cols-2 gap-4">
                  {repair.imei && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">IMEI</span>
                      <p className="font-mono text-sm mt-1">{repair.imei}</p>
                    </div>
                  )}
                  {repair.serial && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seriale</span>
                      <p className="font-mono text-sm mt-1">{repair.serial}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repair Center Card - visible to all roles */}
          <Card data-testid="card-repair-center" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>Centro di Riparazione</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const assignedCenter = repair.repairCenterId 
                  ? repairCenters.find(c => c.id === repair.repairCenterId)
                  : null;
                
                if (!repair.repairCenterId) {
                  return (
                    <p className="text-sm text-muted-foreground" data-testid="text-no-center">
                      Nessun centro assegnato
                    </p>
                  );
                }
                
                if (!assignedCenter) {
                  return (
                    <p className="text-sm text-muted-foreground" data-testid="text-center-loading">
                      Caricamento centro...
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-3" data-testid="repair-center-details">
                    <div>
                      <span className="text-sm text-muted-foreground">Nome</span>
                      <p className="font-medium" data-testid="text-center-name">{assignedCenter.name}</p>
                    </div>
                    
                    {(assignedCenter.address || assignedCenter.city) && (
                      <div>
                        <span className="text-sm text-muted-foreground">Indirizzo</span>
                        <p className="font-medium" data-testid="text-center-address">
                          {[
                            assignedCenter.address,
                            [assignedCenter.cap, assignedCenter.city].filter(Boolean).join(' '),
                            assignedCenter.provincia ? `(${assignedCenter.provincia})` : null
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    
                    {assignedCenter.phone && (
                      <div>
                        <span className="text-sm text-muted-foreground">Telefono</span>
                        <p className="font-medium" data-testid="text-center-phone">
                          <a href={`tel:${assignedCenter.phone}`} className="text-primary hover:underline">
                            {assignedCenter.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {assignedCenter.email && (
                      <div>
                        <span className="text-sm text-muted-foreground">Email</span>
                        <p className="font-medium" data-testid="text-center-email">
                          <a href={`mailto:${assignedCenter.email}`} className="text-primary hover:underline">
                            {assignedCenter.email}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {assignedCenter.ownerName && (
                      <div>
                        <span className="text-sm text-muted-foreground">Rivenditore</span>
                        <p className="font-medium" data-testid="text-center-owner">{assignedCenter.ownerName}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* Dropdown for changing center - only for admin/reseller/reseller_staff */}
              {(user?.role === 'admin' || user?.role === 'reseller' || user?.role === 'reseller_staff') && (
                <div className="pt-3 border-t">
                  <span className="text-sm text-muted-foreground block mb-2">Cambia centro</span>
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
                          {center.name} {center.ownerName ? `(${center.ownerName})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

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

          {diagnosis && (
            <Card data-testid="card-diagnosis">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Dati Diagnosi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {diagnosis.technicalDiagnosis && (
                  <div>
                    <span className="text-sm text-muted-foreground">Diagnosi Tecnica</span>
                    <p className="text-sm whitespace-pre-wrap">{diagnosis.technicalDiagnosis}</p>
                  </div>
                )}
                {diagnosis.damagedComponents && diagnosis.damagedComponents.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Componenti Danneggiati</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {diagnosis.damagedComponents.map((comp: string, idx: number) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {diagnosis.diagnosisOutcome && (
                  <div>
                    <span className="text-sm text-muted-foreground">Esito Diagnosi</span>
                    <Badge 
                      variant={diagnosis.diagnosisOutcome === 'riparabile' ? 'default' : diagnosis.diagnosisOutcome === 'irriparabile' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {diagnosis.diagnosisOutcome === 'riparabile' ? 'Riparabile' : diagnosis.diagnosisOutcome === 'irriparabile' ? 'Irriparabile' : 'Non Conveniente'}
                    </Badge>
                  </div>
                )}
                {diagnosis.estimatedRepairTime && (
                  <div>
                    <span className="text-sm text-muted-foreground">Tempo Stimato Riparazione</span>
                    <p className="font-medium">{diagnosis.estimatedRepairTime} ore</p>
                  </div>
                )}
                {diagnosis.requiresExternalParts && (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">Richiede ricambi esterni</span>
                  </div>
                )}
                {diagnosis.diagnosisNotes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Note del Tecnico</span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{diagnosis.diagnosisNotes}</p>
                  </div>
                )}
                {diagnosis.diagnosedAt && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Data Diagnosi</span>
                    <p className="font-medium">{format(new Date(diagnosis.diagnosedAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Suggested Devices Card - shown when diagnosis outcome is irriparabile */}
          {diagnosis?.diagnosisOutcome === 'irriparabile' && suggestedDevices.length > 0 && (
            <Card data-testid="card-suggested-devices">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  Smartphone Consigliati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Il dispositivo è stato diagnosticato come irriparabile. Ecco alcuni smartphone consigliati per la sostituzione:
                </p>
                <div className="space-y-2">
                  {suggestedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-green-500/5 border-green-500/20"
                      data-testid={`suggested-device-${device.id}`}
                    >
                      {device.imageUrl && (
                        <img 
                          src={device.imageUrl} 
                          alt={device.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{device.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.brand} {device.model && `- ${device.model}`}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        €{((device.unitPrice || 0) / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {testChecklist && (
            <Card data-testid="card-test-checklist">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Dati Collaudo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">Esito Complessivo:</span>
                  <Badge variant={testChecklist.overallResult ? 'default' : 'destructive'}>
                    {testChecklist.overallResult ? 'Superato' : 'Non Superato'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'displayTest', label: 'Display' },
                    { key: 'touchTest', label: 'Touch' },
                    { key: 'batteryTest', label: 'Batteria' },
                    { key: 'audioTest', label: 'Audio' },
                    { key: 'cameraTest', label: 'Fotocamera' },
                    { key: 'connectivityTest', label: 'Connettività' },
                    { key: 'buttonsTest', label: 'Pulsanti' },
                    { key: 'sensorsTest', label: 'Sensori' },
                    { key: 'chargingTest', label: 'Ricarica' },
                    { key: 'softwareTest', label: 'Software' },
                  ].map(({ key, label }) => {
                    const value = testChecklist[key as keyof typeof testChecklist];
                    if (value === undefined || value === null) return null;
                    return (
                      <div key={key} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                        <span>{label}</span>
                        {value ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {testChecklist.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Note Collaudo</span>
                    <p className="text-sm whitespace-pre-wrap mt-1">{testChecklist.notes}</p>
                  </div>
                )}

                {testChecklist.testedAt && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Data Collaudo</span>
                    <p className="font-medium">{format(new Date(testChecklist.testedAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(() => {
            // Use customer data from repair order response (preferred) or fallback to separate query
            const customerData = repair?.customer || customer;
            if (!customerData) return null;
            return (
              <Card data-testid="card-customer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Dati Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Nome</span>
                    <p className="font-medium" data-testid="text-customer-name">{customerData.fullName || customerData.username || '-'}</p>
                  </div>
                  {customerData.email && (
                    <div>
                      <span className="text-sm text-muted-foreground">Email</span>
                      <p className="font-medium">
                        <a href={`mailto:${customerData.email}`} className="text-primary hover:underline" data-testid="link-customer-email">
                          {customerData.email}
                        </a>
                      </p>
                    </div>
                  )}
                  {customerData.phone && (
                    <div>
                      <span className="text-sm text-muted-foreground">Telefono</span>
                      <p className="font-medium">
                        <a href={`tel:${customerData.phone}`} className="text-primary hover:underline" data-testid="link-customer-phone">
                          {customerData.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  {(customerData.address || customerData.city || customerData.province || customerData.postalCode) && (
                    <div>
                      <span className="text-sm text-muted-foreground">Indirizzo</span>
                      <p className="font-medium" data-testid="text-customer-address">
                        {[
                          customerData.address,
                          [customerData.postalCode, customerData.city].filter(Boolean).join(' '),
                          customerData.province ? `(${customerData.province})` : null
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                  {customerData.fiscalCode && (
                    <div>
                      <span className="text-sm text-muted-foreground">Codice Fiscale</span>
                      <p className="font-medium font-mono text-sm" data-testid="text-customer-fiscal-code">{customerData.fiscalCode}</p>
                    </div>
                  )}
                  {customerData.vatNumber && (
                    <div>
                      <span className="text-sm text-muted-foreground">Partita IVA</span>
                      <p className="font-medium font-mono text-sm" data-testid="text-customer-vat">{customerData.vatNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {quote && (
            <Card data-testid="card-quote">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Preventivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Numero</span>
                  <span className="font-mono text-sm">{quote.quoteNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stato</span>
                  <Badge variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'outline'}>
                    {quote.status === 'pending' || quote.status === 'sent' || quote.status === 'draft' ? 'In Attesa' : quote.status === 'accepted' ? 'Accettato' : 'Rifiutato'}
                  </Badge>
                </div>
                
                {/* Parts/Services list */}
                {quote.parts && (() => {
                  try {
                    const parts = typeof quote.parts === 'string' ? JSON.parse(quote.parts) : quote.parts;
                    if (Array.isArray(parts) && parts.length > 0) {
                      return (
                        <div className="pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Ricambi e Servizi</span>
                          <div className="mt-2 space-y-2">
                            {parts.map((part: { name: string; quantity: number; unitPrice: number }, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm bg-muted/50 rounded px-2 py-1">
                                <div className="flex items-center gap-2">
                                  <span>{part.name}</span>
                                  {part.quantity > 1 && (
                                    <Badge variant="outline" className="text-xs">x{part.quantity}</Badge>
                                  )}
                                </div>
                                <span className="font-medium">
                                  {((part.unitPrice * part.quantity) / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  } catch {
                    return null;
                  }
                })()}

                {/* Labor cost */}
                {quote.laborCost > 0 && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Manodopera</span>
                    <span className="font-medium">
                      {(quote.laborCost / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t bg-muted/30 rounded px-2 py-2">
                  <span className="font-medium">Totale</span>
                  <span className="text-lg font-bold">{formatCurrency(quote.totalAmount, true)}</span>
                </div>

                {/* Valid until */}
                {quote.validUntil && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Valido fino al</span>
                    <span>{format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: it })}</span>
                  </div>
                )}

                {/* Notes */}
                {quote.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Note</span>
                    <p className="text-sm whitespace-pre-wrap mt-1">{quote.notes}</p>
                  </div>
                )}
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
