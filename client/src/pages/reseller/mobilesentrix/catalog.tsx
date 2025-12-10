import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Package, Search, Loader2, Settings, AlertTriangle, Image
} from "lucide-react";
import { Link } from "wouter";

type MobilesentrixProduct = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  stock: number;
  image_url: string;
  description: string;
};

type MobilesentrixCredential = {
  id: string;
  isActive: boolean;
};

export default function MobilesentrixCatalogPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accumulatedProducts, setAccumulatedProducts] = useState<MobilesentrixProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const perPage = 20;

  const { data: credential, isLoading: loadingCredential } = useQuery<MobilesentrixCredential | null>({
    queryKey: ["/api/mobilesentrix/credentials"],
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

  const { data: productsData, isLoading: loadingProducts, isFetching, error: productsError } = useQuery<{
    products: MobilesentrixProduct[];
    total: number;
    page: number;
    per_page: number;
  }>({
    queryKey: ["/api/mobilesentrix/catalog/products", debouncedSearch, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("search", debouncedSearch);
      params.append("page", String(currentPage));
      params.append("per_page", String(perPage));
      
      const res = await fetch(`/api/mobilesentrix/catalog/products?${params}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Errore ${res.status} nel caricamento prodotti`);
      }
      return res.json();
    },
    enabled: !!credential?.isActive && debouncedSearch.length >= 2,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (productsData) {
      setTotalProducts(productsData.total);
      if (currentPage === 1) {
        setAccumulatedProducts(productsData.products);
      } else {
        setAccumulatedProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = productsData.products.filter(p => !existingIds.has(p.id));
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

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "USD",
    }).format(numPrice);
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
            <span>Credenziali MobileSentrix non configurate. Configura le tue credenziali OAuth per continuare.</span>
            <Link href="/reseller/mobilesentrix/settings">
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Catalogo MobileSentrix</h1>
            <p className="text-muted-foreground">Sfoglia e cerca ricambi dal catalogo MobileSentrix</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/reseller/mobilesentrix/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cerca Prodotti
          </CardTitle>
          <CardDescription>Inserisci almeno 2 caratteri per cercare nel catalogo MobileSentrix</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, SKU, marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            {(loadingProducts || isFetching) && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
          </div>
        </CardContent>
      </Card>

      {productsError && debouncedSearch.length >= 2 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Errore durante il caricamento dei prodotti: {productsError.message}
          </AlertDescription>
        </Alert>
      )}

      {debouncedSearch.length >= 2 && !productsError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalProducts > 0 
                ? `Mostrando ${accumulatedProducts.length} di ${totalProducts} prodotti`
                : loadingProducts ? "Ricerca in corso..." : "Nessun prodotto trovato per la ricerca"}
            </p>
          </div>

          {loadingProducts && accumulatedProducts.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full mb-4" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accumulatedProducts.map((product) => (
                <Card key={product.id} className="hover-elevate transition-all">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-20 h-20 bg-muted rounded flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-muted-foreground"><svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></span>';
                            }}
                          />
                        ) : (
                          <Image className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2" data-testid={`text-product-name-${product.id}`}>
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          SKU: {product.sku}
                        </p>
                        {product.brand && (
                          <p className="text-xs text-muted-foreground">
                            {product.brand} {product.model && `- ${product.model}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div>
                        <p className="font-bold text-lg" data-testid={`text-product-price-${product.id}`}>
                          {formatPrice(product.price)}
                        </p>
                        <Badge 
                          variant={product.stock > 0 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {product.stock > 0 ? `Stock: ${product.stock}` : "Non disponibile"}
                        </Badge>
                      </div>
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {hasMoreProducts && !loadingProducts && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore || isFetching}
                data-testid="button-load-more"
              >
                {isLoadingMore || isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Carica altri prodotti
              </Button>
            </div>
          )}
        </div>
      )}

      {debouncedSearch.length > 0 && debouncedSearch.length < 2 && (
        <Alert>
          <AlertDescription>
            Inserisci almeno 2 caratteri per avviare la ricerca nel catalogo.
          </AlertDescription>
        </Alert>
      )}

      {!debouncedSearch && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Cerca nel catalogo MobileSentrix</h3>
            <p className="text-muted-foreground">
              Usa la barra di ricerca sopra per trovare ricambi per smartphone e tablet.
              Cerca per nome prodotto, SKU, marca o modello.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
