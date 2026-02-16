import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShippingMethod } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Truck, Plus, Pencil, Trash2, Copy, MapPin, Package, Clock, Building2 } from "lucide-react";
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

interface ShippingMethodsTabProps {
  role: "admin" | "reseller" | "repair_center";
  apiBase: string;
  showTemplateToggle?: boolean;
  showInheritedMethods?: boolean;
  inheritedMethodsFilter?: (method: ShippingMethod) => boolean;
  ownMethodsFilter?: (method: ShippingMethod) => boolean;
}

export function ShippingMethodsTab({
  role,
  apiBase,
  showTemplateToggle = false,
  showInheritedMethods = false,
  inheritedMethodsFilter,
  ownMethodsFilter,
}: ShippingMethodsTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [formData, setFormData] = useState<ShippingFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: methods = [], isLoading } = useQuery<ShippingMethod[]>({
    queryKey: [apiBase],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ShippingFormData) => {
      return apiRequest("POST", apiBase, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase] });
      toast({ title: "Metodo di consegna creato" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ShippingFormData> }) => {
      return apiRequest("PUT", `${apiBase}/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase] });
      toast({ title: "Metodo di consegna aggiornato" });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `${apiBase}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase] });
      toast({ title: "Metodo di consegna eliminato" });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("common.nameRequired"), variant: "destructive" });
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

  const inheritedMethods = showInheritedMethods && inheritedMethodsFilter
    ? filteredMethods.filter(inheritedMethodsFilter)
    : role === "admin"
    ? filteredMethods.filter((m) => m.isTemplate)
    : [];

  const ownMethods = ownMethodsFilter
    ? filteredMethods.filter(ownMethodsFilter)
    : role === "admin"
    ? filteredMethods.filter((m) => !m.isTemplate)
    : filteredMethods;

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  const isInherited = (method: ShippingMethod) => {
    if (inheritedMethodsFilter) return inheritedMethodsFilter(method);
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("shipping.searchMethods")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-shipping"
          />
        </div>
        <Button onClick={openCreateDialog} data-testid="button-create-shipping">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Metodo
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {role === "admin" && inheritedMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Template Globali
                </CardTitle>
                <CardDescription>
                  Questi template sono disponibili per reseller e centri riparazione
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.code")}</TableHead>
                      <TableHead>{t("common.price")}</TableHead>
                      <TableHead>Giorni</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inheritedMethods.map((method) => (
                      <TableRow key={method.id} data-testid={`row-shipping-template-${method.id}`}>
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
                              {t("delivery.pickup")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Package className="h-3 w-3" />
                              {t("shipping.shipping")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? t("common.active") : "Inattivo"}
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

          {showInheritedMethods && role === "repair_center" && inheritedMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Metodi del Reseller
                </CardTitle>
                <CardDescription>
                  Questi metodi sono ereditati dal tuo reseller di riferimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.code")}</TableHead>
                      <TableHead>{t("common.price")}</TableHead>
                      <TableHead>Giorni</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inheritedMethods.map((method) => (
                      <TableRow key={method.id} data-testid={`row-shipping-inherited-${method.id}`}>
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
                              {t("delivery.pickup")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Package className="h-3 w-3" />
                              {t("shipping.shipping")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? t("common.active") : "Inattivo"}
                          </Badge>
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
                {role === "repair_center" ? "I Tuoi Metodi Personalizzati" : "I Tuoi Metodi di Consegna"} ({ownMethods.length})
              </CardTitle>
              {role === "repair_center" && (
                <CardDescription>
                  Metodi di consegna specifici per il tuo centro riparazioni
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {ownMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("shipping.noDeliveryMethodsConfigured")}</p>
                  <p className="text-sm mt-2">
                    {role === "repair_center" 
                      ? "Puoi aggiungere metodi specifici per il tuo centro oltre a quelli ereditati dal reseller"
                      : "I clienti vedranno le opzioni di consegna durante il checkout"}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crea il primo metodo
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.code")}</TableHead>
                      <TableHead>{t("common.price")}</TableHead>
                      <TableHead>Giorni</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownMethods.map((method) => (
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
                              {t("delivery.pickup")}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                              <Package className="h-3 w-3" />
                              {t("shipping.shipping")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.isActive ? "default" : "secondary"}>
                            {method.isActive ? t("common.active") : "Inattivo"}
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
              {editingMethod ? t("shipping.editMethod") : "Nuovo Metodo di Consegna"}
            </DialogTitle>
            <DialogDescription>
              Configura i dettagli del metodo di spedizione o ritiro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("common.name")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Spedizione Standard"
                  data-testid="input-shipping-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">{t("common.code")}</Label>
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
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("shipping.optionalDescription")}
                rows={2}
                data-testid="input-shipping-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("common.price")} (EUR)</Label>
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
              <Label htmlFor="sortOrder">{t("shipping.displayOrder")}</Label>
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
                  <Label htmlFor="isPickup">{t("delivery.pickupAtOffice")}</Label>
                  <p className="text-sm text-muted-foreground">Il cliente ritira presso un punto fisico</p>
                </div>
                <Switch
                  id="isPickup"
                  checked={formData.isPickup}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPickup: checked })}
                  data-testid="switch-shipping-pickup"
                />
              </div>

              {showTemplateToggle && (
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
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">{t("common.active")}</Label>
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
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-shipping"
            >
              {createMutation.isPending || updateMutation.isPending ? t("common.saving") : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeletion")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo metodo di consegna? L'azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
