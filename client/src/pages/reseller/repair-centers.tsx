import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { RepairCenter, InsertRepairCenter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, MapPin, Phone, Mail, Pencil, Trash2, Building, Clock, ChevronLeft, ChevronRight, Check, FileText, Settings, Network, Users, Eye, UserCheck, KeyRound, Wrench, Euro, TrendingUp, Loader2, BarChart3, Calendar, User2, AlertCircle, Upload, ImageIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { useUser } from "@/hooks/use-user";
import { ActionGuard } from "@/components/permission-guard";

const WIZARD_STEPS = [
  { id: 1, title: "Info Base", icon: Building },
  { id: 2, title: "Indirizzo", icon: MapPin },
  { id: 3, title: "Dati Fiscali", icon: FileText },
  { id: 4, title: "Configurazione", icon: Settings },
];

type SubResellerCenter = {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  isActive: boolean;
};

type SubResellerWithCenters = {
  subReseller: {
    id: string;
    name: string;
    username: string;
    email: string;
  };
  repairCenters: SubResellerCenter[];
};

type RepairCenterDetailData = {
  center: RepairCenter;
  stats: {
    totalRepairs: number;
    pendingRepairs: number;
    completedRepairs: number;
    inProgressRepairs: number;
    totalRevenue: number;
    staffCount: number;
    customerCount: number;
  };
  recentRepairs: {
    id: string;
    orderNumber: string;
    status: string;
    deviceType: string;
    brand: string | null;
    deviceModel: string;
    issueDescription: string;
    finalCost: number | null;
    estimatedCost: number | null;
    createdAt: string;
    customerName: string | null;
    customerEmail: string | null;
  }[];
};

type RepairCenterRepairsData = {
  repairs: {
    id: string;
    orderNumber: string;
    status: string;
    deviceType: string;
    brand: string | null;
    deviceModel: string;
    issueDescription: string;
    finalCost: number | null;
    estimatedCost: number | null;
    createdAt: string;
    updatedAt: string;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
  }[];
  total: number;
};

export default function ResellerRepairCenters() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<RepairCenter | null>(null);
  const [addressData, setAddressData] = useState({ address: "", city: "", cap: "", provincia: "" });
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");
  const [useMyFiscalData, setUseMyFiscalData] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [expandedSubResellers, setExpandedSubResellers] = useState<Record<string, boolean>>({});
  const [selectedSubResellerId, setSelectedSubResellerId] = useState<string | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [centerToResetPassword, setCenterToResetPassword] = useState<RepairCenter | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(null);
  const [repairsPage, setRepairsPage] = useState(0);
  const [repairsStatusFilter, setRepairsStatusFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    ragioneSociale: "",
    partitaIva: "",
    codiceFiscale: "",
    codiceUnivoco: "",
    pec: "",
    iban: "",
  });
  const { toast } = useToast();
  const { user } = useUser();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const formLogoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);

  const { data: centers = [], isLoading } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: subResellersCenters = [], isLoading: isLoadingSubResellers } = useQuery<SubResellerWithCenters[]>({
    queryKey: ["/api/reseller/sub-resellers-repair-centers"],
  });

  const { data: subResellers = [] } = useQuery<User[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  // Query per il dettaglio centro selezionato
  const { data: centerDetail, isLoading: isLoadingDetail } = useQuery<RepairCenterDetailData>({
    queryKey: [`/api/reseller/repair-centers/${selectedCenterId}/detail`],
    enabled: !!selectedCenterId && detailDialogOpen,
  });

  // Query per le riparazioni paginate del centro
  const { data: repairsData, isLoading: isLoadingRepairs } = useQuery<RepairCenterRepairsData>({
    queryKey: [`/api/reseller/repair-centers/${selectedCenterId}/repairs?limit=20&offset=${repairsPage * 20}${repairsStatusFilter !== "all" ? `&status=${repairsStatusFilter}` : ""}`],
    enabled: !!selectedCenterId && detailDialogOpen,
  });

  const totalNetworkCenters = subResellersCenters.reduce((acc, sr) => acc + sr.repairCenters.length, 0);
  const hasSubResellers = subResellersCenters.length > 0;

  const createCenterMutation = useMutation({
    mutationFn: async (data: Omit<InsertRepairCenter, 'resellerId'>) => {
      const res = await apiRequest("POST", "/api/reseller/repair-centers", data);
      return await res.json();
    },
    onSuccess: async (newCenter: RepairCenter) => {
      if (pendingLogoFile && newCenter.id) {
        try {
          const formData = new FormData();
          formData.append("logo", pendingLogoFile);
          const logoRes = await fetch(`/api/repair-centers/${newCenter.id}/logo`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          if (!logoRes.ok) {
            toast({ title: "Attenzione", description: "Centro creato ma upload logo fallito. Puoi caricarlo dal dettaglio.", variant: "default" });
          }
        } catch {
          toast({ title: "Attenzione", description: "Centro creato ma upload logo fallito.", variant: "default" });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      resetWizard();
      toast({ title: "Centro di riparazione creato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateCenterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RepairCenter> }) => {
      const res = await apiRequest("PATCH", `/api/reseller/repair-centers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      toast({ title: "Centro aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reseller/repair-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
      toast({ title: "Centro eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/reseller/repair-centers/${id}/reset-password`, { newPassword });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Password aggiornata con successo" });
      setResetPasswordDialogOpen(false);
      setCenterToResetPassword(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleResetPasswordClick = (center: RepairCenter) => {
    setCenterToResetPassword(center);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (centerToResetPassword && newPassword.length >= 6) {
      resetPasswordMutation.mutate({ id: centerToResetPassword.id, newPassword });
    }
  };

  const handleViewDetail = (centerId: string) => {
    setSelectedCenterId(centerId);
    setRepairsPage(0);
    setRepairsStatusFilter("all");
    setDetailDialogOpen(true);
  };

  const handleCenterLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCenterId) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato non supportato", description: "Usa un'immagine JPEG, PNG o WebP", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "L'immagine non può superare i 2MB", variant: "destructive" });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`/api/repair-centers/${selectedCenterId}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error(await res.text());

      queryClient.invalidateQueries({ queryKey: [`/api/reseller/repair-centers/${selectedCenterId}/detail`] });
      toast({ title: "Logo caricato", description: "Il logo è stato aggiornato con successo" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Impossibile caricare il logo", variant: "destructive" });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleDeleteCenterLogo = async () => {
    if (!selectedCenterId) return;

    try {
      const res = await fetch(`/api/repair-centers/${selectedCenterId}/logo`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error(await res.text());

      queryClient.invalidateQueries({ queryKey: [`/api/reseller/repair-centers/${selectedCenterId}/detail`] });
      toast({ title: "Logo rimosso", description: "Il logo è stato eliminato" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Impossibile eliminare il logo", variant: "destructive" });
    }
  };

  const handleFormLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Formato non supportato", description: "Usa un'immagine JPEG, PNG o WebP", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File troppo grande", description: "L'immagine non può superare i 2MB", variant: "destructive" });
      return;
    }

    setPendingLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePendingLogo = () => {
    setPendingLogoFile(null);
    setPendingLogoPreview(null);
    if (formLogoInputRef.current) formLogoInputRef.current.value = "";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: "In Attesa", variant: "secondary" },
      ingressato: { label: "Ingressato", variant: "outline" },
      in_diagnosi: { label: "In Diagnosi", variant: "outline" },
      preventivo_emesso: { label: "Preventivo Emesso", variant: "outline" },
      preventivo_accettato: { label: "Preventivo Accettato", variant: "default" },
      attesa_ricambi: { label: "Attesa Ricambi", variant: "secondary" },
      in_riparazione: { label: "In Riparazione", variant: "default" },
      in_test: { label: "In Test", variant: "default" },
      pronto_ritiro: { label: "Pronto Ritiro", variant: "default" },
      consegnato: { label: "Consegnato", variant: "default" },
      cancelled: { label: "Annullato", variant: "destructive" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const resetWizard = () => {
    setWizardStep(1);
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      ragioneSociale: "",
      partitaIva: "",
      codiceFiscale: "",
      codiceUnivoco: "",
      pec: "",
      iban: "",
    });
    setAddressData({ address: "", city: "", cap: "", provincia: "" });
    setHourlyRateEuros("");
    setUseMyFiscalData(false);
    setSelectedSubResellerId(null);
    setPendingLogoFile(null);
    setPendingLogoPreview(null);
    if (formLogoInputRef.current) formLogoInputRef.current.value = "";
  };

  const progressPercent = (wizardStep / WIZARD_STEPS.length) * 100;

  const canProceedToNextStep = () => {
    switch (wizardStep) {
      case 1: return formData.name && formData.email && formData.phone && (!editingCenter ? formData.password.length >= 6 : true);
      case 2: return addressData.address && addressData.city;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (wizardStep < WIZARD_STEPS.length) {
      setWizardStep(wizardStep + 1);
    }
  };

  const prevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const isLastStep = () => wizardStep === WIZARD_STEPS.length;
  const isFirstStep = () => wizardStep === 1;

  const handleUseMyFiscalDataChange = (checked: boolean) => {
    setUseMyFiscalData(checked);
    if (checked && user) {
      setFormData(prev => ({
        ...prev,
        ragioneSociale: user.ragioneSociale || "",
        partitaIva: user.partitaIva || "",
        codiceFiscale: user.codiceFiscale || "",
        codiceUnivoco: user.codiceUnivoco || "",
        pec: user.pec || "",
        iban: user.iban || "",
      }));
      if (user.indirizzo) {
        setAddressData({
          address: user.indirizzo || "",
          city: user.citta || "",
          cap: user.cap || "",
          provincia: user.provincia || "",
        });
      }
    }
  };

  const handleFinalSubmit = () => {
    if (!addressData.address.trim() || !addressData.city.trim()) {
      toast({ title: "Errore", description: "Indirizzo e Città sono campi obbligatori", variant: "destructive" });
      return;
    }
    
    const fiscalData = {
      ragioneSociale: formData.ragioneSociale?.trim() || null,
      partitaIva: formData.partitaIva?.trim() || null,
      codiceFiscale: formData.codiceFiscale?.trim() || null,
      iban: formData.iban?.trim() || null,
      codiceUnivoco: formData.codiceUnivoco?.trim() || null,
      pec: formData.pec?.trim() || null,
    };
    
    const hourlyRateCentsValue = hourlyRateEuros 
      ? Math.round(parseFloat(hourlyRateEuros) * 100)
      : (editingCenter ? editingCenter.hourlyRateCents : null);
    
    if (editingCenter) {
      const updates: Partial<RepairCenter> = {
        name: formData.name,
        address: addressData.address,
        city: addressData.city,
        cap: addressData.cap?.trim() || null,
        provincia: addressData.provincia?.trim() || null,
        phone: formData.phone,
        email: formData.email,
        hourlyRateCents: hourlyRateCentsValue,
        ...fiscalData,
      };
      if (subResellers.length > 0) {
        updates.subResellerId = selectedSubResellerId;
      }
      updateCenterMutation.mutate({ id: editingCenter.id, data: updates });
    } else {
      const data = {
        name: formData.name,
        address: addressData.address,
        city: addressData.city,
        cap: addressData.cap?.trim() || null,
        provincia: addressData.provincia?.trim() || null,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        isActive: true,
        hourlyRateCents: hourlyRateCentsValue,
        ...(subResellers.length > 0 ? { subResellerId: selectedSubResellerId } : {}),
        ...fiscalData,
      };
      createCenterMutation.mutate(data);
    }
  };

  const filteredCenters = centers.filter((center) =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCenters = centers.filter(c => c.isActive).length;

  return (
    <div className="space-y-6" data-testid="page-reseller-repair-centers">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Centri di Riparazione</h1>
              <p className="text-sm text-white/80">
                Gestisci i tuoi centri di riparazione
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingCenter(null);
              resetWizard();
            }
          }}>
            <ActionGuard module="repair_centers" action="create">
              <DialogTrigger asChild>
                <Button onClick={() => resetWizard()} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg" data-testid="button-new-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Centro
                </Button>
              </DialogTrigger>
            </ActionGuard>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-center-form">
            <DialogHeader>
              <DialogTitle>{editingCenter ? "Modifica Centro" : "Nuovo Centro di Riparazione"}</DialogTitle>
            </DialogHeader>
            
            {/* MODIFICA: Form con Accordion (tutte le sezioni visibili) */}
            {editingCenter ? (
              <div className="space-y-4">
                <Accordion type="multiple" defaultValue={["info", "address", "fiscal", "config", "logo"]} className="w-full">
                  <AccordionItem value="info">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <Building className="h-4 w-4" />
                        Info Base
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Nome Centro *</Label>
                        <Input 
                          id="edit-name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="edit-input-name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email *</Label>
                        <Input 
                          id="edit-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          data-testid="edit-input-email" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Telefono *</Label>
                        <Input 
                          id="edit-phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          data-testid="edit-input-phone" 
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="address">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Indirizzo
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Indirizzo *</Label>
                        <AddressAutocomplete
                          value={addressData.address}
                          onChange={(val) => setAddressData(prev => ({ ...prev, address: val }))}
                          onAddressSelect={(result) => {
                            setAddressData({
                              address: result.address || result.fullAddress,
                              city: result.city,
                              cap: result.postalCode,
                              provincia: result.province,
                            });
                          }}
                          placeholder="Inizia a digitare..."
                          data-testid="edit-input-address"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-city">Città *</Label>
                          <Input 
                            id="edit-city"
                            value={addressData.city}
                            onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                            data-testid="edit-input-city" 
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="edit-cap">CAP</Label>
                            <Input 
                              id="edit-cap"
                              value={addressData.cap}
                              onChange={(e) => setAddressData(prev => ({ ...prev, cap: e.target.value }))}
                              data-testid="edit-input-cap" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-provincia">Prov.</Label>
                            <Input 
                              id="edit-provincia"
                              maxLength={2}
                              value={addressData.provincia}
                              onChange={(e) => setAddressData(prev => ({ ...prev, provincia: e.target.value }))}
                              placeholder="XX"
                              data-testid="edit-input-provincia" 
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fiscal">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Dati Fiscali
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <p className="text-sm text-muted-foreground">Dati fiscali e fatturazione (opzionali).</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="edit-ragioneSociale">Ragione Sociale</Label>
                          <Input 
                            id="edit-ragioneSociale"
                            value={formData.ragioneSociale}
                            onChange={(e) => setFormData(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                            data-testid="edit-input-ragioneSociale" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-partitaIva">Partita IVA</Label>
                          <Input 
                            id="edit-partitaIva"
                            value={formData.partitaIva}
                            onChange={(e) => setFormData(prev => ({ ...prev, partitaIva: e.target.value }))}
                            data-testid="edit-input-partitaIva" 
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="edit-codiceFiscale">Codice Fiscale</Label>
                          <Input 
                            id="edit-codiceFiscale"
                            value={formData.codiceFiscale}
                            onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                            data-testid="edit-input-codiceFiscale" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-codiceUnivoco">Codice SDI</Label>
                          <Input 
                            id="edit-codiceUnivoco"
                            maxLength={7}
                            value={formData.codiceUnivoco}
                            onChange={(e) => setFormData(prev => ({ ...prev, codiceUnivoco: e.target.value }))}
                            placeholder="7 caratteri"
                            data-testid="edit-input-codiceUnivoco" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-pec">PEC</Label>
                          <Input 
                            id="edit-pec"
                            type="email"
                            value={formData.pec}
                            onChange={(e) => setFormData(prev => ({ ...prev, pec: e.target.value }))}
                            placeholder="email@pec.it"
                            data-testid="edit-input-pec" 
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="edit-iban">IBAN</Label>
                          <Input 
                            id="edit-iban"
                            value={formData.iban}
                            onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                            placeholder="IT..."
                            data-testid="edit-input-iban" 
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="config">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Configurazione
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="edit-hourlyRate">Tariffa Oraria (EUR)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                          <Input
                            id="edit-hourlyRate"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="35.00"
                            value={hourlyRateEuros}
                            onChange={(e) => setHourlyRateEuros(e.target.value)}
                            className="pl-7"
                            data-testid="edit-input-hourly-rate"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tariffa oraria per il calcolo del costo manodopera. Se non specificata, verrà usata la tariffa di sistema.
                        </p>
                      </div>
                      
                      {subResellers.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="edit-subReseller">Sub-Reseller (opzionale)</Label>
                          <Select
                            value={selectedSubResellerId || "none"}
                            onValueChange={(value) => setSelectedSubResellerId(value === "none" ? null : value)}
                          >
                            <SelectTrigger data-testid="edit-select-sub-reseller">
                              <SelectValue placeholder="Seleziona sub-reseller..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nessuno (gestito direttamente)</SelectItem>
                              {subResellers.map((sr) => (
                                <SelectItem key={sr.id} value={sr.id}>
                                  {sr.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Assegna questo centro a un sub-reseller per permettergli di gestirlo.
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="logo">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex flex-wrap items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Logo Aziendale
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                      <div className="flex flex-wrap items-center gap-4">
                        <Avatar className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25">
                          {editingCenter?.logoUrl ? (
                            <AvatarImage src={editingCenter.logoUrl} alt="Logo centro" className="object-contain" />
                          ) : pendingLogoPreview ? (
                            <AvatarImage src={pendingLogoPreview} alt="Anteprima logo" className="object-contain" />
                          ) : null}
                          <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                            <Building className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => formLogoInputRef.current?.click()}
                              disabled={isUploadingLogo}
                              data-testid="button-edit-select-logo"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploadingLogo ? "Caricamento..." : editingCenter?.logoUrl ? "Cambia Logo" : "Carica Logo"}
                            </Button>
                            {editingCenter?.logoUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (!editingCenter?.id) return;
                                  try {
                                    const res = await fetch(`/api/repair-centers/${editingCenter.id}/logo`, {
                                      method: "DELETE",
                                      credentials: "include",
                                    });
                                    if (!res.ok) throw new Error(await res.text());
                                    queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
                                    setEditingCenter({ ...editingCenter, logoUrl: null });
                                    toast({ title: "Logo rimosso" });
                                  } catch (error: any) {
                                    toast({ title: "Errore", description: error.message, variant: "destructive" });
                                  }
                                }}
                                className="text-destructive hover:text-destructive"
                                data-testid="button-edit-delete-logo"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Rimuovi
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Formati supportati: JPEG, PNG, WebP. Max 2MB
                          </p>
                        </div>
                        <input
                          ref={formLogoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !editingCenter?.id) return;

                            const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
                            if (!allowedTypes.includes(file.type)) {
                              toast({ title: "Formato non supportato", description: "Usa JPEG, PNG o WebP", variant: "destructive" });
                              return;
                            }
                            if (file.size > 2 * 1024 * 1024) {
                              toast({ title: "File troppo grande", description: "Max 2MB", variant: "destructive" });
                              return;
                            }

                            setIsUploadingLogo(true);
                            try {
                              const formData = new FormData();
                              formData.append("logo", file);
                              const res = await fetch(`/api/repair-centers/${editingCenter.id}/logo`, {
                                method: "POST",
                                body: formData,
                                credentials: "include",
                              });
                              if (!res.ok) throw new Error(await res.text());
                              const result = await res.json();
                              queryClient.invalidateQueries({ queryKey: ["/api/reseller/repair-centers"] });
                              setEditingCenter({ ...editingCenter, logoUrl: result.logoUrl });
                              toast({ title: "Logo caricato" });
                            } catch (error: any) {
                              toast({ title: "Errore", description: error.message, variant: "destructive" });
                            } finally {
                              setIsUploadingLogo(false);
                              if (formLogoInputRef.current) formLogoInputRef.current.value = "";
                            }
                          }}
                          className="hidden"
                          data-testid="input-edit-logo-file"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex justify-end pt-4 border-t gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Annulla
                  </Button>
                  <Button 
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={updateCenterMutation.isPending}
                    data-testid="button-edit-submit"
                  >
                    {updateCenterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Check className="mr-1 h-4 w-4" />
                    Salva Modifiche
                  </Button>
                </div>
              </div>
            ) : (
              /* CREAZIONE: Wizard a step */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  {WIZARD_STEPS.map((step) => {
                    const StepIcon = step.icon;
                    const isActive = step.id === wizardStep;
                    const isPast = wizardStep > step.id;
                    return (
                      <div key={step.id} className="flex flex-col items-center flex-1">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isActive ? 'bg-primary border-primary text-primary-foreground' : 
                            isPast ? 'bg-primary/20 border-primary text-primary' : 
                            'bg-muted border-muted-foreground/30 text-muted-foreground'
                          }`}
                        >
                          {isPast ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                        </div>
                        <span className={`text-xs mt-1 text-center ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {step.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Progress value={progressPercent} className="h-1" />

                <div className="min-h-[280px]">
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Informazioni di base del centro di riparazione.</p>
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Centro *</Label>
                        <Input 
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          data-testid="input-name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input 
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          data-testid="input-email" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefono *</Label>
                        <Input 
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          data-testid="input-phone" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password Account * (min 6 caratteri)</Label>
                        <Input 
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Password per accesso al centro"
                          data-testid="input-password" 
                        />
                        <p className="text-xs text-muted-foreground">
                          Questa password verrà usata dal centro per accedere al sistema
                        </p>
                      </div>
                    </div>
                  )}

                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Indirizzo e ubicazione del centro.</p>
                      <div className="space-y-2">
                        <Label>Indirizzo *</Label>
                        <AddressAutocomplete
                          value={addressData.address}
                          onChange={(val) => setAddressData(prev => ({ ...prev, address: val }))}
                          onAddressSelect={(result) => {
                            setAddressData({
                              address: result.address || result.fullAddress,
                              city: result.city,
                              cap: result.postalCode,
                              provincia: result.province,
                            });
                          }}
                          placeholder="Inizia a digitare..."
                          data-testid="input-address"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="city">Città *</Label>
                          <Input 
                            id="city"
                            value={addressData.city}
                            onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                            data-testid="input-city" 
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="cap">CAP</Label>
                            <Input 
                              id="cap"
                              value={addressData.cap}
                              onChange={(e) => setAddressData(prev => ({ ...prev, cap: e.target.value }))}
                              data-testid="input-cap" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="provincia">Prov.</Label>
                            <Input 
                              id="provincia"
                              maxLength={2}
                              value={addressData.provincia}
                              onChange={(e) => setAddressData(prev => ({ ...prev, provincia: e.target.value }))}
                              placeholder="XX"
                              data-testid="input-provincia" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 3 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Dati fiscali e fatturazione (opzionali).</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Checkbox 
                            id="useMyFiscalData" 
                            checked={useMyFiscalData}
                            onCheckedChange={(checked) => handleUseMyFiscalDataChange(checked as boolean)}
                            data-testid="checkbox-use-my-fiscal-data"
                          />
                          <Label htmlFor="useMyFiscalData" className="text-xs cursor-pointer">
                            Usa i miei dati
                          </Label>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="ragioneSociale">Ragione Sociale</Label>
                          <Input 
                            id="ragioneSociale"
                            value={formData.ragioneSociale}
                            onChange={(e) => setFormData(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                            data-testid="input-ragioneSociale" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="partitaIva">Partita IVA</Label>
                          <Input 
                            id="partitaIva"
                            value={formData.partitaIva}
                            onChange={(e) => setFormData(prev => ({ ...prev, partitaIva: e.target.value }))}
                            data-testid="input-partitaIva" 
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                          <Input 
                            id="codiceFiscale"
                            value={formData.codiceFiscale}
                            onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                            data-testid="input-codiceFiscale" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="codiceUnivoco">Codice SDI</Label>
                          <Input 
                            id="codiceUnivoco"
                            maxLength={7}
                            value={formData.codiceUnivoco}
                            onChange={(e) => setFormData(prev => ({ ...prev, codiceUnivoco: e.target.value }))}
                            placeholder="7 caratteri"
                            data-testid="input-codiceUnivoco" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pec">PEC</Label>
                          <Input 
                            id="pec"
                            type="email"
                            value={formData.pec}
                            onChange={(e) => setFormData(prev => ({ ...prev, pec: e.target.value }))}
                            placeholder="email@pec.it"
                            data-testid="input-pec" 
                          />
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="iban">IBAN</Label>
                          <Input 
                            id="iban"
                            value={formData.iban}
                            onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                            placeholder="IT..."
                            data-testid="input-iban" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {wizardStep === 4 && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Configurazione tariffe e servizi.</p>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Tariffa Manodopera
                        </h4>
                        <div className="space-y-2">
                          <Label htmlFor="hourlyRate">Tariffa Oraria (EUR)</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                            <Input
                              id="hourlyRate"
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="35.00"
                              value={hourlyRateEuros}
                              onChange={(e) => setHourlyRateEuros(e.target.value)}
                              className="pl-7"
                              data-testid="input-hourly-rate"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Tariffa oraria per il calcolo del costo manodopera. 
                            Se non specificata, verrà usata la tariffa di sistema.
                          </p>
                        </div>
                      </div>
                      
                      {subResellers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Assegnazione Sub-Reseller
                          </h4>
                          <div className="space-y-2">
                            <Label htmlFor="subReseller">Sub-Reseller (opzionale)</Label>
                            <Select
                              value={selectedSubResellerId || "none"}
                              onValueChange={(value) => setSelectedSubResellerId(value === "none" ? null : value)}
                            >
                              <SelectTrigger data-testid="select-sub-reseller">
                                <SelectValue placeholder="Seleziona sub-reseller..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nessuno (gestito direttamente)</SelectItem>
                                {subResellers.map((sr) => (
                                  <SelectItem key={sr.id} value={sr.id}>
                                    {sr.fullName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Assegna questo centro a un sub-reseller per permettergli di gestirlo.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Logo Aziendale (opzionale)
                        </h4>
                        <div className="flex flex-wrap items-center gap-4">
                          <Avatar className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25">
                            {pendingLogoPreview ? (
                              <AvatarImage src={pendingLogoPreview} alt="Anteprima logo" className="object-contain" />
                            ) : null}
                            <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                              <Building className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => formLogoInputRef.current?.click()}
                                data-testid="button-select-logo"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                {pendingLogoFile ? "Cambia" : "Seleziona"}
                              </Button>
                              {pendingLogoFile && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleRemovePendingLogo}
                                  className="text-destructive hover:text-destructive"
                                  data-testid="button-remove-pending-logo"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Rimuovi
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              JPEG, PNG, WebP. Max 2MB
                            </p>
                          </div>
                          <input
                            ref={formLogoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFormLogoSelect}
                            className="hidden"
                            data-testid="input-form-logo-file"
                          />
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded-md mt-4">
                        <p className="text-xs text-muted-foreground">
                          Il centro di riparazione sarà automaticamente associato al tuo account rivenditore e potrai gestirne le attività.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={prevStep}
                    disabled={isFirstStep()}
                    data-testid="button-wizard-prev"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Indietro
                  </Button>
                  {isLastStep() ? (
                    <Button 
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={createCenterMutation.isPending}
                      data-testid="button-submit-center"
                    >
                      {createCenterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Check className="mr-1 h-4 w-4" />
                      Crea Centro
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      onClick={nextStep}
                      disabled={!canProceedToNextStep()}
                      data-testid="button-wizard-next"
                    >
                      Avanti
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Totale Centri</p>
                <p className="text-3xl font-bold tabular-nums">{centers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasSubResellers && `+${totalNetworkCenters} nella rete`}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <Building className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Centri Attivi</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{activeCenters}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {centers.length > 0 ? Math.round((activeCenters / centers.length) * 100) : 0}% operativi
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Rete Sub-Reseller</p>
                <p className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{totalNetworkCenters}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Centri gestiti da {subResellersCenters.length} sub-reseller
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Network className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome o città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-centers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredCenters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun centro di riparazione trovato</p>
              <p className="text-sm mt-2">Clicca su "Nuovo Centro" per crearne uno</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Località</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Tariffa Oraria</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map((center) => (
                  <TableRow key={center.id} data-testid={`row-center-${center.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${center.id}`}>{center.name}</TableCell>
                    <TableCell data-testid={`text-location-${center.id}`}>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{center.city}</div>
                          <div className="text-xs text-muted-foreground">{center.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-contacts-${center.id}`}>
                      <div className="text-sm space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {center.phone}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {center.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-hourly-rate-${center.id}`}>
                      {center.hourlyRateCents ? (
                        <span className="font-medium">€{(center.hourlyRateCents / 100).toFixed(2)}/ora</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">Default</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? "default" : "secondary"} data-testid={`badge-status-${center.id}`}>
                        {center.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(center.id)}
                          title="Visualizza Dettagli"
                          data-testid={`button-view-detail-${center.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingCenter(center);
                            setWizardStep(1);
                            setFormData({
                              name: center.name || "",
                              phone: center.phone || "",
                              email: center.email || "",
                              password: "",
                              ragioneSociale: center.ragioneSociale || "",
                              partitaIva: center.partitaIva || "",
                              codiceFiscale: center.codiceFiscale || "",
                              codiceUnivoco: center.codiceUnivoco || "",
                              pec: center.pec || "",
                              iban: center.iban || "",
                            });
                            setAddressData({
                              address: center.address || "",
                              city: center.city || "",
                              cap: center.cap || "",
                              provincia: center.provincia || "",
                            });
                            setHourlyRateEuros(center.hourlyRateCents ? (center.hourlyRateCents / 100).toFixed(2) : "");
                            setSelectedSubResellerId(center.subResellerId || null);
                            setDialogOpen(true);
                          }}
                          data-testid={`button-edit-${center.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPasswordClick(center)}
                          title="Reimposta Password"
                          data-testid={`button-reset-password-${center.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler eliminare questo centro di riparazione?")) {
                              deleteCenterMutation.mutate(center.id);
                            }
                          }}
                          disabled={deleteCenterMutation.isPending}
                          data-testid={`button-delete-${center.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Sezione Centri della Rete - Solo se ci sono sub-reseller */}
      {hasSubResellers && (
        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Network className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Centri della Rete</h2>
                  <p className="text-sm text-muted-foreground">
                    Centri di riparazione dei tuoi rivenditori
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="flex flex-wrap items-center gap-1">
                  <Users className="h-3 w-3" />
                  {subResellersCenters.length} Rivenditori
                </Badge>
                <Badge variant="outline" className="flex flex-wrap items-center gap-1">
                  <Building className="h-3 w-3" />
                  {totalNetworkCenters} Centri
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSubResellers ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : totalNetworkCenters === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>I tuoi rivenditori non hanno ancora centri di riparazione</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subResellersCenters.map((srData) => (
                  <Collapsible
                    key={srData.subReseller.id}
                    open={expandedSubResellers[srData.subReseller.id] ?? false}
                    onOpenChange={(open) => 
                      setExpandedSubResellers(prev => ({ ...prev, [srData.subReseller.id]: open }))
                    }
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover-elevate rounded-lg" data-testid={`subreseller-toggle-${srData.subReseller.id}`}>
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{srData.subReseller.name}</div>
                              <div className="text-sm text-muted-foreground">{srData.subReseller.email}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {srData.repairCenters.length} {srData.repairCenters.length === 1 ? 'Centro' : 'Centri'}
                            </Badge>
                            <ChevronRight className={`h-4 w-4 transition-transform ${expandedSubResellers[srData.subReseller.id] ? 'rotate-90' : ''}`} />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {srData.repairCenters.length === 0 ? (
                          <div className="px-4 pb-4 text-sm text-muted-foreground">
                            Nessun centro di riparazione
                          </div>
                        ) : (
                          <div className="border-t">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome Centro</TableHead>
                                  <TableHead>Località</TableHead>
                                  <TableHead>Contatti</TableHead>
                                  <TableHead>Stato</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {srData.repairCenters.map((center) => (
                                  <TableRow key={center.id} data-testid={`row-network-center-${center.id}`}>
                                    <TableCell className="font-medium">
                                      {center.name}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <div>{center.city}</div>
                                          <div className="text-xs text-muted-foreground">{center.address}</div>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-sm space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Phone className="h-3 w-3 text-muted-foreground" />
                                          {center.phone}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Mail className="h-3 w-3 text-muted-foreground" />
                                          {center.email}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={center.isActive ? "default" : "secondary"}>
                                        {center.isActive ? "Attivo" : "Inattivo"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Dettaglio Centro */}
      <Dialog open={detailDialogOpen} onOpenChange={(open) => {
        setDetailDialogOpen(open);
        if (!open) setSelectedCenterId(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-center-detail">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl">{centerDetail?.center.name || "Caricamento..."}</span>
                {centerDetail?.center.isActive !== undefined && (
                  <Badge variant={centerDetail.center.isActive ? "default" : "secondary"} className="ml-3">
                    {centerDetail.center.isActive ? "Attivo" : "Inattivo"}
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : centerDetail ? (
            <Tabs defaultValue="anagrafica" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="anagrafica" className="flex flex-wrap items-center gap-2" data-testid="tab-anagrafica">
                  <FileText className="h-4 w-4" />
                  Anagrafica
                </TabsTrigger>
                <TabsTrigger value="statistiche" className="flex flex-wrap items-center gap-2" data-testid="tab-statistiche">
                  <BarChart3 className="h-4 w-4" />
                  Statistiche
                </TabsTrigger>
                <TabsTrigger value="riparazioni" className="flex flex-wrap items-center gap-2" data-testid="tab-riparazioni">
                  <Wrench className="h-4 w-4" />
                  Riparazioni
                </TabsTrigger>
              </TabsList>

              {/* Tab Anagrafica */}
              <TabsContent value="anagrafica" className="mt-4 space-y-4">
                {/* Logo Aziendale */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-semibold">Logo Aziendale</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-6">
                      <Avatar className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25">
                        {centerDetail.center.logoUrl ? (
                          <AvatarImage src={centerDetail.center.logoUrl} alt="Logo centro" className="object-contain" />
                        ) : null}
                        <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                          <Building className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={isUploadingLogo}
                            data-testid="button-upload-center-logo"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {isUploadingLogo ? "Caricamento..." : centerDetail.center.logoUrl ? "Cambia Logo" : "Carica Logo"}
                          </Button>
                          {centerDetail.center.logoUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleDeleteCenterLogo}
                              className="text-destructive hover:text-destructive"
                              data-testid="button-delete-center-logo"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Rimuovi
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Formati supportati: JPEG, PNG, WebP. Max 2MB
                        </p>
                      </div>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleCenterLogoUpload}
                        className="hidden"
                        data-testid="input-center-logo-file"
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contatti */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-semibold">Contatti</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{centerDetail.center.email}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{centerDetail.center.phone}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Indirizzo */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="font-semibold">Indirizzo</span>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>{centerDetail.center.address}</p>
                      <p>{centerDetail.center.cap} {centerDetail.center.city} ({centerDetail.center.provincia})</p>
                    </CardContent>
                  </Card>

                  {/* Dati Fiscali */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="font-semibold">Dati Fiscali</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Ragione Sociale</p>
                          <p className="font-medium">{centerDetail.center.ragioneSociale || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Partita IVA</p>
                          <p className="font-medium">{centerDetail.center.partitaIva || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Codice Fiscale</p>
                          <p className="font-medium">{centerDetail.center.codiceFiscale || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Codice SDI</p>
                          <p className="font-medium">{centerDetail.center.codiceUnivoco || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">PEC</p>
                          <p className="font-medium">{centerDetail.center.pec || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">IBAN</p>
                          <p className="font-medium">{centerDetail.center.iban || "-"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab Statistiche */}
              <TabsContent value="statistiche" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                    <CardContent className="relative pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Totale Riparazioni</p>
                          <p className="text-2xl font-bold">{centerDetail.stats.totalRepairs}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                          <Wrench className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                    <CardContent className="relative pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">In Attesa</p>
                          <p className="text-2xl font-bold text-amber-600">{centerDetail.stats.pendingRepairs}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
                    <CardContent className="relative pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">In Corso</p>
                          <p className="text-2xl font-bold text-violet-600">{centerDetail.stats.inProgressRepairs}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-violet-500 text-white flex items-center justify-center">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                    <CardContent className="relative pt-4 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Completate</p>
                          <p className="text-2xl font-bold text-emerald-600">{centerDetail.stats.completedRepairs}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Fatturato Totale</p>
                          <p className="text-xl font-bold">€{(centerDetail.stats.totalRevenue / 100).toFixed(2)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Staff Assegnato</p>
                          <p className="text-xl font-bold">{centerDetail.stats.staffCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                          <User2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase">Clienti Serviti</p>
                          <p className="text-xl font-bold">{centerDetail.stats.customerCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab Riparazioni */}
              <TabsContent value="riparazioni" className="mt-4 space-y-4">
                {/* Filtri */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Riparazioni ({repairsData?.total || 0})
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={repairsStatusFilter} onValueChange={(v) => { setRepairsStatusFilter(v); setRepairsPage(0); }}>
                      <SelectTrigger className="w-48" data-testid="select-repair-status-filter">
                        <SelectValue placeholder="Filtra per stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="pending">In Attesa</SelectItem>
                        <SelectItem value="ingressato">Ingressato</SelectItem>
                        <SelectItem value="in_diagnosi">In Diagnosi</SelectItem>
                        <SelectItem value="preventivo_emesso">Preventivo Emesso</SelectItem>
                        <SelectItem value="preventivo_accettato">Preventivo Accettato</SelectItem>
                        <SelectItem value="attesa_ricambi">Attesa Ricambi</SelectItem>
                        <SelectItem value="in_riparazione">In Riparazione</SelectItem>
                        <SelectItem value="in_test">In Test</SelectItem>
                        <SelectItem value="pronto_ritiro">Pronto Ritiro</SelectItem>
                        <SelectItem value="consegnato">Consegnato</SelectItem>
                        <SelectItem value="cancelled">Annullato</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoadingRepairs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !repairsData || repairsData.repairs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Nessuna riparazione trovata</p>
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ordine</TableHead>
                          <TableHead>Dispositivo</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Importo</TableHead>
                          <TableHead className="text-right">Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repairsData.repairs.map((repair) => (
                          <TableRow key={repair.id} data-testid={`row-repair-${repair.id}`}>
                            <TableCell className="font-mono text-sm">{repair.orderNumber}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{repair.brand} {repair.deviceModel}</div>
                                <div className="text-xs text-muted-foreground">{repair.deviceType}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{repair.customerName || "-"}</div>
                                <div className="text-xs text-muted-foreground">{repair.customerEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(repair.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(repair.createdAt), "dd/MM/yyyy", { locale: it })}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {repair.finalCost ? `€${(repair.finalCost / 100).toFixed(2)}` : 
                               repair.estimatedCost ? `~€${(repair.estimatedCost / 100).toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDetailDialogOpen(false);
                                  setLocation(`/reseller/repairs/${repair.id}`);
                                }}
                                data-testid={`button-view-repair-${repair.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Paginazione */}
                    {repairsData.total > 20 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Pagina {repairsPage + 1} di {Math.ceil(repairsData.total / 20)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRepairsPage(p => Math.max(0, p - 1))}
                            disabled={repairsPage === 0}
                            data-testid="button-prev-repairs-page"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Precedente
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRepairsPage(p => p + 1)}
                            disabled={(repairsPage + 1) * 20 >= repairsData.total}
                            data-testid="button-next-repairs-page"
                          >
                            Successiva
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>Impossibile caricare i dati del centro</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog per reset password */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex flex-wrap items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reimposta Password
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Inserisci la nuova password per il centro <strong>{centerToResetPassword?.name}</strong>.</p>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nuova Password</Label>
                  <Input
                    id="newPassword"
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri"
                    data-testid="input-new-password"
                  />
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-sm text-destructive">La password deve contenere almeno 6 caratteri</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCenterToResetPassword(null);
              setNewPassword("");
            }}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmResetPassword}
              disabled={newPassword.length < 6 || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Aggiornamento..." : "Aggiorna Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
