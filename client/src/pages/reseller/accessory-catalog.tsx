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
import { Package, Search, Plus, Pencil, Trash2, Loader2, Headphones, Cable, Battery, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AccessorySpecs, Product } from "@shared/schema";

type AccessoryWithSpecs = Product & {
  specs: AccessorySpecs | null;
};

const ACCESSORY_TYPES = [
  { value: "cover", label: "Cover/Custodie", icon: Shield },
  { value: "pellicola", label: "Pellicole Protettive", icon: Shield },
  { value: "caricatore", label: "Caricatori", icon: Battery },
  { value: "cavo", label: "Cavi", icon: Cable },
  { value: "powerbank", label: "Power Bank", icon: Battery },
  { value: "auricolari", label: "Auricolari/Cuffie", icon: Headphones },
  { value: "supporto", label: "Supporti", icon: Package },
  { value: "adattatore", label: "Adattatori", icon: Cable },
  { value: "memoria", label: "Schede Memoria", icon: Package },
  { value: "altro", label: "Altro", icon: Package },
];

const CONDITION_OPTIONS = [
  { value: "nuovo", label: "Nuovo" },
  { value: "ricondizionato", label: "Ricondizionato" },
  { value: "usato", label: "Usato" },
  { value: "difettoso", label: "Difettoso" },
];

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Universale", "Altro"];

export default function AccessoryCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryWithSpecs | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessoryToDelete, setAccessoryToDelete] = useState<AccessoryWithSpecs | null>(null);
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

  const resetForm = () => {
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

  const getAccessoryTypeInfo = (type: string | null | undefined) => {
    return ACCESSORY_TYPES.find(t => t.value === type) || ACCESSORY_TYPES.find(t => t.value === "altro");
  };

  const toggleCompatibleBrand = (brand: string) => {
    setFormData(prev => {
      const brands = prev.compatibleBrands.includes(brand)
        ? prev.compatibleBrands.filter(b => b !== brand)
        : [...prev.compatibleBrands, brand];
      return { ...prev, compatibleBrands: brands };
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Catalogo Accessori
          </h1>
          <p className="text-muted-foreground">
            Gestisci cover, caricatori, cavi, auricolari e altri accessori
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
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nessun accessorio nel catalogo</p>
              <p className="text-sm">Clicca "Aggiungi Accessorio" per iniziare</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accessorio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Compatibilità</TableHead>
                    <TableHead>Materiale</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessories.map((accessory) => {
                    const typeInfo = getAccessoryTypeInfo(accessory.specs?.accessoryType);
                    const TypeIcon = typeInfo?.icon || Package;
                    return (
                      <TableRow key={accessory.id} data-testid={`row-accessory-${accessory.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{accessory.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {accessory.brand && `${accessory.brand} • `}
                              {accessory.specs?.color || accessory.color}
                            </div>
                            <div className="text-xs text-muted-foreground">SKU: {accessory.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{typeInfo?.label || accessory.specs?.accessoryType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {accessory.specs?.isUniversal ? (
                            <Badge variant="secondary">Universale</Badge>
                          ) : accessory.specs?.compatibleBrands?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {accessory.specs.compatibleBrands.slice(0, 3).map(b => (
                                <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                              ))}
                              {accessory.specs.compatibleBrands.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{accessory.specs.compatibleBrands.length - 3}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{accessory.specs?.material || "-"}</span>
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
                    );
                  })}
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
                <Label htmlFor="name">Nome accessorio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Cover Silicone iPhone 15"
                  data-testid="input-accessory-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="es. CVR-IP15-BLK"
                  data-testid="input-accessory-sku"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessoryType">Tipo Accessorio *</Label>
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
                  placeholder="es. Silicone, Vetro temperato"
                  data-testid="input-accessory-material"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUniversal"
                  checked={formData.isUniversal}
                  onCheckedChange={(checked) => setFormData({ ...formData, isUniversal: checked as boolean })}
                  data-testid="checkbox-accessory-universal"
                />
                <Label htmlFor="isUniversal" className="text-sm cursor-pointer">
                  Compatibile con tutti i dispositivi (universale)
                </Label>
              </div>
            </div>

            {!formData.isUniversal && (
              <>
                <div className="space-y-2">
                  <Label>Compatibile con marche</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "Google", "OnePlus"].map(brand => (
                      <Badge
                        key={brand}
                        variant={formData.compatibleBrands.includes(brand) ? "default" : "outline"}
                        className="cursor-pointer toggle-elevate"
                        onClick={() => toggleCompatibleBrand(brand)}
                        data-testid={`badge-brand-${brand.toLowerCase()}`}
                      >
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compatibleModels">Modelli compatibili (separati da virgola)</Label>
                  <Input
                    id="compatibleModels"
                    value={formData.compatibleModels}
                    onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                    placeholder="es. iPhone 15, iPhone 15 Pro, iPhone 14"
                    data-testid="input-accessory-models"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Prezzo Vendita *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="es. 19.90"
                  data-testid="input-accessory-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Prezzo Costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="es. 8.00"
                  data-testid="input-accessory-cost"
                />
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingAccessory(null); }}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || !formData.unitPrice || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-accessory"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccessory ? "Salva Modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{accessoryToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
