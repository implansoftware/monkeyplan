import { useState, useEffect } from "react";
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
import { Network, Search, Users, Building, Store, ShoppingCart, Package, TrendingUp, DollarSign, Eye, Plus, Pencil, Trash2, Loader2, Copy, KeyRound, User as UserIcon, FileText, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const WIZARD_STEPS = [
  { id: 1, title: "Credenziali", icon: KeyRound },
  { id: 2, title: "Info Base", icon: UserIcon },
  { id: 3, title: "Dati Fiscali", icon: FileText },
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
        toast({ title: "Errore", description: "La password è obbligatoria", variant: "destructive" });
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
                Sub-Reseller
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestisci i tuoi rivenditori affiliati
              </p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-lg shadow-primary/25" data-testid="button-add-subreseller">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Sub-Reseller
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
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

        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Clienti Totali</p>
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

        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                <Building className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Centri Riparazione</p>
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

        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
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
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
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
                    placeholder="Cerca per nome, email o username..."
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
                  <p className="text-lg font-semibold">Nessun sub-reseller trovato</p>
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
                        <TableHead className="font-semibold">Nome</TableHead>
                        <TableHead className="font-semibold">Email</TableHead>
                        <TableHead className="font-semibold">Telefono</TableHead>
                        <TableHead className="font-semibold">Categoria</TableHead>
                        <TableHead className="text-center font-semibold">Clienti</TableHead>
                        <TableHead className="text-center font-semibold">Centri</TableHead>
                        <TableHead className="font-semibold">Stato</TableHead>
                        <TableHead className="font-semibold">Data Creazione</TableHead>
                        <TableHead className="text-right font-semibold">Azioni</TableHead>
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
                              {reseller.isActive ? "Attivo" : "Inattivo"}
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
            <DialogTitle className="flex items-center gap-2 text-xl">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input 
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        data-testid="input-phone" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
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
                    <Label htmlFor="isActive">Attivo</Label>
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
                      <div className="flex items-center gap-2">
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="ragioneSociale">Ragione Sociale</Label>
                      <Input 
                        id="ragioneSociale"
                        value={formData.ragioneSociale}
                        onChange={(e) => setFormData(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                        data-testid="input-ragione-sociale" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partitaIva">Partita IVA</Label>
                      <Input 
                        id="partitaIva"
                        value={formData.partitaIva}
                        onChange={(e) => setFormData(prev => ({ ...prev, partitaIva: e.target.value }))}
                        data-testid="input-partita-iva" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                      <Input 
                        id="codiceFiscale"
                        value={formData.codiceFiscale}
                        onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                        data-testid="input-codice-fiscale" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="indirizzo">Indirizzo</Label>
                      <Input 
                        id="indirizzo"
                        value={formData.indirizzo}
                        onChange={(e) => setFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                        data-testid="input-indirizzo" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="citta">Città</Label>
                      <Input 
                        id="citta"
                        value={formData.citta}
                        onChange={(e) => setFormData(prev => ({ ...prev, citta: e.target.value }))}
                        data-testid="input-citta" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="cap">CAP</Label>
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
                      <Label htmlFor="codiceUnivoco">Codice SDI</Label>
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
                  {editingReseller ? "Salva Modifiche" : "Crea Sub-Reseller"}
                </Button>
              ) : (
                <Button onClick={nextStep} disabled={!canProceedToNextStep()} data-testid="button-next">
                  Avanti
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il sub-reseller "{deletingReseller?.fullName}"?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
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
          <DialogTitle className="flex items-center gap-2 text-xl">
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
              <div className="flex items-center gap-3">
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
                {data.isActive ? "Attivo" : "Inattivo"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Username</Label>
                <p className="text-sm font-medium">{data.username}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Telefono</Label>
                <p className="text-sm font-medium">{data.phone || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Badge variant="outline">
                  {categoryLabels[data.resellerCategory || "standard"] || data.resellerCategory}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data Creazione</Label>
                <p className="text-sm font-medium">
                  {format(new Date(data.createdAt), "dd MMMM yyyy", { locale: it })}
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
                  <FileText className="h-4 w-4 text-violet-600" />
                </div>
                Dati Fiscali
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ragione Sociale</Label>
                  <p className="text-sm font-medium">{data.ragioneSociale || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Partita IVA</Label>
                  <p className="text-sm font-medium">{data.partitaIva || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Codice Fiscale</Label>
                  <p className="text-sm font-medium">{data.codiceFiscale || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Codice Univoco (SDI)</Label>
                  <p className="text-sm font-medium">{data.codiceUnivoco || "-"}</p>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">PEC</Label>
                  <p className="text-sm font-medium">{data.pec || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10">
                  <Building className="h-4 w-4 text-amber-600" />
                </div>
                Indirizzo
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Via/Indirizzo</Label>
                  <p className="text-sm font-medium">{data.indirizzo || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Città</Label>
                  <p className="text-sm font-medium">{data.citta || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">CAP</Label>
                  <p className="text-sm font-medium">{data.cap || "-"}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Provincia</Label>
                  <p className="text-sm font-medium">{data.provincia || "-"}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                Statistiche
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.customersCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Clienti</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                    <Store className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{data.repairCentersCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Centri Riparazione</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-violet-600" />
                      <span className="text-xs text-muted-foreground">Prodotti</span>
                    </div>
                    <p className="text-lg font-bold">{ecommerce.productsPublished}/{ecommerce.productsAssigned}</p>
                    <p className="text-xs text-muted-foreground">pubblicati/assegnati</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      <span className="text-xs text-muted-foreground">Ordini</span>
                    </div>
                    <p className="text-lg font-bold">{ecommerce.totalOrders}</p>
                    {ecommerce.pendingOrders > 0 && (
                      <p className="text-xs text-amber-600">{ecommerce.pendingOrders} in attesa</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs text-muted-foreground">Fatturato</span>
                    </div>
                    <p className="text-lg font-bold">{formatPrice(ecommerce.totalRevenue)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Ultimo Ordine</span>
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
          <div className="text-center py-8 text-muted-foreground">
            Nessun dato disponibile
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-detail">
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
