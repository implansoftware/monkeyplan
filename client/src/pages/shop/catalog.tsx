import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Filter, Grid, List, Package } from "lucide-react";
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

  const { data: cartData } = useQuery<{ items: any[] }>({
    queryKey: ['/api/shop', resellerId, 'cart'],
    queryFn: async () => {
      const res = await fetch(`/api/shop/${resellerId}/cart`, { credentials: 'include' });
      if (!res.ok) return { items: [] };
      return res.json();
    }
  });

  const cartItemCount = cartData?.items?.length ?? 0;

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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-shop-title">Shop</h1>
          <p className="text-sm text-muted-foreground">Scopri i nostri prodotti</p>
        </div>

        <Button
          variant="outline"
          onClick={() => setLocation(`/shop/${resellerId}/cart`)}
          className="relative"
          data-testid="button-go-to-cart"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Carrello
          {cartItemCount > 0 && (
            <Badge variant="default" className="ml-2 no-default-hover-elevate no-default-active-elevate" data-testid="badge-cart-count">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
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
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-type-filter">
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
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
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
          {Array.from({ length: 8 }).map((_, i) =>
            viewMode === 'grid' ? (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Skeleton className="h-9 w-full" />
                </CardFooter>
              </Card>
            ) : (
              <Card key={i}>
                <CardContent className="p-4 flex gap-4 items-center">
                  <Skeleton className="w-24 h-20 rounded-md flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      ) : data?.products?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium mb-1">Nessun prodotto trovato</p>
          <p className="text-sm text-muted-foreground">Prova a modificare i filtri di ricerca</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
          {data?.products?.map((product) =>
            viewMode === 'grid' ? (
              <Card
                key={product.id}
                className="overflow-hidden cursor-pointer group"
                onClick={() => setLocation(`/shop/${resellerId}/products/${product.id}`)}
                data-testid={`card-product-${product.id}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 dark:from-muted dark:to-muted/40 flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 text-xs"
                  >
                    {product.productType}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-1">
                  <h3 className="font-semibold line-clamp-2 leading-snug" data-testid={`text-product-name-${product.id}`}>
                    {product.name}
                  </h3>
                  {product.brand && (
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  )}
                  <p className="text-lg font-bold pt-1" data-testid={`text-product-price-${product.id}`}>
                    {formatPrice((product as any).shopPrice || product.unitPrice || 0)}
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
              </Card>
            ) : (
              <Card
                key={product.id}
                className="cursor-pointer"
                onClick={() => setLocation(`/shop/${resellerId}/products/${product.id}`)}
                data-testid={`card-product-${product.id}`}
              >
                <CardContent className="p-4 flex gap-4 items-center flex-wrap">
                  <div className="w-24 h-20 rounded-md flex-shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted to-muted/60 dark:from-muted dark:to-muted/40 flex items-center justify-center rounded-md">
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" data-testid={`text-product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {product.productType}
                      </Badge>
                    </div>
                    {product.brand && (
                      <p className="text-sm text-muted-foreground">{product.brand}</p>
                    )}
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <p className="text-lg font-bold whitespace-nowrap" data-testid={`text-product-price-${product.id}`}>
                      {formatPrice((product as any).shopPrice || product.unitPrice || 0)}
                    </p>
                    <Button
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
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {data?.total && data.total > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {data.products.length} di {data.total} prodotti
        </p>
      )}
    </div>
  );
}
