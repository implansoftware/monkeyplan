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
import { Package, Search, Tag, Plus, Pencil, Trash2, User, Globe, Warehouse, Save, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type StockByCenter = {
  repairCenterId: string;
  repairCenterName: string;
  quantity: number;
};

type ProductWithStock = {
  product: EnrichedProduct;
  stockByCenter: StockByCenter[];
  totalStock: number;
};

type EnrichedProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  productType: string;
  description: string | null;
  brand: string | null;
  compatibleModels: string[] | null;
  color: string | null;
  costPrice: number | null;
  unitPrice: number;
  condition: string;
  warrantyMonths: number | null;
  supplier: string | null;
  minStock: number | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
  isOwn: boolean;
  customPrice: { id: string; priceCents: number; costPriceCents: number | null } | null;
  effectivePrice: number;
  effectiveCostPrice: number | null;
};

const CATEGORIES = [
  { value: "display", label: "Display/Schermo" },
  { value: "batteria", label: "Batteria" },
  { value: "scheda_madre", label: "Scheda Madre" },
  { value: "fotocamera", label: "Fotocamera" },
  { value: "altoparlante", label: "Altoparlante/Speaker" },
  { value: "microfono", label: "Microfono" },
  { value: "connettore", label: "Connettore Ricarica" },
  { value: "cover", label: "Cover/Scocca" },
  { value: "accessorio", label: "Accessorio" },
  { value: "altro", label: "Altro" },
];

const BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus",
  "Google", "Motorola", "Sony", "Nokia", "Universale", "Altro"
];

export default function ResellerProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EnrichedProduct | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<EnrichedProduct | null>(null);
  const [stockValues, setStockValues] = useState<Record<string, number>>({});
  const [stockByCenters, setStockByCenters] = useState<StockByCenter[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery<EnrichedProduct[]>({
    queryKey: ["/api/reseller/products"],
  });

  const { data: productsWithStock = [] } = useQuery<ProductWithStock[]>({
    queryKey: ["/api/reseller/products/with-stock"],
  });

  const stockMap = new Map<string, { totalStock: number; stockByCenter: StockByCenter[] }>();
  productsWithStock.forEach(item => {
    stockMap.set(item.product.id, { totalStock: item.totalStock, stockByCenter: item.stockByCenter });
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/reseller/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/products"] });
      setDialogOpen(false);
      toast({ title: "Prodotto creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/reseller/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/products"] });
      setEditDialogOpen(false);
      setEditingProduct(null);
      toast({ title: "Prodotto aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/reseller/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/products"] });
      toast({ title: "Prodotto eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, repairCenterId, quantity, notes }: { productId: string; repairCenterId: string; quantity: number; notes?: string }) => {
      const res = await apiRequest("POST", `/api/reseller/products/${productId}/stock`, { repairCenterId, quantity, notes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/products/with-stock"] });
      toast({ title: "Stock aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const openStockDialog = async (product: EnrichedProduct) => {
    setStockProduct(product);
    setLoadingStock(true);
    setStockDialogOpen(true);
    
    try {
      const res = await fetch(`/api/reseller/products/${product.id}/stock`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data: StockByCenter[] = await res.json();
        setStockByCenters(data);
        const initialValues: Record<string, number> = {};
        data.forEach(s => {
          initialValues[s.repairCenterId] = s.quantity;
        });
        setStockValues(initialValues);
      } else {
        toast({ title: "Errore", description: "Impossibile caricare i dati stock", variant: "destructive" });
        setStockByCenters([]);
      }
    } catch (error) {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" });
      setStockByCenters([]);
    } finally {
      setLoadingStock(false);
    }
  };

  const saveAllStockChanges = async () => {
    if (!stockProduct) return;
    if (stockByCenters.length === 0) return;

    const promises = stockByCenters.map(s => {
      const newQuantity = stockValues[s.repairCenterId] ?? s.quantity;
      if (newQuantity !== s.quantity) {
        return updateStockMutation.mutateAsync({
          productId: stockProduct.id,
          repairCenterId: s.repairCenterId,
          quantity: newQuantity,
        });
      }
      return Promise.resolve();
    });

    await Promise.all(promises);
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/products/with-stock"] });
    setStockDialogOpen(false);
    setStockProduct(null);
    setStockValues({});
    setStockByCenters([]);
  };

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  const brands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean) as string[];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
    const matchesOwnership = ownershipFilter === "all" || 
      (ownershipFilter === "own" && product.isOwn) ||
      (ownershipFilter === "global" && !product.isOwn);
    return matchesSearch && matchesCategory && matchesBrand && matchesOwnership && product.isActive;
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getConditionBadge = (condition: string) => {
    switch (condition) {
      case "nuovo":
        return <Badge>Nuovo</Badge>;
      case "ricondizionato":
        return <Badge variant="secondary">Ricondizionato</Badge>;
      case "usato":
        return <Badge variant="outline">Usato</Badge>;
      default:
        return <Badge variant="outline">{condition}</Badge>;
    }
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      productType: formData.get("productType") as string || "ricambio",
      condition: formData.get("condition") as string || "nuovo",
      brand: formData.get("brand") as string || null,
      color: formData.get("color") as string || null,
      description: formData.get("description") as string || null,
      unitPrice: Math.round(parseFloat(formData.get("unitPrice") as string) * 100),
      costPrice: formData.get("costPrice") ? Math.round(parseFloat(formData.get("costPrice") as string) * 100) : null,
      warrantyMonths: formData.get("warrantyMonths") ? parseInt(formData.get("warrantyMonths") as string) : null,
    };
    
    createProductMutation.mutate(data);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      productType: formData.get("productType") as string,
      condition: formData.get("condition") as string,
      brand: formData.get("brand") as string || null,
      color: formData.get("color") as string || null,
      description: formData.get("description") as string || null,
      unitPrice: Math.round(parseFloat(formData.get("unitPrice") as string) * 100),
      costPrice: formData.get("costPrice") ? Math.round(parseFloat(formData.get("costPrice") as string) * 100) : null,
      warrantyMonths: formData.get("warrantyMonths") ? parseInt(formData.get("warrantyMonths") as string) : null,
    };
    
    updateProductMutation.mutate({ id: editingProduct.id, data });
  };

  const ownProducts = products.filter(p => p.isOwn);
  const globalProducts = products.filter(p => !p.isOwn);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Catalogo Prodotti</h1>
          <p className="text-muted-foreground">
            Visualizza il catalogo prodotti disponibili
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Catalogo Prodotti</h1>
          <p className="text-muted-foreground">
            Visualizza i prodotti del catalogo e gestisci i tuoi prodotti personalizzati
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-new-product">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Prodotto
        </Button>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca prodotto, SKU o marca..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-products"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category">
            <Tag className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-brand">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le marche</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
          <SelectTrigger className="w-[150px]" data-testid="select-ownership">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="own">I miei prodotti</SelectItem>
            <SelectItem value="global">Catalogo globale</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== "all" || brandFilter !== "all" || ownershipFilter !== "all"
                ? "Nessun prodotto trovato con i filtri applicati."
                : "Nessun prodotto nel catalogo."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Prodotti ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Condizione</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Garanzia</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          {product.isOwn ? (
                            <Badge variant="default" className="gap-1">
                              <User className="h-3 w-3" />
                              Mio
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Globe className="h-3 w-3" />
                              Globale
                            </Badge>
                          )}
                        </TooltipTrigger>
                        <TooltipContent>
                          {product.isOwn 
                            ? "Prodotto creato da te" 
                            : product.customPrice 
                              ? "Prodotto del catalogo con prezzo personalizzato"
                              : "Prodotto del catalogo globale"
                          }
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {product.compatibleModels && product.compatibleModels.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {product.compatibleModels.slice(0, 3).join(", ")}
                            {product.compatibleModels.length > 3 && ` +${product.compatibleModels.length - 3}`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{product.brand || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category}</Badge>
                    </TableCell>
                    <TableCell>{getConditionBadge(product.condition)}</TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="font-medium">{formatCurrency(product.effectivePrice)}</div>
                        {!product.isOwn && product.customPrice && (
                          <div className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.unitPrice)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.isOwn ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1"
                              onClick={() => openStockDialog(product)}
                              data-testid={`button-stock-${product.id}`}
                            >
                              <Warehouse className="h-3 w-3" />
                              <span className="font-medium">{stockMap.get(product.id)?.totalStock ?? 0}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Gestisci stock nei tuoi centri</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.warrantyMonths ? `${product.warrantyMonths} mesi` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.isOwn && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingProduct(product);
                              setEditDialogOpen(true);
                            }}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Eliminare questo prodotto?")) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            disabled={deleteProductMutation.isPending}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Prodotti</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">I Miei Prodotti</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ownProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catalogo Globale</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalProducts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorie</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog Nuovo Prodotto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuovo Prodotto
            </DialogTitle>
            <DialogDescription>
              Crea un nuovo prodotto personalizzato per il tuo catalogo
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <form onSubmit={handleCreateSubmit} className="space-y-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Prodotto *</Label>
                  <Input id="name" name="name" required data-testid="input-create-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU/Codice *</Label>
                  <Input id="sku" name="sku" required data-testid="input-create-sku" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select name="category" defaultValue="altro">
                    <SelectTrigger data-testid="select-create-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Select name="brand">
                    <SelectTrigger data-testid="select-create-brand">
                      <SelectValue placeholder="Seleziona marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRANDS.map(brand => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condizione *</Label>
                  <Select name="condition" defaultValue="nuovo">
                    <SelectTrigger data-testid="select-create-condition">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nuovo">Nuovo</SelectItem>
                      <SelectItem value="ricondizionato">Ricondizionato</SelectItem>
                      <SelectItem value="usato">Usato</SelectItem>
                      <SelectItem value="compatibile">Compatibile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyMonths">Garanzia (mesi)</Label>
                  <Input id="warrantyMonths" name="warrantyMonths" type="number" min="0" data-testid="input-create-warranty" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Prezzo Vendita (EUR) *</Label>
                  <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" required data-testid="input-create-price" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Prezzo Costo (EUR)</Label>
                  <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0" data-testid="input-create-cost" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea id="description" name="description" rows={3} data-testid="textarea-create-description" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createProductMutation.isPending} data-testid="button-submit-create">
                  {createProductMutation.isPending ? "Creazione..." : "Crea Prodotto"}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Prodotto */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Modifica Prodotto
            </DialogTitle>
            <DialogDescription>
              Modifica i dettagli del tuo prodotto
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <ScrollArea className="max-h-[70vh]">
              <form onSubmit={handleEditSubmit} className="space-y-4 pr-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Nome Prodotto *</Label>
                    <Input id="edit-name" name="name" required defaultValue={editingProduct.name} data-testid="input-edit-name" />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU/Codice</Label>
                    <Input disabled value={editingProduct.sku} className="bg-muted" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Categoria *</Label>
                    <Select name="category" defaultValue={editingProduct.category}>
                      <SelectTrigger data-testid="select-edit-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Marca</Label>
                    <Select name="brand" defaultValue={editingProduct.brand || undefined}>
                      <SelectTrigger data-testid="select-edit-brand">
                        <SelectValue placeholder="Seleziona marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {BRANDS.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-condition">Condizione *</Label>
                    <Select name="condition" defaultValue={editingProduct.condition}>
                      <SelectTrigger data-testid="select-edit-condition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nuovo">Nuovo</SelectItem>
                        <SelectItem value="ricondizionato">Ricondizionato</SelectItem>
                        <SelectItem value="usato">Usato</SelectItem>
                        <SelectItem value="compatibile">Compatibile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-warrantyMonths">Garanzia (mesi)</Label>
                    <Input 
                      id="edit-warrantyMonths" 
                      name="warrantyMonths" 
                      type="number" 
                      min="0" 
                      defaultValue={editingProduct.warrantyMonths || ""} 
                      data-testid="input-edit-warranty" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-unitPrice">Prezzo Vendita (EUR) *</Label>
                    <Input 
                      id="edit-unitPrice" 
                      name="unitPrice" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      required 
                      defaultValue={(editingProduct.unitPrice / 100).toFixed(2)} 
                      data-testid="input-edit-price" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-costPrice">Prezzo Costo (EUR)</Label>
                    <Input 
                      id="edit-costPrice" 
                      name="costPrice" 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      defaultValue={editingProduct.costPrice ? (editingProduct.costPrice / 100).toFixed(2) : ""} 
                      data-testid="input-edit-cost" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Descrizione</Label>
                  <Textarea 
                    id="edit-description" 
                    name="description" 
                    rows={3} 
                    defaultValue={editingProduct.description || ""} 
                    data-testid="textarea-edit-description" 
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={updateProductMutation.isPending} data-testid="button-submit-edit">
                    {updateProductMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </div>
              </form>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Gestione Stock */}
      <Dialog open={stockDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setStockDialogOpen(false);
          setStockProduct(null);
          setStockValues({});
          setStockByCenters([]);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Gestione Stock
            </DialogTitle>
            <DialogDescription>
              {stockProduct && (
                <>Modifica le quantità di <strong>{stockProduct.name}</strong> nei tuoi centri di riparazione</>
              )}
            </DialogDescription>
          </DialogHeader>
          {stockProduct && (
            <div className="space-y-4">
              {loadingStock ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Caricamento...</span>
                </div>
              ) : stockByCenters.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Warehouse className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nessun centro di riparazione configurato.</p>
                  <p className="text-sm">Crea prima un centro di riparazione dalla sezione dedicata.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stockByCenters.map(center => (
                    <div key={center.repairCenterId} className="flex items-center justify-between gap-4 p-3 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium">{center.repairCenterName}</div>
                        <div className="text-xs text-muted-foreground">
                          Attuale: {center.quantity} unità
                        </div>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="0"
                          value={stockValues[center.repairCenterId] ?? center.quantity}
                          onChange={(e) => setStockValues({
                            ...stockValues,
                            [center.repairCenterId]: parseInt(e.target.value) || 0
                          })}
                          className="text-center"
                          data-testid={`input-stock-${center.repairCenterId}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStockDialogOpen(false);
                    setStockProduct(null);
                    setStockValues({});
                    setStockByCenters([]);
                  }}
                >
                  Annulla
                </Button>
                <Button 
                  onClick={saveAllStockChanges}
                  disabled={updateStockMutation.isPending || loadingStock || stockByCenters.length === 0}
                  data-testid="button-save-stock"
                >
                  {updateStockMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salva Stock
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
