import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Filter, Grid, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

export default function ShopCatalog() {
  const { resellerId } = useParams<{ resellerId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const { data, isLoading } = useQuery<{ products: Product[]; total: number }>({
    queryKey: ['/api/shop', resellerId, 'products', { search, type: typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/shop/${resellerId}/products?${params}`);
      if (!res.ok) throw new Error('Errore nel caricamento prodotti');
      return res.json();
    }
  });
  
  const addToCart = async (productId: string) => {
    try {
      await apiRequest('POST', `/api/shop/${resellerId}/cart/items`, { productId, quantity: 1 });
      toast({ title: "Prodotto aggiunto al carrello" });
      queryClient.invalidateQueries({ queryKey: ['/api/shop', resellerId, 'cart'] });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };
  
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-shop-title">Shop</h1>
          <p className="text-muted-foreground">Scopri i nostri prodotti</p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/shop/${resellerId}/cart`)}
          data-testid="button-go-to-cart"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Carrello
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca prodotti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tipo prodotto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="dispositivo">Dispositivi</SelectItem>
            <SelectItem value="accessorio">Accessori</SelectItem>
            <SelectItem value="ricambio">Ricambi</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.products?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Nessun prodotto trovato</p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {data?.products?.map((product) => (
            <Card 
              key={product.id} 
              className="overflow-hidden hover-elevate cursor-pointer"
              onClick={() => setLocation(`/shop/${resellerId}/products/${product.id}`)}
              data-testid={`card-product-${product.id}`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">Nessuna immagine</div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <Badge variant="secondary">{product.productType}</Badge>
                    </div>
                    {product.brand && (
                      <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
                    )}
                    <p className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                      {formatPrice(product.unitPrice || 0)}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                      }}
                      data-testid={`button-add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Aggiungi al carrello
                    </Button>
                  </CardFooter>
                </>
              ) : (
                <CardContent className="p-4 flex gap-4">
                  <div className="w-24 h-24 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <Badge variant="secondary">{product.productType}</Badge>
                    </div>
                    {product.brand && (
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    )}
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xl font-bold text-primary" data-testid={`text-product-price-${product.id}`}>
                        {formatPrice(product.unitPrice || 0)}
                      </p>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product.id);
                        }}
                        data-testid={`button-add-to-cart-${product.id}`}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Aggiungi
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {data?.total && data.total > 0 && (
        <p className="text-center text-muted-foreground">
          {data.products.length} di {data.total} prodotti
        </p>
      )}
    </div>
  );
}
