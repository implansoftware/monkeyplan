import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Package, Search, Filter, Eye, Boxes, AlertTriangle
} from "lucide-react";
import type { Product, WarehouseStock } from "@shared/schema";

type EnrichedStock = WarehouseStock & { 
  product: { id: string; name: string; sku: string; category: string; imageUrl?: string | null } | null 
};

type ProductWithStock = Product & {
  myStock?: number;
};

export default function RepairCenterProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: myWarehouse } = useQuery<{ id: string }>({
    queryKey: ["/api/my-warehouse"],
  });

  const { data: stock = [] } = useQuery<EnrichedStock[]>({
    queryKey: ["/api/warehouses", myWarehouse?.id, "stock"],
    queryFn: async () => {
      if (!myWarehouse?.id) return [];
      const res = await fetch(`/api/warehouses/${myWarehouse.id}/stock`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!myWarehouse?.id,
  });

  const stockMap = new Map(stock.map(s => [s.productId, s.quantity]));

  const productsWithStock: ProductWithStock[] = products.map(p => ({
    ...p,
    myStock: stockMap.get(p.id) || 0
  }));

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = productsWithStock.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalStock = productsWithStock.reduce((sum, p) => sum + (p.myStock || 0), 0);
  const lowStockCount = productsWithStock.filter(p => p.minStock && (p.myStock || 0) < p.minStock).length;

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-products-title">Catalogo Ricambi</h1>
          <p className="text-sm text-muted-foreground">Visualizza i ricambi disponibili e il tuo stock</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prodotti Totali</p>
                <p className="text-2xl font-bold" data-testid="text-products-count">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Boxes className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mio Stock Totale</p>
                <p className="text-2xl font-bold" data-testid="text-total-stock">{totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sotto Scorta</p>
                <p className="text-2xl font-bold" data-testid="text-low-stock">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per nome, SKU o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-products"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le categorie</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Prodotto</th>
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-left p-4 font-medium">Categoria</th>
                  <th className="text-left p-4 font-medium">Marca</th>
                  <th className="text-right p-4 font-medium">Mio Stock</th>
                  <th className="text-right p-4 font-medium">Prezzo</th>
                  <th className="text-center p-4 font-medium">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                      Nessun prodotto trovato
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-product-${product.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{product.sku}</td>
                      <td className="p-4">
                        <Badge variant="outline">{product.category || "N/D"}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{product.brand || "-"}</td>
                      <td className="p-4 text-right">
                        <Badge variant={product.myStock && product.myStock > 0 ? "default" : "secondary"}>
                          {product.myStock || 0}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {product.unitPrice ? `€${(product.unitPrice / 100).toFixed(2)}` : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => setSelectedProduct(product)}
                          data-testid={`button-view-${product.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettaglio Prodotto</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {selectedProduct.imageUrl ? (
                  <img 
                    src={selectedProduct.imageUrl} 
                    alt={selectedProduct.name}
                    className="w-24 h-24 rounded object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded bg-muted flex items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                  {selectedProduct.brand && (
                    <p className="text-sm text-muted-foreground">Marca: {selectedProduct.brand}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{selectedProduct.category || "N/D"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo Prodotto</p>
                  <p className="font-medium">{selectedProduct.productType || "N/D"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prezzo Unitario</p>
                  <p className="font-medium">
                    {selectedProduct.unitPrice ? `€${(selectedProduct.unitPrice / 100).toFixed(2)}` : "N/D"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mio Stock</p>
                  <p className="font-medium">{selectedProduct.myStock || 0}</p>
                </div>
              </div>

              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrizione</p>
                  <p className="text-sm">{selectedProduct.description}</p>
                </div>
              )}

              {selectedProduct.compatibleModels && selectedProduct.compatibleModels.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Modelli Compatibili</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedProduct.compatibleModels.map((model, idx) => (
                      <Badge key={idx} variant="secondary">{model}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
