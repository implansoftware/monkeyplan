import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Search, Plus, Pencil, Trash2, Loader2, Tag, Store, ImagePlus, X, Image } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import type { AccessorySpecs, Product } from "@shared/schema";

type AccessoryWithSpecs = Product & {
  specs: AccessorySpecs | null;
  reseller?: { id: string; username: string; fullName: string | null } | null;
};

const ACCESSORY_TYPES = [
  { value: "cover", label: "Cover / Custodia" },
  { value: "pellicola", label: "Pellicola protettiva" },
  { value: "caricatore", label: "Caricatore" },
  { value: "cavo", label: "Cavo" },
  { value: "auricolare", label: "Auricolari" },
  { value: "powerbank", label: "Power Bank" },
  { value: "supporto", label: "Supporto / Stand" },
  { value: "adattatore", label: "Adattatore" },
  { value: "altro", label: "Altro" },
];

const CONDITION_OPTIONS = [
  { value: "nuovo", label: "Nuovo" },
  { value: "ricondizionato", label: "Ricondizionato" },
  { value: "usato", label: "Usato" },
];

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "Anker", "Belkin", "Spigen", "OtterBox", "Universale", "Altro"];

export default function AdminAccessoryCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryWithSpecs | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessoryToDelete, setAccessoryToDelete] = useState<AccessoryWithSpecs | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    brand: "",
    color: "",
    description: "",
    unitPrice: "",
    costPrice: "",
    condition: "nuovo",
    warrantyMonths: "12",
    accessoryType: "cover",
    isUniversal: false,
    compatibleBrands: [] as string[],
    compatibleModels: "",
    material: "",
    notes: "",
  });

  const { data: accessories = [], isLoading } = useQuery<AccessoryWithSpecs[]>({
    queryKey: ["/api/accessories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/accessories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Accessorio aggiunto", description: "L'accessorio è stato aggiunto al catalogo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => {
      await apiRequest("PATCH", `/api/accessories/${productId}`, { product: data.product, specs: data.specs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setDialogOpen(false);
      setEditingAccessory(null);
      resetForm();
      toast({ title: "Accessorio aggiornato", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("DELETE", `/api/accessories/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setDeleteDialogOpen(false);
      setAccessoryToDelete(null);
      toast({ title: "Eliminato", description: "L'accessorio è stato rimosso dal catalogo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        toast({ title: "Errore", description: "Formato non supportato. Usa JPEG, PNG, WebP o GIF.", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Errore", description: "Immagine troppo grande. Max 10MB.", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (productId: string) => {
    if (!imageFile) return;
    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", imageFile);
      const response = await fetch(`/api/admin/products/${productId}/image`, {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({ title: "Immagine caricata", description: "L'immagine è stata salvata." });
    } catch (error: any) {
      toast({ title: "Errore upload", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const deleteImage = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/image`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({ title: "Immagine rimossa" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      name: "",
      sku: "",
      brand: "",
      color: "",
      description: "",
      unitPrice: "",
      costPrice: "",
      condition: "nuovo",
      warrantyMonths: "12",
      accessoryType: "cover",
      isUniversal: false,
      compatibleBrands: [],
      compatibleModels: "",
      material: "",
      notes: "",
    });
  };

  const openEditDialog = (accessory: AccessoryWithSpecs) => {
    setEditingAccessory(accessory);
    setFormData({
      name: accessory.name,
      sku: accessory.sku,
      brand: accessory.brand || "",
      color: accessory.color || accessory.specs?.color || "",
      description: accessory.description || "",
      unitPrice: accessory.unitPrice ? (accessory.unitPrice / 100).toString() : "",
      costPrice: accessory.costPrice ? (accessory.costPrice / 100).toString() : "",
      condition: accessory.condition,
      warrantyMonths: accessory.warrantyMonths?.toString() || "12",
      accessoryType: accessory.specs?.accessoryType || "cover",
      isUniversal: accessory.specs?.isUniversal || false,
      compatibleBrands: accessory.specs?.compatibleBrands || [],
      compatibleModels: accessory.specs?.compatibleModels?.join(", ") || "",
      material: accessory.specs?.material || "",
      notes: accessory.specs?.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const product = {
      name: formData.name,
      sku: formData.sku,
      category: "accessorio",
      brand: formData.brand,
      color: formData.color,
      description: formData.description,
      unitPrice: Math.round(parseFloat(formData.unitPrice || "0") * 100),
      costPrice: formData.costPrice ? Math.round(parseFloat(formData.costPrice) * 100) : null,
      condition: formData.condition,
      warrantyMonths: parseInt(formData.warrantyMonths) || 12,
    };

    const specs = {
      accessoryType: formData.accessoryType,
      isUniversal: formData.isUniversal,
      compatibleBrands: formData.compatibleBrands.length > 0 ? formData.compatibleBrands : null,
      compatibleModels: formData.compatibleModels ? formData.compatibleModels.split(",").map(m => m.trim()).filter(Boolean) : null,
      material: formData.material || null,
      color: formData.color || null,
      notes: formData.notes || null,
    };

    if (editingAccessory) {
      updateMutation.mutate({ productId: editingAccessory.id, data: { product, specs } });
    } else {
      createMutation.mutate({ product, specs });
    }
  };

  const filteredAccessories = accessories.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || a.specs?.accessoryType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: string | null | undefined) => {
    return ACCESSORY_TYPES.find(t => t.value === type)?.label || type || "-";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Catalogo Accessori (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizza e gestisci tutti gli accessori di tutti i rivenditori
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingAccessory(null); setDialogOpen(true); }} data-testid="button-add-accessory">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Accessorio
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Lista Accessori ({filteredAccessories.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-accessories"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44" data-testid="select-type-filter">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {ACCESSORY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAccessories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nessun accessorio nel catalogo</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Rivenditore</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Compatibilità</TableHead>
                    <TableHead>Condizione</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessories.map((accessory) => (
                    <TableRow key={accessory.id} data-testid={`row-accessory-${accessory.id}`}>
                      <TableCell>
                        {accessory.imageUrl ? (
                          <img
                            src={accessory.imageUrl}
                            alt={accessory.name}
                            className="w-12 h-12 object-cover rounded"
                            data-testid={`img-accessory-${accessory.id}`}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Image className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{accessory.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {accessory.brand} {accessory.color && `• ${accessory.color}`}
                          </div>
                          <div className="text-xs text-muted-foreground">SKU: {accessory.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Store className="h-4 w-4" />
                          {accessory.reseller?.fullName || accessory.reseller?.username || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {getTypeLabel(accessory.specs?.accessoryType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {accessory.specs?.isUniversal ? (
                          <Badge variant="secondary">Universale</Badge>
                        ) : accessory.specs?.compatibleBrands?.length ? (
                          <span className="text-sm text-muted-foreground">
                            {accessory.specs.compatibleBrands.slice(0, 2).join(", ")}
                            {accessory.specs.compatibleBrands.length > 2 && ` +${accessory.specs.compatibleBrands.length - 2}`}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={accessory.condition === "nuovo" ? "default" : "secondary"}>
                          {accessory.condition === "nuovo" ? "Nuovo" : accessory.condition === "ricondizionato" ? "Ricondizionato" : "Usato"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(accessory.unitPrice / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(accessory)}
                            data-testid={`button-edit-accessory-${accessory.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setAccessoryToDelete(accessory); setDeleteDialogOpen(true); }}
                            data-testid={`button-delete-accessory-${accessory.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccessory ? "Modifica Accessorio" : "Aggiungi Accessorio"}</DialogTitle>
            <DialogDescription>
              {editingAccessory ? "Modifica i dettagli dell'accessorio" : "Inserisci i dettagli del nuovo accessorio"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome prodotto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Cover silicone iPhone 14"
                  data-testid="input-accessory-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="es. COV-IP14-BLK"
                  data-testid="input-accessory-sku"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessoryType">Tipo accessorio</Label>
                <Select value={formData.accessoryType} onValueChange={(v) => setFormData({ ...formData, accessoryType: v })}>
                  <SelectTrigger data-testid="select-accessory-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESSORY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger data-testid="select-accessory-brand">
                    <SelectValue placeholder="Seleziona marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condizione</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                  <SelectTrigger data-testid="select-accessory-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Colore</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="es. Nero"
                  data-testid="input-accessory-color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Materiale</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                  placeholder="es. Silicone, TPU"
                  data-testid="input-accessory-material"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isUniversal"
                checked={formData.isUniversal}
                onCheckedChange={(checked) => setFormData({ ...formData, isUniversal: !!checked })}
                data-testid="checkbox-universal"
              />
              <Label htmlFor="isUniversal">Accessorio universale</Label>
            </div>

            {!formData.isUniversal && (
              <div className="space-y-2">
                <Label htmlFor="compatibleModels">Modelli compatibili</Label>
                <Input
                  id="compatibleModels"
                  value={formData.compatibleModels}
                  onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                  placeholder="es. iPhone 14, iPhone 14 Pro, iPhone 14 Pro Max"
                  data-testid="input-compatible-models"
                />
                <p className="text-xs text-muted-foreground">Separa i modelli con virgole</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Prezzo vendita</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-accessory-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Prezzo costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-accessory-cost"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyMonths">Garanzia (mesi)</Label>
              <Input
                id="warrantyMonths"
                type="number"
                value={formData.warrantyMonths}
                onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                placeholder="12"
                data-testid="input-accessory-warranty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione del prodotto..."
                rows={2}
                data-testid="textarea-accessory-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note interne</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note per uso interno..."
                rows={2}
                data-testid="textarea-accessory-notes"
              />
            </div>

            {editingAccessory && (
              <div className="space-y-2">
                <Label>Immagine prodotto</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          data-testid="button-clear-preview"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : editingAccessory.imageUrl ? (
                      <div className="relative">
                        <img src={editingAccessory.imageUrl} alt={editingAccessory.name} className="w-24 h-24 object-cover rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => deleteImage(editingAccessory.id)}
                          data-testid="button-delete-image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageSelect}
                      data-testid="input-image-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-select-image"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Seleziona immagine
                    </Button>
                    {imageFile && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => uploadImage(editingAccessory.id)}
                        disabled={uploadingImage}
                        data-testid="button-upload-image"
                      >
                        {uploadingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Carica immagine
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP o GIF. Max 10MB.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-accessory"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccessory ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{accessoryToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => accessoryToDelete && deleteMutation.mutate(accessoryToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
