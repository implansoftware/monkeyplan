import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, ShippingMethod } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, Search, ShoppingCart, Plus, Minus, Trash2, Send, Box } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateVatSummary } from "@/lib/utils";
import { StripeB2BCheckout } from "@/components/StripeB2BCheckout";
import PayPalButton from "@/components/PayPalButton";

interface B2BCatalogItem {
  product: Product;
  resellerStock: number;
  b2bPrice: number;
  minimumOrderQuantity: number;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  minQty: number;
  maxQty: number;
  vatRate?: number;
}

interface PaymentConfig {
  bankTransfer: { enabled: boolean; iban: string | null; accountHolder: string | null; bankName: string | null; bic: string | null };
  stripe: { enabled: boolean };
  paypal: { enabled: boolean; email: string | null };
  hasAnyMethod: boolean;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function RepairCenterB2BCatalog() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [selectedShippingMethod, setSelectedShippingMethod] = useState("");
  const { toast } = useToast();

  const { data: catalog, isLoading } = useQuery<B2BCatalogItem[]>({
    queryKey: ['/api/repair-center/b2b-catalog'],
  });

  // Fetch parent reseller's shipping methods for RC B2B orders
  const { data: shippingMethods, isLoading: shippingMethodsLoading } = useQuery<ShippingMethod[]>({
    queryKey: ['/api/shipping-methods/rc-public'],
    queryFn: async () => {
      const res = await fetch('/api/shipping-methods/rc-public', { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento metodi di spedizione');
      return res.json();
    },
  });

  // Fetch parent reseller's payment configuration
  const { data: paymentConfig, isLoading: paymentConfigLoading } = useQuery<PaymentConfig>({
    queryKey: ['/api/repair-center/parent-payment-config'],
  });

  // Auto-select first shipping method when loaded
  useEffect(() => {
    if (shippingMethods && shippingMethods.length > 0 && !selectedShippingMethod) {
      setSelectedShippingMethod(shippingMethods[0].id);
    }
  }, [shippingMethods, selectedShippingMethod]);
  
  // Auto-select first available payment method
  useEffect(() => {
    if (paymentConfig) {
      if (paymentConfig.bankTransfer.enabled) {
        setPaymentMethod('bank_transfer');
      } else if (paymentConfig.stripe.enabled) {
        setPaymentMethod('stripe');
      } else if (paymentConfig.paypal.enabled) {
        setPaymentMethod('paypal');
      }
    }
  }, [paymentConfig]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: { items: { productId: string; quantity: number }[]; paymentMethod: string; shippingMethodId: string; notes: string }) => {
      const res = await apiRequest('POST', '/api/repair-center/b2b-orders', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ordine creato", description: t("b2b.ilTuoOrdineStatoInviatoAlRivenditorePerA") });
      setCart([]);
      setCheckoutOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/b2b-orders'] });
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const filteredCatalog = catalog?.filter(item =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const addToCart = (item: B2BCatalogItem) => {
    const existing = cart.find(c => c.productId === item.product.id);
    if (existing) {
      setCart(cart.map(c => 
        c.productId === item.product.id 
          ? { ...c, quantity: Math.min(c.quantity + item.minimumOrderQuantity, item.resellerStock) }
          : c
      ));
    } else {
      setCart([...cart, {
        productId: item.product.id,
        product: item.product,
        quantity: item.minimumOrderQuantity,
        unitPrice: item.b2bPrice,
        minQty: item.minimumOrderQuantity,
        maxQty: item.resellerStock,
      }]);
    }
    toast({ title: "Aggiunto al carrello", description: item.product.name });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty < item.minQty) return item;
        if (newQty > item.maxQty) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate VAT summary
  const cartVatSummary = useMemo(() => {
    const items = cart.map(item => ({
      priceCents: item.unitPrice * item.quantity,
      quantity: 1,
      vatRate: item.vatRate || 22,
    }));
    return calculateVatSummary(items);
  }, [cart]);
  
  // Calculate selected shipping cost
  const selectedShippingCost = useMemo(() => {
    if (!selectedShippingMethod || !shippingMethods) return 0;
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    return method?.priceCents || 0;
  }, [selectedShippingMethod, shippingMethods]);
  
  const grandTotal = cartVatSummary.total + selectedShippingCost;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: t("pos.emptyCart"), description: "Aggiungi prodotti al carrello", variant: "destructive" });
      return;
    }
    setCheckoutOpen(true);
  };

  const submitOrder = () => {
    createOrderMutation.mutate({
      items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
      paymentMethod,
      shippingMethodId: selectedShippingMethod,
      notes,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <ShoppingCart className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{t("sidebar.items.b2bCatalog")}</h1>
              <p className="text-emerald-100">Acquista prodotti dal magazzino del tuo rivenditore</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                placeholder={t("b2b.cercaProdotti")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70"
                data-testid="input-search"
              />
            </div>
            <Button 
              variant="outline" 
              className="relative bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg"
              onClick={handleCheckout}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrello
              {cart.length > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {filteredCatalog.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("b2b.nessunProdottoDisponibileNelCatalogoB2BDelR")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCatalog.map((item) => {
            const inCart = cart.find(c => c.productId === item.product.id);
            return (
              <Card key={item.product.id} data-testid={`card-product-${item.product.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{item.product.name}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2 flex-wrap">
                        {item.product.sku && <span>{item.product.sku}</span>}
                        {item.product.category && (
                          <Badge variant="outline" className="text-xs">{item.product.category}</Badge>
                        )}
                      </CardDescription>
                    </div>
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center flex-shrink-0">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("b2b.prezzoB2B")}</span>
                    <span className="font-semibold text-primary">{formatPrice(item.b2bPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("b2b.disponibilit")}</span>
                    <Badge variant={item.resellerStock > 10 ? "default" : item.resellerStock > 0 ? "secondary" : "destructive"}>
                      {item.resellerStock} pz
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  {inCart ? (
                    <div className="flex items-center justify-between w-full gap-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => updateCartQuantity(item.product.id, -1)}
                          disabled={inCart.quantity <= item.minimumOrderQuantity}
                          data-testid={`button-decrease-${item.product.id}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{inCart.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                          disabled={inCart.quantity >= item.resellerStock}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        size="icon" 
                        variant="destructive"
                        onClick={() => removeFromCart(item.product.id)}
                        data-testid={`button-remove-${item.product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => addToCart(item)}
                      disabled={item.resellerStock === 0}
                      data-testid={`button-add-${item.product.id}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("b2b.confermaOrdineB2B")}</DialogTitle>
            <DialogDescription>Verifica i prodotti nel carrello e completa l'ordine</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex flex-wrap items-center gap-3 py-2 border-b">
                  <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.product.imageUrl ? (
                      <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold shrink-0">{formatPrice(item.unitPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Imponibile:</span>
              <span>{formatPrice(cartVatSummary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IVA:</span>
              <span>{formatPrice(cartVatSummary.vatAmount)}</span>
            </div>
            {selectedShippingCost > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Spedizione:</span>
                <span>{formatPrice(selectedShippingCost)}</span>
              </div>
            )}
            <Separator className="my-1" />
            <div className="flex justify-between text-lg font-bold">
              <span>{t("accessories.totale")}</span>
              <span>{formatPrice(grandTotal)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Metodo di Spedizione</Label>
              {shippingMethodsLoading ? (
                <div className="h-10 bg-muted animate-pulse rounded" />
              ) : !shippingMethods || shippingMethods.length === 0 ? (
                <Card className="border-muted bg-muted/10 p-3">
                  <p className="text-sm text-muted-foreground">{t("b2b.nessunMetodoDiSpedizioneConfigurato")}</p>
                </Card>
              ) : (
                <Select value={selectedShippingMethod} onValueChange={setSelectedShippingMethod}>
                  <SelectTrigger data-testid="select-shipping-method">
                    <SelectValue placeholder={t("b2b.selezionaMetodoDiSpedizione")} />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} - {method.priceCents === 0 ? 'Gratuita' : formatPrice(method.priceCents)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Metodo di Pagamento</Label>
              {paymentConfigLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !paymentConfig?.hasAnyMethod ? (
                <Card className="border-muted bg-muted/10 p-3">
                  <p className="text-sm text-muted-foreground">{t("b2b.nessunMetodoDiPagamentoConfigurato")}</p>
                </Card>
              ) : (
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-payment-method">
                    <SelectValue placeholder={t("b2b.selezionaMetodoDiPagamento")} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentConfig.bankTransfer.enabled && (
                      <SelectItem value="bank_transfer">{t("settings.bankTransfer")}</SelectItem>
                    )}
                    {paymentConfig.stripe.enabled && (
                      <SelectItem value="stripe">Carta di Credito (Stripe)</SelectItem>
                    )}
                    {paymentConfig.paypal.enabled && (
                      <SelectItem value="paypal">PayPal</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Note Ordine</Label>
              <Textarea
                placeholder={t("b2b.optionalOrderNotes")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Annulla
            </Button>
            {paymentMethod === "paypal" && paymentConfig?.paypal?.enabled ? (
              <PayPalButton
                amount={(grandTotal / 100).toFixed(2)}
                currency="EUR"
                disabled={cart.length === 0 || createOrderMutation.isPending}
                setupEndpoint="/api/repair-center/paypal/setup"
                orderEndpoint="/api/repair-center/paypal/order"
                captureEndpointBase="/api/repair-center/paypal/order"
                onSuccess={(paypalOrderId, captureData) => {
                  createOrderMutation.mutate({
                    items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
                    paymentMethod: "paypal",
                    shippingMethodId: selectedShippingMethod,
                    notes: notes + (notes ? "\n" : "") + `[PayPal Order ID: ${paypalOrderId}]`,
                  });
                }}
                onError={(error) => {
                  toast({
                    title: t("b2b.errorePayPal"),
                    description: error,
                    variant: "destructive",
                  });
                }}
                onCancel={() => {
                  toast({
                    title: t("license.paymentCancelled"),
                    description: t("b2b.paypalPaymentCancelled"),
                  });
                }}
              />
            ) : paymentMethod === "stripe" && paymentConfig?.stripe?.enabled ? (
              <StripeB2BCheckout
                items={cart.map(item => ({ productId: item.productId, quantity: item.quantity }))}
                shippingMethodId={selectedShippingMethod}
                notes={notes}
                totalAmount={grandTotal}
                paymentIntentEndpoint="/api/repair-center/b2b-orders/stripe-payment-intent"
                createOrderEndpoint="/api/repair-center/b2b-orders"
                returnUrl="/repair-center/b2b-orders"
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/repair-center/b2b-orders'] });
                  setCheckoutOpen(false);
                  setCart([]);
                  setNotes("");
                  toast({ title: "Ordine completato", description: "Pagamento ricevuto con successo" });
                }}
                onError={(error) => {
                  toast({ title: t("auth.error"), description: error, variant: "destructive" });
                }}
              />
            ) : (
              <Button 
                onClick={submitOrder} 
                disabled={createOrderMutation.isPending || !paymentConfig?.hasAnyMethod || (!shippingMethods?.length && !shippingMethodsLoading)}
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? (
                  t("common.sendingInProgress")
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Invia Ordine
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
