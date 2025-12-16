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
import { Smartphone, Search, Plus, Pencil, Trash2, Battery, HardDrive, Wifi, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SmartphoneSpecs, Product } from "@shared/schema";

type SmartphoneWithSpecs = Product & {
  specs: SmartphoneSpecs | null;
};

const STORAGE_OPTIONS = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
const GRADE_OPTIONS = [
  { value: "A+", label: "A+ - Come nuovo" },
  { value: "A", label: "A - Ottimo" },
  { value: "B", label: "B - Buono" },
  { value: "C", label: "C - Discreto" },
  { value: "D", label: "D - Danneggiato" },
];
const NETWORK_LOCK_OPTIONS = [
  { value: "unlocked", label: "Sbloccato" },
  { value: "locked", label: "Bloccato operatore" },
  { value: "icloud_locked", label: "Bloccato iCloud" },
];
const CONDITION_OPTIONS = [
  { value: "nuovo", label: "Nuovo" },
  { value: "ricondizionato", label: "Ricondizionato" },
  { value: "usato", label: "Usato" },
  { value: "difettoso", label: "Difettoso" },
];
const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Motorola", "Sony", "Nokia", "Altro"];

export default function SmartphoneCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSmartphone, setEditingSmartphone] = useState<SmartphoneWithSpecs | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [smartphoneToDelete, setSmartphoneToDelete] = useState<SmartphoneWithSpecs | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    brand: "",
    color: "",
    description: "",
    unitPrice: "",
    costPrice: "",
    condition: "ricondizionato",
    warrantyMonths: "12",
    storage: "128GB",
    ram: "",
    screenSize: "",
    batteryHealth: "",
    grade: "A",
    networkLock: "unlocked",
    imei: "",
    imei2: "",
    serialNumber: "",
    originalBox: false,
    accessories: [] as string[],
    notes: "",
  });

  const { data: smartphones = [], isLoading } = useQuery<SmartphoneWithSpecs[]>({
    queryKey: ["/api/smartphones"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/smartphones", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Smartphone aggiunto", description: "Il dispositivo è stato aggiunto al catalogo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => {
      await apiRequest("PATCH", `/api/products/${productId}`, data.product);
      await apiRequest("PATCH", `/api/smartphones/${productId}/specs`, data.specs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      setDialogOpen(false);
      setEditingSmartphone(null);
      resetForm();
      toast({ title: "Smartphone aggiornato", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("DELETE", `/api/smartphones/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      setDeleteDialogOpen(false);
      setSmartphoneToDelete(null);
      toast({ title: "Eliminato", description: "Lo smartphone è stato rimosso dal catalogo." });
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
      condition: "ricondizionato",
      warrantyMonths: "12",
      storage: "128GB",
      ram: "",
      screenSize: "",
      batteryHealth: "",
      grade: "A",
      networkLock: "unlocked",
      imei: "",
      imei2: "",
      serialNumber: "",
      originalBox: false,
      accessories: [],
      notes: "",
    });
  };

  const openEditDialog = (smartphone: SmartphoneWithSpecs) => {
    setEditingSmartphone(smartphone);
    setFormData({
      name: smartphone.name,
      sku: smartphone.sku,
      brand: smartphone.brand || "",
      color: smartphone.color || "",
      description: smartphone.description || "",
      unitPrice: smartphone.unitPrice ? (smartphone.unitPrice / 100).toString() : "",
      costPrice: smartphone.costPrice ? (smartphone.costPrice / 100).toString() : "",
      condition: smartphone.condition,
      warrantyMonths: smartphone.warrantyMonths?.toString() || "12",
      storage: smartphone.specs?.storage || "128GB",
      ram: smartphone.specs?.ram || "",
      screenSize: smartphone.specs?.screenSize || "",
      batteryHealth: smartphone.specs?.batteryHealth?.toString() || "",
      grade: smartphone.specs?.grade || "A",
      networkLock: smartphone.specs?.networkLock || "unlocked",
      imei: smartphone.specs?.imei || "",
      imei2: smartphone.specs?.imei2 || "",
      serialNumber: smartphone.specs?.serialNumber || "",
      originalBox: smartphone.specs?.originalBox || false,
      accessories: smartphone.specs?.accessories || [],
      notes: smartphone.specs?.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const product = {
      name: formData.name,
      sku: formData.sku,
      category: "smartphone",
      brand: formData.brand,
      color: formData.color,
      description: formData.description,
      unitPrice: Math.round(parseFloat(formData.unitPrice || "0") * 100),
      costPrice: formData.costPrice ? Math.round(parseFloat(formData.costPrice) * 100) : null,
      condition: formData.condition,
      warrantyMonths: parseInt(formData.warrantyMonths) || 12,
    };

    const specs = {
      storage: formData.storage,
      ram: formData.ram || null,
      screenSize: formData.screenSize || null,
      batteryHealth: formData.batteryHealth ? parseInt(formData.batteryHealth) : null,
      grade: formData.grade,
      networkLock: formData.networkLock,
      imei: formData.imei || null,
      imei2: formData.imei2 || null,
      serialNumber: formData.serialNumber || null,
      originalBox: formData.originalBox,
      accessories: formData.accessories.length > 0 ? formData.accessories : null,
      notes: formData.notes || null,
    };

    if (editingSmartphone) {
      updateMutation.mutate({ productId: editingSmartphone.id, data: { product, specs } });
    } else {
      createMutation.mutate({ product, specs });
    }
  };

  const filteredSmartphones = smartphones.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specs?.imei?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = brandFilter === "all" || s.brand === brandFilter;
    const matchesGrade = gradeFilter === "all" || s.specs?.grade === gradeFilter;
    return matchesSearch && matchesBrand && matchesGrade;
  });

  const getGradeColor = (grade: string | null | undefined) => {
    switch (grade) {
      case "A+": return "bg-green-500";
      case "A": return "bg-green-400";
      case "B": return "bg-yellow-500";
      case "C": return "bg-orange-500";
      case "D": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getNetworkLockBadge = (lock: string | null | undefined) => {
    switch (lock) {
      case "unlocked": return <Badge variant="outline" className="text-green-600 border-green-600">Sbloccato</Badge>;
      case "locked": return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Operatore</Badge>;
      case "icloud_locked": return <Badge variant="destructive">iCloud Lock</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Catalogo Smartphone
          </h1>
          <p className="text-muted-foreground">
            Gestisci il tuo catalogo di smartphone nuovi, ricondizionati e usati
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingSmartphone(null); setDialogOpen(true); }} data-testid="button-add-smartphone">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Smartphone
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Lista Smartphone ({filteredSmartphones.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, SKU o IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-smartphones"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-36" data-testid="select-brand-filter">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le marche</SelectItem>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-36" data-testid="select-grade-filter">
                <SelectValue placeholder="Grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i gradi</SelectItem>
                {GRADE_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
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
          ) : filteredSmartphones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Smartphone className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nessuno smartphone nel catalogo</p>
              <p className="text-sm">Clicca "Aggiungi Smartphone" per iniziare</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Stato Rete</TableHead>
                    <TableHead>Batteria</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSmartphones.map((smartphone) => (
                    <TableRow key={smartphone.id} data-testid={`row-smartphone-${smartphone.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{smartphone.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {smartphone.brand} {smartphone.color && `• ${smartphone.color}`}
                          </div>
                          <div className="text-xs text-muted-foreground">SKU: {smartphone.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          {smartphone.specs?.storage || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {smartphone.specs?.grade && (
                          <Badge className={`${getGradeColor(smartphone.specs.grade)} text-white`}>
                            {smartphone.specs.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getNetworkLockBadge(smartphone.specs?.networkLock)}
                      </TableCell>
                      <TableCell>
                        {smartphone.specs?.batteryHealth && (
                          <div className="flex items-center gap-1">
                            <Battery className="h-4 w-4 text-muted-foreground" />
                            {smartphone.specs.batteryHealth}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(smartphone.unitPrice / 100).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(smartphone)}
                            data-testid={`button-edit-smartphone-${smartphone.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSmartphoneToDelete(smartphone); setDeleteDialogOpen(true); }}
                            data-testid={`button-delete-smartphone-${smartphone.id}`}
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
            <DialogTitle>{editingSmartphone ? "Modifica Smartphone" : "Aggiungi Smartphone"}</DialogTitle>
            <DialogDescription>
              {editingSmartphone ? "Modifica i dettagli dello smartphone" : "Inserisci i dettagli del nuovo smartphone"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome dispositivo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. iPhone 14 Pro Max"
                  data-testid="input-smartphone-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="es. IP14PM-256-BLK"
                  data-testid="input-smartphone-sku"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger data-testid="select-smartphone-brand">
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
                <Label htmlFor="color">Colore</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="es. Space Black"
                  data-testid="input-smartphone-color"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condizione</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                  <SelectTrigger data-testid="select-smartphone-condition">
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storage">Storage *</Label>
                <Select value={formData.storage} onValueChange={(v) => setFormData({ ...formData, storage: v })}>
                  <SelectTrigger data-testid="select-smartphone-storage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grado</Label>
                <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                  <SelectTrigger data-testid="select-smartphone-grade">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="networkLock">Stato Rete</Label>
                <Select value={formData.networkLock} onValueChange={(v) => setFormData({ ...formData, networkLock: v })}>
                  <SelectTrigger data-testid="select-smartphone-network">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORK_LOCK_OPTIONS.map((n) => (
                      <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ram">RAM</Label>
                <Input
                  id="ram"
                  value={formData.ram}
                  onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                  placeholder="es. 8GB"
                  data-testid="input-smartphone-ram"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="screenSize">Display</Label>
                <Input
                  id="screenSize"
                  value={formData.screenSize}
                  onChange={(e) => setFormData({ ...formData, screenSize: e.target.value })}
                  placeholder="es. 6.7 pollici"
                  data-testid="input-smartphone-screen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batteryHealth">Batteria %</Label>
                <Input
                  id="batteryHealth"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryHealth}
                  onChange={(e) => setFormData({ ...formData, batteryHealth: e.target.value })}
                  placeholder="es. 95"
                  data-testid="input-smartphone-battery"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="imei">IMEI</Label>
                <Input
                  id="imei"
                  value={formData.imei}
                  onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  placeholder="es. 353012345678901"
                  data-testid="input-smartphone-imei"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imei2">IMEI 2 (Dual SIM)</Label>
                <Input
                  id="imei2"
                  value={formData.imei2}
                  onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                  placeholder="Opzionale"
                  data-testid="input-smartphone-imei2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Seriale</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="es. DNPX12345678"
                  data-testid="input-smartphone-serial"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Prezzo Vendita *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="es. 599.00"
                  data-testid="input-smartphone-price"
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
                  placeholder="es. 450.00"
                  data-testid="input-smartphone-cost"
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
                  data-testid="input-smartphone-warranty"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="originalBox"
                checked={formData.originalBox}
                onCheckedChange={(checked) => setFormData({ ...formData, originalBox: checked as boolean })}
                data-testid="checkbox-smartphone-box"
              />
              <Label htmlFor="originalBox" className="text-sm cursor-pointer">
                Include scatola originale
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note aggiuntive sul dispositivo..."
                rows={3}
                data-testid="textarea-smartphone-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingSmartphone(null); }}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || !formData.unitPrice || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-smartphone"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSmartphone ? "Salva Modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{smartphoneToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => smartphoneToDelete && deleteMutation.mutate(smartphoneToDelete.id)}
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
