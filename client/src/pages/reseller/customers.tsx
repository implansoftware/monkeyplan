import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Users, Plus, Search, Mail, Building2, Wrench, Pencil, X, Check, Trash2, Phone, UserCheck, Eye, ChevronRight, TrendingUp, Filter } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { User, RepairOrder, RepairCenter } from "@shared/schema";
import { CustomerBranchManager } from "@/components/CustomerBranchManager";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { useToast } from "@/hooks/use-toast";
import { ActionGuard } from "@/components/permission-guard";

type CustomerWithRepairCenters = User & {
  assignedRepairCenters?: RepairCenter[];
};

type FilterType = "all" | "active" | "inactive";

export default function ResellerCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithRepairCenters | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<CustomerWithRepairCenters | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    isActive: true,
    repairCenterIds: [] as string[],
  });
  const { toast } = useToast();

  const { data: allUsers = [], isLoading } = useQuery<CustomerWithRepairCenters[]>({
    queryKey: ["/api/reseller/customers"],
  });

  const { data: allRepairs = [] } = useQuery<RepairOrder[]>({
    queryKey: ["/api/repair-orders"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: subResellers = [] } = useQuery<User[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  const hasSubResellers = subResellers.length > 0;

  const getSubResellerName = (subResellerId: string | null | undefined) => {
    if (!subResellerId) return null;
    const subReseller = subResellers.find(sr => sr.id === subResellerId);
    return subReseller?.fullName || null;
  };

  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: string; updates: typeof editForm }) => {
      return await apiRequest("PATCH", `/api/reseller/customers/${data.id}`, data.updates);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
      toast({ title: "Cliente aggiornato con successo" });
      setIsEditing(false);
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await apiRequest("DELETE", `/api/reseller/customers/${customerId}`);
      return response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
      toast({ title: "Cliente eliminato con successo" });
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: async (error: any) => {
      const errorMsg = error.message || "";
      const jsonMatch = errorMsg.match(/^\d+:\s*(.+)$/);
      if (jsonMatch) {
        try {
          const errorData = JSON.parse(jsonMatch[1]);
          if (errorData.error === "ACTIVE_REPAIRS") {
            toast({ 
              title: "Impossibile eliminare il cliente", 
              description: errorData.message,
              variant: "destructive" 
            });
            return;
          }
        } catch {
        }
      }
      toast({ title: "Errore", description: errorMsg, variant: "destructive" });
    },
  });

  const handleDeleteClick = (customer: CustomerWithRepairCenters) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomerMutation.mutate(customerToDelete.id);
    }
  };

  const customers = allUsers.filter(user => user.role === "customer");

  const handleCustomerCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/customers"] });
    setDialogOpen(false);
  };

  const startEditing = (customer: CustomerWithRepairCenters) => {
    setEditForm({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone || "",
      isActive: customer.isActive,
      repairCenterIds: customer.assignedRepairCenters?.map(rc => rc.id) || [],
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveEditing = () => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({
        id: selectedCustomer.id,
        updates: editForm,
      });
    }
  };

  const toggleRepairCenter = (centerId: string) => {
    setEditForm(prev => ({
      ...prev,
      repairCenterIds: prev.repairCenterIds.includes(centerId)
        ? prev.repairCenterIds.filter(id => id !== centerId)
        : [...prev.repairCenterIds, centerId],
    }));
  };

  const getCustomerRepairs = (customerId: string) => {
    return allRepairs.filter(repair => repair.customerId === customerId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">In attesa</Badge>;
      case "in_progress": return <Badge>In lavorazione</Badge>;
      case "completed": return <Badge variant="outline">Completata</Badge>;
      case "delivered": return <Badge variant="outline">Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeCustomers = customers.filter(c => c.isActive).length;
  const inactiveCustomers = customers.filter(c => !c.isActive).length;
  const totalRepairs = allRepairs.length;

  const filteredCustomers = customers
    .filter((customer) => {
      if (activeFilter === "active") return customer.isActive;
      if (activeFilter === "inactive") return !customer.isActive;
      return true;
    })
    .filter((customer) =>
      customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-6" data-testid="page-reseller-customers">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Clienti</h1>
                <p className="text-sm text-white/80">
                  Gestisci la tua base clienti
                </p>
              </div>
            </div>
          </div>
          <ActionGuard module="customers" action="create">
            <Button onClick={() => setDialogOpen(true)} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg" data-testid="button-new-customer">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Cliente
            </Button>
            <CustomerWizardDialog 
              open={dialogOpen} 
              onOpenChange={setDialogOpen}
              onSuccess={handleCustomerCreated}
            />
          </ActionGuard>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Totale Clienti</p>
                <p className="text-3xl font-bold tabular-nums">{customers.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">+12% questo mese</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Clienti Attivi</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{activeCustomers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {customers.length > 0 ? Math.round((activeCustomers / customers.length) * 100) : 0}% del totale
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Riparazioni Totali</p>
                <p className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{totalRepairs}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Media {customers.length > 0 ? (totalRepairs / customers.length).toFixed(1) : 0} per cliente
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Wrench className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">Elenco Clienti</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {filteredCustomers.length} risultati
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={activeFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("all")}
                >
                  Tutti
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{customers.length}</Badge>
                </Button>
                <Button
                  variant={activeFilter === "active" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("active")}
                >
                  Attivi
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{activeCustomers}</Badge>
                </Button>
                <Button
                  variant={activeFilter === "inactive" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("inactive")}
                >
                  Inattivi
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{inactiveCustomers}</Badge>
                </Button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Nessun cliente trovato</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery ? "Prova a modificare i criteri di ricerca" : "Inizia aggiungendo il tuo primo cliente"}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="pl-6 w-[250px]">Cliente</TableHead>
                    <TableHead>Contatti</TableHead>
                    {hasSubResellers && <TableHead>Sub-Reseller</TableHead>}
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-center">Riparazioni</TableHead>
                    <TableHead className="pr-6 text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer, index) => {
                    const customerRepairs = getCustomerRepairs(customer.id);
                    const subResellerName = getSubResellerName(customer.subResellerId);
                    return (
                      <TableRow 
                        key={customer.id} 
                        data-testid={`row-customer-${customer.id}`}
                        className={`group ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <TableCell className="pl-6 relative">
                          <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${customer.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          <div>
                            <p className="font-medium" data-testid={`text-name-${customer.id}`}>
                              {customer.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              @{customer.username}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[200px]">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        {hasSubResellers && (
                          <TableCell>
                            {subResellerName ? (
                              <Badge variant="outline" className="font-normal" data-testid={`badge-sub-reseller-${customer.id}`}>
                                {subResellerName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          {customer.isActive ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 font-normal">
                              Attivo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-normal">Inattivo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-normal tabular-nums" data-testid={`badge-repairs-${customer.id}`}>
                            {customerRepairs.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Link href={`/reseller/customers/${customer.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                data-testid={`button-view-${customer.id}`}
                              >
                                Dettagli
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </Link>
                            <ActionGuard module="customers" action="delete">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteClick(customer)}
                                title="Elimina cliente"
                                data-testid={`button-delete-${customer.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ActionGuard>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => { setSelectedCustomer(null); setIsEditing(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle>{selectedCustomer.fullName}</DialogTitle>
                {!isEditing && (
                  <ActionGuard module="customers" action="update">
                    <Button variant="outline" size="sm" onClick={() => startEditing(selectedCustomer)} data-testid="button-edit-customer">
                      <Pencil className="h-4 w-4 mr-1" />
                      Modifica
                    </Button>
                  </ActionGuard>
                )}
              </div>
            </DialogHeader>
            
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-fullName">Nome Completo</Label>
                    <Input
                      id="edit-fullName"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      data-testid="input-edit-fullName"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      data-testid="input-edit-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Telefono</Label>
                    <Input
                      id="edit-phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      data-testid="input-edit-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={editForm.isActive}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, isActive: checked }))}
                        data-testid="switch-edit-isActive"
                      />
                      <span className="text-sm">{editForm.isActive ? "Attivo" : "Inattivo"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Label className="flex items-center gap-2 mb-3">
                    <Wrench className="h-4 w-4" />
                    Centri Riparazione Assegnati
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {repairCenters.map((rc) => {
                      const isSelected = editForm.repairCenterIds.includes(rc.id);
                      return (
                        <Badge
                          key={rc.id}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleRepairCenter(rc.id)}
                          data-testid={`badge-edit-repair-center-${rc.id}`}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-1" />}
                          {rc.name}
                        </Badge>
                      );
                    })}
                    {repairCenters.length === 0 && (
                      <p className="text-sm text-muted-foreground">Nessun centro di riparazione disponibile</p>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={cancelEditing} data-testid="button-cancel-edit">
                    Annulla
                  </Button>
                  <Button onClick={saveEditing} disabled={updateCustomerMutation.isPending} data-testid="button-save-edit">
                    {updateCustomerMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info" data-testid="tab-customer-info">Informazioni</TabsTrigger>
                  <TabsTrigger value="branches" data-testid="tab-customer-branches">Filiali</TabsTrigger>
                  <TabsTrigger value="repairs" data-testid="tab-customer-repairs">Riparazioni</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Username</Label>
                      <p className="text-sm font-mono">@{selectedCustomer.username}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Telefono</Label>
                      <p className="text-sm">
                        {selectedCustomer.phone || <span className="text-muted-foreground">-</span>}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stato</Label>
                      <p className="text-sm">
                        {selectedCustomer.isActive ? "Attivo" : "Inattivo"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Registrazione</Label>
                      <p className="text-sm">
                        {format(new Date(selectedCustomer.createdAt), "dd/MM/yyyy")}
                      </p>
                    </div>
                    {hasSubResellers && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Sub-Reseller</Label>
                        <p className="text-sm">
                          {getSubResellerName(selectedCustomer.subResellerId) || <span className="text-muted-foreground">-</span>}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedCustomer.assignedRepairCenters && selectedCustomer.assignedRepairCenters.length > 0 && (
                    <div className="pt-4 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">Centri Riparazione</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.assignedRepairCenters.map((rc) => (
                          <Badge key={rc.id} variant="secondary" data-testid={`badge-detail-repair-center-${rc.id}`}>
                            {rc.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="branches" className="mt-4">
                  <CustomerBranchManager 
                    customerId={selectedCustomer.id} 
                    customerName={selectedCustomer.fullName}
                  />
                </TabsContent>

                <TabsContent value="repairs" className="mt-4">
                  {getCustomerRepairs(selectedCustomer.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nessuna riparazione</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ordine</TableHead>
                          <TableHead>Dispositivo</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getCustomerRepairs(selectedCustomer.id).map((repair) => (
                          <TableRow key={repair.id}>
                            <TableCell className="font-mono text-sm">{repair.orderNumber}</TableCell>
                            <TableCell>{repair.deviceType}</TableCell>
                            <TableCell>{getStatusBadge(repair.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(repair.createdAt), "dd/MM/yy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare <strong>{customerToDelete?.fullName}</strong>. 
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomerMutation.isPending}
            >
              {deleteCustomerMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
