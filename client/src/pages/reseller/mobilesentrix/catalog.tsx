import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Package, Search, Loader2, Settings, AlertTriangle, Image, ShoppingCart, Plus, Filter, X
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type MobilesentrixCategory = {
  id: string;
  name: string;
  parent_id: string | null;
};

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [accumulatedProducts, setAccumulatedProducts] = useState<MobilesentrixProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const perPage = 20;

  const { data: cartCount } = useQuery<{ count: number }>({
    queryKey: ["/api/mobilesentrix/cart/count"],
  });

  // Fetch categories
  const { data: categories } = useQuery<MobilesentrixCategory[]>({
    queryKey: ["/api/mobilesentrix/catalog/categories"],
    staleTime: 10 * 60 * 1000,
  });

  // Fetch brands
  const { data: brands } = useQuery<string[]>({
    queryKey: ["/api/mobilesentrix/catalog/brands"],
    staleTime: 10 * 60 * 1000,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product: MobilesentrixProduct) => {
      setAddingToCart(product.id);
      return apiRequest("POST", "/api/mobilesentrix/cart", {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        model: product.model,
        price: product.price,
        quantity: 1,
        imageUrl: product.image_url,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart/count"] });
      toast({ title: t("integrations.addedToCart"), description: t("integrations.productAddedSuccess") });
      setAddingToCart(null);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      setAddingToCart(null);
    },
  });

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

  // Reset when filters change
  useEffect(() => {
    setAccumulatedProducts([]);
    setCurrentPage(1);
    setTotalProducts(0);
  }, [selectedCategory, selectedBrand]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchQuery("");
    setDebouncedSearch("");
  };

  const hasActiveFilters = selectedCategory || selectedBrand || debouncedSearch;

  const { data: productsData, isLoading: loadingProducts, isFetching, error: productsError } = useQuery<{
    products: MobilesentrixProduct[];
    total: number;
    page: number;
    per_page: number;
  }>({
    queryKey: ["/api/mobilesentrix/catalog/products", debouncedSearch, currentPage, selectedCategory, selectedBrand],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      params.append("page", String(currentPage));
      params.append("per_page", String(perPage));
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (selectedBrand) params.append("brand", selectedBrand);
      
      const res = await fetch(`/api/mobilesentrix/catalog/products?${params}`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || t("integrations.loadingProductsError"));
      }
      return res.json();
    },
    enabled: !!credential?.isActive && (debouncedSearch.length >= 2 || !!selectedCategory || !!selectedBrand),
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

  // Tasso di cambio USD -> EUR (aggiornabile)
  const USD_TO_EUR_RATE = 0.92;
  
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    const eurPrice = numPrice * USD_TO_EUR_RATE;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(eurPrice);
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
            <span>{t("integrations.credentialsNotConfigured")}</span>
            <Link href="/reseller/mobilesentrix/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {t("integrations.configure")}
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
        <div className="flex flex-wrap items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">{t("integrations.mobilesentrixCatalog")}</h1>
            <p className="text-muted-foreground">{t("integrations.browseAndSearchParts")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/reseller/mobilesentrix/cart">
            <Button variant="outline" className="relative" data-testid="button-view-cart">
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t("integrations.cartTitle")}
              {cartCount && cartCount.count > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-r from-blue-500 to-cyan-500">
                  {cartCount.count}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/reseller/mobilesentrix/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Filter className="h-5 w-5" />
            {t("integrations.searchFilterProducts")}
          </CardTitle>
          <CardDescription>{t("integrations.searchOrFilterDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("integrations.searchByNameSku")}
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
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder={t("products.allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.allCategories")}</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select value={selectedBrand || "all"} onValueChange={(val) => setSelectedBrand(val === "all" ? "" : val)}>
                <SelectTrigger data-testid="select-brand">
                  <SelectValue placeholder={t("products.allBrands")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("products.allBrands")}</SelectItem>
                  {brands?.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                <X className="h-4 w-4 mr-1" />
                {t("integrations.clearFilters")}
              </Button>
            )}
          </div>
          
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {debouncedSearch && (
                <Badge variant="secondary">{t("integrations.searchBadge", { query: debouncedSearch })}</Badge>
              )}
              {selectedCategory && categories && (
                <Badge variant="secondary">
                  {t("integrations.categoryBadge", { name: categories.find(c => c.id === selectedCategory)?.name })}
                </Badge>
              )}
              {selectedBrand && (
                <Badge variant="secondary">{t("integrations.brandBadge", { name: selectedBrand })}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {productsError && hasActiveFilters && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t("integrations.errorLoadingProductsDetail", { message: productsError.message })}
          </AlertDescription>
        </Alert>
      )}

      {hasActiveFilters && !productsError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalProducts > 0 
                ? t("integrations.showingOfProducts", { shown: accumulatedProducts.length, total: totalProducts })
                : loadingProducts ? t("integrations.searchInProgress") : t("integrations.noProductsFound")}
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

                    <div className="flex items-center justify-between mt-4 pt-4 border-t gap-2">
                      <div>
                        <p className="font-bold text-lg" data-testid={`text-product-price-${product.id}`}>
                          {formatPrice(product.price)}
                        </p>
                        <Badge 
                          variant={product.stock > 0 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {product.stock > 0 ? t("integrations.stockLabel", { count: product.stock }) : t("integrations.unavailable")}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-cyan-500"
                        disabled={product.stock <= 0 || addingToCart === product.id}
                        onClick={() => addToCartMutation.mutate(product)}
                        data-testid={`button-add-cart-${product.id}`}
                      >
                        {addingToCart === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />{t("common.add")}</>
                        )}
                      </Button>
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
                {t("integrations.loadMoreProducts")}
              </Button>
            </div>
          )}
        </div>
      )}

      {debouncedSearch.length > 0 && debouncedSearch.length < 2 && !selectedCategory && !selectedBrand && (
        <Alert>
          <AlertDescription>
            {t("integrations.enterMinCharsOrFilter")}
          </AlertDescription>
        </Alert>
      )}

      {!hasActiveFilters && (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">{t("integrations.searchByCatalog")}</h3>
            <p className="text-muted-foreground">
              {t("integrations.useSearchBarOrFilters")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
