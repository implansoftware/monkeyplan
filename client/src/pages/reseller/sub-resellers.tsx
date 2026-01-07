import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function SubResellers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("anagrafica");
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

  const { data: ecommerceData = [], isLoading: isLoadingEcommerce } = useQuery<SubResellerEcommerce[]>({
    queryKey: ["/api/reseller/sub-resellers/ecommerce"],
    enabled: activeTab === "ecommerce",
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

  const totalEcommerceRevenue = ecommerceData.reduce((acc, r) => acc + r.totalRevenue, 0);
  const totalEcommerceOrders = ecommerceData.reduce((acc, r) => acc + r.totalOrders, 0);

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Network className="h-6 w-6" />
            Sub-Reseller
          </h1>
          <p className="text-muted-foreground">
            Gestisci i tuoi rivenditori affiliati
          </p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-subreseller">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Sub-Reseller
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Totale Sub-Reseller</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-subresellers">
              {isLoading ? <Skeleton className="h-8 w-16" /> : subResellers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeResellers} attivi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Clienti Totali</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-customers">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              tra tutti i sub-reseller
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Centri Riparazione</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-centers">
              {isLoading ? <Skeleton className="h-8 w-16" /> : totalCenters}
            </div>
            <p className="text-xs text-muted-foreground">
              tra tutti i sub-reseller
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {activeTab === "ecommerce" ? "Fatturato Rete" : "Attivi"}
            </CardTitle>
            {activeTab === "ecommerce" ? (
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Network className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-resellers">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : activeTab === "ecommerce" ? (
                formatPrice(totalEcommerceRevenue)
              ) : (
                `${activeResellers}/${subResellers.length}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeTab === "ecommerce" 
                ? `${totalEcommerceOrders} ordini totali`
                : "sub-reseller attivi"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="anagrafica">
            <Users className="h-4 w-4 mr-2" />
            Anagrafica
          </TabsTrigger>
          <TabsTrigger value="ecommerce">
            <ShoppingCart className="h-4 w-4 mr-2" />
            E-commerce
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anagrafica">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Elenco Sub-Reseller
              </CardTitle>
              <CardDescription>
                Visualizza e gestisci i rivenditori affiliati alla tua rete
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per nome, email o username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredResellers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nessun sub-reseller trovato</p>
                  <p className="text-sm">
                    {searchQuery
                      ? "Prova a modificare i criteri di ricerca"
                      : "Non hai ancora rivenditori affiliati"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefono</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Clienti</TableHead>
                        <TableHead className="text-center">Centri</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data Creazione</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
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
                                onClick={() => handleOpenEdit(reseller)}
                                data-testid={`button-edit-${reseller.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
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
        </TabsContent>

        <TabsContent value="ecommerce">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance E-commerce Sub-Reseller
              </CardTitle>
              <CardDescription>
                Monitora le vendite e il catalogo dei tuoi sub-reseller
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEcommerce ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : ecommerceData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nessun dato e-commerce</p>
                  <p className="text-sm">
                    I tuoi sub-reseller non hanno ancora attività e-commerce
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sub-Reseller</TableHead>
                        <TableHead className="text-center">Prodotti Assegnati</TableHead>
                        <TableHead className="text-center">Prodotti Pubblicati</TableHead>
                        <TableHead className="text-center">Ordini Totali</TableHead>
                        <TableHead className="text-center">Ordini Pendenti</TableHead>
                        <TableHead className="text-right">Fatturato</TableHead>
                        <TableHead>Ultimo Ordine</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ecommerceData.map((data) => (
                        <TableRow key={data.resellerId} data-testid={`row-ecommerce-${data.resellerId}`}>
                          <TableCell className="font-medium">
                            {data.resellerName}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              <Package className="h-3 w-3 mr-1" />
                              {data.productsAssigned}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={data.productsPublished > 0 ? "default" : "secondary"}>
                              <Store className="h-3 w-3 mr-1" />
                              {data.productsPublished}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              <ShoppingCart className="h-3 w-3 mr-1" />
                              {data.totalOrders}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {data.pendingOrders > 0 ? (
                              <Badge variant="default">
                                {data.pendingOrders}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatPrice(data.totalRevenue)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {data.lastOrderDate 
                              ? format(new Date(data.lastOrderDate), "dd MMM yyyy", { locale: it })
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/shop/${data.resellerId}`}>
                              <Button size="sm" variant="outline" data-testid={`button-view-shop-${data.resellerId}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                Shop
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingReseller(null);
          resetWizard();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-subreseller-form">
          <DialogHeader>
            <DialogTitle>{editingReseller ? "Modifica Sub-Reseller" : "Nuovo Sub-Reseller"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              {currentSteps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = step.id === wizardStep;
                const isPast = currentSteps.findIndex(s => s.id === wizardStep) > idx;
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

  if (!open) return null;

  const data = details || reseller;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="dialog-subreseller-detail">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Dettagli Sub-Reseller
          </DialogTitle>
          <DialogDescription>
            Informazioni complete del sub-reseller
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{data.fullName}</h3>
                <p className="text-sm text-muted-foreground">{data.email}</p>
              </div>
              <Badge variant={data.isActive ? "default" : "secondary"}>
                {data.isActive ? "Attivo" : "Inattivo"}
              </Badge>
            </div>

            <Separator />

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

            <Separator />

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
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

            <Separator />

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Building className="h-4 w-4" />
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

            <Separator />

            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Statistiche
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data.customersCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Clienti</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{data.repairCentersCount || 0}</p>
                      <p className="text-xs text-muted-foreground">Centri Riparazione</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
