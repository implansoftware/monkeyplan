import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  ArrowLeft, 
  Store, 
  ShoppingCart, 
  Check, 
  Truck,
  Box,
  Tag,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProductSeller {
  resellerId: string;
  resellerName: string;
  price: number;
  isPublished: boolean;
}

interface ProductDetail {
  product: {
    id: string;
    name: string;
    description: string | null;
    sku: string;
    category: string;
    brand: string | null;
    imageUrl: string | null;
    unitPrice: number;
    productType: string;
  };
  specs: any;
  sellers: ProductSeller[];
  lowestPrice: number;
  sellerCount: number;
  totalStock: number;
  hasValidSellers: boolean;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function MarketplaceProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSeller, setSelectedSeller] = useState<ProductSeller | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);

  const { data, isLoading, error } = useQuery<ProductDetail>({
    queryKey: ['/api/marketplace/products', productId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/products/${productId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Prodotto non trovato');
      return res.json();
    },
    enabled: !!productId,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ resellerId, productId }: { resellerId: string; productId: string }) => {
      await apiRequest('POST', `/api/shop/${resellerId}/cart/items`, {
        productId,
        quantity: 1,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop', variables.resellerId, 'cart'] });
      toast({ title: "Prodotto aggiunto al carrello" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleAddToCart = (seller: ProductSeller) => {
    addToCartMutation.mutate({ resellerId: seller.resellerId, productId: productId! });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Link href="/marketplace">
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al Marketplace
          </Button>
        </Link>
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Prodotto non trovato</h3>
          <p className="text-muted-foreground">
            Il prodotto richiesto non esiste o non è più disponibile
          </p>
        </div>
      </div>
    );
  }

  const { product, specs, sellers, lowestPrice, sellerCount, totalStock, hasValidSellers } = data;
  const images = product.imageUrl ? [product.imageUrl] : [];

  return (
    <div className="container mx-auto py-8 px-4">
      <Link href="/marketplace">
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna al Marketplace
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <img 
                src={images[selectedImage]} 
                alt={product.name} 
                className="w-full h-full object-contain"
                data-testid="img-product-main"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === idx ? 'border-primary' : 'border-transparent'
                  }`}
                  data-testid={`button-thumbnail-${idx}`}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline">{product.category}</Badge>
              {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
            </div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-product-name">{product.name}</h1>
            <p className="text-sm text-muted-foreground" data-testid="text-product-sku">SKU: {product.sku}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
              {formatPrice(lowestPrice)}
            </span>
            {sellerCount > 1 && (
              <span className="text-muted-foreground">
                da {sellerCount} venditor{sellerCount > 1 ? 'i' : 'e'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className={totalStock > 0 ? 'text-green-600' : 'text-red-600'}>
                {totalStock > 0 ? `${totalStock} disponibili` : 'Non disponibile'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span>Spedizione rapida</span>
            </div>
          </div>

          {product.description && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Descrizione
              </h3>
              <p className="text-muted-foreground" data-testid="text-product-description">
                {product.description}
              </p>
            </div>
          )}

          {specs && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Specifiche Tecniche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {product.productType === 'dispositivo' && specs && (
                    <>
                      {specs.storage && <><span className="text-muted-foreground">Memoria:</span><span>{specs.storage}</span></>}
                      {specs.color && <><span className="text-muted-foreground">Colore:</span><span>{specs.color}</span></>}
                      {specs.condition && <><span className="text-muted-foreground">Condizione:</span><span>{specs.condition}</span></>}
                      {specs.batteryHealth && <><span className="text-muted-foreground">Batteria:</span><span>{specs.batteryHealth}%</span></>}
                    </>
                  )}
                  {product.productType === 'accessorio' && specs && (
                    <>
                      {specs.color && <><span className="text-muted-foreground">Colore:</span><span>{specs.color}</span></>}
                      {specs.material && <><span className="text-muted-foreground">Materiale:</span><span>{specs.material}</span></>}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Venditori disponibili ({sellers.length})
            </h3>
            <div className="space-y-3">
              {sellers.map((seller, idx) => (
                <Card 
                  key={seller.resellerId} 
                  className={`hover-elevate cursor-pointer ${selectedSeller?.resellerId === seller.resellerId ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedSeller(seller)}
                  data-testid={`card-seller-${idx}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-seller-name-${idx}`}>
                            {seller.resellerName}
                            {seller.resellerId === 'admin' && (
                              <Badge variant="secondary" className="ml-2 text-xs">Ufficiale</Badge>
                            )}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Check className="h-3 w-3 text-green-600" />
                            {seller.resellerId === 'admin' ? 'Negozio ufficiale' : 'Venditore verificato'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold" data-testid={`text-seller-price-${idx}`}>
                          {formatPrice(seller.price)}
                        </p>
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(seller);
                          }}
                          disabled={addToCartMutation.isPending}
                          data-testid={`button-add-cart-${idx}`}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Aggiungi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {sellers.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nessun venditore disponibile per questo prodotto
                </p>
              )}
            </div>
          </div>

          {sellers.length > 0 && (
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={() => {
                  if (sellers.length === 0) return;
                  const bestSeller = sellers.reduce((a, b) => a.price < b.price ? a : b);
                  handleAddToCart(bestSeller);
                }}
                disabled={addToCartMutation.isPending}
                data-testid="button-buy-best-price"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Acquista al miglior prezzo
              </Button>
            </div>
          )}
          
          {sellers.length === 0 && (
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                Questo prodotto non è attualmente disponibile per l'acquisto
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
