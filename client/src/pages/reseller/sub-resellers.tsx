import { useState } from "react";
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
import { Network, Search, Users, Building, Store, ShoppingCart, Package, TrendingUp, DollarSign, Eye, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const [formData, setFormData] = useState<SubResellerFormData>(initialFormData);
  const { toast } = useToast();

  const { data: subResellers = [], isLoading } = useQuery<SubReseller[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  const { data: ecommerceData = [], isLoading: isLoadingEcommerce } = useQuery<SubResellerEcommerce[]>({
    queryKey: ["/api/reseller/sub-resellers/ecommerce"],
    enabled: activeTab === "ecommerce",
  });

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
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (reseller: SubReseller) => {
    setEditingReseller(reseller);
    setFormData({
      username: reseller.username,
      email: reseller.email,
      password: "",
      fullName: reseller.fullName,
      phone: reseller.phone || "",
      resellerCategory: reseller.resellerCategory || "standard",
      isActive: reseller.isActive,
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
  };

  const handleSubmit = () => {
    if (editingReseller) {
      const updateData: Partial<SubResellerFormData> = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        resellerCategory: formData.resellerCategory,
        isActive: formData.isActive,
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" data-testid="dialog-subreseller-form">
          <DialogHeader>
            <DialogTitle>
              {editingReseller ? "Modifica Sub-Reseller" : "Nuovo Sub-Reseller"}
            </DialogTitle>
            <DialogDescription>
              {editingReseller 
                ? "Modifica i dati del sub-reseller selezionato"
                : "Inserisci i dati per creare un nuovo sub-reseller"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  disabled={!!editingReseller}
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                data-testid="input-fullname"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.resellerCategory}
                  onValueChange={(value) => setFormData({ ...formData, resellerCategory: value })}
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

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingReseller ? "(lascia vuoto per non modificare)" : "*"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingReseller ? "••••••••" : ""}
                data-testid="input-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Attivo</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-active"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} data-testid="button-cancel">
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-submit">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingReseller ? "Salva Modifiche" : "Crea Sub-Reseller"}
            </Button>
          </DialogFooter>
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
    </div>
  );
}
