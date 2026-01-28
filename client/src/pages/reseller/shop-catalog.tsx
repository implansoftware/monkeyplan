import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Store, Eye, EyeOff, DollarSign, Warehouse, ShoppingBag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CatalogProduct {
  product: Product;
  assignment: {
    id: string;
    isPublished: boolean;
    customPriceCents: number | null;
    inheritedFrom: string | null;
  } | null;
  isOwn: boolean;
  effectivePrice: number;
  availableQuantity?: number;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function ResellerShopCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const { toast } = useToast();

  const { data: catalog, isLoading } = useQuery<CatalogProduct[]>({
    queryKey: ['/api/reseller/shop-catalog'],
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ productId, publish }: { productId: string; publish: boolean }) => {
      const endpoint = publish 
        ? `/api/reseller/catalog/${productId}/publish` 
        : `/api/reseller/catalog/${productId}/unpublish`;
      await apiRequest('POST', endpoint);
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Stato pubblicazione aggiornato" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/shop-catalog'] });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ productId, priceCents }: { productId: string; priceCents: number | null }) => {
      await apiRequest('PATCH', `/api/reseller/catalog/${productId}/price`, { priceCents });
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Prezzo aggiornato" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/shop-catalog'] });
      setPriceDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredCatalog = catalog?.filter(item =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Per prodotti propri usa product.isActive, per assegnati usa assignment.isPublished
  const isProductPublished = (item: CatalogProduct) => {
    if (item.isOwn) return item.product.isActive;
    return item.assignment?.isPublished ?? false;
  };
  const publishedProducts = filteredCatalog.filter(isProductPublished);
  const unpublishedProducts = filteredCatalog.filter(p => !isProductPublished(p));

  const handleOpenPriceDialog = (item: CatalogProduct) => {
    setSelectedProduct(item);
    setCustomPrice(item.assignment?.customPriceCents 
      ? (item.assignment.customPriceCents / 100).toString() 
      : "");
    setPriceDialogOpen(true);
  };

  const handleSavePrice = () => {
    if (!selectedProduct) return;
    const priceCents = customPrice ? Math.round(parseFloat(customPrice) * 100) : null;
    updatePriceMutation.mutate({ 
      productId: selectedProduct.product.id, 
      priceCents 
    });
  };

  const ProductRow = ({ item }: { item: CatalogProduct }) => (
    <TableRow data-testid={`row-product-${item.product.id}`}>
      <TableCell>
        <div className="flex flex-wrap items-center gap-3">
          {item.product.imageUrl ? (
            <img src={item.product.imageUrl} alt={item.product.name} className="w-10 h-10 object-cover rounded" />
          ) : (
            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">{item.product.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              {item.product.brand && <span className="text-sm text-muted-foreground">{item.product.brand}</span>}
              {item.isOwn ? (
                <Badge variant="outline">Proprio</Badge>
              ) : item.assignment?.inheritedFrom ? (
                <Badge variant="secondary">Ereditato</Badge>
              ) : (
                <Badge variant="secondary">Globale</Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{item.product.sku}</TableCell>
      <TableCell>
        <Badge variant="outline">{item.product.category}</Badge>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{formatPrice(item.effectivePrice)}</p>
          {item.assignment?.customPriceCents && (
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(item.product.unitPrice)}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium" data-testid={`text-stock-${item.product.id}`}>
            {item.availableQuantity ?? 0}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-2">
          <Switch
            checked={isProductPublished(item)}
            onCheckedChange={(checked) => togglePublishMutation.mutate({
              productId: item.product.id,
              publish: checked,
            })}
            disabled={togglePublishMutation.isPending}
            data-testid={`switch-publish-${item.product.id}`}
          />
          {isProductPublished(item) ? (
            <Eye className="h-4 w-4 text-green-500" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenPriceDialog(item)}
          data-testid={`button-price-${item.product.id}`}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          Prezzo
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">Catalogo Negozio</h1>
              <p className="text-white/80 text-sm">Prodotti disponibili per la vendita</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>I Tuoi Prodotti</CardTitle>
              <CardDescription>
                Pubblica i prodotti assegnati e imposta prezzi personalizzati
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-12">
              <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nessun prodotto in stock</h3>
              <p className="text-muted-foreground">
                Carica prodotti nel tuo magazzino per vederli qui nel catalogo shop
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  Tutti ({filteredCatalog.length})
                </TabsTrigger>
                <TabsTrigger value="published">
                  <Eye className="h-4 w-4 mr-1" />
                  Pubblicati ({publishedProducts.length})
                </TabsTrigger>
                <TabsTrigger value="unpublished">
                  <EyeOff className="h-4 w-4 mr-1" />
                  Non pubblicati ({unpublishedProducts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prodotto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Prezzo</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Pubblicato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCatalog.map((item) => (
                      <ProductRow key={item.product.id} item={item} />
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="published">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prodotto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Prezzo</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Pubblicato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {publishedProducts.map((item) => (
                      <ProductRow key={item.product.id} item={item} />
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="unpublished">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prodotto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Prezzo</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Pubblicato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpublishedProducts.map((item) => (
                      <ProductRow key={item.product.id} item={item} />
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Imposta Prezzo Personalizzato</DialogTitle>
            <DialogDescription>
              {selectedProduct?.product.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Prezzo base</Label>
              <p className="text-lg font-semibold">
                {selectedProduct && formatPrice(selectedProduct.product.unitPrice)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-price">Prezzo personalizzato (lascia vuoto per usare il prezzo base)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  EUR
                </span>
                <Input
                  id="custom-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-12"
                  data-testid="input-custom-price"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleSavePrice}
              disabled={updatePriceMutation.isPending}
              data-testid="button-save-price"
            >
              Salva Prezzo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
