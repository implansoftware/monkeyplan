import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WarrantyProduct, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Shield, Plus, Pencil, Trash2, Euro } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

type WarrantyFormData = {
  name: string;
  description: string;
  durationMonths: number;
  priceInCents: number;
  coverageType: "basic" | "extended" | "full";
  maxClaimAmount: number | null;
  deductibleAmount: number;
  termsAndConditions: string;
  isActive: boolean;
};

const defaultFormData: WarrantyFormData = {
  name: "",
  description: "",
  durationMonths: 12,
  priceInCents: 0,
  coverageType: "basic",
  maxClaimAmount: null,
  deductibleAmount: 0,
  termsAndConditions: "",
  isActive: true,
};

export default function AdminWarrantyProducts() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WarrantyProduct | null>(null);
  const [formData, setFormData] = useState<WarrantyFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<WarrantyProduct[]>({
    queryKey: ["/api/admin/warranty-products"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const getOwnerName = (resellerId: string | null) => {
    if (!resellerId) return "Globale (Admin)";
    const user = users.find(u => u.id === resellerId);
    return user ? user.fullName || user.username : resellerId.slice(0, 8);
  };

  const createMutation = useMutation({
    mutationFn: (data: WarrantyFormData) => apiRequest("POST", "/api/admin/warranty-products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warranty-products"] });
      toast({ title: t("warranties.productCreated"), description: t("warranties.productCreatedDesc") });
      closeDialog();
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("warrantyProducts.createError"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarrantyFormData> }) => 
      apiRequest("PATCH", `/api/admin/warranty-products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warranty-products"] });
      toast({ title: t("warranties.productUpdated"), description: t("warranties.productUpdatedDesc") });
      closeDialog();
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("warrantyProducts.updateError"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/warranty-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/warranty-products"] });
      toast({ title: t("warranties.productDeleted"), description: t("warranties.productDeletedDesc") });
      setDeleteConfirmId(null);
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("warrantyProducts.deleteError"), variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData(defaultFormData);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: WarrantyProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      durationMonths: product.durationMonths,
      priceInCents: product.priceInCents,
      coverageType: product.coverageType as "basic" | "extended" | "full",
      maxClaimAmount: product.maxClaimAmount,
      deductibleAmount: product.deductibleAmount || 0,
      termsAndConditions: product.termsAndConditions || "",
      isActive: product.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || formData.durationMonths <= 0 || formData.priceInCents <= 0) {
      toast({ title: t("common.error"), description: t("warrantyProducts.fillRequired"), variant: "destructive" });
      return;
    }

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);

  const getCoverageLabel = (type: string) => {
    switch (type) {
      case "basic": return t("warranties.types.basic");
      case "extended": return t("warranties.types.extended");
      case "full": return t("warranties.types.full");
      default: return type;
    }
  };

  const getCoverageBadge = (type: string) => {
    switch (type) {
      case "basic": return <Badge variant="secondary">{getCoverageLabel(type)}</Badge>;
      case "extended": return <Badge>{getCoverageLabel(type)}</Badge>;
      case "full": return <Badge className="bg-emerald-500">{getCoverageLabel(type)}</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-slate-100 dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Prodotti Garanzia</h1>
              <p className="text-sm text-muted-foreground">
                Gestisci il catalogo delle garanzie e assicurazioni
              </p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="gap-2" data-testid="button-create-warranty">
            <Plus className="h-4 w-4" />
            Nuovo Prodotto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchProduct")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-warranty"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nessun prodotto garanzia</p>
              <p className="text-sm mt-1">Crea il tuo primo prodotto garanzia</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("warehouse.owner")}</TableHead>
                  <TableHead>{t("warranties.coverage")}</TableHead>
                  <TableHead className="text-center">Durata</TableHead>
                  <TableHead className="text-right">{t("common.price")}</TableHead>
                  <TableHead className="text-center">{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-warranty-${product.id}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.resellerId ? "outline" : "secondary"} data-testid={`text-owner-${product.id}`}>
                        {getOwnerName(product.resellerId)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getCoverageBadge(product.coverageType)}</TableCell>
                    <TableCell className="text-center">{product.durationMonths} mesi</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.priceInCents)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(product)}
                          data-testid={`button-edit-warranty-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(product.id)}
                          data-testid={`button-delete-warranty-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? t("warrantyProducts.editProduct") : t("warrantyProducts.newProduct")}</DialogTitle>
            <DialogDescription>
              {editingProduct ? t("warrantyProducts.editProductDesc") : t("warrantyProducts.newProductDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es. Garanzia Estesa 12 Mesi"
                data-testid="input-warranty-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("warranties.coverageDescription")}
                rows={2}
                data-testid="input-warranty-description"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationMonths">{t("warranties.durationMonths")} *</Label>
                <Input
                  id="durationMonths"
                  type="number"
                  min="1"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 0 })}
                  data-testid="input-warranty-duration"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t("common.price")} (EUR) *</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    defaultValue={(formData.priceInCents / 100).toString()}
                    key={`price-${editingProduct?.id || 'new'}`}
                    onBlur={(e) => {
                      const val = e.target.value.replace(',', '.');
                      setFormData({ ...formData, priceInCents: Math.round(parseFloat(val) * 100) || 0 });
                    }}
                    className="pl-9"
                    data-testid="input-warranty-price"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverageType">{t("warranties.coverageType")} *</Label>
              <Select
                value={formData.coverageType}
                onValueChange={(value: "basic" | "extended" | "full") => setFormData({ ...formData, coverageType: value })}
              >
                <SelectTrigger data-testid="select-warranty-coverage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{t("warranties.basic")}</SelectItem>
                  <SelectItem value="extended">{t("warranties.extended")}</SelectItem>
                  <SelectItem value="full">{t("warranties.full")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxClaimAmount">{t("warranties.maxClaimAmount")} (EUR)</Label>
                <Input
                  id="maxClaimAmount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={formData.maxClaimAmount ? (formData.maxClaimAmount / 100).toString() : ""}
                  key={`maxClaim-${editingProduct?.id || 'new'}`}
                  onBlur={(e) => {
                    const val = e.target.value.replace(',', '.');
                    setFormData({ ...formData, maxClaimAmount: val ? Math.round(parseFloat(val) * 100) : null });
                  }}
                  placeholder={t("common.unlimited")}
                  data-testid="input-warranty-max-claim"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deductibleAmount">{t("warranties.deductibleAmount")} (EUR)</Label>
                <Input
                  id="deductibleAmount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={(formData.deductibleAmount / 100).toString()}
                  key={`deductible-${editingProduct?.id || 'new'}`}
                  onBlur={(e) => {
                    const val = e.target.value.replace(',', '.');
                    setFormData({ ...formData, deductibleAmount: Math.round(parseFloat(val) * 100) || 0 });
                  }}
                  data-testid="input-warranty-deductible"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms">{t("warranties.terms")}</Label>
              <Textarea
                id="terms"
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                placeholder={t("warranties.warrantyTerms")}
                rows={3}
                data-testid="input-warranty-terms"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">{t("products.activeProduct")}</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-warranty-active"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-warranty"
            >
              {createMutation.isPending || updateMutation.isPending ? t("settings.savingRate") : editingProduct ? t("warrantyProducts.saveChanges") : t("warrantyProducts.createProduct")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questo prodotto garanzia? L'azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{t("common.cancel")}</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("admin.resellers.deleting") : t("warrantyProducts.deleteProduct")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
