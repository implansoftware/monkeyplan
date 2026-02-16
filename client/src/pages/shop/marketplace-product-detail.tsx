import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  ArrowLeft, 
  Store, 
  ShoppingCart, 
  Check, 
  Truck,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ProductSeller {
  resellerId: string;
  resellerName: string;
  price: number;
  isPublished: boolean;
  isAdmin?: boolean;
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
  const { t } = useTranslation();
  const { productId, resellerId } = useParams<{ productId: string; resellerId?: string }>();
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
      toast({ title: t("marketplace.detail.addedToCart") });
    },
    onError: (error: any) => {
      toast({ title: t("marketplace.detail.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleAddToCart = (seller: ProductSeller) => {
    addToCartMutation.mutate({ resellerId: seller.resellerId, productId: productId! });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Skeleton className="h-9 w-40 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const backUrl = resellerId ? `/shop/${resellerId}` : "/marketplace";
  const backLabel = resellerId ? t("marketplace.detail.backToShop") : t("marketplace.detail.backToMarketplace");

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <Link href={backUrl}>
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </Link>
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">{t("marketplace.detail.productNotFound")}</h3>
          <p className="text-muted-foreground">
            {t("marketplace.detail.productNotFoundDesc")}
          </p>
        </div>
      </div>
    );
  }

  const { product, specs, sellers, lowestPrice, sellerCount, totalStock, hasValidSellers } = data;
  const images = product.imageUrl ? [product.imageUrl] : [];

  const hasSpecs = specs && (
    (product.productType === 'dispositivo' && (specs.storage || specs.color || specs.condition || specs.batteryHealth)) ||
    (product.productType === 'accessorio' && (specs.color || specs.material))
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <Link href={backUrl}>
        <Button variant="ghost" className="mb-6" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {backLabel}
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <img 
                src={images[selectedImage]} 
                alt={product.name} 
                className="w-full h-full object-contain p-4"
                data-testid="img-product-main"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
                <Package className="h-28 w-28 text-muted-foreground/40" />
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
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline">{product.category}</Badge>
              {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" data-testid="text-product-name">
              {product.name}
            </h1>
            <p className="text-sm text-muted-foreground" data-testid="text-product-sku">
              SKU: {product.sku}
            </p>
          </div>

          <div>
            <span className="text-3xl font-bold" data-testid="text-product-price">
              {formatPrice(lowestPrice)}
            </span>
            {sellerCount > 1 && (
              <span className="text-sm text-muted-foreground ml-3">
                {t("marketplace.detail.fromSellers", { count: sellerCount })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${
                totalStock > 0
                  ? 'bg-green-500 dark:bg-green-400'
                  : 'bg-red-500 dark:bg-red-400'
              }`} />
              <span className={totalStock > 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-700 dark:text-red-400'
              }>
                {totalStock > 0 ? t("marketplace.detail.available", { count: totalStock }) : t("marketplace.detail.unavailable")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>{t("marketplace.detail.fastShipping")}</span>
            </div>
          </div>

          {product.description && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t("marketplace.detail.description")}
              </h3>
              <p className="text-sm leading-relaxed" data-testid="text-product-description">
                {product.description}
              </p>
            </div>
          )}

          {hasSpecs && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("marketplace.detail.technicalSpecs")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {product.productType === 'dispositivo' && (
                    <>
                      {specs.storage && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">{t("marketplace.detail.storage")}</p>
                          <p className="font-medium">{specs.storage}</p>
                        </div>
                      )}
                      {specs.color && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">{t("marketplace.detail.color")}</p>
                          <p className="font-medium">{specs.color}</p>
                        </div>
                      )}
                      {specs.condition && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">{t("marketplace.detail.condition")}</p>
                          <p className="font-medium">{specs.condition}</p>
                        </div>
                      )}
                      {specs.batteryHealth && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">{t("marketplace.detail.battery")}</p>
                          <p className="font-medium">{specs.batteryHealth}%</p>
                        </div>
                      )}
                    </>
                  )}
                  {product.productType === 'accessorio' && (
                    <>
                      {specs.color && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">{t("marketplace.detail.color")}</p>
                          <p className="font-medium">{specs.color}</p>
                        </div>
                      )}
                      {specs.material && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-0.5">{t("marketplace.detail.material")}</p>
                          <p className="font-medium">{specs.material}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <Store className="h-4 w-4" />
              {t("marketplace.detail.availableSellers", { count: sellers.length })}
            </h3>
            <div className="space-y-2">
              {sellers.map((seller, idx) => (
                <div
                  key={seller.resellerId}
                  className={`border rounded-md p-4 cursor-pointer transition-shadow ${
                    selectedSeller?.resellerId === seller.resellerId
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => setSelectedSeller(seller)}
                  data-testid={`card-seller-${idx}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium truncate" data-testid={`text-seller-name-${idx}`}>
                            {seller.resellerName}
                          </p>
                          {seller.isAdmin && (
                            <Badge variant="secondary" className="text-xs">{t("marketplace.detail.official")}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          <span>{seller.isAdmin ? t("marketplace.detail.officialStore") : t("marketplace.detail.verifiedSeller")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-lg font-bold" data-testid={`text-seller-price-${idx}`}>
                        {formatPrice(seller.price)}
                      </span>
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
                        {t("marketplace.detail.add")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {sellers.length === 0 && (
                <p className="text-muted-foreground text-center py-6">
                  Nessun venditore disponibile per questo prodotto
                </p>
              )}
            </div>
          </div>

          {sellers.length > 0 && (
            <Button 
              className="w-full" 
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
          )}
          
          {sellers.length === 0 && (
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-muted-foreground text-sm">
                Questo prodotto non è attualmente disponibile per l'acquisto
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
