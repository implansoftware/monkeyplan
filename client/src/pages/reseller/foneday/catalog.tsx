import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Package, Search, ShoppingCart, Plus, Minus, Loader2, Settings, AlertTriangle, Image, RefreshCw, CheckCircle2, Clock, XCircle
} from "lucide-react";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type FonedayProduct = {
  id: string | number;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category_id: number;
  category_name: string;
  price: number;
  stock: number;
  ean: string;
  image_url: string;
  description: string;
  warranty_months: number;
  quality?: string;
  model_codes?: string[];
};

type FonedayCartItem = {
  sku: string;
  quantity: number;
  title: string;
  price: string;
  note: string | null;
};

type FonedayCart = {
  cart: FonedayCartItem[];
};

type FonedayCredential = {
  id: string;
  isActive: boolean;
};

type CacheStatus = {
  hasCache: boolean;
  syncStatus: "success" | "syncing" | "error" | null;
  lastSyncAt: string | null;
  expiresAt: string | null;
  totalProducts: number;
  syncDurationMs: number | null;
  syncError: string | null;
  isExpired: boolean;
};

export default function FonedayCatalogPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accumulatedProducts, setAccumulatedProducts] = useState<FonedayProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const perPage = 20;

  const { data: credential, isLoading: loadingCredential } = useQuery<FonedayCredential | null>({
    queryKey: ["/api/foneday/credentials"],
  });

  const { data: cacheStatus, refetch: refetchCacheStatus } = useQuery<CacheStatus>({
    queryKey: ["/api/foneday/catalog/cache-status"],
    enabled: !!credential?.isActive,
    refetchInterval: (query) => {
      const data = query.state.data as CacheStatus | undefined;
      return data?.syncStatus === "syncing" ? 2000 : false;
    },
  });

  const syncCacheMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/foneday/catalog/sync", {});
      return res.json();
    },
    onMutate: () => {
      toast({ title: "Sincronizzazione avviata", description: "Questo potrebbe richiedere qualche minuto..." });
    },
    onSuccess: (data) => {
      refetchCacheStatus();
      queryClient.invalidateQueries({ queryKey: ["/api/foneday/catalog/products"] });
      toast({ 
        title: "Sincronizzazione completata", 
        description: `${data.totalProducts} prodotti caricati in ${Math.round(data.syncDurationMs / 1000)}s` 
      });
    },
    onError: (error: Error) => {
      refetchCacheStatus();
      toast({ title: "Errore sincronizzazione", description: error.message, variant: "destructive" });
    },
  });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearch) {
        setAccumulatedProducts([]);
        setCurrentPage(1);
        setTotalProducts(0);
      }
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, debouncedSearch]);

  const { data: productsData, isLoading: loadingProducts, isFetching } = useQuery<{
    products: FonedayProduct[];
    total: number;
    page: number;
    per_page: number;
  }>({
    queryKey: ["/api/foneday/catalog/products", debouncedSearch, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("search", debouncedSearch);
      params.append("page", String(currentPage));
      params.append("per_page", String(perPage));
      
      const res = await fetch(`/api/foneday/catalog/products?${params}`);
      if (!res.ok) throw new Error("Errore nel caricamento prodotti");
      return res.json();
    },
    enabled: !!credential?.isActive && debouncedSearch.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (productsData) {
      setTotalProducts(productsData.total);
      if (currentPage === 1) {
        setAccumulatedProducts(productsData.products);
      } else {
        setAccumulatedProducts(prev => {
          const existingSkus = new Set(prev.map(p => p.sku));
          const newProducts = productsData.products.filter(p => !existingSkus.has(p.sku));
          return [...prev, ...newProducts];
        });
      }
      setIsLoadingMore(false);
    }
  }, [productsData, currentPage]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setCurrentPage(prev => prev + 1);
  };

  const hasMoreProducts = accumulatedProducts.length < totalProducts;

  const { data: cart, refetch: refetchCart } = useQuery<FonedayCart>({
    queryKey: ["/api/foneday/cart"],
    enabled: !!credential?.isActive,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ sku, quantity, productName, productPrice }: { sku: string; quantity: number; productName: string; productPrice: number }) => {
      const res = await apiRequest("POST", "/api/foneday/cart/add", {
        sku,
        quantity,
        productName,
        productPrice,
      });
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
      toast({ title: "Aggiunto al carrello" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(numPrice);
  };

  const handleQuantityChange = (sku: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[sku] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [sku]: newQty };
    });
  };

  const handleAddToCart = (product: FonedayProduct) => {
    const qty = quantities[product.sku] || 1;
    addToCartMutation.mutate({ 
      sku: product.sku, 
      quantity: qty,
      productName: product.name,
      productPrice: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
    });
    setQuantities((prev) => ({ ...prev, [product.sku]: 1 }));
  };


  if (loadingCredential) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!credential || !credential.isActive) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Credenziali Foneday non configurate. Configura il tuo API Token per continuare.</span>
            <Link href="/reseller/foneday/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configura
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Catalogo Foneday</h1>
              <p className="text-sm text-muted-foreground">Sfoglia e ordina ricambi dal catalogo Foneday</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/reseller/foneday/cart">
              <Button variant="outline" className="shadow-lg shadow-primary/25" data-testid="button-view-cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrello
                {cart && cart.cart && cart.cart.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {cart.cart.reduce((sum: number, item: FonedayCartItem) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </Button>
            </Link>
            <Link href="/reseller/foneday/settings">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Search className="h-5 w-5" />
                Cerca Prodotti
              </CardTitle>
              <CardDescription>
                Cerca per nome, SKU, modello o descrizione
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {cacheStatus && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {cacheStatus.syncStatus === "success" && !cacheStatus.isExpired && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">
                        {cacheStatus.totalProducts} prodotti in cache
                      </span>
                      {cacheStatus.lastSyncAt && (
                        <span className="text-xs text-muted-foreground/70">
                          (sync {formatDistanceToNow(new Date(cacheStatus.lastSyncAt), { addSuffix: true, locale: it })})
                        </span>
                      )}
                    </>
                  )}
                  {cacheStatus.syncStatus === "syncing" && (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      <span className="text-blue-600">Sincronizzazione in corso...</span>
                    </>
                  )}
                  {cacheStatus.syncStatus === "error" && (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Errore sync</span>
                    </>
                  )}
                  {(!cacheStatus.hasCache || cacheStatus.isExpired) && cacheStatus.syncStatus !== "syncing" && (
                    <>
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-amber-600">Cache scaduta o assente</span>
                    </>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncCacheMutation.mutate()}
                disabled={syncCacheMutation.isPending || cacheStatus?.syncStatus === "syncing"}
                data-testid="button-sync-cache"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${cacheStatus?.syncStatus === "syncing" ? "animate-spin" : ""}`} />
                {cacheStatus?.hasCache && !cacheStatus.isExpired ? t("common.update") : "Sincronizza"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome, SKU, modello..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Package className="h-5 w-5" />
            Prodotti
            {totalProducts > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({accumulatedProducts.length} di {totalProducts})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProducts && currentPage === 1 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-md">
                  <Skeleton className="h-20 w-20" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : accumulatedProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {debouncedSearch.length >= 2 ? "Nessun prodotto trovato. Prova a modificare la ricerca." : "Inserisci almeno 2 caratteri per cercare."}
            </div>
          ) : (
            <div className="space-y-3">
              {accumulatedProducts.map((product, index) => (
                <div
                  key={`${product.sku}-${index}`}
                  className="flex items-start gap-4 p-4 border rounded-md hover-elevate"
                  data-testid={`product-item-${product.sku}`}
                >
                  <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-full object-contain rounded-md"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <div className="text-sm text-muted-foreground space-y-1 mt-1">
                          <div>SKU: {product.sku}</div>
                          {product.model && <div>{product.brand} - {product.model}</div>}
                          {product.quality && (
                            <Badge variant="outline" className="text-xs">{product.quality}</Badge>
                          )}
                          {product.warranty_months > 0 && (
                            <div>Garanzia: {product.warranty_months} mesi</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-semibold">{formatPrice(product.price)}</div>
                        <div className="mt-1">
                          {product.stock > 0 ? (
                            <Badge variant="default" className="bg-green-600">{t("shop.inStock")}</Badge>
                          ) : (
                            <Badge variant="secondary">Non disponibile</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {product.stock > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(product.sku, -1)}
                          data-testid={`button-minus-${product.sku}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {quantities[product.sku] || 1}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(product.sku, 1)}
                          data-testid={`button-plus-${product.sku}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleAddToCart(product)}
                          disabled={addToCartMutation.isPending}
                          className="ml-2"
                          data-testid={`button-add-cart-${product.sku}`}
                        >
                          {addToCartMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 mr-2" />
                          )}
                          Aggiungi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {hasMoreProducts && (
                <div className="flex flex-col items-center gap-2 pt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore || isFetching}
                    className="w-full max-w-xs"
                    data-testid="button-load-more"
                  >
                    {isLoadingMore || isFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("common.loading")}</>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Carica Altri ({totalProducts - accumulatedProducts.length} rimanenti)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
