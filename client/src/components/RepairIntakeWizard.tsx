import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, Smartphone, ClipboardCheck, CheckCircle2, Check,
  ChevronRight, ChevronLeft, Loader2, Plus, Search,
  Monitor, Tablet, Laptop, Tv, Gamepad2, Watch, Headphones, Printer,
  AlertCircle, UserPlus, X, Mail, Phone, Building, Store, Download, Tag, PartyPopper, FileText, Calculator,
  Warehouse, Package, Cpu, Code, Wifi, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchableServiceCombobox } from "@/components/SearchableServiceCombobox";
import { SearchableProductCombobox } from "@/components/SearchableProductCombobox";
import { DiagnosisPhotoUploader } from "@/components/DiagnosisPhotoUploader";
import { DiagnosisFormDialog, type DiagnosisCollectedData } from "@/components/DiagnosisFormDialog";
import { QuoteFormDialog, type QuoteCollectedData } from "@/components/QuoteFormDialog";
import { Stethoscope } from "lucide-react";
import type { 
  Warehouse as WarehouseType, 
  DiagnosticFinding, 
  DamagedComponentType, 
  EstimatedRepairTime, 
  UnrepairableReason, 
  Promotion 
} from "@shared/schema";

interface WarehouseWithOwner extends WarehouseType {
  owner?: { id: string; username: string; fullName: string | null } | null;
}

interface RepairIntakeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (order: any) => void;
}

// Wizard schema - includes acceptance flow fields
const wizardSchema = z.object({
  // Step 1: Device
  deviceType: z.string().min(1, "Seleziona il tipo di dispositivo"),
  deviceBrandId: z.string().optional(),
  deviceModelId: z.string().optional(),
  deviceModel: z.string().optional(),
  brand: z.string().optional(),
  imei: z.string().optional(),
  serial: z.string().optional(),
  // IMEI flags
  imeiNotReadable: z.boolean().default(false),
  imeiNotPresent: z.boolean().default(false),
  issueDescription: z.string().optional().default(""),
  
  // Step 2: Customer & Assignment
  customerId: z.string().min(1, "Seleziona un cliente"),
  resellerId: z.string().optional(),
  subResellerId: z.string().optional(),
  repairCenterId: z.string().optional(),
  
  // Step 3: Conditions
  aestheticCondition: z.string().optional(),
  accessories: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

type WizardData = z.infer<typeof wizardSchema>;

const STEPS = [
  { id: 1, name: "Dispositivo", icon: Smartphone },
  { id: 2, name: "Cliente", icon: User },
  { id: 3, name: "Condizioni", icon: ClipboardCheck },
  { id: 4, name: "Diagnosi", icon: FileText },
  { id: 5, name: "Conferma", icon: CheckCircle2 },
  { id: 6, name: "Completato", icon: PartyPopper },
];

const DEVICE_TYPE_ICONS: Record<string, any> = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  pc: Monitor,
  tv: Tv,
  console: Gamepad2,
  smartwatch: Watch,
  cuffie: Headphones,
  stampante: Printer,
};

const AESTHETIC_CONDITIONS = [
  { value: "new", label: "Come nuovo", color: "bg-green-500" },
  { value: "good", label: "Buono", color: "bg-blue-500" },
  { value: "fair", label: "Usura normale", color: "bg-yellow-500" },
  { value: "poor", label: "Danneggiato", color: "bg-red-500" },
];

export function RepairIntakeWizard({ 
  open, 
  onOpenChange, 
  onSuccess 
}: RepairIntakeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ fullName: "", email: "", phone: "" });
  const [showNewBrandForm, setShowNewBrandForm] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [showNewModelForm, setShowNewModelForm] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [selectedSubResellerId, setSelectedSubResellerId] = useState("");
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string } | null>(null);
  const [createQuoteNow, setCreateQuoteNow] = useState(false);
  const [quoteParts, setQuoteParts] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([]);
  const [quoteLaborCost, setQuoteLaborCost] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [selectedQuoteWarehouseId, setSelectedQuoteWarehouseId] = useState<string>("");
  const [createDiagnosisNow, setCreateDiagnosisNow] = useState(false);
  const [showTechnicalDiagnosis, setShowTechnicalDiagnosis] = useState(false);
  const [diagnosisTechnical, setDiagnosisTechnical] = useState("");
  const [diagnosisOutcome, setDiagnosisOutcome] = useState<"riparabile" | "non_conveniente" | "irriparabile">("riparabile");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [diagnosisEstimatedTime, setDiagnosisEstimatedTime] = useState<number | null>(null);
  const [diagnosisRequiresExternalParts, setDiagnosisRequiresExternalParts] = useState(false);
  const [diagnosisCustomerDataImportant, setDiagnosisCustomerDataImportant] = useState(false);
  const [diagnosisDataRecoveryRequested, setDiagnosisDataRecoveryRequested] = useState(false);
  const [diagnosisSelectedFindingIds, setDiagnosisSelectedFindingIds] = useState<string[]>([]);
  const [diagnosisSelectedComponentIds, setDiagnosisSelectedComponentIds] = useState<string[]>([]);
  const [diagnosisEstimatedTimeId, setDiagnosisEstimatedTimeId] = useState<string>("");
  const [diagnosisSkipPhotos, setDiagnosisSkipPhotos] = useState(true);
  const [diagnosisPhotoIds, setDiagnosisPhotoIds] = useState<string[]>([]);
  const [uploadSessionId] = useState(() => crypto.randomUUID());
  const [diagnosisUnrepairableReasonId, setDiagnosisUnrepairableReasonId] = useState<string>("");
  const [diagnosisSuggestedPromotionIds, setDiagnosisSuggestedPromotionIds] = useState<string[]>([]);
  
  // Modal dialog states for standalone mode
  const [diagnosisDialogOpen, setDiagnosisDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [collectedDiagnosisData, setCollectedDiagnosisData] = useState<DiagnosisCollectedData | null>(null);
  const [collectedQuoteData, setCollectedQuoteData] = useState<QuoteCollectedData | null>(null);
  
  const dialogContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [, setLocation] = useLocation();

  const form = useForm<WizardData>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      customerId: "",
      resellerId: "",
      subResellerId: "",
      repairCenterId: "",
      deviceType: "",
      deviceBrandId: "",
      deviceModelId: "",
      deviceModel: "",
      brand: "",
      imei: "",
      serial: "",
      imeiNotReadable: false,
      imeiNotPresent: false,
      issueDescription: "",
      aestheticCondition: "",
      accessories: [],
      notes: "",
    },
  });

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setCustomerSearch("");
      setSelectedTypeId("");
      setSelectedBrandId("");
      setSelectedResellerId("");
      setSelectedSubResellerId("");
      setShowNewCustomerForm(false);
      setNewCustomerForm({ fullName: "", email: "", phone: "" });
      setShowNewBrandForm(false);
      setNewBrandName("");
      setShowNewModelForm(false);
      setNewModelName("");
      setCreatedOrder(null);
      // Reset quote state
      setCreateQuoteNow(false);
      setQuoteParts([]);
      setQuoteLaborCost(0);
      setQuoteNotes("");
      setSelectedQuoteWarehouseId("");
      setCreateDiagnosisNow(false);
      setDiagnosisTechnical("");
      setDiagnosisOutcome("riparabile");
      setDiagnosisNotes("");
      setDiagnosisEstimatedTime(null);
      setDiagnosisRequiresExternalParts(false);
      setDiagnosisCustomerDataImportant(false);
      setDiagnosisDataRecoveryRequested(false);
      setDiagnosisSelectedFindingIds([]);
      setDiagnosisSelectedComponentIds([]);
      setDiagnosisEstimatedTimeId("");
      setDiagnosisSkipPhotos(true);
      setDiagnosisUnrepairableReasonId("");
      setDiagnosisSuggestedPromotionIds([]);
      // Reset modal dialog states
      setDiagnosisDialogOpen(false);
      setQuoteDialogOpen(false);
      setCollectedDiagnosisData(null);
      setCollectedQuoteData(null);
      form.reset();
    }
  }, [open, form]);

  // Scroll to top when step changes
  useEffect(() => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Queries
  const customerEndpoint = (user?.role === "reseller" || user?.role === "reseller_staff") ? "/api/reseller/customers" : "/api/customers";

  // Mutation per creare nuovo cliente rapido
  const createCustomerMutation = useMutation({
    mutationFn: async (data: { fullName: string; email?: string; phone?: string }) => {
      return apiRequest("POST", "/api/customers/quick", data);
    },
    onSuccess: async (response) => {
      const newCustomer = await response.json();
      // Invalida la cache clienti
      queryClient.invalidateQueries({ queryKey: [customerEndpoint] });
      // Seleziona automaticamente il nuovo cliente
      form.setValue("customerId", newCustomer.id);
      // Chiudi il form e resetta
      setShowNewCustomerForm(false);
      setNewCustomerForm({ fullName: "", email: "", phone: "" });
      toast({ 
        title: "Cliente creato", 
        description: `${newCustomer.fullName} è stato aggiunto` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile creare il cliente", 
        variant: "destructive" 
      });
    },
  });

  // Mutation per creare nuova marca (usa endpoint diverso per admin vs reseller)
  const createBrandMutation = useMutation({
    mutationFn: async (data: { name: string; typeId: string }) => {
      const endpoint = user?.role === "admin" 
        ? "/api/admin/device-brands" 
        : "/api/reseller/device-brands";
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: async (response) => {
      const newBrand = await response.json();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/reseller/device-brands", { includeGlobal: true }] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/device-brands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
      form.setValue("deviceBrandId", newBrand.id);
      setSelectedBrandId(newBrand.id);
      form.setValue("deviceModelId", "");
      setShowNewBrandForm(false);
      setNewBrandName("");
      toast({ title: "Marca creata", description: `${newBrand.name} aggiunta al catalogo` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile creare la marca", 
        variant: "destructive" 
      });
    },
  });

  // Mutation per creare nuovo modello (usa endpoint diverso per admin vs reseller)
  const createModelMutation = useMutation({
    mutationFn: async (data: { modelName: string; typeId: string; brandId?: string; resellerBrandId?: string }) => {
      const endpoint = user?.role === "admin" 
        ? "/api/admin/device-models" 
        : "/api/reseller/device-models";
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: async (response) => {
      const newModel = await response.json();
      queryClient.invalidateQueries({ 
        queryKey: ["/api/reseller/device-models", { typeId: selectedTypeId, includeGlobal: true }] 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/device-models", { typeId: selectedTypeId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      form.setValue("deviceModelId", newModel.id);
      setShowNewModelForm(false);
      setNewModelName("");
      toast({ title: "Modello creato", description: `${newModel.modelName} aggiunto al catalogo` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Errore", 
        description: error.message || "Impossibile creare il modello", 
        variant: "destructive" 
      });
    },
  });

  const { data: customers = [] } = useQuery<Array<{
    id: string;
    fullName: string;
    email: string;
    phone?: string;
  }>>({
    queryKey: [customerEndpoint],
    select: (data: any[]) => data?.map((u: any) => ({
      id: u.id,
      fullName: u.fullName || u.companyName || u.username || "Cliente",
      email: u.email || "",
      phone: u.phone || "",
    })) || [],
  });

  const { data: deviceTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/device-types"],
  });

  const { data: accessibleWarehouses = [] } = useQuery<WarehouseWithOwner[]>({
    queryKey: ["/api/warehouses/accessible"],
    enabled: open,
  });

  const isResellerOrStaff = ["reseller", "reseller_staff"].includes(user?.role || "");
  const canCreateCatalogItems = ["admin", "reseller", "reseller_staff"].includes(user?.role || "");

  const { data: deviceBrands = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: isResellerOrStaff 
      ? ["/api/reseller/device-brands", { includeGlobal: true }]
      : ["/api/device-brands"],
    queryFn: async () => {
      const url = isResellerOrStaff 
        ? "/api/reseller/device-brands?includeGlobal=true"
        : "/api/device-brands";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const { data: deviceModels = [] } = useQuery<Array<{ 
    id: string; 
    modelName: string; 
    brandId: string;
  }>>({
    queryKey: isResellerOrStaff
      ? ["/api/reseller/device-models", { typeId: selectedTypeId, includeGlobal: true }]
      : ["/api/device-models", { typeId: selectedTypeId }],
    queryFn: async () => {
      const params = new URLSearchParams({ typeId: selectedTypeId });
      if (isResellerOrStaff) params.append("includeGlobal", "true");
      const url = isResellerOrStaff 
        ? `/api/reseller/device-models?${params}`
        : `/api/device-models?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const { data: repairCenters = [] } = useQuery<Array<{ 
    id: string; 
    name: string;
    address: string | null;
    resellerId: string | null;
    ownerName: string | null;
    isOwn: boolean;
    isSubResellerCenter: boolean;
  }>>({
    queryKey: ["/api/repair-centers"],
    enabled: user?.role === "admin" || user?.role === "reseller",
  });

  // Query for resellers (admin only)
  const { data: resellers = [] } = useQuery<Array<{ 
    id: string; 
    username: string;
    fullName: string | null;
    email: string | null;
  }>>({
    queryKey: ["/api/resellers"],
    queryFn: async () => {
      const res = await fetch("/api/resellers");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: user?.role === "admin",
  });

  // Query for sub-resellers (filtered by selected reseller)
  const { data: subResellers = [] } = useQuery<Array<{ 
    id: string; 
    username: string;
    fullName: string | null;
    email: string | null;
    parentResellerId: string | null;
  }>>({
    queryKey: ["/api/admin/sub-resellers", selectedResellerId],
    queryFn: async () => {
      const res = await fetch(`/api/users?role=reseller&parentResellerId=${selectedResellerId}`);
      if (!res.ok) throw new Error("Failed");
      const users = await res.json();
      return users.filter((u: any) => u.parentResellerId === selectedResellerId);
    },
    enabled: user?.role === "admin" && !!selectedResellerId,
  });

  const { data: accessoryTypes = [] } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/accessory-types", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? `?deviceTypeId=${selectedTypeId}` : "";
      const res = await fetch(`/api/accessory-types${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  // Diagnosis lookup data queries
  const { data: diagnosticFindings = [] } = useQuery<DiagnosticFinding[]>({
    queryKey: ["/api/diagnostic-findings", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? `?deviceTypeId=${selectedTypeId}` : "";
      const res = await fetch(`/api/diagnostic-findings${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open && createDiagnosisNow,
  });

  const { data: damagedComponentTypes = [] } = useQuery<DamagedComponentType[]>({
    queryKey: ["/api/damaged-component-types", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? `?deviceTypeId=${selectedTypeId}` : "";
      const res = await fetch(`/api/damaged-component-types${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open && createDiagnosisNow,
  });

  const { data: estimatedRepairTimes = [] } = useQuery<EstimatedRepairTime[]>({
    queryKey: ["/api/estimated-repair-times", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? `?deviceTypeId=${selectedTypeId}` : "";
      const res = await fetch(`/api/estimated-repair-times${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open && createDiagnosisNow,
  });

  const { data: unrepairableReasons = [] } = useQuery<UnrepairableReason[]>({
    queryKey: ["/api/unrepairable-reasons", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? `?deviceTypeId=${selectedTypeId}` : "";
      const res = await fetch(`/api/unrepairable-reasons${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open && createDiagnosisNow && diagnosisOutcome === "irriparabile",
  });

  const { data: promotions = [] } = useQuery<Promotion[]>({
    queryKey: ["/api/promotions"],
    queryFn: async () => {
      const res = await fetch("/api/promotions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: open && createDiagnosisNow && diagnosisOutcome === "non_conveniente",
  });

  // Group findings by category
  const findingsByCategory = diagnosticFindings.reduce((acc, finding) => {
    const category = finding.category || "altro";
    if (!acc[category]) acc[category] = [];
    acc[category].push(finding);
    return acc;
  }, {} as Record<string, DiagnosticFinding[]>);

  const categoryLabels: Record<string, string> = {
    hardware: "Hardware",
    software: "Software", 
    connectivity: "Connettività",
    altro: "Altro",
  };

  const categoryIcons: Record<string, any> = {
    hardware: Cpu,
    software: Code,
    connectivity: Wifi,
    altro: MoreHorizontal,
  };

  // Filter customers by search
  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Show all brands for selected device type (don't filter by existing models)
  const availableBrands = deviceBrands;

  // Filter models by selected brand
  const filteredModels = selectedBrandId 
    ? deviceModels.filter(m => m.brandId === selectedBrandId)
    : deviceModels;

  // Filter repair centers based on selected reseller/sub-reseller (admin only)
  const filteredRepairCenters = user?.role === "admin" 
    ? repairCenters.filter(rc => {
        if (selectedSubResellerId) {
          // Filter by sub-reseller
          return rc.resellerId === selectedSubResellerId;
        } else if (selectedResellerId) {
          // Filter by reseller (include direct centers and sub-reseller centers)
          return rc.resellerId === selectedResellerId || 
                 subResellers.some(sr => sr.id === rc.resellerId);
        }
        return true; // No filter - show all
      })
    : repairCenters;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: WizardData) => {
      // Find selected device type name
      const selectedType = deviceTypes.find(t => t.id === data.deviceType);
      const selectedBrand = deviceBrands.find(b => b.id === data.deviceBrandId);
      const selectedModel = deviceModels.find(m => m.id === data.deviceModelId);

      // Build acceptance-aware payload
      const payload: Record<string, any> = {
        customerId: data.customerId,
        deviceType: selectedType?.name || data.deviceType,
        deviceModel: selectedModel?.modelName || data.deviceModel || "Non specificato",
        issueDescription: data.issueDescription,
        // IMEI flags - always include for acceptance flow
        imeiNotReadable: data.imeiNotReadable || false,
        imeiNotPresent: data.imeiNotPresent || false,
      };

      // Add optional order fields
      if (selectedBrand?.name || data.brand) {
        payload.brand = selectedBrand?.name || data.brand;
      }
      if (data.deviceModelId) {
        payload.deviceModelId = data.deviceModelId;
      }
      if (data.imei) {
        payload.imei = data.imei;
      }
      if (data.serial) {
        payload.serial = data.serial;
      }
      if (data.notes) {
        payload.notes = data.notes;
      }
      if (data.repairCenterId || user?.repairCenterId) {
        payload.repairCenterId = data.repairCenterId || user?.repairCenterId;
      }
      // Add reseller/sub-reseller assignment (admin only)
      if (data.resellerId) {
        payload.resellerId = data.resellerId;
      }
      if (data.subResellerId) {
        payload.subResellerId = data.subResellerId;
      }

      // Build acceptance object with structured data and required defaults
      // Always include acceptance to trigger the acceptance flow on backend
      const acceptance: Record<string, any> = {
        // Arrays - empty by default
        declaredDefects: [],
        accessories: data.accessories || [],
        // Required booleans with sensible defaults
        aestheticPhotosMandatory: false,
        hasLockCode: false,
        accessoriesRemoved: true, // Default to accessories being removed/checked
      };
      
      // Add optional fields if provided
      if (data.aestheticCondition) {
        acceptance.aestheticCondition = data.aestheticCondition;
      }
      
      // Include acceptance in payload - this triggers acceptanceOrderSchema on backend
      payload.acceptance = acceptance;

      // Include quote data if collected from modal dialog
      if (createQuoteNow && collectedQuoteData) {
        payload.quote = {
          createQuote: true,
          parts: collectedQuoteData.parts.map(p => ({
            name: p.name,
            quantity: p.quantity,
            unitPrice: Math.round(p.unitPrice * 100),
          })),
          laborCost: Math.round(collectedQuoteData.laborCost * 100),
          notes: collectedQuoteData.notes || null,
        };
      }

      // Include diagnosis data if collected from modal dialog
      if (createDiagnosisNow && collectedDiagnosisData) {
        payload.diagnosis = {
          createDiagnosis: true,
          technicalDiagnosis: collectedDiagnosisData.technicalDiagnosis,
          diagnosisOutcome: collectedDiagnosisData.outcome,
          estimatedRepairTime: collectedDiagnosisData.estimatedTime ?? null,
          diagnosisNotes: collectedDiagnosisData.notes || null,
          requiresExternalParts: collectedDiagnosisData.requiresExternalParts || false,
          customerDataImportant: collectedDiagnosisData.customerDataImportant || false,
          dataRecoveryRequested: collectedDiagnosisData.dataRecoveryRequested || false,
          findingIds: collectedDiagnosisData.findingIds && collectedDiagnosisData.findingIds.length > 0 
            ? collectedDiagnosisData.findingIds : undefined,
          componentIds: collectedDiagnosisData.componentIds && collectedDiagnosisData.componentIds.length > 0 
            ? collectedDiagnosisData.componentIds : undefined,
          estimatedRepairTimeId: collectedDiagnosisData.estimatedRepairTimeId || undefined,
          skipPhotos: collectedDiagnosisData.skipPhotos ?? true,
          unrepairableReasonId: collectedDiagnosisData.outcome === "irriparabile" && collectedDiagnosisData.unrepairableReasonId 
            ? collectedDiagnosisData.unrepairableReasonId : undefined,
          suggestedPromotionIds: collectedDiagnosisData.outcome === "non_conveniente" && 
            collectedDiagnosisData.suggestedPromotionIds && collectedDiagnosisData.suggestedPromotionIds.length > 0 
            ? collectedDiagnosisData.suggestedPromotionIds : undefined,
        };
      }

      const res = await apiRequest("POST", "/api/repair-orders", payload);
      return res.json();
    },
    onSuccess: async (data: { order: { id: string; orderNumber: string } }) => {
      // Link temporary photos if any were uploaded
      if (diagnosisPhotoIds.length > 0) {
        try {
          await fetch(`/api/repair-orders/${data.order.id}/attachments/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ uploadSessionId }),
          });
        } catch (e) {
          console.warn("Could not link photos:", e);
        }
      }
      
      toast({
        title: "Riparazione creata",
        description: "La nuova riparazione è stata registrata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      onSuccess?.(data.order);
      onOpenChange(false);
      
      // Navigate to repair detail page based on user role
      const rolePrefix = user?.role === "admin" ? "/admin" 
        : (user?.role === "reseller" || user?.role === "reseller_staff" || user?.role === "sub_reseller") ? "/reseller"
        : user?.role === "repair_center" ? "/repair-center"
        : "/customer";
      setLocation(`${rolePrefix}/repairs/${data.order.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare la riparazione",
        variant: "destructive",
      });
    },
  });

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return !!form.watch("deviceType");
      case 2:
        return !!form.watch("customerId");
      case 3:
        return true; // Optional step
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    form.handleSubmit((data) => {
      createMutation.mutate(data);
    })();
  };

  const selectedCustomer = customers.find(c => c.id === form.watch("customerId"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className="w-[calc(100vw-2rem)] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">Nuova Riparazione</DialogTitle>
        </DialogHeader>

        {/* Step Indicator - show only first 4 steps (step 5 is success screen) */}
        {currentStep < 6 && currentStep !== 6 && (
        <div className="flex items-center justify-between mb-6 overflow-x-auto min-w-0">
          {STEPS.slice(0, 4).map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-primary/20 text-primary",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] sm:text-xs mt-1 font-medium text-center max-w-[60px] sm:max-w-none truncate",
                    isActive && "text-primary",
                    !isActive && "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < 3 && (
                  <div className={cn(
                    "w-4 sm:w-8 md:w-12 h-0.5 mx-1 sm:mx-2 flex-shrink-0",
                    isCompleted ? "bg-primary/50" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
        )}

        <Form {...form}>
          <form className="space-y-4">
            {/* Step 2: Customer Selection */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <User className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">
                    {showNewCustomerForm ? "Nuovo Cliente" : "Seleziona il Cliente"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {showNewCustomerForm 
                      ? "Inserisci i dati del nuovo cliente" 
                      : "Cerca e seleziona il cliente per questa riparazione"}
                  </p>
                </div>

                {!showNewCustomerForm ? (
                  <>
                    {/* Search + New Customer Button */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca per nome o email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="pl-10"
                          data-testid="input-customer-search"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewCustomerForm(true)}
                        data-testid="button-new-customer"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Nuovo
                      </Button>
                    </div>

                    {/* Customer List */}
                    <div className="max-h-64 overflow-y-auto space-y-2 p-1">
                      {filteredCustomers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>Nessun cliente trovato</p>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowNewCustomerForm(true)}
                            className="mt-2"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Crea nuovo cliente
                          </Button>
                        </div>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <Card
                            key={customer.id}
                            className={cn(
                              "cursor-pointer transition-colors hover-elevate",
                              form.watch("customerId") === customer.id && "ring-2 ring-primary"
                            )}
                            onClick={() => form.setValue("customerId", customer.id)}
                            data-testid={`card-customer-${customer.id}`}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{customer.fullName}</p>
                                <p className="text-sm text-muted-foreground truncate">
                                  {customer.email}
                                </p>
                              </div>
                              {form.watch("customerId") === customer.id && (
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  /* New Customer Form */
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Dati Cliente</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setShowNewCustomerForm(false);
                            setNewCustomerForm({ fullName: "", email: "", phone: "" });
                          }}
                          data-testid="button-cancel-new-customer"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="new-customer-name">Nome Completo *</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-customer-name"
                              placeholder="Mario Rossi"
                              value={newCustomerForm.fullName}
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, fullName: e.target.value }))}
                              className="pl-10"
                              data-testid="input-new-customer-name"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="new-customer-email">Email</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-customer-email"
                              type="email"
                              placeholder="mario.rossi@email.com"
                              value={newCustomerForm.email}
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                              className="pl-10"
                              data-testid="input-new-customer-email"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="new-customer-phone">Telefono</Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="new-customer-phone"
                              type="tel"
                              placeholder="+39 333 1234567"
                              value={newCustomerForm.phone}
                              onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                              className="pl-10"
                              data-testid="input-new-customer-phone"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowNewCustomerForm(false);
                            setNewCustomerForm({ fullName: "", email: "", phone: "" });
                          }}
                        >
                          Annulla
                        </Button>
                        <Button
                          type="button"
                          className="flex-1"
                          disabled={!newCustomerForm.fullName.trim() || createCustomerMutation.isPending}
                          onClick={() => {
                            createCustomerMutation.mutate({
                              fullName: newCustomerForm.fullName.trim(),
                              email: newCustomerForm.email.trim() || undefined,
                              phone: newCustomerForm.phone.trim() || undefined,
                            });
                          }}
                          data-testid="button-create-customer"
                        >
                          {createCustomerMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creazione...
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Crea Cliente
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reseller Selection - admin only */}
                {user?.role === "admin" && resellers.length > 0 && !showNewCustomerForm && (
                  <FormField
                    control={form.control}
                    name="resellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assegna a Rivenditore</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(val) => {
                            field.onChange(val);
                            setSelectedResellerId(val);
                            // Reset sub-reseller and repair center when reseller changes
                            form.setValue("subResellerId", "");
                            form.setValue("repairCenterId", "");
                            setSelectedSubResellerId("");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-reseller-step1">
                              <SelectValue placeholder="Seleziona rivenditore (opzionale)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {resellers.map((reseller) => (
                              <SelectItem key={reseller.id} value={reseller.id}>
                                {reseller.fullName || reseller.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Scegli a quale rivenditore assegnare la lavorazione
                        </p>
                      </FormItem>
                    )}
                  />
                )}

                {/* Sub-Reseller Selection - admin only, when reseller is selected */}
                {user?.role === "admin" && selectedResellerId && subResellers.length > 0 && !showNewCustomerForm && (
                  <FormField
                    control={form.control}
                    name="subResellerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assegna a Sub-Rivenditore</FormLabel>
                        <Select 
                          value={field.value} 
                          onValueChange={(val) => {
                            field.onChange(val);
                            setSelectedSubResellerId(val);
                            // Reset repair center when sub-reseller changes
                            form.setValue("repairCenterId", "");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-sub-reseller-step1">
                              <SelectValue placeholder="Seleziona sub-rivenditore (opzionale)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subResellers.map((subReseller) => (
                              <SelectItem key={subReseller.id} value={subReseller.id}>
                                {subReseller.fullName || subReseller.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Scegli a quale sub-rivenditore assegnare la lavorazione
                        </p>
                      </FormItem>
                    )}
                  />
                )}

                {/* Repair Center Selection - show for admin/reseller with filtered centers */}
                {(user?.role === "admin" || user?.role === "reseller") && filteredRepairCenters.length > 0 && !showNewCustomerForm && (
                  <FormField
                    control={form.control}
                    name="repairCenterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assegna a Centro Riparazione</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-repair-center-step1">
                              <SelectValue placeholder="Seleziona centro (opzionale)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* For admin: show filtered centers */}
                            {user?.role === "admin" && filteredRepairCenters.map((rc) => (
                              <SelectItem key={rc.id} value={rc.id}>
                                {rc.name} {rc.ownerName ? `(${rc.ownerName})` : ''}
                              </SelectItem>
                            ))}
                            {/* For reseller: show categorized centers */}
                            {user?.role === "reseller" && (
                              <>
                                {/* Own centers first */}
                                {filteredRepairCenters.filter(c => c.isOwn).length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      I miei centri
                                    </div>
                                    {filteredRepairCenters.filter(c => c.isOwn).map((rc) => (
                                      <SelectItem key={rc.id} value={rc.id}>
                                        {rc.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                                {/* Sub-reseller centers */}
                                {filteredRepairCenters.filter(c => c.isSubResellerCenter).length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      Centri della Rete
                                    </div>
                                    {filteredRepairCenters.filter(c => c.isSubResellerCenter).map((rc) => (
                                      <SelectItem key={rc.id} value={rc.id}>
                                        {rc.name} {rc.ownerName ? `(${rc.ownerName})` : ''}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                                {/* Fallback for non-reseller roles or simple list */}
                                {filteredRepairCenters.filter(c => !c.isOwn && !c.isSubResellerCenter).map((rc) => (
                                  <SelectItem key={rc.id} value={rc.id}>
                                    {rc.name}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Scegli a quale centro affidare la lavorazione
                        </p>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}

            {/* Step 1: Device Info */}
            {currentStep === 1 && (
              <div className="space-y-4 min-w-0">
                <div className="text-center mb-4">
                  <Smartphone className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">Dati Dispositivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Seleziona il tipo di dispositivo e descrivi il problema
                  </p>
                </div>

                {/* Device Type Selection */}
                <FormField
                  control={form.control}
                  name="deviceType"
                  render={({ field }) => (
                    <FormItem className="min-w-0">
                      <FormLabel>Tipo Dispositivo *</FormLabel>
                      <div className="grid gap-2 w-full min-w-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                        {deviceTypes.map((type) => {
                          const Icon = DEVICE_TYPE_ICONS[type.name.toLowerCase()] || Smartphone;
                          return (
                            <Card
                              key={type.id}
                              className={cn(
                                "cursor-pointer transition-colors min-w-0 w-full",
                                field.value === type.id && "ring-2 ring-primary"
                              )}
                              onClick={() => {
                                field.onChange(type.id);
                                setSelectedTypeId(type.id);
                                setSelectedBrandId("");
                                form.setValue("deviceBrandId", "");
                                form.setValue("deviceModelId", "");
                              }}
                              data-testid={`card-device-type-${type.id}`}
                            >
                              <CardContent className="p-3 text-center">
                                <Icon className="h-6 w-6 mx-auto mb-1" />
                                <span className="text-sm truncate block">{type.name}</span>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brand & Model */}
                {selectedTypeId && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {/* Brand Select + Create */}
                      <FormField
                        control={form.control}
                        name="deviceBrandId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <div className="flex gap-2">
                              <Select
                                value={field.value}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  setSelectedBrandId(val);
                                  form.setValue("deviceModelId", "");
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-brand" className="flex-1">
                                    <SelectValue placeholder="Seleziona marca" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableBrands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                      {brand.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {canCreateCatalogItems && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  onClick={() => setShowNewBrandForm(true)}
                                  data-testid="button-new-brand"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Model Select + Create */}
                      <FormField
                        control={form.control}
                        name="deviceModelId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Modello</FormLabel>
                            <div className="flex gap-2">
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!selectedBrandId}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-model" className="flex-1">
                                    <SelectValue placeholder="Seleziona modello" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {filteredModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      {model.modelName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {canCreateCatalogItems && selectedBrandId && (
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  onClick={() => setShowNewModelForm(true)}
                                  data-testid="button-new-model"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* New Brand Form Inline */}
                    {showNewBrandForm && (
                      <Card className="border-primary/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm">Nuova Marca</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setShowNewBrandForm(false);
                                setNewBrandName("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nome marca..."
                              value={newBrandName}
                              onChange={(e) => setNewBrandName(e.target.value)}
                              data-testid="input-new-brand-name"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              disabled={!newBrandName.trim() || createBrandMutation.isPending}
                              onClick={() => {
                                createBrandMutation.mutate({
                                  name: newBrandName.trim(),
                                  typeId: selectedTypeId,
                                });
                              }}
                              data-testid="button-create-brand"
                            >
                              {createBrandMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Crea"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* New Model Form Inline */}
                    {showNewModelForm && selectedBrandId && (
                      <Card className="border-primary/50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm">Nuovo Modello</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setShowNewModelForm(false);
                                setNewModelName("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nome modello..."
                              value={newModelName}
                              onChange={(e) => setNewModelName(e.target.value)}
                              data-testid="input-new-model-name"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              disabled={!newModelName.trim() || createModelMutation.isPending}
                              onClick={() => {
                                createModelMutation.mutate({
                                  modelName: newModelName.trim(),
                                  typeId: selectedTypeId,
                                  brandId: selectedBrandId,
                                });
                              }}
                              data-testid="button-create-model"
                            >
                              {createModelMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Crea"
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Manual model input if no catalog match */}
                {selectedTypeId && !form.watch("deviceModelId") && (
                  <FormField
                    control={form.control}
                    name="deviceModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modello (manuale)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="es. iPhone 14 Pro, Galaxy S23..."
                            data-testid="input-device-model"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                {/* IMEI / Serial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <FormField
                    control={form.control}
                    name="imei"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IMEI</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Opzionale"
                            disabled={form.watch("imeiNotPresent") || form.watch("imeiNotReadable")}
                            data-testid="input-imei"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="serial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seriale</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Opzionale"
                            data-testid="input-serial"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* IMEI Flags */}
                <div className="flex flex-wrap gap-4">
                  <FormField
                    control={form.control}
                    name="imeiNotReadable"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue("imei", "");
                                form.setValue("imeiNotPresent", false);
                              }
                            }}
                            data-testid="checkbox-imei-not-readable"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          IMEI non leggibile
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imeiNotPresent"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                form.setValue("imei", "");
                                form.setValue("imeiNotReadable", false);
                              }
                            }}
                            data-testid="checkbox-imei-not-present"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          IMEI non presente
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                </div>
            )}

            {/* Step 3: Conditions */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <ClipboardCheck className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">Condizioni e Accessori</h3>
                  <p className="text-sm text-muted-foreground">
                    Documenta lo stato del dispositivo (opzionale)
                  </p>
                </div>

                {/* Aesthetic Condition */}
                <FormField
                  control={form.control}
                  name="aestheticCondition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condizione Estetica</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {AESTHETIC_CONDITIONS.map((condition) => (
                          <Card
                            key={condition.value}
                            className={cn(
                              "cursor-pointer transition-colors hover-elevate",
                              field.value === condition.value && "ring-2 ring-primary"
                            )}
                            onClick={() => field.onChange(condition.value)}
                            data-testid={`card-condition-${condition.value}`}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className={cn("w-3 h-3 rounded-full", condition.color)} />
                              <span className="text-sm font-medium">{condition.label}</span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Accessories */}
                <FormField
                  control={form.control}
                  name="accessories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accessori Consegnati</FormLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {accessoryTypes.length > 0 ? (
                          accessoryTypes.map((accessory) => (
                            <div
                              key={accessory.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`acc-${accessory.id}`}
                                checked={field.value?.includes(accessory.name)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, accessory.name]);
                                  } else {
                                    field.onChange(current.filter((a: string) => a !== accessory.name));
                                  }
                                }}
                                data-testid={`checkbox-accessory-${accessory.id}`}
                              />
                              <Label htmlFor={`acc-${accessory.id}`} className="text-sm">
                                {accessory.name}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground col-span-2">
                            Nessun accessorio definito per questo tipo di dispositivo
                          </p>
                        )}
                      </div>
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note Aggiuntive</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Note opzionali..."
                          rows={2}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Preventivo (opzionale) */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <FileText className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">Diagnosi e Preventivo</h3>
                  <p className="text-sm text-muted-foreground">
                    Esegui diagnosi e/o crea preventivo (opzionale)
                  </p>
                </div>

                <Card>
                  <CardContent className="pt-4 space-y-4">
                    {/* Diagnosis Section */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            {collectedDiagnosisData && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">Diagnosi Tecnica</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {collectedDiagnosisData ? "Diagnosi configurata" : "Opzionale"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {collectedDiagnosisData && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setCollectedDiagnosisData(null);
                                setCreateDiagnosisNow(false);
                              }}
                              data-testid="button-remove-diagnosis"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant={collectedDiagnosisData ? "outline" : "default"}
                            size="sm"
                            onClick={() => setDiagnosisDialogOpen(true)}
                            data-testid="button-configure-diagnosis"
                          >
                            {collectedDiagnosisData ? "Modifica" : "Configura"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Quote Section */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            {collectedQuoteData && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">Preventivo</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {collectedQuoteData ? "Preventivo configurato" : "Opzionale"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {collectedQuoteData && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setCollectedQuoteData(null);
                                setCreateQuoteNow(false);
                              }}
                              data-testid="button-remove-quote"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant={collectedQuoteData ? "outline" : "default"}
                            size="sm"
                            onClick={() => setQuoteDialogOpen(true)}
                            data-testid="button-configure-quote"
                          >
                            {collectedQuoteData ? "Modifica" : "Configura"}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Info message */}
                    {!collectedDiagnosisData && !collectedQuoteData && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        <p>Puoi saltare questo passaggio e aggiungere diagnosi e preventivo in seguito.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}


            {/* Step 5: Summary */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-semibold">Conferma Dati</h3>
                  <p className="text-sm text-muted-foreground">
                    Verifica i dati e conferma la creazione
                  </p>
                </div>

                {/* Summary Card */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {/* Customer */}
                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Cliente</p>
                        <p className="font-medium">{selectedCustomer?.fullName}</p>
                        <p className="text-sm text-muted-foreground">{selectedCustomer?.email}</p>
                      </div>
                    </div>

                    {/* Device */}
                    <div className="flex items-start gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Dispositivo</p>
                        <p className="font-medium">
                          {deviceTypes.find(t => t.id === form.watch("deviceType"))?.name}
                          {form.watch("deviceModelId") && (
                            <> - {deviceModels.find(m => m.id === form.watch("deviceModelId"))?.modelName}</>
                          )}
                          {!form.watch("deviceModelId") && form.watch("deviceModel") && (
                            <> - {form.watch("deviceModel")}</>
                          )}
                        </p>
                        {(form.watch("imei") || form.watch("serial")) && (
                          <p className="text-sm text-muted-foreground">
                            {form.watch("imei") && `IMEI: ${form.watch("imei")}`}
                            {form.watch("imei") && form.watch("serial") && " | "}
                            {form.watch("serial") && `S/N: ${form.watch("serial")}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Problem - only show if provided */}
                    {form.watch("issueDescription") && (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Problema</p>
                          <p className="font-medium">{form.watch("issueDescription")}</p>
                        </div>
                      </div>
                    )}

                    {/* Condition & Accessories */}
                    {(form.watch("aestheticCondition") || (form.watch("accessories")?.length || 0) > 0) && (
                      <div className="flex items-start gap-3">
                        <ClipboardCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Condizioni</p>
                          {form.watch("aestheticCondition") && (
                            <Badge variant="secondary" className="mr-2">
                              {AESTHETIC_CONDITIONS.find(c => c.value === form.watch("aestheticCondition"))?.label}
                            </Badge>
                          )}
                          {(form.watch("accessories")?.length || 0) > 0 && (
                            <p className="text-sm mt-1">
                              Accessori: {form.watch("accessories")?.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Show selected Reseller in summary */}
                {form.watch("resellerId") && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rivenditore</p>
                      <p className="font-medium">
                        {resellers.find(r => r.id === form.watch("resellerId"))?.fullName || 
                         resellers.find(r => r.id === form.watch("resellerId"))?.username || "Non selezionato"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show selected Sub-Reseller in summary */}
                {form.watch("subResellerId") && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Store className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sub-Rivenditore</p>
                      <p className="font-medium">
                        {subResellers.find(sr => sr.id === form.watch("subResellerId"))?.fullName || 
                         subResellers.find(sr => sr.id === form.watch("subResellerId"))?.username || "Non selezionato"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Show selected Repair Center in summary */}
                {form.watch("repairCenterId") && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Centro Riparazione</p>
                      <p className="font-medium">
                        {repairCenters.find(c => c.id === form.watch("repairCenterId"))?.name || "Non selezionato"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Success - Download Documents */}
            {currentStep === 6 && createdOrder && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">Riparazione Creata!</h3>
                  <p className="text-muted-foreground mt-1">
                    Ordine <span className="font-mono font-semibold">{createdOrder.orderNumber}</span> registrato con successo
                  </p>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-3">Scarica i documenti:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => window.open(`/api/repair-orders/${createdOrder.id}/intake-document`, '_blank')}
                        data-testid="button-download-acceptance-wizard"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Documento Accettazione
                      </Button>
                      <Button
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open(`/api/repair-orders/${createdOrder.id}/labels`, '_blank')}
                        data-testid="button-download-labels-wizard"
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        Stampa Etichette
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-center text-muted-foreground">
                  Puoi sempre scaricare questi documenti dalla pagina dettaglio riparazione
                </p>
              </div>
            )}
          </form>
        </Form>

        {/* Navigation Buttons */}
        {currentStep < 6 && currentStep !== 6 && (
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-wizard-back"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Indietro
            </Button>

            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canGoNext()}
                data-testid="button-wizard-next"
              >
                Avanti
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                data-testid="button-wizard-confirm"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creazione...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Crea Riparazione
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Close button for Step 5 */}
        {currentStep === 6 && (
          <div className="flex justify-center mt-6 pt-4 border-t">
            <Button
              onClick={() => onOpenChange(false)}
              data-testid="button-wizard-close"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Chiudi
            </Button>
          </div>
        )}
      </DialogContent>
      
      {/* Standalone Modal Dialogs */}
      <DiagnosisFormDialog
        open={diagnosisDialogOpen}
        onOpenChange={setDiagnosisDialogOpen}
        standalone={true}
        deviceTypeId={form.watch("deviceType") || undefined}
        onDataCollected={(data) => {
          setCollectedDiagnosisData(data);
          setCreateDiagnosisNow(true);
        }}
      />
      
      <QuoteFormDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        standalone={true}
        onDataCollected={(data) => {
          setCollectedQuoteData(data);
          setCreateQuoteNow(true);
        }}
      />
    </Dialog>
  );
}
