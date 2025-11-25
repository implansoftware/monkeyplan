import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, InsertProduct } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Search, Pencil, Trash2, Package, Warehouse, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductWithStock {
  product: Product;
  stockByCenter: Array<{ repairCenterId: string; repairCenterName: string; quantity: number }>;
  totalStock: number;
}

const CATEGORIES = [
  { value: "display", label: "Display/Schermo" },
  { value: "batteria", label: "Batteria" },
  { value: "scheda_madre", label: "Scheda Madre" },
  { value: "fotocamera", label: "Fotocamera" },
  { value: "altoparlante", label: "Altoparlante/Speaker" },
  { value: "microfono", label: "Microfono" },
  { value: "connettore", label: "Connettore Ricarica" },
  { value: "tasto", label: "Tasti/Pulsanti" },
  { value: "cover", label: "Cover/Scocca" },
  { value: "vetro", label: "Vetro Posteriore" },
  { value: "sensore", label: "Sensori" },
  { value: "flex", label: "Flat/Flex Cable" },
  { value: "antenna", label: "Antenna" },
  { value: "vibrazione", label: "Motore Vibrazione" },
  { value: "sim_tray", label: "Carrello SIM" },
  { value: "accessorio", label: "Accessorio" },
  { value: "altro", label: "Altro" },
];

const BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "Vivo", "OnePlus",
  "Google", "Motorola", "LG", "Sony", "Nokia", "Realme", "Honor",
  "ASUS", "Lenovo", "HP", "Dell", "Acer", "Microsoft", "Universale", "Altro"
];

const COLORS = [
  "Nero", "Bianco", "Argento", "Oro", "Blu", "Verde", "Rosso",
  "Viola", "Rosa", "Grigio", "Trasparente", "Altro"
];

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [compatibleModels, setCompatibleModels] = useState<string[]>([]);
  const [newModel, setNewModel] = useState("");
  const { toast } = useToast();

  const { data: productsWithStock = [], isLoading } = useQuery<ProductWithStock[]>({
    queryKey: ["/api/products/with-stock"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      setDialogOpen(false);
      setCompatibleModels([]);
      toast({ title: "Prodotto creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      toast({ title: "Prodotto eliminato" });
    },
  });

  const addCompatibleModel = () => {
    if (newModel.trim() && !compatibleModels.includes(newModel.trim())) {
      setCompatibleModels([...compatibleModels, newModel.trim()]);
      setNewModel("");
    }
  };

  const removeCompatibleModel = (model: string) => {
    setCompatibleModels(compatibleModels.filter(m => m !== model));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const costPriceValue = formData.get("costPrice") as string;
    const warrantyValue = formData.get("warrantyMonths") as string;
    const minStockValue = formData.get("minStock") as string;
    
    const data: InsertProduct = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      category: formData.get("category") as string,
      productType: formData.get("productType") as any,
      description: formData.get("description") as string || undefined,
      brand: formData.get("brand") as string || undefined,
      compatibleModels: compatibleModels.length > 0 ? compatibleModels : undefined,
      color: formData.get("color") as string || undefined,
      costPrice: costPriceValue ? Math.round(parseFloat(costPriceValue) * 100) : undefined,
      unitPrice: Math.round(parseFloat(formData.get("unitPrice") as string) * 100),
      condition: formData.get("condition") as any,
      warrantyMonths: warrantyValue ? parseInt(warrantyValue) : undefined,
      supplier: formData.get("supplier") as string || undefined,
      supplierCode: formData.get("supplierCode") as string || undefined,
      minStock: minStockValue ? parseInt(minStockValue) : undefined,
      location: formData.get("location") as string || undefined,
    };
    createProductMutation.mutate(data);
  };

  const filteredProducts = productsWithStock.filter(({ product }) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return "-";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getConditionBadge = (condition: string | undefined) => {
    switch (condition) {
      case "nuovo": return <Badge variant="default">Nuovo</Badge>;
      case "ricondizionato": return <Badge variant="secondary">Ricondizionato</Badge>;
      case "usato": return <Badge variant="outline">Usato</Badge>;
      case "compatibile": return <Badge variant="outline">Compatibile</Badge>;
      default: return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getStockBadge = (totalStock: number, minStock: number | null | undefined) => {
    const min = minStock ?? 5;
    if (totalStock === 0) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Esaurito</Badge>;
    } else if (totalStock <= min) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" />Scorta Bassa</Badge>;
    }
    return <Badge variant="outline">{totalStock}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Prodotti</h1>
          <p className="text-muted-foreground">
            Gestisci il catalogo ricambi e accessori
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setCompatibleModels([]);
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-product">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Prodotto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Crea Nuovo Prodotto
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Info Base</TabsTrigger>
                    <TabsTrigger value="compatibility">Compatibilità</TabsTrigger>
                    <TabsTrigger value="pricing">Prezzi</TabsTrigger>
                    <TabsTrigger value="inventory">Magazzino</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Prodotto *</Label>
                        <Input 
                          id="name" 
                          name="name" 
                          required 
                          placeholder="es. Display LCD iPhone 14"
                          data-testid="input-name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU/Codice *</Label>
                        <Input 
                          id="sku" 
                          name="sku" 
                          required 
                          placeholder="es. LCD-IP14-001"
                          data-testid="input-sku" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria *</Label>
                        <Select name="category" defaultValue="display">
                          <SelectTrigger id="category" data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productType">Tipo Prodotto *</Label>
                        <Select name="productType" defaultValue="ricambio">
                          <SelectTrigger id="productType" data-testid="select-product-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ricambio">Ricambio</SelectItem>
                            <SelectItem value="accessorio">Accessorio</SelectItem>
                            <SelectItem value="dispositivo">Dispositivo</SelectItem>
                            <SelectItem value="consumabile">Consumabile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="condition">Condizione *</Label>
                        <Select name="condition" defaultValue="nuovo">
                          <SelectTrigger id="condition" data-testid="select-condition">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuovo">Nuovo Originale</SelectItem>
                            <SelectItem value="ricondizionato">Ricondizionato</SelectItem>
                            <SelectItem value="usato">Usato</SelectItem>
                            <SelectItem value="compatibile">Compatibile (aftermarket)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Colore</Label>
                        <Select name="color">
                          <SelectTrigger id="color" data-testid="select-color">
                            <SelectValue placeholder="Seleziona colore" />
                          </SelectTrigger>
                          <SelectContent>
                            {COLORS.map(color => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrizione</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Descrizione dettagliata del prodotto..."
                        rows={3}
                        data-testid="textarea-description" 
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="compatibility" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Select name="brand">
                        <SelectTrigger id="brand" data-testid="select-brand">
                          <SelectValue placeholder="Seleziona marca" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANDS.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Modelli Compatibili</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newModel}
                          onChange={(e) => setNewModel(e.target.value)}
                          placeholder="es. iPhone 14 Pro Max"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCompatibleModel();
                            }
                          }}
                          data-testid="input-compatible-model"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={addCompatibleModel}
                          data-testid="button-add-model"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {compatibleModels.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {compatibleModels.map((model) => (
                            <Badge 
                              key={model} 
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => removeCompatibleModel(model)}
                            >
                              {model} <span className="ml-1">×</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Aggiungi i modelli di dispositivi con cui questo ricambio è compatibile
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="costPrice">Prezzo Acquisto (€)</Label>
                        <Input
                          id="costPrice"
                          name="costPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          data-testid="input-cost-price"
                        />
                        <p className="text-xs text-muted-foreground">Costo dal fornitore</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">Prezzo Vendita (€) *</Label>
                        <Input
                          id="unitPrice"
                          name="unitPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          data-testid="input-price"
                        />
                        <p className="text-xs text-muted-foreground">Prezzo al cliente</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warrantyMonths">Garanzia (mesi)</Label>
                      <Input
                        id="warrantyMonths"
                        name="warrantyMonths"
                        type="number"
                        min="0"
                        defaultValue="3"
                        placeholder="3"
                        data-testid="input-warranty"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="inventory" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Fornitore</Label>
                        <Input
                          id="supplier"
                          name="supplier"
                          placeholder="Nome fornitore"
                          data-testid="input-supplier"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplierCode">Codice Fornitore</Label>
                        <Input
                          id="supplierCode"
                          name="supplierCode"
                          placeholder="Codice articolo fornitore"
                          data-testid="input-supplier-code"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minStock">Scorta Minima</Label>
                        <Input
                          id="minStock"
                          name="minStock"
                          type="number"
                          min="0"
                          defaultValue="5"
                          placeholder="5"
                          data-testid="input-min-stock"
                        />
                        <p className="text-xs text-muted-foreground">Alert quando scende sotto</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicazione</Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="es. Scaffale A3"
                          data-testid="input-location"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProductMutation.isPending}
                  data-testid="button-submit-product"
                >
                  {createProductMutation.isPending ? "Creazione..." : "Crea Prodotto"}
                </Button>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, SKU o marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-products"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun prodotto trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Condizione</TableHead>
                  <TableHead>Vendita</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Warehouse className="h-4 w-4" />
                      Giacenze
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(({ product, stockByCenter, totalStock }) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.brand && <span>{product.brand}</span>}
                          {product.brand && product.compatibleModels && product.compatibleModels.length > 0 && " - "}
                          {product.compatibleModels && product.compatibleModels.length > 0 && (
                            <span>
                              {product.compatibleModels.slice(0, 2).join(", ")}
                              {product.compatibleModels.length > 2 && ` +${product.compatibleModels.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>{getCategoryLabel(product.category)}</TableCell>
                    <TableCell>{getConditionBadge(product.condition)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(product.unitPrice)}</TableCell>
                    <TableCell>
                      {stockByCenter.length > 0 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              {getStockBadge(totalStock, product.minStock)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-semibold mb-2">Giacenze per Centro:</div>
                              {stockByCenter.map((stock) => (
                                <div key={stock.repairCenterId} className="flex justify-between gap-4 text-sm">
                                  <span>{stock.repairCenterName}</span>
                                  <span className="font-mono">{stock.quantity}</span>
                                </div>
                              ))}
                              <Separator className="my-2" />
                              <div className="flex justify-between gap-4 font-semibold">
                                <span>Totale</span>
                                <span className="font-mono">{totalStock}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Nessuna giacenza
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" data-testid={`button-edit-${product.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          disabled={deleteProductMutation.isPending}
                          data-testid={`button-delete-${product.id}`}
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
    </div>
  );
}
