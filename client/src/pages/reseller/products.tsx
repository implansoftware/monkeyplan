import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Search, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Product = {
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
};

export default function ResellerProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/reseller/products"],
  });

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);
  const brands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean) as string[];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesBrand = brandFilter === "all" || product.brand === brandFilter;
    return matchesSearch && matchesCategory && matchesBrand && product.isActive;
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
      <div>
        <h1 className="text-2xl font-semibold mb-2">Catalogo Prodotti</h1>
        <p className="text-muted-foreground">
          Visualizza il catalogo prodotti disponibili
        </p>
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
          <SelectTrigger className="w-[200px]" data-testid="select-category">
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
          <SelectTrigger className="w-[200px]" data-testid="select-brand">
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
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== "all" || brandFilter !== "all"
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
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Condizione</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                  <TableHead>Garanzia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
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
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.unitPrice)}
                    </TableCell>
                    <TableCell>
                      {product.warrantyMonths ? `${product.warrantyMonths} mesi` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Prodotti</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marche</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
