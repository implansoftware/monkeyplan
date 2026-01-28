import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertRepairOrderSchema, insertRepairAcceptanceSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Smartphone, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, UserPlus, Loader2, Camera, X, ImageIcon, FileText, Calculator, Euro,
  Monitor, Battery, Volume2, Thermometer, Cpu, HardDrive, Usb, Wifi, Power, Zap, Fan, Bug, Settings, MoreHorizontal,
  Headphones, Keyboard, Mouse, Cable, BatteryCharging, Briefcase, Watch, Tablet, Laptop, Gamepad2, Printer,
  MonitorSmartphone, CircleDot, Square, Grid3X3, Link2, PenTool, PackageOpen, Shield, AlertTriangle, CircleSlash,
  Bluetooth, PowerOff, PlugZap, MemoryStick, Disc, Server, Router, Fingerprint, Eye, Mic, Speaker, Vibrate, Tag, Tv, Search
} from "lucide-react";
import { 
  SiApple, SiSamsung, SiHuawei, SiXiaomi, SiSony, SiLg, SiLenovo, SiDell, SiHp, SiAsus,
  SiAcer, SiGoogle, SiOneplus, SiMotorola, SiNokia, SiOppo, SiHonor,
  SiNintendo, SiPlaystation
} from "react-icons/si";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { cn } from "@/lib/utils";
import { PatternLock } from "@/components/PatternLock";
import { SearchableServiceCombobox } from "@/components/SearchableServiceCombobox";
import { SearchableProductCombobox } from "@/components/SearchableProductCombobox";
import { DiagnosisPhotoUploader } from "@/components/DiagnosisPhotoUploader";
import { Warehouse, Plus, Package, Wrench } from "lucide-react";
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

interface AcceptanceWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (order: any) => void;
  customerId?: string;
}

type WizardStep = "device-info" | "acceptance-checks" | "quote" | "review";

const acceptanceWizardSchema = z.object({
  customerId: z.string().min(1, "Seleziona un cliente"),
  branchId: z.string().optional(),
  repairCenterId: z.string().min(1, "Seleziona un centro di riparazione"),
  deviceType: z.string().min(1, "Seleziona il tipo di dispositivo"),
  deviceModel: z.string().optional(),
  brand: z.string().optional(),
  deviceModelId: z.string().optional(), // FK to device catalog
  deviceBrandId: z.string().optional(), // FK to device brand catalog
  issueDescription: z.string().min(1, "Seleziona almeno un problema"),
  otherIssueDescription: z.string().optional(),
  notes: z.string().optional(),
  imei: z.string().optional(),
  serial: z.string().optional(),
  imeiNotReadable: z.boolean().optional(),
  imeiNotPresent: z.boolean().optional(),
  serialOnly: z.boolean().optional(),
  acceptance: z.object({
    declaredDefects: z.string().optional(),
    aestheticCondition: z.string().optional(),
    aestheticNotes: z.string().optional(),
    aestheticPhotosMandatory: z.boolean().optional(),
    accessories: z.string().optional(),
    lockCode: z.string().optional(),
    lockPattern: z.string().optional(),
    hasLockCode: z.boolean().optional(),
    accessoriesRemoved: z.boolean().optional(),
  }),
});

type AcceptanceWizardData = z.infer<typeof acceptanceWizardSchema>;

const getIssueIcon = (issueName: string) => {
  const name = issueName.toLowerCase();
  
  if (name.includes("schermo") || name.includes("display") || name.includes("lcd") || name.includes("oled")) return Monitor;
  if (name.includes("batteria") || name.includes("carica") || name.includes("autonomia")) return Battery;
  if (name.includes("audio") || name.includes("suono") || name.includes("altoparlante") || name.includes("speaker")) return Volume2;
  if (name.includes("microfono") || name.includes("mic")) return Mic;
  if (name.includes("surriscaldamento") || name.includes("temperatura") || name.includes("caldo")) return Thermometer;
  if (name.includes("scheda madre") || name.includes("motherboard") || name.includes("cpu") || name.includes("processore")) return Cpu;
  if (name.includes("scheda video") || name.includes("gpu") || name.includes("grafica")) return MonitorSmartphone;
  if (name.includes("ssd") || name.includes("hdd") || name.includes("hard disk") || name.includes("memoria")) return HardDrive;
  if (name.includes("ram")) return MemoryStick;
  if (name.includes("usb") || name.includes("hdmi") || name.includes("porta") || name.includes("connettore")) return Usb;
  if (name.includes("wifi") || name.includes("wireless") || name.includes("rete")) return Wifi;
  if (name.includes("bluetooth")) return Bluetooth;
  if (name.includes("non si avvia") || name.includes("non accende") || name.includes("accensione")) return PowerOff;
  if (name.includes("alimentatore") || name.includes("alimentazione") || name.includes("power")) return PlugZap;
  if (name.includes("ventola") || name.includes("fan") || name.includes("rumore")) return Fan;
  if (name.includes("virus") || name.includes("malware") || name.includes("sicurezza")) return Bug;
  if (name.includes("software") || name.includes("sistema") || name.includes("os") || name.includes("windows") || name.includes("macos")) return Settings;
  if (name.includes("tastiera") || name.includes("keyboard") || name.includes("tasti")) return Keyboard;
  if (name.includes("touchpad") || name.includes("mouse") || name.includes("trackpad")) return Mouse;
  if (name.includes("webcam") || name.includes("fotocamera") || name.includes("camera")) return Eye;
  if (name.includes("touch") || name.includes("sensore") || name.includes("face id") || name.includes("fingerprint") || name.includes("impronta")) return Fingerprint;
  if (name.includes("vibrazione") || name.includes("vibra")) return Vibrate;
  if (name.includes("cerniera") || name.includes("hinge")) return Link2;
  if (name.includes("altro")) return MoreHorizontal;
  
  return AlertTriangle;
};

const getDefectIcon = (defectName: string) => {
  const name = defectName.toLowerCase();
  
  if (name.includes("graffi") || name.includes("graffio") || name.includes("righe")) return CircleSlash;
  if (name.includes("ammaccatur") || name.includes("bozza") || name.includes("deformazione")) return CircleDot;
  if (name.includes("crepa") || name.includes("incrinat") || name.includes("rotto") || name.includes("frantum")) return Monitor;
  if (name.includes("cornice") || name.includes("scocca") || name.includes("telaio") || name.includes("frame")) return Square;
  if (name.includes("tasti") || name.includes("tastiera") || name.includes("button")) return Grid3X3;
  if (name.includes("cerniera") || name.includes("hinge")) return Link2;
  if (name.includes("schermo") || name.includes("display")) return MonitorSmartphone;
  if (name.includes("vetro") || name.includes("glass")) return Smartphone;
  if (name.includes("altro")) return MoreHorizontal;
  
  return AlertTriangle;
};

const getAccessoryIcon = (accessoryName: string) => {
  const name = accessoryName.toLowerCase();
  
  if (name.includes("caricatore") || name.includes("caricabatterie") || name.includes("charger") || name.includes("alimentatore")) return BatteryCharging;
  if (name.includes("cavo") || name.includes("cable") || name.includes("filo")) return Cable;
  if (name.includes("custodia") || name.includes("cover") || name.includes("case")) return Briefcase;
  if (name.includes("mouse")) return Mouse;
  if (name.includes("tastiera") || name.includes("keyboard")) return Keyboard;
  if (name.includes("auricolar") || name.includes("cuffie") || name.includes("earphone") || name.includes("headphone") || name.includes("airpods")) return Headphones;
  if (name.includes("pennino") || name.includes("stylus") || name.includes("penna") || name.includes("apple pencil")) return PenTool;
  if (name.includes("borsa") || name.includes("zaino") || name.includes("bag")) return PackageOpen;
  if (name.includes("watch") || name.includes("orologio") || name.includes("smartwatch")) return Watch;
  if (name.includes("tablet")) return Tablet;
  if (name.includes("laptop") || name.includes("notebook") || name.includes("computer")) return Laptop;
  if (name.includes("controller") || name.includes("gamepad") || name.includes("joystick")) return Gamepad2;
  if (name.includes("stampante") || name.includes("printer")) return Printer;
  if (name.includes("router") || name.includes("modem")) return Router;
  if (name.includes("disco") || name.includes("hdd") || name.includes("ssd") || name.includes("pendrive") || name.includes("usb")) return Disc;
  if (name.includes("scheda") || name.includes("sd") || name.includes("memoria")) return Server;
  if (name.includes("protezione") || name.includes("pellicola") || name.includes("vetro")) return Shield;
  if (name.includes("altro")) return MoreHorizontal;
  
  return PackageOpen;
};

const getDeviceTypeIcon = (typeName: string) => {
  const name = typeName.toLowerCase();
  
  if (name.includes("smartphone") || name.includes("telefono") || name.includes("cellulare") || name.includes("iphone")) return Smartphone;
  if (name.includes("tablet") || name.includes("ipad")) return Tablet;
  if (name.includes("laptop") || name.includes("notebook") || name.includes("macbook") || name.includes("portatile")) return Laptop;
  if (name.includes("desktop") || name.includes("pc") || name.includes("computer") || name.includes("fisso")) return Monitor;
  if (name.includes("smartwatch") || name.includes("orologio") || name.includes("watch")) return Watch;
  if (name.includes("console") || name.includes("playstation") || name.includes("xbox") || name.includes("nintendo") || name.includes("gaming")) return Gamepad2;
  if (name.includes("stampante") || name.includes("printer")) return Printer;
  if (name.includes("router") || name.includes("modem") || name.includes("rete")) return Router;
  if (name.includes("auricolar") || name.includes("cuffie") || name.includes("headphone") || name.includes("airpods")) return Headphones;
  if (name.includes("monitor") || name.includes("schermo") || name.includes("tv") || name.includes("televisore")) return Monitor;
  if (name.includes("speaker") || name.includes("cassa") || name.includes("altoparlante") || name.includes("homepod")) return Speaker;
  
  return Smartphone;
};

const BRAND_ICONS: Record<string, any> = {
  apple: SiApple,
  samsung: SiSamsung,
  huawei: SiHuawei,
  xiaomi: SiXiaomi,
  sony: SiSony,
  lg: SiLg,
  lenovo: SiLenovo,
  dell: SiDell,
  hp: SiHp,
  asus: SiAsus,
  acer: SiAcer,
  google: SiGoogle,
  oneplus: SiOneplus,
  motorola: SiMotorola,
  nokia: SiNokia,
  oppo: SiOppo,
  honor: SiHonor,
  nintendo: SiNintendo,
  playstation: SiPlaystation,
};

function getBrandIcon(brandName: string) {
  const normalized = brandName.toLowerCase().replace(/\s+/g, '');
  return BRAND_ICONS[normalized] || null;
}

export function AcceptanceWizardDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  customerId 
}: AcceptanceWizardDialogProps) {
  const [step, setStep] = useState<WizardStep>("device-info");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [customModelInput, setCustomModelInput] = useState<string>("");
  const [saveForReuse, setSaveForReuse] = useState<boolean>(false);
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [showOtherIssue, setShowOtherIssue] = useState(false);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [showOtherDefect, setShowOtherDefect] = useState(false);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [showOtherAccessory, setShowOtherAccessory] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [acceptancePhotos, setAcceptancePhotos] = useState<Array<{ file: File; preview: string }>>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [createQuoteNow, setCreateQuoteNow] = useState(false);
  const [quoteParts, setQuoteParts] = useState<Array<{ name: string; quantity: number; unitPrice: number }>>([]);
  const [selectedQuoteWarehouseId, setSelectedQuoteWarehouseId] = useState<string>("");
  const [quoteLaborCost, setQuoteLaborCost] = useState(0);
  const [wantAddLaborCost, setWantAddLaborCost] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState("");
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
  const [marketCodeInput, setMarketCodeInput] = useState("");
  const [marketCodeLoading, setMarketCodeLoading] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    customerType: "private" as "private" | "company",
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zipCode: "",
    country: "IT",
    vatNumber: "",
    fiscalCode: "",
    pec: "",
    codiceUnivoco: "",
    iban: "",
    username: "",
    password: "",
    repairCenterId: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const { data: customers = [] } = useQuery<Array<{
    id: string;
    fullName: string;
    email: string;
  }>>({
    queryKey: (user?.role === "reseller" || user?.role === "reseller_staff") ? ["/api/reseller/customers"] : ["/api/customers"],
    select: (data: any[]) => {
      if (!data) return [];
      return data.map((u: any) => ({
        id: u.id,
        fullName: u.fullName || u.companyName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Cliente',
        email: u.email || '',
      }));
    },
    enabled: user?.role === "admin" || user?.role === "repair_center" || user?.role === "reseller" || user?.role === "reseller_staff",
  });

  const { data: resellerRepairCenters = [] } = useQuery<Array<{
    id: string;
    name: string;
  }>>({
    queryKey: ["/api/reseller/repair-centers"],
    enabled: user?.role === "reseller",
  });

  const { data: deviceTypes = [] } = useQuery<Array<{
    id: string;
    name: string;
  }>>({
    queryKey: ["/api/device-types"],
  });

  const { data: accessibleWarehouses = [] } = useQuery<WarehouseWithOwner[]>({
    queryKey: ["/api/warehouses/accessible"],
    enabled: open,
  });

  const { data: issueTypes = [] } = useQuery<Array<{
    id: string;
    name: string;
    description: string | null;
    deviceTypeId: string | null;
  }>>({
    queryKey: ["/api/issue-types", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? new URLSearchParams({ deviceTypeId: selectedTypeId }) : new URLSearchParams();
      const res = await fetch(`/api/issue-types?${params}`);
      if (!res.ok) throw new Error("Failed to fetch issue types");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const { data: aestheticDefects = [] } = useQuery<Array<{
    id: string;
    name: string;
    description: string | null;
    deviceTypeId: string | null;
  }>>({
    queryKey: ["/api/aesthetic-defects", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? new URLSearchParams({ deviceTypeId: selectedTypeId }) : new URLSearchParams();
      const res = await fetch(`/api/aesthetic-defects?${params}`);
      if (!res.ok) throw new Error("Failed to fetch aesthetic defects");
      return res.json();
    },
    enabled: !!selectedTypeId,
  });

  const { data: accessoryTypes = [] } = useQuery<Array<{
    id: string;
    name: string;
    description: string | null;
    deviceTypeId: string | null;
  }>>({
    queryKey: ["/api/accessory-types", { deviceTypeId: selectedTypeId }],
    queryFn: async () => {
      const params = selectedTypeId ? new URLSearchParams({ deviceTypeId: selectedTypeId }) : new URLSearchParams();
      const res = await fetch(`/api/accessory-types?${params}`);
      if (!res.ok) throw new Error("Failed to fetch accessory types");
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

  const isResellerOrStaff = ["reseller", "reseller_staff"].includes(user?.role as string);
  
  const { data: allDeviceBrands = [] } = useQuery<Array<{
    id: string;
    name: string;
    logoUrl?: string | null;
    isCustom?: boolean;
  }>>({
    queryKey: isResellerOrStaff 
      ? ["/api/reseller/device-brands", { includeGlobal: true }] 
      : ["/api/device-brands"],
    queryFn: async () => {
      if (isResellerOrStaff) {
        const res = await fetch("/api/reseller/device-brands?includeGlobal=true");
        if (!res.ok) throw new Error("Failed to fetch brands");
        return res.json();
      } else {
        const res = await fetch("/api/device-brands");
        if (!res.ok) throw new Error("Failed to fetch brands");
        return res.json();
      }
    },
    select: (data: any[]) => {
      if (!data) return [];
      return data.map((b: any) => ({
        id: b.id,
        name: b.name,
        isCustom: b.isCustom || false,
      }));
    },
  });

  const { data: deviceModels = [] } = useQuery<Array<{
    id: string;
    modelName: string;
    brandId: string;
    typeId: string;
    isCustom?: boolean;
  }>>({
    queryKey: isResellerOrStaff
      ? ["/api/reseller/device-models", { typeId: selectedTypeId, includeGlobal: true }]
      : ["/api/device-models", { typeId: selectedTypeId }],
    queryFn: async () => {
      if (isResellerOrStaff) {
        const params = new URLSearchParams({ typeId: selectedTypeId, includeGlobal: "true" });
        const res = await fetch(`/api/reseller/device-models?${params}`);
        if (!res.ok) throw new Error("Failed to fetch models");
        return res.json();
      } else {
        const params = new URLSearchParams({ typeId: selectedTypeId });
        const res = await fetch(`/api/device-models?${params}`);
        if (!res.ok) throw new Error("Failed to fetch models");
        return res.json();
      }
    },
    select: (data: any[]) => {
      if (!data) return [];
      return data.map((m: any) => ({
        id: m.id,
        modelName: m.modelName,
        brandId: m.brandId,
        typeId: m.typeId,
        isCustom: m.isCustom || false,
      }));
    },
    enabled: !!selectedTypeId,
  });

  const deviceBrands = allDeviceBrands.filter(brand => 
    deviceModels.some(model => model.brandId === brand.id)
  );

  const filteredModels = selectedBrandId 
    ? deviceModels.filter(model => model.brandId === selectedBrandId)
    : deviceModels;

  const getBrandName = (brandId: string) => {
    const brand = allDeviceBrands.find(b => b.id === brandId);
    return brand?.name || "";
  };

  const { data: repairCenters = [] } = useQuery<Array<{
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    resellerId: string | null;
    ownerName: string | null;
    isOwn: boolean;
    isSubResellerCenter: boolean;
  }>>({
    queryKey: ["/api/repair-centers"],
    enabled: user?.role === "admin" || user?.role === "repair_center" || user?.role === "reseller" || user?.role === "sub_reseller" || user?.role === "reseller_staff" || user?.role === "reseller_collaborator",
  });
  
  // Filter repair centers for sub_reseller to show only their own centers
  // For reseller_staff/reseller_collaborator, use the full list (they inherit reseller's centers)
  const filteredRepairCenters = user?.role === "sub_reseller"
    ? repairCenters.filter(rc => rc.resellerId === user?.id)
    : repairCenters;

  const form = useForm<AcceptanceWizardData>({
    resolver: zodResolver(acceptanceWizardSchema),
    defaultValues: {
      customerId: customerId || "",
      branchId: "",
      repairCenterId: "",
      deviceType: "",
      deviceModel: "",
      brand: "",
      deviceModelId: "",
      deviceBrandId: "",
      issueDescription: "",
      otherIssueDescription: "",
      notes: "",
      imei: "",
      serial: "",
      imeiNotReadable: false,
      imeiNotPresent: false,
      serialOnly: false,
      acceptance: {
        declaredDefects: "",
        aestheticCondition: "",
        aestheticNotes: "",
        aestheticPhotosMandatory: true,
        accessories: "",
        lockCode: "",
        lockPattern: "",
        hasLockCode: false,
        accessoriesRemoved: false,
      },
    },
  });

  const selectedCustomerId = form.watch("customerId");

  const { data: customerBranches = [] } = useQuery<Array<{
    id: string;
    branchCode: string;
    branchName: string;
    city: string | null;
    isActive: boolean;
  }>>({
    queryKey: ["/api/customers", selectedCustomerId, "branches"],
    enabled: !!selectedCustomerId && (user?.role === "admin" || user?.role === "repair_center" || user?.role === "reseller" || user?.role === "reseller_staff"),
  });

  const activeBranches = customerBranches.filter(b => b.isActive);

  const createOrderMutation = useMutation({
    mutationFn: async (data: AcceptanceWizardData) => {
      const orderData: any = {
        ...data,
        branchId: data.branchId === "__none__" ? undefined : data.branchId,
      };
      
      // Include quote data if user wants to create quote during order creation
      if (createQuoteNow) {
        orderData.quote = {
          createQuote: true,
          parts: quoteParts.filter(p => p.name && p.unitPrice > 0),
          laborCost: Math.round(quoteLaborCost * 100),
          notes: quoteNotes || null,
        };
      }

      // Include diagnosis data if user wants to create diagnosis during order creation
      if (createDiagnosisNow && diagnosisTechnical.trim()) {
        const selectedTimeData = estimatedRepairTimes.find(t => t.id === diagnosisEstimatedTimeId);
        const computedEstimatedTime = selectedTimeData?.hoursMax ?? diagnosisEstimatedTime ?? null;
        orderData.diagnosis = {
          createDiagnosis: true,
          technicalDiagnosis: diagnosisTechnical.trim(),
          diagnosisOutcome: diagnosisOutcome,
          estimatedRepairTime: computedEstimatedTime,
          diagnosisNotes: diagnosisNotes || null,
          requiresExternalParts: diagnosisRequiresExternalParts,
          customerDataImportant: diagnosisCustomerDataImportant,
          dataRecoveryRequested: diagnosisDataRecoveryRequested,
          findingIds: diagnosisSelectedFindingIds.length > 0 ? diagnosisSelectedFindingIds : undefined,
          componentIds: diagnosisSelectedComponentIds.length > 0 ? diagnosisSelectedComponentIds : undefined,
          estimatedRepairTimeId: diagnosisEstimatedTimeId || undefined,
          skipPhotos: diagnosisSkipPhotos,
          unrepairableReasonId: diagnosisOutcome === "irriparabile" && diagnosisUnrepairableReasonId ? diagnosisUnrepairableReasonId : undefined,
          suggestedPromotionIds: diagnosisOutcome === "non_conveniente" && diagnosisSuggestedPromotionIds.length > 0 ? diagnosisSuggestedPromotionIds : undefined,
        };
      }
      
      const response = await apiRequest("POST", "/api/repair-orders", orderData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }
      return await response.json();
    },
    onSuccess: async (data) => {
      // Upload photos if any were selected
      let uploadedCount = 0;
      if (acceptancePhotos.length > 0) {
        uploadedCount = await uploadPhotosToOrder(data.order.id);
      }
      
      // Link diagnosis photos if any were uploaded during wizard
      if (diagnosisPhotoIds.length > 0) {
        try {
          await fetch(`/api/repair-orders/${data.order.id}/attachments/link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ uploadSessionId }),
          });
        } catch (e) {
          console.warn("Could not link diagnosis photos:", e);
        }
      }
      
      // Save custom model for reuse if requested (only for resellers)
      if (saveForReuse && customModelInput && selectedBrandId && selectedTypeId) {
        try {
          // Check if the selected brand is custom (reseller-owned) or global
          const selectedBrandData = allDeviceBrands.find(b => b.id === selectedBrandId);
          const isCustomBrand = selectedBrandData?.isCustom || false;
          
          // Use brand name from data, or fallback to form value
          const brandName = selectedBrandData?.name || form.getValues("brand") || null;
          await apiRequest("POST", "/api/reseller/device-models", {
            modelName: customModelInput,
            // Use resellerBrandId for custom brands, brandId for global brands
            brandId: isCustomBrand ? null : selectedBrandId,
            resellerBrandId: isCustomBrand ? selectedBrandId : null,
            brandName: brandName,
            typeId: selectedTypeId,
          });
          // Invalidate all device-models queries to refresh dropdowns
          // Use partial matching to invalidate all related queries regardless of parameters
          queryClient.invalidateQueries({ 
            predicate: (query) => {
              const key = query.queryKey[0];
              if (typeof key !== "string") return false;
              return key.includes("/api/reseller/device-models") || key.includes("/api/reseller/device-brands");
            }
          });
        } catch (err) {
          console.error("Failed to save custom model:", err);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      const photoMessage = uploadedCount > 0 
        ? ` con ${uploadedCount} foto allegate`
        : "";
      toast({
        title: "Riparazione ingressata",
        description: `Ordine ${data.order.orderNumber} creato con successo${photoMessage}`,
      });
      handleClose();
      if (onSuccess) onSuccess(data);
      
      // Navigate to repair detail page based on user role
      const rolePrefix = user?.role === "admin" ? "/admin" 
        : (user?.role === "reseller" || user?.role === "reseller_staff" || user?.role === "sub_reseller") ? "/reseller"
        : user?.role === "repair_center" ? "/repair-center"
        : "/customer";
      setLocation(`${rolePrefix}/repairs/${data.order.id}`);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile creare l'ordine",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof newCustomerData) => {
      let endpoint: string;
      let payload: any;
      
      const basePayload = {
        customerType: data.customerType,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        zipCode: data.zipCode,
        country: data.country || "IT",
        iban: data.iban || undefined,
        ...(data.customerType === "private" 
          ? { fullName: data.fullName }
          : { 
              companyName: data.companyName,
              fullName: data.companyName,
              vatNumber: data.vatNumber || undefined,
              fiscalCode: data.fiscalCode || undefined,
              pec: data.pec || undefined,
              codiceUnivoco: data.codiceUnivoco || undefined,
            }
        ),
      };
      
      if (user?.role === "admin") {
        endpoint = "/api/admin/users";
        payload = { 
          ...basePayload, 
          username: data.username,
          password: data.password,
          role: "customer", 
          isActive: true 
        };
      } else if (user?.role === "reseller" || user?.role === "reseller_staff") {
        endpoint = "/api/reseller/customers";
        payload = { 
          ...basePayload, 
          username: data.username,
          password: data.password,
          isActive: true,
          repairCenterId: data.repairCenterId || undefined,
        };
      } else {
        // repair_center uses the unified customers endpoint
        endpoint = "/api/customers";
        payload = { 
          ...basePayload, 
          username: data.username,
          password: data.password,
          isActive: true 
        };
      }
      
      const response = await apiRequest("POST", endpoint, payload);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Errore durante la creazione del cliente");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      const customerId = data.user?.id || data.id;
      const customerName = data.user?.fullName || data.fullName;
      form.setValue("customerId", customerId);
      setShowNewCustomerForm(false);
      setNewCustomerData({
        customerType: "private",
        fullName: "",
        companyName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        zipCode: "",
        country: "IT",
        vatNumber: "",
        fiscalCode: "",
        pec: "",
        codiceUnivoco: "",
        iban: "",
        username: "",
        password: "",
        repairCenterId: "",
      });
      toast({
        title: "Cliente creato",
        description: `Il cliente ${customerName} è stato creato con successo`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message || "Impossibile creare il cliente",
      });
    },
  });

  const handleCreateCustomer = () => {
    const isPrivate = newCustomerData.customerType === "private";
    
    if (isPrivate && !newCustomerData.fullName) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Nome completo è obbligatorio",
      });
      return;
    }
    
    if (!isPrivate && !newCustomerData.companyName) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Ragione sociale è obbligatoria",
      });
      return;
    }
    
    if (!newCustomerData.email) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Email è obbligatoria",
      });
      return;
    }
    
    if (!newCustomerData.phone || !newCustomerData.address || !newCustomerData.city || !newCustomerData.zipCode) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Telefono, indirizzo, città e CAP sono obbligatori",
      });
      return;
    }
    
    if (!isPrivate && !newCustomerData.pec && !newCustomerData.codiceUnivoco) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Per le aziende, almeno PEC o Codice Univoco è obbligatorio",
      });
      return;
    }
    
    if (user?.role !== "repair_center" && 
        (!newCustomerData.username || !newCustomerData.password)) {
      toast({
        variant: "destructive",
        title: "Dati mancanti",
        description: "Username e password sono obbligatori",
      });
      return;
    }
    createCustomerMutation.mutate(newCustomerData);
  };

  const scrollToTop = () => {
    if (dialogContentRef.current) {
      dialogContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = async () => {
    let fieldsToValidate: (keyof AcceptanceWizardData)[] = [];
    
    if (step === "device-info") {
      fieldsToValidate = ["customerId", "repairCenterId", "deviceType", "issueDescription"];
    }
    
    const isValid = await form.trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined);
    
    if (isValid) {
      if (step === "device-info") {
        setStep("acceptance-checks");
        scrollToTop();
      } else if (step === "acceptance-checks") {
        setStep("quote");
      } else if (step === "quote") {
        setStep("review");
        scrollToTop();
      }
    }
  };

  const handleBack = () => {
    if (step === "acceptance-checks") {
      setStep("device-info");
      scrollToTop();
    } else if (step === "review") {
      setStep("acceptance-checks");
      scrollToTop();
    }
  };


  // Lookup device by market code
  const lookupMarketCode = async () => {
    const code = marketCodeInput.trim();
    if (!code) {
      toast({ variant: "destructive", title: "Inserisci un codice mercato" });
      return;
    }
    setMarketCodeLoading(true);
    try {
      const res = await fetch(`/api/device-models/by-market-code?code=${encodeURIComponent(code)}`);
      if (!res.ok) throw new Error("Errore nella ricerca");
      const data = await res.json();
      if (!data) {
        toast({ variant: "destructive", title: "Codice non trovato", description: `Nessun dispositivo con codice ${code}` });
        return;
      }
      // Populate form fields
      if (data.typeId) {
        form.setValue("deviceType", data.typeId);
        setSelectedTypeId(data.typeId);
      }
      if (data.brandId) {
        form.setValue("deviceBrandId", data.brandId);
        setSelectedBrandId(data.brandId);
      }
      if (data.modelId) {
        form.setValue("deviceModelId", data.modelId);
        form.setValue("deviceModel", data.modelName || "");
      }
      toast({ title: "Dispositivo trovato", description: `${data.typeName || ""} ${data.brandName || ""} ${data.modelName || ""}`.trim() });
    } catch (error) {
      toast({ variant: "destructive", title: "Errore", description: "Impossibile cercare il codice mercato" });
    } finally {
      setMarketCodeLoading(false);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only submit if we're on the review step
    if (step !== "review") {
      return;
    }
    
    form.handleSubmit((data) => {
      const payload = {
        ...data,
        acceptance: {
          ...data.acceptance,
          declaredDefects: data.acceptance.declaredDefects 
            ? data.acceptance.declaredDefects.split('\n').filter(d => d.trim())
            : [],
          accessories: data.acceptance.accessories
            ? data.acceptance.accessories.split(',').map(a => a.trim()).filter(a => a)
            : [],
        }
      };
      createOrderMutation.mutate(payload as any);
    })();
  };

  const handleClose = () => {
    form.reset();
    setStep("device-info");
    setSelectedTypeId("");
    setSelectedBrandId("");
    setCustomModelInput("");
    setSaveForReuse(false);
    setSelectedIssues([]);
    setShowOtherIssue(false);
    setSelectedDefects([]);
    setShowOtherDefect(false);
    setSelectedAccessories([]);
    setShowOtherAccessory(false);
    // Reset quote state
    setCreateQuoteNow(false);
    setQuoteParts([]);
    setQuoteLaborCost(0);
    setWantAddLaborCost(false);
    setQuoteNotes("");
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
    setSelectedQuoteWarehouseId("");
    setMarketCodeInput("");
    // Cleanup photo previews
    acceptancePhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    setAcceptancePhotos([]);
    onOpenChange(false);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: Array<{ file: File; preview: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newPhotos.push({
          file,
          preview: URL.createObjectURL(file)
        });
      }
    }
    setAcceptancePhotos(prev => [...prev, ...newPhotos]);
    e.target.value = ''; // Reset input
  };

  const handleRemovePhoto = (index: number) => {
    setAcceptancePhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const uploadPhotosToOrder = async (repairOrderId: string): Promise<number> => {
    if (acceptancePhotos.length === 0) return 0;

    setIsUploadingPhotos(true);
    let successCount = 0;
    const failedPhotos: string[] = [];
    
    try {
      for (const photo of acceptancePhotos) {
        const formData = new FormData();
        formData.append('file', photo.file);

        const response = await fetch(`/api/repair-orders/${repairOrderId}/attachments`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failedPhotos.push(photo.file.name);
          console.error(`Failed to upload ${photo.file.name}: ${response.status}`);
        }
      }
      
      if (failedPhotos.length > 0) {
        toast({
          variant: "destructive",
          title: "Errore upload foto",
          description: `${failedPhotos.length} foto non caricate: ${failedPhotos.join(', ')}`,
        });
      }
      
      return successCount;
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        variant: "destructive",
        title: "Errore upload foto",
        description: "Errore di rete durante l'upload delle foto",
      });
      return successCount;
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const renderDeviceInfoStep = () => (
    <div className="space-y-4">
      {(user?.role === "admin" || user?.role === "repair_center" || user?.role === "reseller") && (
        <>
          {!showNewCustomerForm ? (
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente *</FormLabel>
                  <div className="flex gap-2">
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer" className="flex-1">
                          <SelectValue placeholder="Seleziona cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.fullName} ({customer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewCustomerForm(true)}
                      data-testid="button-new-customer"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Seleziona il cliente o creane uno nuovo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
          
          {!showNewCustomerForm && selectedCustomerId && activeBranches.length > 0 && (
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filiale (opzionale)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-branch">
                        <SelectValue placeholder="Seleziona filiale (opzionale)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">-- Nessuna filiale --</SelectItem>
                      {activeBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          [{branch.branchCode}] {branch.branchName}
                          {branch.city && ` - ${branch.city}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Se il cliente ha più sedi, seleziona la filiale di provenienza del dispositivo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {showNewCustomerForm && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nuovo Cliente
                </CardTitle>
                <CardDescription>Inserisci i dati del nuovo cliente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
                {/* Tipo Cliente */}
                <div className="space-y-2">
                  <Label>Tipo Cliente *</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerType"
                        checked={newCustomerData.customerType === "private"}
                        onChange={() => setNewCustomerData(prev => ({ ...prev, customerType: "private" }))}
                        className="w-4 h-4"
                        data-testid="radio-customer-private"
                      />
                      <span>Privato</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="customerType"
                        checked={newCustomerData.customerType === "company"}
                        onChange={() => setNewCustomerData(prev => ({ ...prev, customerType: "company" }))}
                        className="w-4 h-4"
                        data-testid="radio-customer-company"
                      />
                      <span>Azienda</span>
                    </label>
                  </div>
                </div>

                {/* Nome / Ragione Sociale */}
                {newCustomerData.customerType === "private" ? (
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-name">Nome completo *</Label>
                    <Input
                      id="new-customer-name"
                      placeholder="Mario Rossi"
                      value={newCustomerData.fullName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, fullName: e.target.value }))}
                      data-testid="input-new-customer-name"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-company">Ragione Sociale *</Label>
                    <Input
                      id="new-customer-company"
                      placeholder="Azienda S.r.l."
                      value={newCustomerData.companyName}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, companyName: e.target.value }))}
                      data-testid="input-new-customer-company"
                    />
                  </div>
                )}

                {/* Email e Telefono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-email">Email *</Label>
                    <Input
                      id="new-customer-email"
                      type="email"
                      placeholder="mario@email.com"
                      value={newCustomerData.email}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-new-customer-email"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-phone">Telefono *</Label>
                    <Input
                      id="new-customer-phone"
                      placeholder="+39 333 1234567"
                      value={newCustomerData.phone}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-new-customer-phone"
                    />
                  </div>
                </div>

                {/* Indirizzo con autocompletamento */}
                <div className="space-y-1">
                  <Label htmlFor="new-customer-address">Indirizzo *</Label>
                  <AddressAutocomplete
                    id="new-customer-address"
                    placeholder="Inizia a digitare l'indirizzo..."
                    value={newCustomerData.address}
                    onChange={(value) => setNewCustomerData(prev => ({ ...prev, address: value }))}
                    onAddressSelect={(result) => {
                      setNewCustomerData(prev => ({
                        ...prev,
                        address: result.address,
                        city: result.city || prev.city,
                        zipCode: result.postalCode || prev.zipCode,
                        country: result.country || prev.country || "IT",
                      }));
                    }}
                    data-testid="input-new-customer-address"
                  />
                </div>

                {/* Città, CAP, Paese */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-city">Città *</Label>
                    <Input
                      id="new-customer-city"
                      placeholder="Milano"
                      value={newCustomerData.city}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                      data-testid="input-new-customer-city"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-zip">CAP *</Label>
                    <Input
                      id="new-customer-zip"
                      placeholder="20100"
                      value={newCustomerData.zipCode}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, zipCode: e.target.value }))}
                      data-testid="input-new-customer-zip"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-customer-country">Paese</Label>
                    <Input
                      id="new-customer-country"
                      placeholder="IT"
                      value={newCustomerData.country}
                      onChange={(e) => setNewCustomerData(prev => ({ ...prev, country: e.target.value }))}
                      data-testid="input-new-customer-country"
                    />
                  </div>
                </div>

                {/* Campi Azienda */}
                {newCustomerData.customerType === "company" && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-vat">Partita IVA</Label>
                        <Input
                          id="new-customer-vat"
                          placeholder="IT12345678901"
                          value={newCustomerData.vatNumber}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, vatNumber: e.target.value }))}
                          data-testid="input-new-customer-vat"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-fiscal">Codice Fiscale</Label>
                        <Input
                          id="new-customer-fiscal"
                          placeholder="12345678901"
                          value={newCustomerData.fiscalCode}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, fiscalCode: e.target.value }))}
                          data-testid="input-new-customer-fiscal"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-pec">PEC *</Label>
                        <Input
                          id="new-customer-pec"
                          type="email"
                          placeholder="azienda@pec.it"
                          value={newCustomerData.pec}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, pec: e.target.value }))}
                          data-testid="input-new-customer-pec"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-sdi">Codice Univoco (SDI) *</Label>
                        <Input
                          id="new-customer-sdi"
                          placeholder="A1B2C3D"
                          value={newCustomerData.codiceUnivoco}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, codiceUnivoco: e.target.value }))}
                          data-testid="input-new-customer-sdi"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">* Almeno PEC o Codice Univoco è obbligatorio</p>
                  </>
                )}

                {/* IBAN */}
                <div className="space-y-1">
                  <Label htmlFor="new-customer-iban">IBAN</Label>
                  <Input
                    id="new-customer-iban"
                    placeholder="IT60X0542811101000000123456"
                    value={newCustomerData.iban}
                    onChange={(e) => setNewCustomerData(prev => ({ ...prev, iban: e.target.value }))}
                    data-testid="input-new-customer-iban"
                  />
                </div>

                {/* Username e Password (solo admin/reseller) */}
                {user?.role !== "repair_center" && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-username">Username *</Label>
                        <Input
                          id="new-customer-username"
                          placeholder="mrossi"
                          value={newCustomerData.username}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, username: e.target.value }))}
                          data-testid="input-new-customer-username"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new-customer-password">Password *</Label>
                        <Input
                          id="new-customer-password"
                          type="password"
                          placeholder="Password"
                          value={newCustomerData.password}
                          onChange={(e) => setNewCustomerData(prev => ({ ...prev, password: e.target.value }))}
                          data-testid="input-new-customer-password"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Centro di Riparazione (solo reseller) */}
                {user?.role === "reseller" && resellerRepairCenters.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-1">
                      <Label htmlFor="new-customer-repair-center">Centro di Riparazione</Label>
                      <Select
                        value={newCustomerData.repairCenterId}
                        onValueChange={(value) => setNewCustomerData(prev => ({ ...prev, repairCenterId: value === "__none__" ? "" : value }))}
                      >
                        <SelectTrigger id="new-customer-repair-center" data-testid="select-new-customer-repair-center">
                          <SelectValue placeholder="Nessun centro associato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Nessun centro associato</SelectItem>
                          {resellerRepairCenters.map((center) => (
                            <SelectItem key={center.id} value={center.id}>
                              {center.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewCustomerForm(false);
                      setNewCustomerData({
                        customerType: "private",
                        fullName: "",
                        companyName: "",
                        email: "",
                        phone: "",
                        address: "",
                        city: "",
                        zipCode: "",
                        country: "IT",
                        vatNumber: "",
                        fiscalCode: "",
                        pec: "",
                        codiceUnivoco: "",
                        iban: "",
                        username: "",
                        password: "",
                        repairCenterId: "",
                      });
                    }}
                    data-testid="button-cancel-new-customer"
                  >
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateCustomer}
                    disabled={createCustomerMutation.isPending}
                    data-testid="button-save-new-customer"
                  >
                    {createCustomerMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creazione...
                      </>
                    ) : (
                      "Crea Cliente"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Centro di Riparazione */}
      <FormField
        control={form.control}
        name="repairCenterId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Centro di Riparazione *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-repair-center">
                  <SelectValue placeholder="Seleziona centro di riparazione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {/* For sub_reseller/reseller_staff/reseller_collaborator: show simple list */}
                {(user?.role === "sub_reseller" || user?.role === "reseller_staff" || user?.role === "reseller_collaborator") && filteredRepairCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name} {center.address ? `- ${center.address}` : ''}
                  </SelectItem>
                ))}
                {/* For reseller/admin/repair_center: show categorized centers */}
                {user?.role !== "sub_reseller" && user?.role !== "reseller_staff" && user?.role !== "reseller_collaborator" && (
                  <>
                    {/* Own centers first */}
                    {repairCenters.filter(c => c.isOwn).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          I miei centri
                        </div>
                        {repairCenters.filter(c => c.isOwn).map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.name} {center.address ? `- ${center.address}` : ''}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {/* Sub-reseller centers */}
                    {repairCenters.filter(c => c.isSubResellerCenter).length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                          Centri della Rete
                        </div>
                        {repairCenters.filter(c => c.isSubResellerCenter).map((center) => (
                          <SelectItem key={center.id} value={center.id}>
                            {center.name} {center.ownerName ? `(${center.ownerName})` : ''} {center.address ? `- ${center.address}` : ''}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {/* Fallback for non-reseller roles or simple list */}
                    {repairCenters.filter(c => !c.isOwn && !c.isSubResellerCenter).map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name} {center.address ? `- ${center.address}` : ''}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Seleziona il centro che effettuerà la riparazione
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Market Code Lookup - PRIMA di Tipo Dispositivo per auto-compilazione */}
      <div className="space-y-2">
        <Label>Codice Mercato (opzionale)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="es. A2633, SM-G998B"
            value={marketCodeInput}
            onChange={(e) => setMarketCodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), lookupMarketCode())}
            data-testid="input-market-code"
          />
          <Button
            type="button"
            variant="outline"
            onClick={lookupMarketCode}
            disabled={marketCodeLoading || !marketCodeInput.trim()}
            data-testid="button-lookup-market-code"
          >
            {marketCodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Inserisci il codice mercato per auto-compilare tipo, marca e modello</p>
      </div>

      <FormField
        control={form.control}
        name="deviceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo dispositivo *</FormLabel>
            <Select 
              onValueChange={(name) => {
                field.onChange(name);
                const type = deviceTypes.find(t => t.name === name);
                setSelectedTypeId(type?.id || "");
                form.setValue("brand", "");
                form.setValue("deviceModel", "");
                form.setValue("deviceBrandId", "");
                form.setValue("deviceModelId", "");
                form.setValue("issueDescription", "");
                form.setValue("otherIssueDescription", "");
                form.setValue("acceptance.aestheticNotes", "");
                form.setValue("acceptance.accessories", "");
                setSelectedBrandId("");
                setSelectedIssues([]);
                setShowOtherIssue(false);
                setSelectedDefects([]);
                setShowOtherDefect(false);
                setSelectedAccessories([]);
                setShowOtherAccessory(false);
              }} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger data-testid="select-device-type">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {deviceTypes.map((type) => {
                  const TypeIcon = getDeviceTypeIcon(type.name);
                  return (
                    <SelectItem key={type.id} value={type.name}>
                      <span className="flex items-center gap-2">
                        <TypeIcon className="h-5 w-5 text-primary" />
                        <span className="font-medium">{type.name}</span>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Brand Selection as Cards */}
      {selectedTypeId && deviceBrands.length > 0 && (
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem className="min-w-0">
              <FormLabel>Brand</FormLabel>
              <div className="grid gap-2 w-full min-w-0" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}>
                {deviceBrands.map((brand) => {
                  const BrandIcon = getBrandIcon(brand.name);
                  const isSelected = field.value === brand.name;
                  return (
                    <Card
                      key={brand.id}
                      className={cn(
                        "cursor-pointer transition-colors min-w-0 w-full hover-elevate",
                        isSelected && "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        if (isSelected) {
                          field.onChange("");
                          setSelectedBrandId("");
                          form.setValue("deviceBrandId", "");
                        } else {
                          field.onChange(brand.name);
                          setSelectedBrandId(brand.id);
                          form.setValue("deviceBrandId", brand.id);
                        }
                        form.setValue("deviceModel", "");
                        form.setValue("deviceModelId", "");
                      }}
                      data-testid={`card-brand-${brand.id}`}
                    >
                      <CardContent className="p-2 text-center">
                        {BrandIcon ? (
                          <BrandIcon className="h-5 w-5 mx-auto mb-1" />
                        ) : brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="h-5 w-5 mx-auto mb-1 object-contain" />
                        ) : (
                          <Tag className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        )}
                        <span className="text-xs truncate block">{brand.name}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              <FormDescription className="text-xs">
                {selectedBrandId ? "Clicca di nuovo per deselezionare" : `${deviceBrands.length} brand disponibili`}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={form.control}
        name="deviceModel"
        render={({ field }) => {
          const isCustomModel = customModelInput !== "" || field.value === "__other__";
          const selectValue = isCustomModel ? "__other__" : field.value;
          
          return (
            <FormItem>
              <FormLabel>Modello</FormLabel>
              {selectedTypeId && filteredModels.length > 0 ? (
                <>
                  <Select 
                    onValueChange={(value) => {
                      if (value === "__other__") {
                        field.onChange("__other__");
                        form.setValue("deviceModelId", "");
                      } else {
                        setCustomModelInput("");
                        field.onChange(value);
                        // Find model by name and set the ID
                        const selectedModel = filteredModels.find(m => m.modelName === value);
                        form.setValue("deviceModelId", selectedModel?.id || "");
                        // Also set brand ID if model has it and brandId is not already set
                        if (selectedModel?.brandId && !form.getValues("deviceBrandId")) {
                          form.setValue("deviceBrandId", selectedModel.brandId);
                        }
                      }
                    }} 
                    value={selectValue}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-device-model">
                        <SelectValue placeholder="Seleziona modello" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredModels.map((model) => (
                        <SelectItem key={model.id} value={model.modelName}>
                          {selectedBrandId ? model.modelName : `${getBrandName(model.brandId)} - ${model.modelName}`}
                        </SelectItem>
                      ))}
                      <SelectItem value="__other__">Altro (inserimento manuale)</SelectItem>
                    </SelectContent>
                  </Select>
                  {isCustomModel && (
                    <div className="space-y-2 mt-2">
                      <Input
                        value={customModelInput}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setCustomModelInput(newValue);
                          field.onChange(newValue || "__other__");
                        }}
                        placeholder="Inserisci il nome del modello..."
                        data-testid="input-custom-device-model"
                        autoFocus
                      />
                      {isResellerOrStaff && customModelInput && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="save-for-reuse"
                            checked={saveForReuse}
                            onCheckedChange={(checked) => setSaveForReuse(!!checked)}
                            data-testid="checkbox-save-for-reuse"
                          />
                          <Label htmlFor="save-for-reuse" className="text-sm font-normal text-muted-foreground cursor-pointer">
                            Salva per riutilizzo futuro
                          </Label>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <FormControl>
                  <Input {...field} placeholder="es. iPhone 13 Pro, Galaxy S21" data-testid="input-device-model" />
                </FormControl>
              )}
              <FormDescription>
                {selectedTypeId && filteredModels.length === 0 && "Nessun modello disponibile, inserisci manualmente"}
                {isCustomModel && "Digita il nome del modello nel campo sopra"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <Separator />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="imei"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IMEI</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Codice IMEI" 
                  disabled={form.watch("imeiNotReadable") || form.watch("imeiNotPresent")}
                  data-testid="input-imei"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="imeiNotReadable"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-imei-not-readable"
                  />
                </FormControl>
                <FormLabel className="font-normal">IMEI non leggibile</FormLabel>
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
                    onCheckedChange={field.onChange}
                    data-testid="checkbox-imei-not-present"
                  />
                </FormControl>
                <FormLabel className="font-normal">IMEI non presente</FormLabel>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="serial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero di serie</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Serial number" data-testid="input-serial" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="serialOnly"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="checkbox-serial-only"
                />
              </FormControl>
              <FormLabel className="font-normal">Solo numero di serie</FormLabel>
            </FormItem>
          )}
        />
      </div>

      <Separator />

      <FormField
        control={form.control}
        name="issueDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Problemi riscontrati *</FormLabel>
            <FormDescription className="text-xs">
              Seleziona uno o più problemi segnalati dal cliente
            </FormDescription>
            {!selectedTypeId ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                Seleziona prima un tipo di dispositivo per vedere i problemi disponibili
              </div>
            ) : issueTypes.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Caricamento problemi...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md" data-testid="issue-types-list">
                {issueTypes.map((issue) => {
                  const isSelected = selectedIssues.includes(issue.name);
                  const isOther = issue.name === "Altro";
                  const IssueIcon = getIssueIcon(issue.name);
                  return (
                    <div key={issue.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`issue-${issue.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          let newSelected: string[];
                          if (checked) {
                            newSelected = [...selectedIssues, issue.name];
                          } else {
                            newSelected = selectedIssues.filter(i => i !== issue.name);
                          }
                          setSelectedIssues(newSelected);
                          if (isOther) {
                            setShowOtherIssue(!!checked);
                            if (!checked) {
                              form.setValue("otherIssueDescription", "");
                            }
                          }
                          const issueText = newSelected.join(", ");
                          field.onChange(issueText);
                        }}
                        data-testid={`checkbox-issue-${issue.id}`}
                      />
                      <IssueIcon className="h-6 w-6 text-primary flex-shrink-0" />
                      <Label 
                        htmlFor={`issue-${issue.id}`} 
                        className="text-sm font-normal cursor-pointer leading-tight"
                        title={issue.description || undefined}
                      >
                        {issue.name}
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
            {selectedIssues.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Selezionati: {selectedIssues.join(", ")}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {showOtherIssue && (
        <FormField
          control={form.control}
          name="otherIssueDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrivi altro problema *</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Descrivi il problema non elencato"
                  rows={2}
                  data-testid="textarea-other-issue"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );

  const renderAcceptanceChecksStep = () => (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="acceptance.aestheticCondition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condizioni estetiche generali *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-aesthetic-condition">
                  <SelectValue placeholder="Seleziona condizione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ottimo">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Ottimo - Nessun difetto visibile</span>
                  </span>
                </SelectItem>
                <SelectItem value="buono">
                  <span className="flex items-center gap-2">
                    <CircleDot className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Buono - Minimi segni di usura</span>
                  </span>
                </SelectItem>
                <SelectItem value="discreto">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Discreto - Segni di usura evidenti</span>
                  </span>
                </SelectItem>
                <SelectItem value="scadente">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Scadente - Danni estetici significativi</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acceptance.aestheticNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Difetti estetici rilevati</FormLabel>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {aestheticDefects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Seleziona prima un tipo di dispositivo</p>
              ) : (
                <>
                  {aestheticDefects.map((defect) => {
                    const DefectIcon = getDefectIcon(defect.name);
                    return (
                      <div key={defect.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`defect-${defect.id}`}
                          checked={selectedDefects.includes(defect.name)}
                          onCheckedChange={(checked) => {
                            const newDefects = checked 
                              ? [...selectedDefects, defect.name]
                              : selectedDefects.filter(d => d !== defect.name);
                            setSelectedDefects(newDefects);
                            
                            if (defect.name === "Altro") {
                              setShowOtherDefect(!!checked);
                            }
                            
                            const defectText = newDefects.filter(d => d !== "Altro").join(", ");
                            field.onChange(defectText);
                          }}
                          data-testid={`checkbox-defect-${defect.id}`}
                        />
                        <DefectIcon className="h-6 w-6 text-primary flex-shrink-0" />
                        <label 
                          htmlFor={`defect-${defect.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {defect.name}
                          {defect.description && (
                            <span className="text-muted-foreground text-xs ml-1">
                              - {defect.description}
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                  <div className="flex items-center space-x-2 border-t pt-2 mt-2">
                    <Checkbox
                      id="defect-altro"
                      checked={showOtherDefect}
                      onCheckedChange={(checked) => {
                        setShowOtherDefect(!!checked);
                        if (!checked) {
                          const newDefects = selectedDefects.filter(d => d !== "Altro");
                          setSelectedDefects(newDefects);
                          const defectText = newDefects.join(", ");
                          field.onChange(defectText);
                        } else {
                          setSelectedDefects([...selectedDefects, "Altro"]);
                        }
                      }}
                      data-testid="checkbox-defect-altro"
                    />
                    <MoreHorizontal className="h-6 w-6 text-primary flex-shrink-0" />
                    <label htmlFor="defect-altro" className="text-sm cursor-pointer font-medium">
                      Altro difetto non in elenco
                    </label>
                  </div>
                </>
              )}
            </div>
            {selectedDefects.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Selezionati: {selectedDefects.join(", ")}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {showOtherDefect && (
        <FormField
          control={form.control}
          name="acceptance.declaredDefects"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrivi altro difetto estetico *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Descrivi il difetto non elencato"
                  data-testid="input-other-defect"
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    const currentNotes = form.getValues("acceptance.aestheticNotes") || "";
                    const baseNotes = selectedDefects.filter(d => d !== "Altro").join(", ");
                    const newNotes = e.target.value 
                      ? (baseNotes ? `${baseNotes}, ${e.target.value}` : e.target.value)
                      : baseNotes;
                    form.setValue("acceptance.aestheticNotes", newNotes);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Photo Upload Section - Inverted logic: photos required by default */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Foto del dispositivo
        </Label>
        
        {/* Skip photos checkbox - inverted logic */}
        <FormField
          control={form.control}
          name="acceptance.aestheticPhotosMandatory"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2 space-y-0 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <FormControl>
                <Checkbox
                  checked={!field.value}
                  onCheckedChange={(checked) => field.onChange(!checked)}
                  data-testid="checkbox-skip-photos"
                />
              </FormControl>
              <FormLabel className="font-normal text-sm">
                Non voglio caricare foto per questo dispositivo
              </FormLabel>
            </FormItem>
          )}
        />

        {/* Show photo upload only if photos are required (aestheticPhotosMandatory = true) */}
        {form.watch("acceptance.aestheticPhotosMandatory") && (
          <div className="border rounded-md p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('acceptance-photo-input')?.click()}
                data-testid="button-add-photo"
              >
                <Camera className="h-4 w-4 mr-2" />
                Aggiungi foto
              </Button>
              <input
                id="acceptance-photo-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
                data-testid="input-photo-file"
              />
              <span className="text-xs text-muted-foreground">
                {acceptancePhotos.length > 0 
                  ? `${acceptancePhotos.length} foto selezionate`
                  : "Nessuna foto selezionata"}
              </span>
            </div>
            
            {acceptancePhotos.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {acceptancePhotos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="relative group aspect-square rounded-md overflow-hidden border"
                    data-testid={`photo-preview-${index}`}
                  >
                    <img 
                      src={photo.preview} 
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemovePhoto(index)}
                      data-testid={`button-remove-photo-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Scatta o carica foto del dispositivo per documentare le condizioni al momento dell'ingresso
            </p>
          </div>
        )}
      </div>

      <Separator />

      <FormField
        control={form.control}
        name="acceptance.accessories"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Accessori consegnati</FormLabel>
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
              {accessoryTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Seleziona prima un tipo di dispositivo</p>
              ) : (
                <>
                  {accessoryTypes.map((accessory) => {
                    const AccessoryIcon = getAccessoryIcon(accessory.name);
                    return (
                      <div key={accessory.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`accessory-${accessory.id}`}
                          checked={selectedAccessories.includes(accessory.name)}
                          onCheckedChange={(checked) => {
                            let newAccessories: string[];
                            
                            if (accessory.name === "Nessun accessorio") {
                              newAccessories = checked ? ["Nessun accessorio"] : [];
                            } else {
                              newAccessories = checked 
                                ? [...selectedAccessories.filter(a => a !== "Nessun accessorio"), accessory.name]
                                : selectedAccessories.filter(a => a !== accessory.name);
                            }
                            
                            setSelectedAccessories(newAccessories);
                            
                            if (accessory.name === "Altro") {
                              setShowOtherAccessory(!!checked);
                            }
                            
                            const accessoryText = newAccessories.filter(a => a !== "Altro").join(", ");
                            field.onChange(accessoryText);
                          }}
                          disabled={accessory.name !== "Nessun accessorio" && selectedAccessories.includes("Nessun accessorio")}
                          data-testid={`checkbox-accessory-${accessory.id}`}
                        />
                        <AccessoryIcon className="h-6 w-6 text-primary flex-shrink-0" />
                        <label 
                          htmlFor={`accessory-${accessory.id}`}
                          className={`text-sm cursor-pointer flex-1 ${
                            accessory.name !== "Nessun accessorio" && selectedAccessories.includes("Nessun accessorio") 
                              ? "text-muted-foreground" 
                              : ""
                          }`}
                        >
                          {accessory.name}
                          {accessory.description && (
                            <span className="text-muted-foreground text-xs ml-1">
                              - {accessory.description}
                            </span>
                          )}
                        </label>
                      </div>
                    );
                  })}
                  <div className="flex items-center space-x-2 border-t pt-2 mt-2">
                    <Checkbox
                      id="accessory-altro"
                      checked={showOtherAccessory}
                      onCheckedChange={(checked) => {
                        setShowOtherAccessory(!!checked);
                        if (!checked) {
                          const newAccessories = selectedAccessories.filter(a => a !== "Altro");
                          setSelectedAccessories(newAccessories);
                          const accessoryText = newAccessories.join(", ");
                          field.onChange(accessoryText);
                        } else {
                          setSelectedAccessories([...selectedAccessories.filter(a => a !== "Nessun accessorio"), "Altro"]);
                        }
                      }}
                      disabled={selectedAccessories.includes("Nessun accessorio")}
                      data-testid="checkbox-accessory-altro"
                    />
                    <MoreHorizontal className="h-6 w-6 text-primary flex-shrink-0" />
                    <label 
                      htmlFor="accessory-altro" 
                      className={`text-sm cursor-pointer font-medium ${
                        selectedAccessories.includes("Nessun accessorio") ? "text-muted-foreground" : ""
                      }`}
                    >
                      Altro accessorio non in elenco
                    </label>
                  </div>
                </>
              )}
            </div>
            {selectedAccessories.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Selezionati: {selectedAccessories.join(", ")}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {showOtherAccessory && (
        <div className="space-y-2">
          <Label>Descrivi altro accessorio *</Label>
          <Input 
            placeholder="Descrivi l'accessorio non elencato"
            data-testid="input-other-accessory"
            onChange={(e) => {
              const baseAccessories = selectedAccessories.filter(a => a !== "Altro").join(", ");
              const newText = e.target.value 
                ? (baseAccessories ? `${baseAccessories}, ${e.target.value}` : e.target.value)
                : baseAccessories;
              form.setValue("acceptance.accessories", newText);
            }}
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="acceptance.accessoriesRemoved"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-accessories-removed"
              />
            </FormControl>
            <FormLabel className="font-normal">Accessori rimossi prima dell'accettazione</FormLabel>
          </FormItem>
        )}
      />

      <Separator />

      <FormField
        control={form.control}
        name="acceptance.hasLockCode"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="checkbox-has-lock-code"
              />
            </FormControl>
            <FormLabel className="font-normal">Il dispositivo ha un codice di blocco</FormLabel>
          </FormItem>
        )}
      />

      {form.watch("acceptance.hasLockCode") && (
        <>
          <FormField
            control={form.control}
            name="acceptance.lockCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice PIN/Password</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="password"
                    placeholder="Codice di sblocco"
                    data-testid="input-lock-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="acceptance.lockPattern"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sequenza sblocco (stile Android)</FormLabel>
                <FormControl>
                  <PatternLock
                    value={field.value || ""}
                    onChange={field.onChange}
                    minNodes={4}
                  />
                </FormControl>
                <FormDescription>
                  Disegna la sequenza collegando i punti (minimo 4)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  );

  
  const renderQuoteStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preventivo Riparazione
          </CardTitle>
          <CardDescription>
            Puoi eseguire diagnosi e/o creare preventivo durante l'accettazione, oppure farlo successivamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnosis Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createDiagnosisNow"
              checked={createDiagnosisNow}
              onCheckedChange={(checked) => setCreateDiagnosisNow(checked === true)}
              data-testid="checkbox-create-diagnosis"
            />
            <Label htmlFor="createDiagnosisNow" className="font-medium">
              Esegui diagnosi ora
            </Label>
          </div>

          {createDiagnosisNow && (
            <div className="space-y-4 pt-4 border-t">
              {/* Risultati Diagnosi (Findings) */}
              {diagnosticFindings.length > 0 && (
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Risultati Diagnosi
                  </Label>
                  {Object.entries(findingsByCategory).map(([category, findings]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{categoryLabels[category] || category}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {findings.map((finding) => (
                          <div key={finding.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`finding-${finding.id}`}
                              checked={diagnosisSelectedFindingIds.includes(finding.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setDiagnosisSelectedFindingIds([...diagnosisSelectedFindingIds, finding.id]);
                                } else {
                                  setDiagnosisSelectedFindingIds(diagnosisSelectedFindingIds.filter(id => id !== finding.id));
                                }
                              }}
                              data-testid={`checkbox-finding-${finding.id}`}
                            />
                            <Label htmlFor={`finding-${finding.id}`} className="text-sm">{finding.name}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Componenti Danneggiati */}
              {damagedComponentTypes.length > 0 && (
                <div className="space-y-2">
                  <Label>Componenti Danneggiati</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {damagedComponentTypes.map((comp) => (
                      <div key={comp.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`component-${comp.id}`}
                          checked={diagnosisSelectedComponentIds.includes(comp.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDiagnosisSelectedComponentIds([...diagnosisSelectedComponentIds, comp.id]);
                            } else {
                              setDiagnosisSelectedComponentIds(diagnosisSelectedComponentIds.filter(id => id !== comp.id));
                            }
                          }}
                          data-testid={`checkbox-component-${comp.id}`}
                        />
                        <Label htmlFor={`component-${comp.id}`} className="text-sm">{comp.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-2" />

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-technical-diagnosis-acceptance"
                    checked={showTechnicalDiagnosis}
                    onCheckedChange={(checked) => {
                      setShowTechnicalDiagnosis(!!checked);
                      if (!checked) setDiagnosisTechnical("");
                    }}
                    data-testid="checkbox-show-technical-diagnosis"
                  />
                  <Label htmlFor="show-technical-diagnosis-acceptance" className="text-sm font-medium cursor-pointer">
                    Voglio lasciare diagnosi tecnica
                  </Label>
                </div>
                {showTechnicalDiagnosis && (
                  <Textarea
                    value={diagnosisTechnical}
                    onChange={(e) => setDiagnosisTechnical(e.target.value)}
                    placeholder="Descrivi la diagnosi tecnica del dispositivo..."
                    rows={3}
                    data-testid="textarea-diagnosis-technical"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Esito Diagnosi</Label>
                  <Select value={diagnosisOutcome} onValueChange={(v: any) => {
                    setDiagnosisOutcome(v);
                    if (v !== "irriparabile") setDiagnosisUnrepairableReasonId("");
                    if (v !== "non_conveniente") setDiagnosisSuggestedPromotionIds([]);
                  }}>
                    <SelectTrigger data-testid="select-diagnosis-outcome">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="riparabile">Riparabile</SelectItem>
                      <SelectItem value="non_conveniente">Non Conveniente</SelectItem>
                      <SelectItem value="irriparabile">Irriparabile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tempo Stimato</Label>
                  <Select value={diagnosisEstimatedTimeId} onValueChange={setDiagnosisEstimatedTimeId}>
                    <SelectTrigger data-testid="select-diagnosis-time">
                      <SelectValue placeholder="Seleziona durata" />
                    </SelectTrigger>
                    <SelectContent>
                      {estimatedRepairTimes.map((time) => (
                        <SelectItem key={time.id} value={time.id}>
                          {time.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Motivo Irriparabilità (condizionale) */}
              {diagnosisOutcome === "irriparabile" && unrepairableReasons.length > 0 && (
                <div className="space-y-2">
                  <Label>Motivo Irriparabilità</Label>
                  <Select value={diagnosisUnrepairableReasonId} onValueChange={setDiagnosisUnrepairableReasonId}>
                    <SelectTrigger data-testid="select-unrepairable-reason">
                      <SelectValue placeholder="Seleziona motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {unrepairableReasons.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Promozioni Suggerite (condizionale) */}
              {diagnosisOutcome === "non_conveniente" && promotions.length > 0 && (
                <div className="space-y-2">
                  <Label>Promozioni Suggerite</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {promotions.map((promo) => (
                      <div key={promo.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`promo-${promo.id}`}
                          checked={diagnosisSuggestedPromotionIds.includes(promo.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDiagnosisSuggestedPromotionIds([...diagnosisSuggestedPromotionIds, promo.id]);
                            } else {
                              setDiagnosisSuggestedPromotionIds(diagnosisSuggestedPromotionIds.filter(id => id !== promo.id));
                            }
                          }}
                          data-testid={`checkbox-promo-${promo.id}`}
                        />
                        <Label htmlFor={`promo-${promo.id}`} className="text-sm">{promo.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Note Diagnosi</Label>
                <Textarea
                  value={diagnosisNotes}
                  onChange={(e) => setDiagnosisNotes(e.target.value)}
                  placeholder="Note aggiuntive sulla diagnosi..."
                  rows={2}
                  data-testid="textarea-diagnosis-notes"
                />
              </div>

              {/* Additional diagnosis options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diagnosisRequiresExternalParts"
                    checked={diagnosisRequiresExternalParts}
                    onCheckedChange={(checked) => setDiagnosisRequiresExternalParts(checked === true)}
                    data-testid="checkbox-requires-external-parts"
                  />
                  <Label htmlFor="diagnosisRequiresExternalParts">
                    Richiede ricambi esterni
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diagnosisCustomerDataImportant"
                    checked={diagnosisCustomerDataImportant}
                    onCheckedChange={(checked) => setDiagnosisCustomerDataImportant(checked === true)}
                    data-testid="checkbox-customer-data-important"
                  />
                  <Label htmlFor="diagnosisCustomerDataImportant">
                    Dati cliente importanti (presenti sul dispositivo)
                  </Label>
                </div>

                {diagnosisCustomerDataImportant && (
                  <div className="flex items-center space-x-2 ml-6">
                    <Checkbox
                      id="diagnosisDataRecoveryRequested"
                      checked={diagnosisDataRecoveryRequested}
                      onCheckedChange={(checked) => setDiagnosisDataRecoveryRequested(checked === true)}
                      data-testid="checkbox-data-recovery-requested"
                    />
                    <Label htmlFor="diagnosisDataRecoveryRequested">
                      Recupero dati richiesto dal cliente
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="diagnosisWantPhotos"
                    checked={!diagnosisSkipPhotos}
                    onCheckedChange={(checked) => setDiagnosisSkipPhotos(checked !== true)}
                    data-testid="checkbox-want-photos"
                  />
                  <Label htmlFor="diagnosisWantPhotos" className="flex flex-col">
                    <span>Voglio caricare foto</span>
                  </Label>
                </div>
                {!diagnosisSkipPhotos && (
                  <div className="mt-4">
                    <DiagnosisPhotoUploader
                      uploadSessionId={uploadSessionId}
                      photos={diagnosisPhotoIds}
                      onPhotosChange={setDiagnosisPhotoIds}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-4 mt-4"></div>
          {/* Quote Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="createQuoteNow"
              checked={createQuoteNow}
              onCheckedChange={(checked) => setCreateQuoteNow(checked === true)}
              data-testid="checkbox-create-quote"
            />
            <Label htmlFor="createQuoteNow" className="font-medium">
              Crea preventivo ora
            </Label>
          </div>

          {createQuoteNow && (
            <div className="space-y-4 pt-4 border-t">
              {/* Parts Section */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Ricambi e Servizi
                </Label>
                
                {/* Warehouse selection */}
                <div className="flex items-center gap-2">
                  <Select value={selectedQuoteWarehouseId} onValueChange={setSelectedQuoteWarehouseId}>
                    <SelectTrigger className="w-[200px]" data-testid="select-quote-warehouse">
                      <Warehouse className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Seleziona magazzino" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessibleWarehouses.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuoteParts([...quoteParts, { name: '', quantity: 1, unitPrice: 0 }])}
                    data-testid="button-add-part-manual"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Manuale
                  </Button>
                  <SearchableServiceCombobox
                    onSelect={(service) => {
                      setQuoteParts([...quoteParts, {
                        name: `[Servizio] ${service.name}`,
                        quantity: 1,
                        unitPrice: service.effectivePriceCents,
                      }]);
                    }}
                    repairCenterId={form.watch("repairCenterId") || undefined}
                    deviceTypeId={selectedTypeId || undefined}
                    brandId={selectedBrandId || undefined}
                    modelId={form.watch("deviceModelId") || undefined}
                  />
                  <SearchableProductCombobox
                    onSelect={(product) => {
                      setQuoteParts([...quoteParts, {
                        name: product.name,
                        quantity: 1,
                        unitPrice: product.unitPrice || 0,
                      }]);
                    }}
                    warehouseId={selectedQuoteWarehouseId || undefined}
                    productType="ricambio"
                  />
                </div>

                {/* Parts list */}
                <div className="space-y-2">
                  {quoteParts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Nessun elemento aggiunto. Seleziona dal catalogo, magazzino o aggiungi manualmente.
                    </p>
                  ) : (
                    quoteParts.map((part, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          placeholder="Nome ricambio/servizio"
                          value={part.name}
                          onChange={(e) => {
                            const newParts = [...quoteParts];
                            newParts[index].name = e.target.value;
                            setQuoteParts(newParts);
                          }}
                          className="flex-1"
                          data-testid={`input-part-name-${index}`}
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={part.quantity}
                          onChange={(e) => {
                            const newParts = [...quoteParts];
                            newParts[index].quantity = parseInt(e.target.value) || 1;
                            setQuoteParts(newParts);
                          }}
                          className="w-20"
                          data-testid={`input-part-qty-${index}`}
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Prezzo €"
                          value={part.unitPrice / 100}
                          onChange={(e) => {
                            const newParts = [...quoteParts];
                            newParts[index].unitPrice = Math.round(parseFloat(e.target.value) * 100) || 0;
                            setQuoteParts(newParts);
                          }}
                          className="w-28"
                          data-testid={`input-part-price-${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newParts = quoteParts.filter((_, i) => i !== index);
                            setQuoteParts(newParts);
                          }}
                          data-testid={`button-remove-part-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Note Preventivo</Label>
                <Textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Note aggiuntive per il preventivo..."
                  data-testid="textarea-quote-notes"
                />
              </div>

              {/* Labor Cost Toggle */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="wantAddLaborCost"
                    checked={wantAddLaborCost}
                    onCheckedChange={(checked) => {
                      setWantAddLaborCost(checked === true);
                      if (!checked) setQuoteLaborCost(0);
                    }}
                    data-testid="checkbox-want-labor-cost"
                  />
                  <Label htmlFor="wantAddLaborCost">
                    Vuoi aggiungere costo manodopera aggiuntivo?
                  </Label>
                </div>
                
                {wantAddLaborCost && (
                  <div className="space-y-2 pl-6">
                    <Label className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Costo Manodopera (€)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quoteLaborCost}
                      onChange={(e) => setQuoteLaborCost(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      data-testid="input-labor-cost"
                    />
                  </div>
                )}
              </div>

              {/* Total Preview */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Totale Preventivo:</span>
                  <span className="text-xl font-bold">
                    € {((quoteParts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0) / 100) + quoteLaborCost).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderReviewStep = () => {
    const formData = form.getValues();
    const selectedCustomer = customers.find((c) => c.id === formData.customerId);
    // Use filteredRepairCenters for sub_reseller to ensure consistent lookup
    const centersToSearch = user?.role === "sub_reseller" ? filteredRepairCenters : repairCenters;
    const selectedRepairCenter = centersToSearch.find((c) => c.id === formData.repairCenterId);
    
    return (
      <div className="space-y-4">
        {(user?.role === "admin" || user?.role === "repair_center") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <div className="font-medium" data-testid="text-review-customer">
                {selectedCustomer ? `${selectedCustomer.fullName} (${selectedCustomer.email})` : "-"}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Centro di Riparazione</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="font-medium" data-testid="text-review-repair-center">
              {selectedRepairCenter ? `${selectedRepairCenter.name}${selectedRepairCenter.address ? ` - ${selectedRepairCenter.address}` : ''}` : "-"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informazioni dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-muted-foreground">Tipo:</div>
              <div className="font-medium" data-testid="text-review-device-type">{formData.deviceType || "-"}</div>
              
              <div className="text-muted-foreground">Brand:</div>
              <div className="font-medium" data-testid="text-review-brand">{formData.brand || "-"}</div>
              
              <div className="text-muted-foreground">Modello:</div>
              <div className="font-medium" data-testid="text-review-model">{formData.deviceModel || "-"}</div>
              
              <div className="text-muted-foreground">IMEI:</div>
              <div className="font-medium" data-testid="text-review-imei">
                {formData.imeiNotReadable ? "Non leggibile" : 
                 formData.imeiNotPresent ? "Non presente" : 
                 formData.imei || "-"}
              </div>
              
              <div className="text-muted-foreground">Serial:</div>
              <div className="font-medium" data-testid="text-review-serial">
                {formData.serialOnly ? `Solo serial: ${formData.serial}` : formData.serial || "-"}
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div>
              <div className="text-muted-foreground mb-1">Problemi segnalati:</div>
              <div className="font-medium" data-testid="text-review-issue">{formData.issueDescription}</div>
              {formData.otherIssueDescription && (
                <div className="text-sm text-muted-foreground mt-1">
                  Altro: {formData.otherIssueDescription}
                </div>
              )}
            </div>
            
            {formData.notes && (
              <div>
                <div className="text-muted-foreground mb-1">Note:</div>
                <div className="font-medium" data-testid="text-review-notes">{formData.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Controlli accettazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {formData.acceptance.declaredDefects && (
              <div>
                <div className="text-muted-foreground mb-1">Difetti dichiarati:</div>
                <div className="font-medium" data-testid="text-review-defects">{formData.acceptance.declaredDefects}</div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="text-muted-foreground">Condizioni estetiche:</div>
              <div className="font-medium capitalize" data-testid="text-review-aesthetic">
                {formData.acceptance.aestheticCondition || "-"}
              </div>
            </div>
            
            {formData.acceptance.aestheticNotes && (
              <div>
                <div className="text-muted-foreground mb-1">Note estetiche:</div>
                <div className="font-medium" data-testid="text-review-aesthetic-notes">{formData.acceptance.aestheticNotes}</div>
              </div>
            )}
            
            {formData.acceptance.accessories && (
              <div>
                <div className="text-muted-foreground mb-1">Accessori:</div>
                <div className="font-medium" data-testid="text-review-accessories">{formData.acceptance.accessories}</div>
              </div>
            )}
            
            <div className="flex flex-col gap-1 mt-2">
              {!formData.acceptance.aestheticPhotosMandatory && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span>Foto non caricate (scelta utente)</span>
                </div>
              )}
              {formData.acceptance.accessoriesRemoved && (
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Accessori rimossi</span>
                </div>
              )}
              {formData.acceptance.hasLockCode && (
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-blue-500" />
                  <span>Codice di blocco fornito</span>
                </div>
              )}
            </div>
            
            {acceptancePhotos.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-muted-foreground mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>Foto allegate ({acceptancePhotos.length})</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {acceptancePhotos.map((photo, index) => (
                    <div 
                      key={index} 
                      className="aspect-square rounded-md overflow-hidden border"
                      data-testid={`review-photo-${index}`}
                    >
                      <img 
                        src={photo.preview} 
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-md bg-muted p-4 text-sm">
          <p className="font-medium mb-1">Nota importante</p>
          <p className="text-muted-foreground">
            Dopo la conferma, l'ordine verrà creato con stato "Ingressato" 
            e sarà pronto per la fase di diagnosi.
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Accettazione dispositivo - {step === "device-info" ? "Passo 1/4" : step === "acceptance-checks" ? "Passo 2/4" : step === "quote" ? "Passo 3/4" : "Passo 4/4"}
          </DialogTitle>
          <DialogDescription>
            {step === "device-info" && "Inserisci le informazioni del dispositivo e i codici identificativi"}
            {step === "acceptance-checks" && "Verifica le condizioni del dispositivo e gli accessori"}
            {step === "quote" && "Diagnosi e preventivo (opzionale)"}
            {step === "review" && "Controlla i dati inseriti prima di confermare"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {step === "device-info" && renderDeviceInfoStep()}
            {step === "acceptance-checks" && renderAcceptanceChecksStep()}
            {step === "quote" && renderQuoteStep()}
            {step === "review" && renderReviewStep()}

            <Separator />

            <div className="flex justify-between gap-2">
              {step !== "device-info" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
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
                
                {step !== "review" ? (
                  <Button
                    key="next-button"
                    type="button"
                    onClick={handleNext}
                    data-testid="button-next"
                  >
                    Avanti
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    key="submit-button"
                    type="button"
                    onClick={handleSubmit}
                    disabled={createOrderMutation.isPending || isUploadingPhotos}
                    data-testid="button-submit"
                  >
                    {isUploadingPhotos ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Caricamento foto...
                      </>
                    ) : createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creazione...
                      </>
                    ) : "Conferma ingresso"}
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
