import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShippingMethod } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Truck, Plus, Pencil, Trash2, Copy, MapPin, Package, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

type ShippingFormData = {
  name: string;
  code: string;
  description: string;
  priceCents: number;
  estimatedDays: number | null;
  isPickup: boolean;
  isActive: boolean;
  isTemplate: boolean;
  sortOrder: number;
};

const defaultFormData: ShippingFormData = {
  name: "",
  code: "",
  description: "",
  priceCents: 0,
  estimatedDays: null,
  isPickup: false,
  isActive: true,
  isTemplate: false,
  sortOrder: 0,
};

export default function AdminShippingMethods() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState<ShippingFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: methods = [], isLoading } = useQuery<ShippingMethod[]>({
    queryKey: ["/api/admin/shipping-methods"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ShippingFormData) => {
      return apiRequest("POST", "/api/admin/shipping-methods", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-methods"] });
      toast({ title: "Metodo di spedizione creato" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShippingFormData> }) => {
      return apiRequest("PUT", `/api/admin/shipping-methods/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-methods"] });
      toast({ title: "Metodo di spedizione aggiornato" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/shipping-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shipping-methods"] });
      toast({ title: "Metodo di spedizione eliminato" });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingMethod(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (method: ShippingMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code || "",
      description: method.description || "",
      priceCents: method.priceCents,
      estimatedDays: method.estimatedDays,
      isPickup: method.isPickup,
      isActive: method.isActive,
      isTemplate: method.isTemplate,
      sortOrder: method.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Nome obbligatorio", variant: "destructive" });
      return;
    }

    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredMethods = methods.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.code && m.code.toLowerCase().includes(search.toLowerCase()))
  );

  const templates = filteredMethods.filter((m) => m.isTemplate);
  const nonTemplates = filteredMethods.filter((m) => !m.isTemplate);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" data-testid="text-page-title">
            <Truck className="h-6 w-6" />
            Metodi di Spedizione
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i metodi di spedizione e consegna per tutte le entità
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-shipping">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Metodo
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca metodi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          data-testid="input-search-shipping"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Template Globali
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Codice</TableHead>
                      <TableHead>Prezzo</TableHead>
                      <TableHead>Giorni</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((method) => (
                      <TableRow key={method.id} data-testid={`row-shipping-${method.id}`}>
                        <TableCell className="font-medium">{method.name}</TableCell>
                        <TableCell>
                          {method.code && <Badge variant="outline">{method.code}</Badge>}
                        </TableCell>
                        <TableCell>{formatPrice(method.priceCents)}</TableCell>
                        <TableCell>
                          {method.estimatedDays ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {method.estimatedDays}g
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {method.isPickup ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <MapPin className="h-3 w-3" />
                              Ritiro
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Package className="h-3 w-3" />
                              Spedizione
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(method)}
                              data-testid={`button-edit-shipping-${method.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(method.id)}
                              data-testid={`button-delete-shipping-${method.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Metodi Configurati ({nonTemplates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nonTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun metodo di spedizione configurato</p>
                  <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea il primo metodo
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Codice</TableHead>
                      <TableHead>Prezzo</TableHead>
                      <TableHead>Giorni</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Creato da</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonTemplates.map((method) => (
                      <TableRow key={method.id} data-testid={`row-shipping-${method.id}`}>
                        <TableCell className="font-medium">{method.name}</TableCell>
                        <TableCell>
                          {method.code && <Badge variant="outline">{method.code}</Badge>}
                        </TableCell>
                        <TableCell>{formatPrice(method.priceCents)}</TableCell>
                        <TableCell>
                          {method.estimatedDays ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {method.estimatedDays}g
                            </span>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          {method.isPickup ? (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <MapPin className="h-3 w-3" />
                              Ritiro
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Package className="h-3 w-3" />
                              Spedizione
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{method.createdBy?.slice(0, 8)}...</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? "Attivo" : "Inattivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(method)}
                              data-testid={`button-edit-shipping-${method.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(method.id)}
                              data-testid={`button-delete-shipping-${method.id}`}
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
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? "Modifica Metodo" : "Nuovo Metodo di Spedizione"}
            </DialogTitle>
            <DialogDescription>
              Configura i dettagli del metodo di spedizione o consegna
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Spedizione Standard"
                  data-testid="input-shipping-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Codice</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="es. STD"
                  data-testid="input-shipping-code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione opzionale del metodo..."
                rows={2}
                data-testid="input-shipping-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prezzo (EUR)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={(formData.priceCents / 100).toFixed(2)}
                  onChange={(e) => setFormData({ ...formData, priceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                  data-testid="input-shipping-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="days">Giorni Stimati</Label>
                <Input
                  id="days"
                  type="number"
                  min="0"
                  value={formData.estimatedDays || ""}
                  onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="es. 3"
                  data-testid="input-shipping-days"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordine di Visualizzazione</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value || "0") })}
                data-testid="input-shipping-sort"
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isPickup">Ritiro in sede</Label>
                  <p className="text-sm text-muted-foreground">Il cliente ritira presso un punto fisico</p>
                </div>
                <Switch
                  id="isPickup"
                  checked={formData.isPickup}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPickup: checked })}
                  data-testid="switch-shipping-pickup"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isTemplate">Template Globale</Label>
                  <p className="text-sm text-muted-foreground">Disponibile come modello per altre entità</p>
                </div>
                <Switch
                  id="isTemplate"
                  checked={formData.isTemplate}
                  onCheckedChange={(checked) => setFormData({ ...formData, isTemplate: checked })}
                  data-testid="switch-shipping-template"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Attivo</Label>
                  <p className="text-sm text-muted-foreground">Visibile durante il checkout</p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-shipping-active"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-shipping">
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-shipping"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo metodo di spedizione? L'azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
