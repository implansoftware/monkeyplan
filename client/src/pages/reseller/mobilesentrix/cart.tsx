import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingCart, Trash2, Plus, Minus, Package, ArrowLeft, CreditCard, Loader2, Truck } from "lucide-react";
import { Link } from "wouter";

type CartItem = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  brand: string | null;
  model: string | null;
  price: number;
  quantity: number;
  imageUrl: string | null;
};

type CartResponse = {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
};

type ShippingMethod = {
  code: string;
  name: string;
  region: string;
};

type ShippingMethodsResponse = {
  methods: ShippingMethod[];
  defaultMethod: string;
  countryId: string;
};

export default function MobilesentrixCartPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("");

  const { data: cart, isLoading } = useQuery<CartResponse>({
    queryKey: ["/api/mobilesentrix/cart"],
  });

  const { data: shippingData, isLoading: isLoadingShipping } = useQuery<ShippingMethodsResponse>({
    queryKey: ["/api/mobilesentrix/shipping-methods"],
  });

  // Set default shipping method when data loads
  useEffect(() => {
    if (shippingData?.defaultMethod && !selectedShippingMethod) {
      setSelectedShippingMethod(shippingData.defaultMethod);
    }
  }, [shippingData, selectedShippingMethod]);

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      return apiRequest("PUT", `/api/mobilesentrix/cart/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart/count"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/mobilesentrix/cart/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart/count"] });
      toast({ title: "Rimosso", description: "Prodotto rimosso dal carrello" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/mobilesentrix/cart");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart/count"] });
      toast({ title: "Carrello svuotato", description: "Tutti i prodotti sono stati rimossi" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setIsCheckingOut(true);
      const res = await apiRequest("POST", "/api/mobilesentrix/checkout", { 
        shippingMethod: selectedShippingMethod 
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsCheckingOut(false);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/cart/count"] });
        queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/orders"] });
        toast({ title: "Ordine creato!", description: `Ordine #${data.order?.orderNumber || data.mobilesentrixOrderId} creato con successo` });
      } else {
        toast({ title: "Errore", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      setIsCheckingOut(false);
      toast({ title: "Errore checkout", description: error.message, variant: "destructive" });
    },
  });

  // Tasso di cambio USD -> EUR (aggiornabile)
  const USD_TO_EUR_RATE = 0.92;
  
  const formatPrice = (cents: number) => {
    const usdAmount = cents / 100;
    const eurAmount = usdAmount * USD_TO_EUR_RATE;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(eurAmount);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const items = cart?.items || [];
  const totalAmount = cart?.totalAmount || 0;
  const totalItems = cart?.totalItems || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Carrello MobileSentrix</h1>
            <p className="text-muted-foreground">{totalItems} prodott{totalItems === 1 ? "o" : "i"} nel carrello</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/reseller/mobilesentrix/catalog">
            <Button variant="outline" data-testid="button-back-catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al Catalogo
            </Button>
          </Link>
          <Link href="/reseller/mobilesentrix/orders">
            <Button variant="outline" data-testid="button-view-orders">
              <Package className="h-4 w-4 mr-2" />
              I Miei Ordini
            </Button>
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Carrello vuoto</h2>
            <p className="text-muted-foreground mb-4">Aggiungi prodotti dal catalogo MobileSentrix</p>
            <Link href="/reseller/mobilesentrix/catalog">
              <Button data-testid="button-browse-catalog">
                <Package className="h-4 w-4 mr-2" />
                Sfoglia Catalogo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                      {item.brand && (
                        <p className="text-xs text-muted-foreground">{item.brand} {item.model && `- ${item.model}`}</p>
                      )}
                      <p className="font-semibold mt-1">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                          onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value);
                            if (qty >= 1) {
                              updateQuantityMutation.mutate({ id: item.id, quantity: qty });
                            }
                          }}
                          className="w-14 h-8 text-center"
                          min={1}
                          data-testid={`input-quantity-${item.id}`}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          disabled={updateQuantityMutation.isPending}
                          onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItemMutation.mutate(item.id)}
                        disabled={removeItemMutation.isPending}
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => clearCartMutation.mutate()}
              disabled={clearCartMutation.isPending}
              data-testid="button-clear-cart"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Svuota Carrello
            </Button>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Riepilogo Ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Prodotti ({totalItems})</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex flex-wrap items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Metodo di Spedizione
                  </Label>
                  {isLoadingShipping ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedShippingMethod}
                      onValueChange={setSelectedShippingMethod}
                      data-testid="select-shipping-method"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona spedizione" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingData?.methods.map((method) => (
                          <SelectItem key={method.code} value={method.code}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {shippingData?.countryId && (
                    <p className="text-xs text-muted-foreground">
                      Spedizione verso: {shippingData.countryId}
                    </p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Totale</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    + costi spedizione MobileSentrix
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  size="lg"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={isCheckingOut || checkoutMutation.isPending}
                  data-testid="button-checkout"
                >
                  {(isCheckingOut || checkoutMutation.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4 mr-2" />
                  )}
                  Procedi all'Ordine
                </Button>
              </CardFooter>
            </Card>

            <Alert className="mt-4">
              <AlertDescription>
                L'ordine verrà inviato direttamente a MobileSentrix e processato secondo le loro condizioni di vendita.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </div>
  );
}
