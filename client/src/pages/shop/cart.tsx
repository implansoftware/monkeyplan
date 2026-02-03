import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Cart, CartItem, Product } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: Product | null;
}

export default function ShopCart() {
  const { resellerId } = useParams<{ resellerId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery<{ cart: Cart; items: CartItemWithProduct[] }>({
    queryKey: ['/api/shop', resellerId, 'cart'],
    queryFn: async () => {
      const res = await fetch(`/api/shop/${resellerId}/cart`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento carrello');
      return res.json();
    }
  });
  
  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      await apiRequest('PUT', `/api/cart/items/${itemId}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop', resellerId, 'cart'] });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest('DELETE', `/api/cart/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop', resellerId, 'cart'] });
      toast({ title: "Prodotto rimosso dal carrello" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  };
  
  const handleCheckout = () => {
    if (!user) {
      toast({ 
        title: "Accedi per continuare", 
        description: "Devi effettuare il login per procedere con l'acquisto" 
      });
      setLocation('/auth');
      return;
    }
    setLocation(`/shop/${resellerId}/checkout`);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-20" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const items = data?.items || [];
  const cart = data?.cart;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(`/shop/${resellerId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-cart-title">Carrello</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? 'prodotto' : 'prodotti'}
          </p>
        </div>
      </div>
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Il tuo carrello è vuoto</h3>
            <p className="text-muted-foreground mb-4">Aggiungi prodotti per continuare</p>
            <Button onClick={() => setLocation(`/shop/${resellerId}`)} data-testid="button-continue-shopping">
              Continua lo shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} data-testid={`card-cart-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded flex-shrink-0 flex items-center justify-center">
                      {item.product?.imageUrl ? (
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product?.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-xs text-muted-foreground">No img</div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold" data-testid={`text-item-name-${item.id}`}>
                        {item.product?.name || 'Prodotto'}
                      </h3>
                      {item.product?.brand && (
                        <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPrice(item.unitPrice)} cad.
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem.mutate(item.id)}
                        disabled={removeItem.isPending}
                        data-testid={`button-remove-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                          disabled={item.quantity <= 1 || updateQuantity.isPending}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                          disabled={updateQuantity.isPending}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className="font-bold" data-testid={`text-item-total-${item.id}`}>
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Riepilogo ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotale</span>
                  <span data-testid="text-subtotal">{formatPrice(cart?.subtotal || 0)}</span>
                </div>
                {(cart?.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Sconto</span>
                    <span>-{formatPrice(cart?.discount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Spedizione</span>
                  <span data-testid="text-shipping">
                    {(cart?.shippingCost || 0) > 0 ? formatPrice(cart?.shippingCost || 0) : 'Calcolata al checkout'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Totale</span>
                  <span data-testid="text-total">{formatPrice(cart?.total || 0)}</span>
                </div>
                {items.length > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>di cui IVA</span>
                    <span data-testid="text-vat-amount">
                      {formatPrice(
                        items.reduce((sum, item) => {
                          const vatRate = item.product?.vatRate ?? 22;
                          const vatAmount = item.totalPrice - (item.totalPrice / (1 + vatRate / 100));
                          return sum + vatAmount;
                        }, 0)
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  data-testid="button-checkout"
                >
                  Procedi al checkout
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation(`/shop/${resellerId}`)}
                  data-testid="button-continue-shopping"
                >
                  Continua lo shopping
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
