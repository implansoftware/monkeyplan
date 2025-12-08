import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Package, Search, ShoppingCart, Plus, Minus, Loader2, Settings, AlertTriangle,
  ChevronLeft, ChevronRight, Image
} from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FonedayCategory = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
};

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

export default function FonedayCatalogPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const perPage = 20;

  const { data: credential, isLoading: loadingCredential } = useQuery<FonedayCredential | null>({
    queryKey: ["/api/foneday/credentials"],
  });

  const { data: categories = [] } = useQuery<FonedayCategory[]>({
    queryKey: ["/api/foneday/catalog/categories"],
    enabled: !!credential?.isActive,
  });

  const { data: brands = [] } = useQuery<string[]>({
    queryKey: ["/api/foneday/catalog/brands"],
    enabled: !!credential?.isActive,
  });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: productsData, isLoading: loadingProducts } = useQuery<{
    products: FonedayProduct[];
    total: number;
    page: number;
    per_page: number;
  }>({
    queryKey: ["/api/foneday/catalog/products", debouncedSearch, selectedCategory, selectedBrand, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedCategory) params.append("category_id", selectedCategory);
      if (selectedBrand) params.append("brand", selectedBrand);
      params.append("page", String(currentPage));
      params.append("per_page", String(perPage));
      
      const res = await fetch(`/api/foneday/catalog/products?${params}`);
      if (!res.ok) throw new Error("Errore nel caricamento prodotti");
      return res.json();
    },
    enabled: !!credential?.isActive,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: cart, refetch: refetchCart } = useQuery<FonedayCart>({
    queryKey: ["/api/foneday/cart"],
    enabled: !!credential?.isActive,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ sku, quantity }: { sku: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/foneday/cart/add", {
        sku,
        quantity,
      });
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
      toast({ title: "Aggiunto al carrello" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
    addToCartMutation.mutate({ sku: product.sku, quantity: qty });
    setQuantities((prev) => ({ ...prev, [product.sku]: 1 }));
  };

  const totalPages = productsData ? Math.ceil(productsData.total / perPage) : 0;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Catalogo Foneday</h1>
            <p className="text-muted-foreground">Sfoglia e ordina ricambi dal catalogo Foneday</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/reseller/foneday/cart">
            <Button variant="outline" data-testid="button-view-cart">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cerca Prodotti
          </CardTitle>
          <CardDescription>
            Cerca per nome, SKU, o filtra per categoria e marca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Ricerca</Label>
              <div className="relative">
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
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => {
                  setSelectedCategory(val === "all" ? "" : val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Tutte le categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marca</Label>
              <Select
                value={selectedBrand}
                onValueChange={(val) => {
                  setSelectedBrand(val === "all" ? "" : val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger data-testid="select-brand">
                  <SelectValue placeholder="Tutte le marche" />
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Prodotti
            {productsData && (
              <span className="text-sm font-normal text-muted-foreground">
                ({productsData.total} risultati)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProducts ? (
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
          ) : !productsData || productsData.products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nessun prodotto trovato. Prova a modificare i filtri di ricerca.
            </div>
          ) : (
            <div className="space-y-3">
              {productsData.products.map((product, index) => (
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
                            <Badge variant="default" className="bg-green-600">
                              Disponibile
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Non disponibile</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {product.stock > 0 && (
                      <div className="flex items-center gap-2 mt-3">
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
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Precedente
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {currentPage} di {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Successiva
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
