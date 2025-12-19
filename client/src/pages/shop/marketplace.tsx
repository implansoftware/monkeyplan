import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Store, ShoppingCart, Star, Filter } from "lucide-react";

interface MarketplaceProduct {
  product: {
    id: string;
    name: string;
    description: string | null;
    sku: string;
    category: string;
    brand: string | null;
    imageUrl: string | null;
    unitPrice: number;
  };
  sellers: Array<{
    resellerId: string;
    resellerName: string;
    price: number;
    isPublished: boolean;
  }>;
  lowestPrice: number;
  sellerCount: number;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("price-asc");

  const { data: products, isLoading } = useQuery<MarketplaceProduct[]>({
    queryKey: ['/api/shop/marketplace'],
  });

  const categories = Array.from(new Set(products?.map(p => p.product.category) || []));

  const filteredProducts = products?.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.product.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return a.lowestPrice - b.lowestPrice;
      case "price-desc":
        return b.lowestPrice - a.lowestPrice;
      case "name-asc":
        return a.product.name.localeCompare(b.product.name);
      case "sellers":
        return b.sellerCount - a.sellerCount;
      default:
        return 0;
    }
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2 mb-2" data-testid="text-page-title">
            <Store className="h-8 w-8" />
            Marketplace
          </h1>
          <p className="text-muted-foreground">
            Esplora i prodotti di tutti i venditori e trova le migliori offerte
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca prodotti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40" data-testid="select-category">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44" data-testid="select-sort">
                <SelectValue placeholder="Ordina per" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Prezzo: basso-alto</SelectItem>
                <SelectItem value="price-desc">Prezzo: alto-basso</SelectItem>
                <SelectItem value="name-asc">Nome A-Z</SelectItem>
                <SelectItem value="sellers">Venditori</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nessun prodotto trovato</h3>
            <p className="text-muted-foreground">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((item) => (
              <Card 
                key={item.product.id} 
                className="overflow-hidden hover-elevate"
                data-testid={`card-product-${item.product.id}`}
              >
                <div className="aspect-square relative bg-muted">
                  {item.product.imageUrl ? (
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  {item.sellerCount > 1 && (
                    <Badge className="absolute top-2 right-2">
                      <Store className="h-3 w-3 mr-1" />
                      {item.sellerCount} venditori
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline" className="mb-2">{item.product.category}</Badge>
                    <h3 className="font-semibold line-clamp-2">{item.product.name}</h3>
                    {item.product.brand && (
                      <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold">{formatPrice(item.lowestPrice)}</p>
                      {item.sellerCount > 1 && (
                        <p className="text-sm text-muted-foreground">
                          da {item.sellerCount} venditor{item.sellerCount > 1 ? "i" : "e"}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 gap-2">
                  <Link href={`/marketplace/${item.product.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" data-testid={`button-view-${item.product.id}`}>
                      Dettagli
                    </Button>
                  </Link>
                  <Button size="icon" data-testid={`button-cart-${item.product.id}`}>
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
