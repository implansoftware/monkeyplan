import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  HardDrive, Building2, Clock, Truck, Loader2, XCircle, CalendarCheck, ArrowLeft, ShoppingBag, Smartphone, Tag,
  Upload, ChevronDown, ChevronUp, Printer, Info, RotateCcw, ExternalLink
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
  warrantySupplier: string | null;
  warrantyPurchaseDate: string | null;
  warrantyPurchasePrice: number | null;
  warrantyProofAttachmentId: string | null;
  skipDiagnosis: boolean;
  skipDiagnosisReason: string | null;
  isReturn: boolean;
  parentRepairOrderId: string | null;
  returnReason: string | null;
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
  const { t } = useTranslation();
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
  const [warrantySupplier, setWarrantySupplier] = useState("");
  const [warrantyPurchaseDate, setWarrantyPurchaseDate] = useState("");
  const [warrantyPurchasePrice, setWarrantyPurchasePrice] = useState("");
  const [warrantyProofFile, setWarrantyProofFile] = useState<File | null>(null);
  const [warrantyProofUploading, setWarrantyProofUploading] = useState(false);
  const [warrantyProofAttachmentId, setWarrantyProofAttachmentId] = useState<string | null>(null);
  const [warrantyProofPreview, setWarrantyProofPreview] = useState<string | null>(null);
  const [skipDiagnosisDialogOpen, setSkipDiagnosisDialogOpen] = useState(false);
  const [skipDiagnosisReason, setSkipDiagnosisReason] = useState("");
  const [dataRecoveryDialogOpen, setDataRecoveryDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(false);

  const { data: repair, isLoading, error } = useQuery<RepairOrder>({
    queryKey: ["/api/repair-orders", repairOrderId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      const response = await fetch(`/api/repair-orders/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error(t("repairs.repairNotFound"));
        if (response.status === 403) throw new Error(t("standalone.accessDenied"));
        throw new Error(t("standalone.loadingError"));
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
        throw new Error(t("standalone.quoteLoadingError"));
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
        throw new Error(t("standalone.acceptanceLoadingError"));
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
      toast({ title: t("standalone.repairCenterUpdatedToast") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("standalone.warrantyOffered"), description: t("repairs.lOffertaDiGaranziaStataCreataConSuccesso") });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repairOrderId, "warranty"] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  // Accept warranty mutation
  const acceptWarrantyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repairs/${repairOrderId}/warranty/accept`);
    },
    onSuccess: () => {
      toast({ title: t("standalone.warrantyAccepted"), description: t("repairs.laGaranziaStataAttivataConSuccesso") });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repairOrderId, "warranty"] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  // Decline warranty mutation
  const declineWarrantyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repairs/${repairOrderId}/warranty/decline`);
    },
    onSuccess: () => {
      toast({ title: t("standalone.warrantyDeclined"), description: t("repairs.lOffertaDiGaranziaStataRifiutata") });
      queryClient.invalidateQueries({ queryKey: ["/api/repairs", repairOrderId, "warranty"] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("repairs.statoPreventivoAggiornato") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  // Customer-specific mutations for quote acceptance/rejection
  const acceptQuoteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/quote/accept`);
    },
    onSuccess: () => {
      toast({ title: t("standalone.quoteAcceptedTitle"), description: t("repairs.laRiparazioneProcederComeIndicatoNelPrevent") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/quote/reject`);
    },
    onSuccess: () => {
      toast({ title: t("standalone.quoteRejectedTitle"), description: t("repairs.laRiparazioneStataAnnullata") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("standalone.repairStarted") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const readyForPickupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/ready-for-pickup`);
    },
    onSuccess: () => {
      toast({ title: t("standalone.deviceReadyForPickupToast") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const skipQuoteMutation = useMutation({
    mutationFn: async (reason: 'garanzia' | 'omaggio') => {
      const body: any = { reason };
      if (reason === 'garanzia') {
        if (warrantySupplier) body.warrantySupplier = warrantySupplier;
        if (warrantyPurchaseDate) body.warrantyPurchaseDate = warrantyPurchaseDate;
        if (warrantyPurchasePrice !== "") body.warrantyPurchasePrice = Math.round(parseFloat(warrantyPurchasePrice) * 100);
        if (warrantyProofAttachmentId) body.warrantyProofAttachmentId = warrantyProofAttachmentId;
      }
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/skip-quote`, body);
    },
    onSuccess: () => {
      toast({ title: t("standalone.quoteSkipped"), description: t("standalone.repairProceedsWithoutQuote") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      setSkipQuoteDialogOpen(false);
      setSkipQuoteReason(null);
      setWarrantySupplier("");
      setWarrantyPurchaseDate("");
      setWarrantyPurchasePrice("");
      setWarrantyProofFile(null);
      setWarrantyProofAttachmentId(null);
      setWarrantyProofPreview(null);
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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
        throw new Error(t("standalone.errorVerifyingCurrentStatus"));
      }
      const freshRepair = await freshResponse.json();
      
      // Verify status is still 'ingressato' before proceeding
      if (freshRepair.status !== 'ingressato') {
        throw new Error(t("repairs.statusChangedRefresh", { status: freshRepair.status }));
      }
      
      return await apiRequest("POST", getSkipDiagnosisEndpoint(), { reason });
    },
    onSuccess: () => {
      toast({ title: t("standalone.diagnosisSkipped"), description: t("standalone.proceedDirectlyToQuote") });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      setSkipDiagnosisDialogOpen(false);
      setSkipDiagnosisReason("");
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
      // Invalidate to refresh the UI with current state
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      setSkipDiagnosisDialogOpen(false);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ingressato": return <Badge variant="secondary" data-testid={`status-${status}`}>{t("dashboard.ingressato")}</Badge>;
      case "in_diagnosi": return <Badge variant="outline" data-testid={`status-${status}`}>{t("dashboard.inDiagnosi")}</Badge>;
      case "preventivo_emesso": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repairs.preventivoEmesso")}</Badge>;
      case "preventivo_accettato": return <Badge data-testid={`status-${status}`}>{t("repairs.preventivoAccettato")}</Badge>;
      case "preventivo_rifiutato": return <Badge variant="destructive" data-testid={`status-${status}`}>{t("repairs.preventivoRifiutato")}</Badge>;
      case "attesa_ricambi": return <Badge variant="outline" data-testid={`status-${status}`}>{t("standalone.waitingForParts")}</Badge>;
      case "in_riparazione": return <Badge data-testid={`status-${status}`}>{t("dashboard.inRiparazione")}</Badge>;
      case "in_test": return <Badge data-testid={`status-${status}`}>{t("dashboard.inTest")}</Badge>;
      case "pronto_ritiro": return <Badge data-testid={`status-${status}`}>{t("standalone.readyForPickupBtn")}</Badge>;
      case "consegnato": return <Badge variant="outline" data-testid={`status-${status}`}>{t("repairs.status.delivered")}</Badge>;
      case "cancelled": return <Badge variant="destructive" data-testid={`status-${status}`}>{t("repairs.status.cancelled")}</Badge>;
      case "pending": return <Badge variant="secondary" data-testid={`status-${status}`}>{t("b2b.status.pending")}</Badge>;
      case "in_progress": return <Badge data-testid={`status-${status}`}>{t("tickets.status.inProgress")}</Badge>;
      case "waiting_parts": return <Badge variant="outline" data-testid={`status-${status}`}>{t("standalone.waitingForPartsShort")}</Badge>;
      case "completed": return <Badge variant="outline" data-testid={`status-${status}`}>{t("pos.completata")}</Badge>;
      case "delivered": return <Badge variant="outline" data-testid={`status-${status}`}>{t("shipping.delivered")}</Badge>;
      default: return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null | undefined, inCents: boolean = false) => {
    if (amount === null || amount === undefined) return t("standalone.toDefineAmount");
    const value = inCents ? amount / 100 : amount;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const workflowSteps = [
    { key: 'ingressato', label: t("standalone.intake"), icon: Package, num: 1 },
    { key: 'in_diagnosi', label: t("standalone.diagnosisStep"), icon: Stethoscope, num: 2 },
    { key: 'preventivo_emesso', label: t("standalone.quoteStep"), icon: Receipt, num: 3 },
    { key: 'preventivo_accettato', label: t("standalone.acceptedStep"), icon: CheckCircle, num: 4 },
    { key: 'attesa_ricambi', label: t("standalone.partsStep"), icon: Package, num: 5 },
    { key: 'in_riparazione', label: t("standalone.repairStep"), icon: Wrench, num: 6 },
    { key: 'in_test', label: t("standalone.testingStep"), icon: ClipboardCheck, num: 7 },
    { key: 'pronto_ritiro', label: t("standalone.readyStep"), icon: PackageCheck, num: 8 },
    { key: 'consegnato', label: t("standalone.deliveredStep"), icon: Truck, num: 9 },
  ];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      diagnosis: t("repairs.diagnosis"),
      quote: t("common.quote"),
      repair: t("common.repair"),
      testing: t("repairs.testing"),
      delivery: t("common.delivery"),
    };
    return labels[status] || status;
  };

  const getCurrentStepIndex = (status: string) => {
    const index = workflowSteps.findIndex(step => step.key === status);
    if (index !== -1) return index;
    if (status === 'preventivo_rifiutato') return 2; // Stay at Preventivo step (index 2)
    return 0;
  };

  const handleStepClick = (stepKey: string, isCompleted: boolean, isSkipped: boolean) => {
    if (!isCompleted || isSkipped) return;
    
    switch (stepKey) {
      case 'in_diagnosi':
        if (diagnosis) {
          setDiagnosisDialogOpen(true);
        }
        break;
      case 'preventivo_emesso':
        if (quote) {
          setQuoteDialogOpen(true);
        }
        break;
      default:
        break;
    }
  };

  const isStepClickable = (stepKey: string, isCompleted: boolean, isSkipped: boolean): boolean => {
    if (!isCompleted || isSkipped) return false;
    
    switch (stepKey) {
      case 'in_diagnosi':
        return !!diagnosis;
      case 'preventivo_emesso':
        return !!quote;
      default:
        return false;
    }
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
        <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{t("standalone.expired")} - {phaseLabel}: {timeStr}</span>
        </div>
      );
    }
    
    if (severity === 'urgent') {
      return (
        <div className="flex flex-wrap items-center gap-2 text-sm text-orange-600">
          <Clock className="h-4 w-4" />
          <span>{t("standalone.urgent")} - {phaseLabel}: {timeStr}</span>
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-green-600">
        <Clock className="h-4 w-4" />
        <span>{t("standalone.inTime")} - {phaseLabel}: {timeStr}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
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
        <p className="text-muted-foreground">{error?.message || t("repairs.repairNotFound")}</p>
        <Button onClick={() => setLocation(backPath)} className="mt-4" data-testid="button-back-error">
          {t("standalone.backToList")}
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
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                      {t("repairs.repairOrder")} #{repair.orderNumber}
                    </h1>
                    <p className="text-sm text-muted-foreground" data-testid="text-order-number">
                      {repair.deviceType} - {repair.deviceModel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 flex-wrap">
              {repair.isReturn && (
                <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400" data-testid="badge-return">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  {t("repairs.return.badge", "Rientro")}
                </Badge>
              )}
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
                <span>{t("standalone.workflowTitle")}</span>
                <Badge variant="outline" className="ml-auto">
                  {t("standalone.phaseOf", { current: currentStepIndex + 1, total: workflowSteps.length })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{t("standalone.progressLabel")}</span>
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
                    const clickable = isStepClickable(step.key, isCompleted, isSkipped);
                    
                    return (
                      <div
                        key={step.key}
                        className={`flex flex-col items-center relative group ${clickable ? 'cursor-pointer' : ''}`}
                        data-testid={`workflow-step-${step.key}`}
                        onClick={() => clickable && handleStepClick(step.key, isCompleted, isSkipped)}
                        title={clickable ? `${t("standalone.clickToView")} ${step.label}` : undefined}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      {t("standalone.nextStepLabel")}
                    </p>
                  </div>
                  
                  {repair.status === 'ingressato' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: t("repairs.deviceReceivedStartDiagnosis") }} />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setDiagnosisDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-start-diagnosis"
                        >
                          <Stethoscope className="mr-2 h-4 w-4" />
                          {t("standalone.startDiagnosisBtn")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSkipDiagnosisDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-skip-diagnosis"
                        >
                          <SkipForward className="mr-2 h-4 w-4" />
                          {t("standalone.skipDiagnosisBtn")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'in_diagnosi' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {repair.skipDiagnosis ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <SkipForward className="h-4 w-4" />
                            <span>{t("standalone.diagnosisSkippedLabel")}{repair.skipDiagnosisReason ? `: ${repair.skipDiagnosisReason}` : ''}</span>
                          </div>
                          <p className="text-sm">
                            <strong>{t("repairs.creaIlPreventivo")}</strong> {t("standalone.createQuoteForCustomer")}
                          </p>
                        </div>
                      ) : diagnosis ? (
                        <p className="text-sm">
                          <strong>{t("repairs.diagnosiCompletata")}</strong> <span dangerouslySetInnerHTML={{ __html: t("standalone.nowCreateQuote") }} />
                        </p>
                      ) : (
                        <p className="text-sm" dangerouslySetInnerHTML={{ __html: t("standalone.diagnosisInProgressDesc") }} />
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
                            {diagnosis ? t("standalone.editDiagnosis") : t("standalone.completeDiagnosis")}
                          </Button>
                        )}
                        <Button
                          onClick={() => setQuoteDialogOpen(true)}
                          className="flex-1"
                          disabled={!diagnosis && !repair.skipDiagnosis}
                          data-testid="button-create-quote"
                        >
                          <Receipt className="mr-2 h-4 w-4" />
                          {t("standalone.createQuoteBtn")}
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
                            {t("standalone.skipQuoteWarrantyGift")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {repair.status === 'preventivo_emesso' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        <span dangerouslySetInnerHTML={{ __html: t("standalone.quoteSentAwaitingResponse") }} />
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={() => updateQuoteStatusMutation.mutate('rejected')}
                          disabled={updateQuoteStatusMutation.isPending}
                          className="flex-1"
                          data-testid="button-reject-quote"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {t("standalone.rejectedBtn")}
                        </Button>
                        <Button
                          onClick={() => updateQuoteStatusMutation.mutate('accepted')}
                          disabled={updateQuoteStatusMutation.isPending}
                          className="flex-1"
                          data-testid="button-accept-quote"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {t("standalone.acceptedBtn")}
                        </Button>
                      </div>
                      <div className="pt-3 border-t">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setDiagnosisDialogOpen(true)}
                          data-testid="button-add-diagnosis-later"
                        >
                          <Stethoscope className="mr-2 h-4 w-4" />
                          {diagnosis ? t("standalone.editDiagnosis") : t("standalone.addDiagnosis")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {(repair.status === 'preventivo_accettato' || (repair.quoteBypassReason && repair.status === 'in_diagnosi')) && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      {repair.quoteBypassReason && (
                        <div className="space-y-3 mb-2">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {repair.quoteBypassReason === 'garanzia' ? (
                              <><Shield className="h-4 w-4" /> {t("standalone.repairUnderWarranty")}</>
                            ) : (
                              <><Gift className="h-4 w-4" /> {t("standalone.repairComplimentary")}</>
                            )}
                          </div>
                          {repair.quoteBypassReason === 'garanzia' && (repair.warrantySupplier || repair.warrantyPurchaseDate || repair.warrantyPurchasePrice !== null || repair.warrantyProofAttachmentId) && (
                            <div className="bg-background rounded-md p-3 space-y-2 border">
                              {repair.warrantyProofAttachmentId && (
                                <div className="flex items-start gap-3">
                                  <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{t("warranties.proofPhoto")}</span>
                                  <a
                                    href={`/api/repair-orders/attachments/${repair.warrantyProofAttachmentId}/download?preview=true`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                    data-testid="link-warranty-proof-photo"
                                  >
                                    <img
                                      src={`/api/repair-orders/attachments/${repair.warrantyProofAttachmentId}/download?preview=true`}
                                      alt={t("warranties.proofPhoto")}
                                      className="h-16 w-16 rounded-md object-cover border"
                                    />
                                  </a>
                                </div>
                              )}
                              {repair.warrantySupplier && (
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{t("warranties.supplier")}</span>
                                  <span className="text-sm" data-testid="text-warranty-supplier">{repair.warrantySupplier}</span>
                                </div>
                              )}
                              {repair.warrantyPurchaseDate && (
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{t("warranties.purchaseDate")}</span>
                                  <span className="text-sm" data-testid="text-warranty-purchase-date">{format(new Date(repair.warrantyPurchaseDate), "dd/MM/yyyy", { locale: it })}</span>
                                </div>
                              )}
                              {repair.warrantyPurchasePrice !== null && repair.warrantyPurchasePrice !== undefined && (
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-muted-foreground min-w-[100px]">{t("warranties.purchasePrice")}</span>
                                  <span className="text-sm" data-testid="text-warranty-purchase-price">{(repair.warrantyPurchasePrice / 100).toFixed(2)} &euro;</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-sm">
                        {repair.quoteBypassReason 
                          ? t("standalone.quoteSkippedOrderParts")
                          : t("standalone.quoteAcceptedOrderParts")
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
                          {t("standalone.orderParts")}
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
                          {t("standalone.startRepair")}
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
                          {diagnosis ? t("standalone.editDiagnosis") : t("standalone.addDiagnosis")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'attesa_ricambi' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        <span dangerouslySetInnerHTML={{ __html: t("standalone.waitingForPartsMsg") }} />
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setPartsDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-manage-parts"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          {t("standalone.manageParts")}
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
                          {t("standalone.startRepair")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'in_riparazione' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: t("repairs.repairInProgressDesc") }} />
                      <Button
                        onClick={() => setTestDialogOpen(true)}
                        className="w-full"
                        data-testid="button-start-test"
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        {t("standalone.startTesting")}
                      </Button>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={() => setPartsDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-order-parts-repair"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          {t("standalone.orderPartsBtn")}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setLogsDialogOpen(true)}
                          className="flex-1"
                          data-testid="button-repair-log"
                        >
                          <ClipboardList className="mr-2 h-4 w-4" />
                          {t("repairs.logActivity")}
                        </Button>
                      </div>
                    </div>
                  )}

                  {repair.status === 'in_test' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        <span dangerouslySetInnerHTML={{ __html: t("standalone.testingInProgressMsg") }} />
                      </p>
                      <Button
                        onClick={() => readyForPickupMutation.mutate()}
                        disabled={readyForPickupMutation.isPending}
                        className="w-full"
                        data-testid="button-ready-pickup"
                      >
                        {readyForPickupMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <PackageCheck className="mr-2 h-4 w-4" />
                        )}
                        {t("standalone.readyForPickupBtn")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setTestDialogOpen(true)}
                        className="w-full"
                        data-testid="button-continue-test"
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        {t("standalone.manageTesting")}
                      </Button>
                    </div>
                  )}

                  {repair.status === 'pronto_ritiro' && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <p className="text-sm">
                        {user?.role === 'customer' ? (
                          <span dangerouslySetInnerHTML={{ __html: t("repairs.deviceReadyBookAppointmentFull") }} />
                        ) : (
                          <span dangerouslySetInnerHTML={{ __html: t("standalone.deviceReadyPickupStaff") }} />
                        )}
                      </p>
                      
                      {/* Show existing appointment if booked */}
                      {appointment && (
                        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-200 dark:border-green-800 space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <CalendarCheck className="h-4 w-4" />
                            <span className="font-medium">{t("standalone.appointmentBookedByCustomer")}</span>
                          </div>
                          <div className="text-sm">
                            <p>{t("standalone.dateLabel")} <strong>{appointment.date}</strong></p>
                            <p>{t("standalone.timeLabel")} <strong>{appointment.startTime} - {appointment.endTime}</strong></p>
                            {appointment.notes && (
                              <p className="mt-1 text-muted-foreground">{t("standalone.notesLabel")} {appointment.notes}</p>
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
                          {appointment ? t("standalone.manageAppointment") : t("standalone.bookAppointment")}
                        </Button>
                        {user?.role !== 'customer' && (
                          <Button
                            onClick={() => setDeliveryDialogOpen(true)}
                            className="flex-1"
                            data-testid="button-complete-delivery"
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            {t("standalone.completeDelivery")}
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
                        {t("standalone.suggestedAccessoriesTitle")}
                      </p>
                      {accessoriesLoading && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("standalone.loadingCompatibleAccessories")}
                        </div>
                      )}
                      {!accessoriesLoading && suggestedAccessories.length === 0 && (
                        <p className="text-sm text-muted-foreground p-3 text-center">
                          {t("standalone.noCompatibleAccessories")}
                        </p>
                      )}
                      <div className="grid gap-3">
                        {suggestedAccessories.slice(0, 4).map((accessory) => (
                          <div
                            key={accessory.id}
                            className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
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
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
                            {t("standalone.otherCompatibleAccessories", { count: suggestedAccessories.length - 4 })}
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
                        {t("standalone.extendedWarrantyOffer")}
                      </p>
                      
                      {warrantyLoading && (
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground p-3">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("common.loading")}
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
                            <div className="flex flex-wrap items-center gap-2">
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
                              {repairWarranty.status === 'offered' ? t("standalone.warrantyStatusOffered") :
                               repairWarranty.status === 'accepted' ? t("standalone.warrantyStatusAccepted") :
                               repairWarranty.status === 'declined' ? t("standalone.warrantyStatusDeclined") : t("standalone.warrantyStatusExpired")}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">{t("standalone.durationLabel")}</span>
                              <p className="font-medium">{repairWarranty.durationMonthsSnapshot} {t("standalone.monthsUnit")}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t("standalone.coverageLabel")}</span>
                              <p className="font-medium capitalize">{repairWarranty.coverageTypeSnapshot}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{t("marketplace.prezzo")}</span>
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
                                {t("standalone.declineBtn")}
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
                                {t("standalone.acceptBtn")}
                              </Button>
                            </div>
                          )}
                          {repairWarranty.status === 'accepted' && repairWarranty.startDate && repairWarranty.endDate && (
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                              {t("standalone.validFromTo", { from: format(new Date(repairWarranty.startDate), 'dd/MM/yyyy', { locale: it }), to: format(new Date(repairWarranty.endDate), 'dd/MM/yyyy', { locale: it }) })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Warranty product selection - only if no warranty exists */}
                      {!warrantyLoading && !repairWarranty && (
                        <>
                          {warrantyProductsLoading && (
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground p-3">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("standalone.loadingWarrantyProducts")}
                            </div>
                          )}
                          {!warrantyProductsLoading && warrantyProducts.length === 0 && (
                            <p className="text-sm text-muted-foreground p-3 text-center">
                              {t("standalone.noWarrantyProducts")}
                            </p>
                          )}
                          <div className="grid gap-2">
                            {warrantyProducts.map((product) => (
                              <div
                                key={product.id}
                                className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-card hover-elevate"
                                data-testid={`card-warranty-product-${product.id}`}
                              >
                                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-sm">{product.name}</p>
                                    {!product.resellerId && (
                                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                                        {t("standalone.globalBadge")}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary" className="text-xs">
                                      {product.durationMonths} {t("standalone.monthsUnit")}
                                    </Badge>
                                    <span className="capitalize">{product.coverageType}</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
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
                                      t("standalone.offerBtn")
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
                        <strong>{t("standalone.customerRejectedQuote")}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("standalone.contactCustomerNegotiate")}
                      </p>
                    </div>
                  )}

                  {repair.status === 'consegnato' && (
                    <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
                      <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <strong>{t("standalone.repairCompletedDeliveredMsg")}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Customer quote response section - visible only to customers when quote is pending */}
              {user?.role === 'customer' && repair.status === 'preventivo_emesso' && quote && (
                <div className="mt-4 pt-4 border-t">
                  <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        {t("standalone.quotePendingResponse")}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">{t("repairs.totalePreventivo")}</span>
                        <span className="text-lg font-bold">
                          {((quote.totalAmount || 0) / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("standalone.acceptQuoteToRepair")}
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
                        {t("standalone.rejectQuoteBtn")}
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
                        {t("standalone.acceptQuoteBtn")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer appointment booking section - visible only to customers when repair is ready for pickup */}
              {user?.role === 'customer' && repair.status === 'pronto_ritiro' && (
                <div className="mt-4 pt-4 border-t">
                  <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <p className="font-medium text-green-800 dark:text-green-200">
                        {t("repairs.deviceReadyForPickup")}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("standalone.bookPickupAppointment")}
                    </p>
                    {appointment ? (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <CalendarCheck className="h-4 w-4 text-primary" />
                          <span className="font-medium">{t("standalone.appointmentBooked")}</span>
                        </div>
                        <div className="text-sm">
                          <p>{t("standalone.dateLabel")} <strong>{appointment.date}</strong></p>
                          <p>{t("standalone.timeLabel")} <strong>{appointment.startTime} - {appointment.endTime}</strong></p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAppointmentDialogOpen(true)}
                          className="w-full mt-2"
                          data-testid="button-customer-manage-appointment"
                        >
                          {t("standalone.manageAppointmentBtn")}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setAppointmentDialogOpen(true)}
                        className="w-full"
                        data-testid="button-customer-book-appointment"
                      >
                        <CalendarCheck className="mr-2 h-4 w-4" />
                        {t("standalone.bookPickupAppointmentBtn")}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => setDocsExpanded(!docsExpanded)}
                  className="w-full justify-between px-3"
                  data-testid="button-toggle-documents"
                >
                  <span className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    <span className="text-sm font-medium">{t("standalone.printAndDocuments")}</span>
                  </span>
                  {docsExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                {docsExpanded && (
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-dashed">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/repair-orders/${repairOrderId}/intake-document`, '_blank')}
                      disabled={!acceptance}
                      data-testid="button-download-acceptance"
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      {t("standalone.acceptanceDoc")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/repair-orders/${repairOrderId}/labels`, '_blank')}
                      disabled={!acceptance}
                      data-testid="button-download-labels"
                    >
                      <Tag className="mr-2 h-3.5 w-3.5" />
                      {t("standalone.labelsDoc")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/repair-orders/${repairOrderId}/diagnosis-document`, '_blank')}
                      disabled={!diagnosis}
                      data-testid="button-download-diagnosis"
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      {t("standalone.diagnosisDoc")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/repair-orders/${repairOrderId}/quote-document`, '_blank')}
                      disabled={!quote}
                      data-testid="button-download-quote"
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      {t("standalone.quoteDoc")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/repair-orders/${repairOrderId}/delivery-document`, '_blank')}
                      disabled={repair.status !== 'consegnato'}
                      data-testid="button-download-delivery"
                    >
                      <Download className="mr-2 h-3.5 w-3.5" />
                      {t("standalone.deliveryWarrantyDoc")}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-3 pt-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight" data-testid="text-repair-summary-title">{t("standalone.repairSummaryTitle")}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-device" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>{t("repairs.device")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.type")}</span>
                  <p className="font-semibold mt-1">{repair.deviceType}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("repairs.deviceBrand")}</span>
                  <p className="font-semibold mt-1">{repair.brand || "-"}</p>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("repairs.deviceModel")}</span>
                <p className="font-semibold mt-1">{repair.deviceModel}</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t("standalone.reportedProblem")}</span>
                <p className="font-medium mt-1 text-sm">{repair.issueDescription}</p>
              </div>
              {repair.isReturn && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wider">{t("repairs.return.badge", "Rientro")}</span>
                  </div>
                  {repair.returnReason && (
                    <div>
                      <span className="text-xs text-muted-foreground">{t("repairs.return.returnReason", "Motivo rientro")}:</span>
                      <p className="font-medium text-sm mt-0.5">{repair.returnReason}</p>
                    </div>
                  )}
                  {repair.parentRepairOrderId && (() => {
                    const rolePrefix = user?.role === "admin" || user?.role === "admin_staff" ? "/admin"
                      : (user?.role === "reseller" || user?.role === "reseller_staff" || user?.role === "sub_reseller") ? "/reseller"
                      : (user?.role === "repair_center" || user?.role === "repair_center_staff") ? "/repair-center"
                      : "/customer";
                    return (
                      <a
                        href={`${rolePrefix}/repairs/${repair.parentRepairOrderId}`}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        data-testid="link-parent-order"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("repairs.return.parentOrder", "Ordine originale")}
                      </a>
                    );
                  })()}
                </div>
              )}
              {(repair.imei || repair.serial) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {repair.imei && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">IMEI</span>
                      <p className="font-mono text-sm mt-1">{repair.imei}</p>
                    </div>
                  )}
                  {repair.serial && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("standalone.serialLabel")}</span>
                      <p className="font-mono text-sm mt-1">{repair.serial}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warranty Details Card - visible when quote was bypassed for warranty */}
          {repair.quoteBypassReason === 'garanzia' && (repair.warrantySupplier || repair.warrantyPurchaseDate || repair.warrantyPurchasePrice !== null || repair.warrantyProofAttachmentId) && (
            <Card data-testid="card-warranty-details" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span>{t("standalone.repairUnderWarranty")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {repair.warrantyProofAttachmentId && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("warranties.proofPhoto")}</span>
                    <div className="mt-2">
                      <a
                        href={`/api/repair-orders/attachments/${repair.warrantyProofAttachmentId}/download?preview=true`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid="link-warranty-proof-card"
                      >
                        <img
                          src={`/api/repair-orders/attachments/${repair.warrantyProofAttachmentId}/download?preview=true`}
                          alt={t("warranties.proofPhoto")}
                          className="h-24 rounded-md object-cover border"
                        />
                      </a>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {repair.warrantySupplier && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("warranties.supplier")}</span>
                      <p className="font-semibold mt-1" data-testid="text-warranty-supplier-card">{repair.warrantySupplier}</p>
                    </div>
                  )}
                  {repair.warrantyPurchaseDate && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("warranties.purchaseDate")}</span>
                      <p className="font-semibold mt-1" data-testid="text-warranty-date-card">{format(new Date(repair.warrantyPurchaseDate), "dd/MM/yyyy", { locale: it })}</p>
                    </div>
                  )}
                </div>
                {repair.warrantyPurchasePrice !== null && repair.warrantyPurchasePrice !== undefined && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("warranties.purchasePrice")}</span>
                    <p className="font-semibold mt-1" data-testid="text-warranty-price-card">{(repair.warrantyPurchasePrice / 100).toFixed(2)} &euro;</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Repair Center Card - visible to all roles */}
          <Card data-testid="card-repair-center" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>{t("standalone.repairCenterTitle")}</span>
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
                      {t("standalone.noCenterAssigned")}
                    </p>
                  );
                }
                
                if (!assignedCenter) {
                  return (
                    <p className="text-sm text-muted-foreground" data-testid="text-center-loading">
                      {t("standalone.loadingCenter")}
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-3" data-testid="repair-center-details">
                    <div>
                      <span className="text-sm text-muted-foreground">{t("common.name")}</span>
                      <p className="font-medium" data-testid="text-center-name">{assignedCenter.name}</p>
                    </div>
                    
                    {(assignedCenter.address || assignedCenter.city) && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t("profile.indirizzo")}</span>
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
                        <span className="text-sm text-muted-foreground">{t("auth.phone")}</span>
                        <p className="font-medium" data-testid="text-center-phone">
                          <a href={`tel:${assignedCenter.phone}`} className="text-primary hover:underline">
                            {assignedCenter.phone}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {assignedCenter.email && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t("auth.email")}</span>
                        <p className="font-medium" data-testid="text-center-email">
                          <a href={`mailto:${assignedCenter.email}`} className="text-primary hover:underline">
                            {assignedCenter.email}
                          </a>
                        </p>
                      </div>
                    )}
                    
                    {assignedCenter.ownerName && (
                      <div>
                        <span className="text-sm text-muted-foreground">{t("roles.reseller")}</span>
                        <p className="font-medium" data-testid="text-center-owner">{assignedCenter.ownerName}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* Dropdown for changing center - only for admin/reseller/reseller_staff */}
              {(user?.role === 'admin' || user?.role === 'reseller' || user?.role === 'reseller_staff') && (
                <div className="pt-3 border-t">
                  <span className="text-sm text-muted-foreground block mb-2">{t("standalone.changeCenter")}</span>
                  <Select
                    value={repair.repairCenterId || "unassigned"}
                    onValueChange={(value) => updateRepairCenterMutation.mutate(value === "unassigned" ? null : value)}
                    disabled={updateRepairCenterMutation.isPending}
                  >
                    <SelectTrigger data-testid="select-repair-center">
                      <SelectValue placeholder={t("repairs.selezionaCentro")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">{t("tickets.unassigned")}</SelectItem>
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
            <Card data-testid="card-acceptance" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <ClipboardCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span>{t("standalone.acceptanceDataTitle")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {acceptance.declaredDefects && acceptance.declaredDefects.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("standalone.declaredDefects")}</span>
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
                    <span className="text-sm text-muted-foreground">{t("standalone.aestheticCondition")}</span>
                    <p className="font-medium">{acceptance.aestheticCondition}</p>
                  </div>
                )}
                {acceptance.aestheticNotes && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("standalone.aestheticNotes")}</span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{acceptance.aestheticNotes}</p>
                  </div>
                )}
                {acceptance.accessories && acceptance.accessories.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("products.includedAccessories")}</span>
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
                    <span className="text-sm text-muted-foreground font-medium">{t("standalone.unlockCodes")}</span>
                    {acceptance.lockCode && (
                      <div>
                        <span className="text-xs text-muted-foreground">{t("standalone.pinPassword")}</span>
                        <p className="font-mono text-sm" data-testid="text-lock-code">{acceptance.lockCode}</p>
                      </div>
                    )}
                    {acceptance.lockPattern && (
                      <div>
                        <span className="text-xs text-muted-foreground">{t("standalone.sequencePattern")}</span>
                        <div className="mt-1">
                          <PatternLock value={acceptance.lockPattern} readOnly />
                        </div>
                      </div>
                    )}
                    {!acceptance.lockCode && !acceptance.lockPattern && (
                      <p className="text-sm text-muted-foreground italic">
                        {t("repairs.customerIndicatedCodeNotProvided")}
                      </p>
                    )}
                  </div>
                )}
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">{t("standalone.acceptanceDate")}</span>
                  <p className="font-medium">{format(new Date(acceptance.acceptedAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {diagnosis && (
            <Card data-testid="card-diagnosis" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span>{t("repairs.diagnosisData")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {diagnosis.technicalDiagnosis && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("repairs.diagnosiTecnica")}</span>
                    <p className="text-sm whitespace-pre-wrap">{diagnosis.technicalDiagnosis}</p>
                  </div>
                )}
                {diagnosis.damagedComponents && diagnosis.damagedComponents.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("standalone.damagedComponents")}</span>
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
                    <span className="text-sm text-muted-foreground">{t("standalone.diagnosisOutcome")}</span>
                    <Badge 
                      variant={diagnosis.diagnosisOutcome === 'riparabile' ? 'default' : diagnosis.diagnosisOutcome === 'irriparabile' ? 'destructive' : 'secondary'}
                      className="ml-2"
                    >
                      {diagnosis.diagnosisOutcome === 'riparabile' ? t("repairs.repairable") : diagnosis.diagnosisOutcome === 'irriparabile' ? t("repairs.unrepairable") : t("repairs.notWorthRepairing")}
                    </Badge>
                  </div>
                )}
                {diagnosis.estimatedRepairTime && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("standalone.estimatedRepairTime")}</span>
                    <p className="font-medium">{diagnosis.estimatedRepairTime} {t("standalone.hoursUnit")}</p>
                  </div>
                )}
                {diagnosis.requiresExternalParts && (
                  <div className="flex flex-wrap items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Package className="h-4 w-4" />
                    <span className="text-sm">{t("standalone.requiresExternalParts")}</span>
                  </div>
                )}
                {diagnosis.diagnosisNotes && (
                  <div>
                    <span className="text-sm text-muted-foreground">{t("standalone.technicianNotes")}</span>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{diagnosis.diagnosisNotes}</p>
                  </div>
                )}
                {diagnosis.diagnosedAt && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{t("standalone.diagnosisDate")}</span>
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
                  {t("repairs.suggestedSmartphones")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("repairs.unreparableSuggestions")}
                </p>
                <div className="space-y-2">
                  {suggestedDevices.map((device) => (
                    <div
                      key={device.id}
                      className="flex flex-wrap items-center gap-3 p-3 rounded-lg border bg-green-500/5 border-green-500/20"
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
            <Card data-testid="card-test-checklist" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <ClipboardCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <span>{t("repairs.testData")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-medium">{t("standalone.overallOutcome")}</span>
                  <Badge variant={testChecklist.overallResult ? 'default' : 'destructive'}>
                    {testChecklist.overallResult ? t("standalone.passed") : t("standalone.failed")}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'displayTest', label: 'Display' },
                    { key: 'touchTest', label: 'Touch' },
                    { key: 'batteryTest', label: t('repairs.batteryTest') },
                    { key: 'audioTest', label: 'Audio' },
                    { key: 'cameraTest', label: t('repairs.cameraTest') },
                    { key: 'connectivityTest', label: t('repairs.connectivityTest') },
                    { key: 'buttonsTest', label: t('repairs.buttonsTest') },
                    { key: 'sensorsTest', label: t('repairs.sensorsTest') },
                    { key: 'chargingTest', label: t('repairs.chargingTest') },
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
                    <span className="text-sm text-muted-foreground">{t("standalone.testingNotes")}</span>
                    <p className="text-sm whitespace-pre-wrap mt-1">{testChecklist.notes}</p>
                  </div>
                )}

                {testChecklist.testedAt && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{t("standalone.testingDate")}</span>
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
              <Card data-testid="card-customer" className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />
                <CardHeader className="pb-3 relative">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <span>{t("repairs.customerData")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">{t("common.name")}</span>
                    <p className="font-medium" data-testid="text-customer-name">{customerData.fullName || customerData.username || '-'}</p>
                  </div>
                  {customerData.email && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("auth.email")}</span>
                      <p className="font-medium">
                        <a href={`mailto:${customerData.email}`} className="text-primary hover:underline" data-testid="link-customer-email">
                          {customerData.email}
                        </a>
                      </p>
                    </div>
                  )}
                  {customerData.phone && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("auth.phone")}</span>
                      <p className="font-medium">
                        <a href={`tel:${customerData.phone}`} className="text-primary hover:underline" data-testid="link-customer-phone">
                          {customerData.phone}
                        </a>
                      </p>
                    </div>
                  )}
                  {(customerData.address || customerData.city || customerData.province || customerData.postalCode) && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("profile.indirizzo")}</span>
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
                      <span className="text-sm text-muted-foreground">{t("profile.codiceFiscale")}</span>
                      <p className="font-medium font-mono text-sm" data-testid="text-customer-fiscal-code">{customerData.fiscalCode}</p>
                    </div>
                  )}
                  {customerData.vatNumber && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("auth.vatNumber")}</span>
                      <p className="font-medium font-mono text-sm" data-testid="text-customer-vat">{customerData.vatNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {quote && (
            <Card data-testid="card-quote" className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
              <CardHeader className="pb-3 relative">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Euro className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span>{t("repairs.quote")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("common.number")}</span>
                  <span className="font-mono text-sm">{quote.quoteNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t("common.status")}</span>
                  <Badge variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'outline'}>
                    {quote.status === 'pending' || quote.status === 'sent' || quote.status === 'draft' ? t("repairs.pending") : quote.status === 'accepted' ? t("repairs.accepted") : t("repairs.rejected")}
                  </Badge>
                </div>
                
                {/* Parts/Services list */}
                {quote.parts && (() => {
                  try {
                    const parts = typeof quote.parts === 'string' ? JSON.parse(quote.parts) : quote.parts;
                    if (Array.isArray(parts) && parts.length > 0) {
                      return (
                        <div className="pt-2 border-t">
                          <span className="text-sm text-muted-foreground">{t("repairs.ricambiEServizi")}</span>
                          <div className="mt-2 space-y-2">
                            {parts.map((part: { name: string; quantity: number; unitPrice: number }, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm bg-muted/50 rounded px-2 py-1">
                                <div className="flex flex-wrap items-center gap-2">
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
                    <span className="text-sm text-muted-foreground">{t("standalone.laborCost")}</span>
                    <span className="font-medium">
                      {(quote.laborCost / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t bg-muted/30 rounded px-2 py-2">
                  <span className="font-medium">{t("common.total")}</span>
                  <span className="text-lg font-bold">{formatCurrency(quote.totalAmount, true)}</span>
                </div>

                {/* Valid until */}
                {quote.validUntil && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{t("standalone.validUntil")}</span>
                    <span>{format(new Date(quote.validUntil), "dd/MM/yyyy", { locale: it })}</span>
                  </div>
                )}

                {/* Notes */}
                {quote.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{t("common.note")}</span>
                    <p className="text-sm whitespace-pre-wrap mt-1">{quote.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card data-testid="card-attachments" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Paperclip className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span>{t("standalone.attachmentsTitle")}</span>
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
          <Card data-testid="card-data-recovery" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                  <HardDrive className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <span>{t("standalone.dataRecoveryTitle")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataRecoveryLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : dataRecoveryJob ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t("common.status")}</span>
                    <Badge>{dataRecoveryJob.status}</Badge>
                  </div>
                  {dataRecoveryJob.notes && (
                    <div>
                      <span className="text-sm text-muted-foreground">{t("common.note")}</span>
                      <p className="text-sm">{dataRecoveryJob.notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("standalone.customerRequestedDataRecovery")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setDataRecoveryDialogOpen(true)}
                    data-testid="button-start-data-recovery"
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    {t("repairs.manageDataRecovery")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {appointment && (
          <Card data-testid="card-appointment" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span>{t("repairs.deliveryAppointment")}</span>
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
                  {appointment.status === 'confirmed' ? t("repairs.confirmed") : t("repairs.pending")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {repair.notes && (
          <Card data-testid="card-notes" className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-transparent pointer-events-none" />
            <CardHeader className="pb-3 relative">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                </div>
                <span>{t("common.notes")}</span>
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
            <DialogTitle>{t("standalone.skipDiagnosisTitle")}</DialogTitle>
            <DialogDescription>
              {t("standalone.skipDiagnosisDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("common.reasonOptional")}</label>
              <Input
                placeholder={t("repairs.esProblemaGiNotoClienteAbituale")}
                value={skipDiagnosisReason}
                onChange={(e) => setSkipDiagnosisReason(e.target.value)}
                data-testid="input-skip-diagnosis-reason"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t("repairs.skipDiagnosisWarning")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipDiagnosisDialogOpen(false)}>
              {t("common.cancel")}
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
              {t("standalone.confirmAndSkip")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skipQuoteDialogOpen} onOpenChange={(open) => {
        setSkipQuoteDialogOpen(open);
        if (!open) {
          setSkipQuoteReason(null);
          setWarrantySupplier("");
          setWarrantyPurchaseDate("");
          setWarrantyPurchasePrice("");
          setWarrantyProofFile(null);
          setWarrantyProofAttachmentId(null);
          setWarrantyProofPreview(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("standalone.skipQuoteTitle")}</DialogTitle>
            <DialogDescription>
              {t("standalone.skipQuoteDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant={skipQuoteReason === 'garanzia' ? 'default' : 'outline'}
                onClick={() => setSkipQuoteReason('garanzia')}
                className="h-20 flex flex-col items-center justify-center gap-2"
                data-testid="button-skip-warranty"
              >
                <Shield className="h-6 w-6" />
                <span>{t("common.warranty")}</span>
              </Button>
              <Button
                variant={skipQuoteReason === 'omaggio' ? 'default' : 'outline'}
                onClick={() => setSkipQuoteReason('omaggio')}
                className="h-20 flex flex-col items-center justify-center gap-2"
                data-testid="button-skip-gift"
              >
                <Gift className="h-6 w-6" />
                <span>{t("standalone.gift")}</span>
              </Button>
            </div>

            {skipQuoteReason === 'garanzia' && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="warranty-proof" data-testid="label-warranty-proof">{t("warranties.proofPhoto")}</Label>
                  <div className="flex items-center gap-3">
                    {warrantyProofPreview ? (
                      <div className="relative">
                        <img
                          src={warrantyProofPreview}
                          alt={t("warranties.proofPhoto")}
                          className="h-20 w-20 rounded-md object-cover border"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute -top-2 -right-2 rounded-full bg-background border"
                          onClick={() => {
                            setWarrantyProofFile(null);
                            setWarrantyProofAttachmentId(null);
                            setWarrantyProofPreview(null);
                          }}
                          data-testid="button-remove-warranty-proof"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="warranty-proof"
                        className="flex flex-col items-center justify-center gap-1 h-20 w-20 rounded-md border-2 border-dashed cursor-pointer hover-elevate"
                        data-testid="label-upload-warranty-proof"
                      >
                        {warrantyProofUploading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{t("warranties.upload")}</span>
                          </>
                        )}
                      </label>
                    )}
                    <input
                      id="warranty-proof"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      data-testid="input-warranty-proof"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !repairOrderId) return;
                        setWarrantyProofFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setWarrantyProofPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                        setWarrantyProofUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append("file", file);
                          const resp = await fetch(`/api/repair-orders/${repairOrderId}/attachments`, {
                            method: "POST",
                            credentials: "include",
                            body: formData,
                          });
                          if (!resp.ok) throw new Error(t("attachment.uploadFailed"));
                          const data = await resp.json();
                          setWarrantyProofAttachmentId(data.id);
                        } catch (err: any) {
                          toast({ title: t("auth.error"), description: err.message, variant: "destructive" });
                          setWarrantyProofFile(null);
                          setWarrantyProofPreview(null);
                          setWarrantyProofAttachmentId(null);
                        } finally {
                          setWarrantyProofUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{t("warranties.proofPhotoDesc")}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="warranty-supplier" data-testid="label-warranty-supplier">{t("warranties.supplier")}</Label>
                  <Input
                    id="warranty-supplier"
                    value={warrantySupplier}
                    onChange={(e) => setWarrantySupplier(e.target.value)}
                    placeholder={t("warranties.supplierPlaceholder")}
                    data-testid="input-warranty-supplier"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="warranty-purchase-date" data-testid="label-warranty-purchase-date">{t("warranties.purchaseDate")}</Label>
                    <Input
                      id="warranty-purchase-date"
                      type="date"
                      value={warrantyPurchaseDate}
                      onChange={(e) => setWarrantyPurchaseDate(e.target.value)}
                      data-testid="input-warranty-purchase-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warranty-purchase-price" data-testid="label-warranty-purchase-price">{t("warranties.purchasePrice")}</Label>
                    <Input
                      id="warranty-purchase-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={warrantyPurchasePrice}
                      onChange={(e) => setWarrantyPurchasePrice(e.target.value)}
                      placeholder="0.00"
                      data-testid="input-warranty-purchase-price"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkipQuoteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => skipQuoteReason && skipQuoteMutation.mutate(skipQuoteReason)}
              disabled={!skipQuoteReason || skipQuoteMutation.isPending || warrantyProofUploading}
              data-testid="button-confirm-skip"
            >
              {skipQuoteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
