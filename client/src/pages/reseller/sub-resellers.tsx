import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Network, Search, Users, Building, Store, ShoppingCart, Package, TrendingUp, DollarSign, Eye, Plus, Pencil, Trash2, Loader2, Copy, KeyRound, User as UserIcon, FileText, Check, ChevronLeft, ChevronRight, Camera, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";

const WIZARD_STEPS = [
  { id: 1, title: t("admin.resellers.credentials"), icon: KeyRound },
  { id: 2, title: t("admin.resellers.basicInfo"), icon: UserIcon },
  { id: 3, title: t("profile.fiscalInfo"), icon: FileText },
];

interface SubReseller {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phone: string | null;
  resellerCategory: string | null;
  isActive: boolean;
  createdAt: string;
  customersCount: number;
  repairCentersCount: number;
  partitaIva?: string | null;
  ragioneSociale?: string | null;
  codiceFiscale?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  pec?: string | null;
  codiceUnivoco?: string | null;
  hasAutonomousInvoicing?: boolean;
  logoUrl?: string | null;
}

interface SubResellerEcommerce {
  resellerId: string;
  resellerName: string;
  totalOrders: number;
  totalRevenue: number;
  productsAssigned: number;
  productsPublished: number;
  pendingOrders: number;
  lastOrderDate: string | null;
}

interface SubResellerFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  resellerCategory: string;
  isActive: boolean;
  partitaIva: string;
  ragioneSociale: string;
  codiceFiscale: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  pec: string;
  codiceUnivoco: string;
  hasAutonomousInvoicing: boolean;
}

const categoryLabels: Record<string, string> = {
  standard: "Standard",
  franchising: "Franchising",
  gdo: "GDO",
};

const initialFormData: SubResellerFormData = {
  username: "",
  email: "",
  password: "",
  fullName: "",
  phone: "",
  resellerCategory: "standard",
  isActive: true,
  partitaIva: "",
  ragioneSociale: "",
  codiceFiscale: "",
  indirizzo: "",
  citta: "",
  cap: "",
  provincia: "",
  pec: "",
  codiceUnivoco: "",
  hasAutonomousInvoicing: false,
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function SubResellers() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<SubReseller | null>(null);
  const [deletingReseller, setDeletingReseller] = useState<SubReseller | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingReseller, setViewingReseller] = useState<SubReseller | null>(null);
  const [formData, setFormData] = useState<SubResellerFormData>(initialFormData);
  const [useParentData, setUseParentData] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const currentSteps = editingReseller 
    ? WIZARD_STEPS.filter(s => s.id !== 1)
    : WIZARD_STEPS;
  
  const currentStepIndex = currentSteps.findIndex(s => s.id === wizardStep);
  const progressPercent = currentStepIndex >= 0 ? ((currentStepIndex + 1) / currentSteps.length) * 100 : 0;

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const canProceedToNextStep = () => {
    switch (wizardStep) {
      case 1: 
        return formData.username.trim().length >= 3 && 
               formData.password.length >= 6;
      case 2: 
        return formData.fullName.trim() !== '' && 
               formData.email.trim() !== '' && 
               isValidEmail(formData.email);
      case 3: 
        return true;
      default: 
        return true;
    }
  };

  const nextStep = () => {
    if (wizardStep === 1) setWizardStep(2);
    else if (wizardStep === 2) setWizardStep(3);
  };

  const prevStep = () => {
    if (wizardStep === 3) setWizardStep(2);
    else if (wizardStep === 2 && !editingReseller) setWizardStep(1);
  };

  const isLastStep = wizardStep === 3;
  const isFirstStep = editingReseller ? wizardStep === 2 : wizardStep === 1;

  const resetWizard = () => {
    setWizardStep(1);
    setFormData(initialFormData);
    setUseParentData(false);
  };

  const { data: subResellers = [], isLoading } = useQuery<SubReseller[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  useEffect(() => {
    if (useParentData && currentUser && !editingReseller) {
      setFormData(prev => ({
        ...prev,
        partitaIva: (currentUser as any).partitaIva || "",
        ragioneSociale: (currentUser as any).ragioneSociale || "",
        codiceFiscale: (currentUser as any).codiceFiscale || "",
        indirizzo: (currentUser as any).indirizzo || "",
        citta: (currentUser as any).citta || "",
        cap: (currentUser as any).cap || "",
        provincia: (currentUser as any).provincia || "",
        pec: (currentUser as any).pec || "",
        codiceUnivoco: (currentUser as any).codiceUnivoco || "",
      }));
    } else if (!useParentData && !editingReseller) {
      setFormData(prev => ({
        ...prev,
        partitaIva: "",
        ragioneSociale: "",
        codiceFiscale: "",
        indirizzo: "",
        citta: "",
        cap: "",
        provincia: "",
        pec: "",
        codiceUnivoco: "",
  hasAutonomousInvoicing: false,
      }));
    }
  }, [useParentData, currentUser, editingReseller]);

  const createMutation = useMutation({
    mutationFn: async (data: SubResellerFormData) => {
      const response = await apiRequest("POST", "/api/reseller/sub-resellers", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-resellers"] });
      toast({ title: "Sub-reseller creato con successo" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubResellerFormData> }) => {
      const response = await apiRequest("PATCH", `/api/reseller/sub-resellers/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-resellers"] });
      toast({ title: "Sub-reseller aggiornato con successo" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/reseller/sub-resellers/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-resellers"] });
      toast({ title: "Sub-reseller eliminato con successo" });
      setDeleteDialogOpen(false);
      setDeletingReseller(null);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingReseller(null);
    resetWizard();
    setDialogOpen(true);
  };

  const handleOpenEdit = (reseller: SubReseller) => {
    setEditingReseller(reseller);
    setUseParentData(false);
    setWizardStep(2);
    setFormData({
      username: reseller.username,
      email: reseller.email,
      password: "",
      fullName: reseller.fullName,
      phone: reseller.phone || "",
      resellerCategory: reseller.resellerCategory || "standard",
      isActive: reseller.isActive,
      partitaIva: reseller.partitaIva || "",
      ragioneSociale: reseller.ragioneSociale || "",
      codiceFiscale: reseller.codiceFiscale || "",
      indirizzo: reseller.indirizzo || "",
      citta: reseller.citta || "",
      cap: reseller.cap || "",
      provincia: reseller.provincia || "",
      pec: reseller.pec || "",
      codiceUnivoco: reseller.codiceUnivoco || "",
      hasAutonomousInvoicing: reseller.hasAutonomousInvoicing || false,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (reseller: SubReseller) => {
    setDeletingReseller(reseller);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingReseller(null);
    setFormData(initialFormData);
    setUseParentData(false);
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato non valido",
        description: "Il file deve essere in formato JPEG, PNG o WebP.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("profile.fileTooLarge"),
        description: "Il file non può superare i 2MB.",
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async (subResellerId: string) => {
    if (!logoFile) return;
    
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);
      
      const res = await fetch(`/api/sub-resellers/${subResellerId}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-resellers"] });
      setLogoFile(null);
      setLogoPreview(null);
      toast({
        title: t("profile.logoUploaded"),
        description: "Il logo è stato aggiornato con successo.",
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Impossibile caricare il logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogo = async (subResellerId: string) => {
    try {
      const res = await fetch(`/api/sub-resellers/${subResellerId}/logo`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      await queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-resellers"] });
      toast({
        title: t("profile.logoRemoved"),
        description: "Il logo è stato rimosso con successo.",
      });
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.message || "Impossibile rimuovere il logo.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (editingReseller) {
      const updateData: Partial<SubResellerFormData> = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        resellerCategory: formData.resellerCategory,
        isActive: formData.isActive,
        partitaIva: formData.partitaIva,
        ragioneSociale: formData.ragioneSociale,
        codiceFiscale: formData.codiceFiscale,
        indirizzo: formData.indirizzo,
        citta: formData.citta,
        cap: formData.cap,
        provincia: formData.provincia,
        pec: formData.pec,
        codiceUnivoco: formData.codiceUnivoco,
        hasAutonomousInvoicing: formData.hasAutonomousInvoicing,
      };
      if (formData.password) {
        updateData.password = formData.password;
      }
      updateMutation.mutate({ id: editingReseller.id, data: updateData });
    } else {
      if (!formData.password) {
        toast({ title: t("common.error"), description: "La password è obbligatoria", variant: "destructive" });
        return;
      }
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingReseller) {
      deleteMutation.mutate(deletingReseller.id);
    }
  };

  const filteredResellers = subResellers.filter((reseller) => {
    const matchesSearch =
      reseller.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reseller.username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalCustomers = subResellers.reduce((acc, r) => acc + r.customersCount, 0);
  const totalCenters = subResellers.reduce((acc, r) => acc + r.repairCentersCount, 0);
  const activeResellers = subResellers.filter((r) => r.isActive).length;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Network className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">{t("roles.subReseller")}</h1>
              <p className="text-sm text-white/80">
                Gestisci i tuoi rivenditori affiliati
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg" data-testid="button-add-subreseller">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Sub-Reseller
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Totale Sub-Reseller</p>
                <div className="text-2xl font-bold" data-testid="text-total-subresellers">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : subResellers.length}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pl-16">
              {activeResellers} attivi
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{t("dashboard.totalCustomers")}</p>
                <div className="text-2xl font-bold" data-testid="text-total-customers">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : totalCustomers}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pl-16">
              tra tutti i sub-reseller
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Building className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{t("sidebar.items.repairCentersShort")}</p>
                <div className="text-2xl font-bold" data-testid="text-total-centers">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : totalCenters}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pl-16">
              tra tutti i sub-reseller
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10">
                <Network className="h-6 w-6 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Attivi</p>
                <div className="text-2xl font-bold" data-testid="text-active-resellers">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${activeResellers}/${subResellers.length}`
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 pl-16">
              sub-reseller attivi
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
          <Card className="shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                    <Store className="h-5 w-5 text-primary" />
                    Elenco Sub-Reseller
                  </CardTitle>
                  <CardDescription>
                    Visualizza e gestisci i rivenditori affiliati alla tua rete
                  </CardDescription>
                </div>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.resellers.searchReseller")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-muted/30"
                    data-testid="input-search"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : filteredResellers.length === 0 ? (
                <div className="text-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mx-auto mb-4">
                    <Network className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold">{t("admin.resellers.noSubResellers")}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? "Prova a modificare i criteri di ricerca"
                      : "Non hai ancora rivenditori affiliati"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleOpenCreate} className="mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi il primo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold">{t("common.name")}</TableHead>
                        <TableHead className="font-semibold">{t("common.email")}</TableHead>
                        <TableHead className="font-semibold">{t("common.phone")}</TableHead>
                        <TableHead className="font-semibold">{t("common.category")}</TableHead>
                        <TableHead className="text-center font-semibold">{t("customers.title")}</TableHead>
                        <TableHead className="text-center font-semibold">Centri</TableHead>
                        <TableHead className="font-semibold">{t("common.status")}</TableHead>
                        <TableHead className="font-semibold">{t("common.creationDate")}</TableHead>
                        <TableHead className="text-right font-semibold">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResellers.map((reseller) => (
                        <TableRow key={reseller.id} data-testid={`row-subreseller-${reseller.id}`}>
                          <TableCell className="font-medium" data-testid={`text-name-${reseller.id}`}>
                            {reseller.fullName}
                          </TableCell>
                          <TableCell data-testid={`text-email-${reseller.id}`}>
                            {reseller.email}
                          </TableCell>
                          <TableCell data-testid={`text-phone-${reseller.id}`}>
                            {reseller.phone || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" data-testid={`badge-category-${reseller.id}`}>
                              {categoryLabels[reseller.resellerCategory || "standard"] || reseller.resellerCategory}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center" data-testid={`text-customers-${reseller.id}`}>
                            <Badge variant="secondary">
                              <Users className="h-3 w-3 mr-1" />
                              {reseller.customersCount}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center" data-testid={`text-centers-${reseller.id}`}>
                            <Badge variant="secondary">
                              <Building className="h-3 w-3 mr-1" />
                              {reseller.repairCentersCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={reseller.isActive ? "default" : "secondary"}
                              data-testid={`badge-status-${reseller.id}`}
                            >
                              {reseller.isActive ? t("common.active") : t("common.inactive")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground" data-testid={`text-date-${reseller.id}`}>
                            {format(new Date(reseller.createdAt), "dd MMM yyyy", { locale: it })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-600"
                                onClick={() => {
                                  setViewingReseller(reseller);
                                  setDetailDialogOpen(true);
                                }}
                                data-testid={`button-view-${reseller.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600"
                                onClick={() => handleOpenEdit(reseller)}
                                data-testid={`button-edit-${reseller.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-lg hover:bg-destructive/10"
                                onClick={() => handleOpenDelete(reseller)}
                                data-testid={`button-delete-${reseller.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingReseller(null);
          resetWizard();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-subreseller-form">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex flex-wrap items-center gap-2 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {editingReseller ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              {editingReseller ? "Modifica Sub-Reseller" : "Nuovo Sub-Reseller"}
            </DialogTitle>
            <DialogDescription>
              {editingReseller ? "Aggiorna le informazioni del sub-reseller" : "Compila i dati per creare un nuovo sub-reseller"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 mb-2 px-2">
              {currentSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = step.id === wizardStep;
                const isPast = currentSteps.findIndex(s => s.id === wizardStep) > idx;
                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div 
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all duration-200 shadow-sm ${
                        isActive ? 'bg-primary border-primary text-primary-foreground scale-105' : 
                        isPast ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600' : 
                        'bg-muted/50 border-muted-foreground/20 text-muted-foreground'
                      }`}
                    >
                      {isPast ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <span className={`text-xs mt-1.5 text-center font-medium ${isActive ? 'text-primary' : isPast ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <Progress value={progressPercent} className="h-1.5 rounded-full" />

            <div className="min-h-[300px]">
              {wizardStep === 1 && !editingReseller && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Inserisci le credenziali di accesso per il nuovo sub-reseller.</p>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input 
                      id="username" 
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      data-testid="input-username" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password * (min. 6 caratteri)</Label>
                    <Input 
                      id="password" 
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      data-testid="input-password" 
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Informazioni di base del sub-reseller.</p>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo *</Label>
                    <Input 
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      data-testid="input-fullname" 
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t("common.phone")}</Label>
                      <Input 
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        data-testid="input-phone" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">{t("common.category")}</Label>
                      <Select
                        value={formData.resellerCategory}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, resellerCategory: value }))}
                      >
                        <SelectTrigger data-testid="select-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="franchising">Franchising</SelectItem>
                          <SelectItem value="gdo">GDO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="isActive">{t("common.active")}</Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      data-testid="switch-active"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="hasAutonomousInvoicing">Fatturazione Autonoma</Label>
                      <span className="text-xs text-muted-foreground">
                        Se attivo, il sub-reseller emette fatture proprie
                      </span>
                    </div>
                    <Switch
                      id="hasAutonomousInvoicing"
                      checked={formData.hasAutonomousInvoicing}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAutonomousInvoicing: checked }))}
                      data-testid="switch-autonomous-invoicing"
                    />
                  </div>

                  {/* Logo Section - Only show when editing */}
                  {editingReseller && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label className="text-base font-medium">{t("profile.companyLogo")}</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Carica il logo del sub-reseller (JPEG, PNG o WebP, max 2MB)
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-start gap-4">
                        <Avatar className="h-16 w-16 rounded-xl border-2 border-dashed border-muted-foreground/25">
                          {(logoPreview || editingReseller.logoUrl) ? (
                            <AvatarImage 
                              src={logoPreview || editingReseller.logoUrl || ''} 
                              alt="Logo" 
                              className="object-contain"
                            />
                          ) : null}
                          <AvatarFallback className="rounded-xl bg-muted">
                            <Building className="h-6 w-6 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 space-y-2">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleLogoFileChange}
                            className="hidden"
                            id="logo-upload-sub-reseller"
                            data-testid="input-logo-file-subreseller"
                          />
                          
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('logo-upload-sub-reseller')?.click()}
                              data-testid="button-select-logo-subreseller"
                            >
                              <Camera className="h-4 w-4 mr-2" />{t("common.select")}</Button>
                            
                            {logoFile && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleUploadLogo(editingReseller.id)}
                                disabled={isUploadingLogo}
                                data-testid="button-upload-logo-subreseller"
                              >
                                {isUploadingLogo ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                Carica
                              </Button>
                            )}
                            
                            {editingReseller.logoUrl && !logoFile && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteLogo(editingReseller.id)}
                                data-testid="button-delete-logo-subreseller"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />{t("profile.removeLogo")}</Button>
                            )}
                          </div>
                          
                          {logoFile && (
                            <p className="text-xs text-muted-foreground">
                              File: {logoFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {editingReseller && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label htmlFor="password">Password (lascia vuoto per mantenere)</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Lascia vuoto per mantenere"
                        data-testid="input-password" 
                      />
                    </div>
                  )}
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Dati fiscali e fatturazione (opzionali).</p>
                    {!editingReseller && (
                      <div className="flex flex-wrap items-center gap-2">
                        <Checkbox
                          id="useParentData"
                          checked={useParentData}
                          onCheckedChange={(checked) => setUseParentData(checked === true)}
                          data-testid="checkbox-use-parent-data"
                        />
                        <Label htmlFor="useParentData" className="text-xs font-normal cursor-pointer flex items-center gap-1">
                          <Copy className="h-3 w-3" />
                          Copia i miei dati
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="ragioneSociale">{t("auth.companyName")}</Label>
                      <Input 
                        id="ragioneSociale"
                        value={formData.ragioneSociale}
                        onChange={(e) => setFormData(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                        data-testid="input-ragione-sociale" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partitaIva">{t("auth.vatNumber")}</Label>
                      <Input 
                        id="partitaIva"
                        value={formData.partitaIva}
                        onChange={(e) => setFormData(prev => ({ ...prev, partitaIva: e.target.value }))}
                        data-testid="input-partita-iva" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="codiceFiscale">{t("common.taxCode")}</Label>
                      <Input 
                        id="codiceFiscale"
                        value={formData.codiceFiscale}
                        onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                        data-testid="input-codice-fiscale" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="indirizzo">{t("common.address")}</Label>
                      <Input 
                        id="indirizzo"
                        value={formData.indirizzo}
                        onChange={(e) => setFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                        data-testid="input-indirizzo" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="citta">{t("common.city")}</Label>
                      <Input 
                        id="citta"
                        value={formData.citta}
                        onChange={(e) => setFormData(prev => ({ ...prev, citta: e.target.value }))}
                        data-testid="input-citta" 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="cap">{t("common.zip")}</Label>
                        <Input 
                          id="cap"
                          value={formData.cap}
                          onChange={(e) => setFormData(prev => ({ ...prev, cap: e.target.value }))}
                          data-testid="input-cap" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provincia">Prov.</Label>
                        <Input 
                          id="provincia"
                          maxLength={2}
                          value={formData.provincia}
                          onChange={(e) => setFormData(prev => ({ ...prev, provincia: e.target.value }))}
                          placeholder="XX"
                          data-testid="input-provincia" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codiceUnivoco">{t("common.sdi")}</Label>
                      <Input 
                        id="codiceUnivoco"
                        maxLength={7}
                        value={formData.codiceUnivoco}
                        onChange={(e) => setFormData(prev => ({ ...prev, codiceUnivoco: e.target.value.toUpperCase() }))}
                        placeholder="7 caratteri"
                        data-testid="input-codice-univoco" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pec">{t("common.pec")}</Label>
                      <Input 
                        id="pec"
                        type="email"
                        value={formData.pec}
                        onChange={(e) => setFormData(prev => ({ ...prev, pec: e.target.value }))}
                        placeholder="email@pec.it"
                        data-testid="input-pec" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={isFirstStep ? handleCloseDialog : prevStep}
                data-testid="button-prev"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isFirstStep ? 'Annulla' : 'Indietro'}
              </Button>
              
              {isLastStep ? (
                <Button onClick={handleSubmit} disabled={isPending} data-testid="button-submit">
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingReseller ? t("profile.saveChanges") : "Crea Sub-Reseller"}
                </Button>
              ) : (
                <Button onClick={nextStep} disabled={!canProceedToNextStep()} data-testid="button-next">{t("common.next")}<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.teams.deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il sub-reseller "{deletingReseller?.fullName}"?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SubResellerDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        reseller={viewingReseller}
      />
    </div>
  );
}

interface SubResellerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: SubReseller | null;
}

const SubResellerDetailDialog = ({ open, onOpenChange, reseller }: SubResellerDetailDialogProps) => {
  const { data: details, isLoading } = useQuery<SubReseller>({
    queryKey: ['/api/reseller/sub-resellers', reseller?.id],
    queryFn: async () => {
      if (!reseller?.id) return null;
      const res = await fetch(`/api/reseller/sub-resellers/${reseller.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch sub-reseller details');
      return res.json();
    },
    enabled: open && !!reseller?.id,
  });

  const { data: ecommerceData } = useQuery<SubResellerEcommerce[]>({
    queryKey: ['/api/reseller/sub-resellers/ecommerce'],
    enabled: open && !!reseller?.id,
  });

  const ecommerce = ecommerceData?.find(e => e.resellerId === reseller?.id);

  if (!open) return null;

  const data = details || reseller;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-subreseller-detail">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <Eye className="h-5 w-5" />
            </div>
            Dettagli Sub-Reseller
          </DialogTitle>
          <DialogDescription>
            Informazioni complete del sub-reseller
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : data ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-lg">
                  {data.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{data.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{data.email}</p>
                </div>
              </div>
              <Badge 
                variant={data.isActive ? "default" : "secondary"}
                className={data.isActive ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
              >
                {data.isActive ? t("common.active") : t("common.inactive")}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("admin.common.usernameLabel")}</Label>
                <p className="text-sm font-medium">{data.username}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("common.phone")}</Label>
                <p className="text-sm font-medium">{data.phone || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("common.category")}</Label>
                <Badge variant="outline">
                  {categoryLabels[data.resellerCategory || "standard"] || data.resellerCategory}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t("common.creationDate")}</Label>
                <p className="text-sm font-medium">
                  {format(new Date(data.createdAt), "dd MMMM yyyy", { locale: it })}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileText className="h-4 w-4 text-violet-600" />
                </div>{t("profile.fiscalInfo")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("auth.companyName")}</Label>
                  <p className="text-sm font-medium">{data.ragioneSociale || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("auth.vatNumber")}</Label>
                  <p className="text-sm font-medium">{data.partitaIva || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("common.taxCode")}</Label>
                  <p className="text-sm font-medium">{data.codiceFiscale || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Codice Univoco (SDI)</Label>
                  <p className="text-sm font-medium">{data.codiceUnivoco || "-"}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("common.pec")}</Label>
                  <p className="text-sm font-medium">{data.pec || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Building className="h-4 w-4 text-amber-600" />
                </div>{t("common.address")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Via/Indirizzo</Label>
                  <p className="text-sm font-medium">{data.indirizzo || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("common.city")}</Label>
                  <p className="text-sm font-medium">{data.citta || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("common.zip")}</Label>
                  <p className="text-sm font-medium">{data.cap || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t("common.province")}</Label>
                  <p className="text-sm font-medium">{data.provincia || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>{t("dashboard.statistics")}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.customersCount || 0}</p>
                    <p className="text-xs text-muted-foreground">{t("customers.title")}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Store className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.repairCentersCount || 0}</p>
                    <p className="text-xs text-muted-foreground">{t("sidebar.items.repairCentersShort")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2 text-sm">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </div>
                  Performance E-commerce
                </h4>
                {ecommerce && (
                  <Link href={`/shop/${reseller?.id}`}>
                    <Button size="sm" variant="outline" data-testid="button-view-shop">
                      <Eye className="h-4 w-4 mr-1" />
                      Vedi Shop
                    </Button>
                  </Link>
                )}
              </div>
              {ecommerce ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-violet-600" />
                      <span className="text-xs text-muted-foreground">{t("products.title")}</span>
                    </div>
                    <p className="text-lg font-bold">{ecommerce.productsPublished}/{ecommerce.productsAssigned}</p>
                    <p className="text-xs text-muted-foreground">pubblicati/assegnati</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">{t("common.orders")}</span>
                    </div>
                    <p className="text-lg font-bold">{ecommerce.totalOrders}</p>
                    {ecommerce.pendingOrders > 0 && (
                      <p className="text-xs text-amber-600">{ecommerce.pendingOrders} in attesa</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">Fatturato</span>
                    </div>
                    <p className="text-lg font-bold">{formatPrice(ecommerce.totalRevenue)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{t("customers.lastOrder")}</span>
                    </div>
                    <p className="text-sm font-medium">
                      {ecommerce.lastOrderDate 
                        ? format(new Date(ecommerce.lastOrderDate), "dd MMM yyyy", { locale: it })
                        : "Nessun ordine"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessuna attività e-commerce</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">{t("common.noData")}</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-detail">{t("common.close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
