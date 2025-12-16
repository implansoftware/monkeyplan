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
import { Users, Plus, Search, Mail, Building2, Wrench, Pencil, X, Check, Trash2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { User, RepairOrder, RepairCenter } from "@shared/schema";
import { CustomerBranchManager } from "@/components/CustomerBranchManager";
import { CustomerWizardDialog } from "@/components/CustomerWizardDialog";
import { useToast } from "@/hooks/use-toast";

type CustomerWithRepairCenters = User & {
  assignedRepairCenters?: RepairCenter[];
};

export default function ResellerCustomers() {
  const [searchQuery, setSearchQuery] = useState("");
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
      // Error format is "409: {json}" - extract JSON part after status code
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
            // Keep dialog open so user can see what happened
            return;
          }
        } catch {
          // Not JSON, continue to generic error
        }
      }
      toast({ title: "Errore", description: errorMsg, variant: "destructive" });
      // Keep dialog open on all errors so user can retry or dismiss
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

  const filteredCustomers = customers.filter((customer) =>
    customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Clienti</h1>
          <p className="text-muted-foreground">
            Gestisci la tua base clienti e visualizza le loro riparazioni
          </p>
        </div>
        <>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-new-customer">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Cliente
          </Button>
          <CustomerWizardDialog 
            open={dialogOpen} 
            onOpenChange={setDialogOpen}
            onSuccess={handleCustomerCreated}
          />
        </>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, email o username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Elenco Clienti ({filteredCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun cliente trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Centri Riparazione</TableHead>
                  <TableHead>Riparazioni</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => {
                  const customerRepairs = getCustomerRepairs(customer.id);
                  return (
                    <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${customer.id}`}>
                        {customer.fullName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {customer.email}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.username}</TableCell>
                      <TableCell>
                        {customer.isActive ? (
                          <Badge variant="outline">Attivo</Badge>
                        ) : (
                          <Badge variant="destructive">Disattivato</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {customer.assignedRepairCenters && customer.assignedRepairCenters.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {customer.assignedRepairCenters.slice(0, 2).map((rc) => (
                              <Badge key={rc.id} variant="secondary" className="text-xs" data-testid={`badge-repair-center-${rc.id}`}>
                                <Wrench className="h-3 w-3 mr-1" />
                                {rc.name}
                              </Badge>
                            ))}
                            {customer.assignedRepairCenters.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{customer.assignedRepairCenters.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Nessuno</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge data-testid={`badge-repairs-${customer.id}`}>
                          {customerRepairs.length} riparazioni
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                            data-testid={`button-view-${customer.id}`}
                          >
                            Dettagli
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteClick(customer)}
                            title="Elimina cliente"
                            data-testid={`button-delete-${customer.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => { setSelectedCustomer(null); setIsEditing(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <DialogTitle>Dettagli Cliente: {selectedCustomer.fullName}</DialogTitle>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => startEditing(selectedCustomer)} data-testid="button-edit-customer">
                    <Pencil className="h-4 w-4 mr-1" />
                    Modifica
                  </Button>
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
                      <span className="text-sm">{editForm.isActive ? "Attivo" : "Disattivato"}</span>
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
                    <X className="h-4 w-4 mr-1" />
                    Annulla
                  </Button>
                  <Button onClick={saveEditing} disabled={updateCustomerMutation.isPending} data-testid="button-save-edit">
                    <Check className="h-4 w-4 mr-1" />
                    {updateCustomerMutation.isPending ? "Salvataggio..." : "Salva"}
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info" data-testid="tab-customer-info">
                    <Users className="h-4 w-4 mr-1" />
                    Informazioni
                  </TabsTrigger>
                  <TabsTrigger value="branches" data-testid="tab-customer-branches">
                    <Building2 className="h-4 w-4 mr-1" />
                    Filiali
                  </TabsTrigger>
                  <TabsTrigger value="repairs" data-testid="tab-customer-repairs">
                    Riparazioni
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label>Username</Label>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.username}</p>
                    </div>
                    <div>
                      <Label>Data Registrazione</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(selectedCustomer.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <div>
                      <Label>Stato</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.isActive ? "Attivo" : "Disattivato"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Label className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4" />
                      Centri Riparazione Assegnati
                    </Label>
                    {selectedCustomer.assignedRepairCenters && selectedCustomer.assignedRepairCenters.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.assignedRepairCenters.map((rc) => (
                          <Badge key={rc.id} variant="secondary" data-testid={`badge-detail-repair-center-${rc.id}`}>
                            <Wrench className="h-3 w-3 mr-1" />
                            {rc.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nessun centro di riparazione assegnato</p>
                    )}
                  </div>
                </TabsContent>

              <TabsContent value="branches" className="mt-4">
                <CustomerBranchManager 
                  customerId={selectedCustomer.id} 
                  customerName={selectedCustomer.fullName}
                />
              </TabsContent>

              <TabsContent value="repairs" className="mt-4">
                {getCustomerRepairs(selectedCustomer.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">Nessuna riparazione registrata</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numero Ordine</TableHead>
                        <TableHead>Dispositivo</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getCustomerRepairs(selectedCustomer.id).map((repair) => (
                        <TableRow key={repair.id}>
                          <TableCell className="font-medium">{repair.orderNumber}</TableCell>
                          <TableCell>
                            {repair.deviceType} - {repair.deviceModel}
                          </TableCell>
                          <TableCell>{getStatusBadge(repair.status)}</TableCell>
                          <TableCell>{format(new Date(repair.createdAt), "dd/MM/yyyy")}</TableCell>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il cliente <strong>{customerToDelete?.fullName}</strong>?
              <br /><br />
              Questa azione non può essere annullata. Tutti i dati del cliente verranno eliminati permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCustomerMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteCustomerMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
