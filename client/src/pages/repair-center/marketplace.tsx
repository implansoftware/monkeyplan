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
import { Store, Search, ShoppingCart, Plus, Minus, Trash2, Send, Package, Users, Building } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateVatSummary, DEFAULT_VAT_RATE } from "@/lib/utils";
import PayPalButton from "@/components/PayPalButton";
import { StripeB2BCheckout } from "@/components/StripeB2BCheckout";

interface MarketplaceCatalogItem {
  product: Product;
  sellerResellerId: string;
  sellerName: string;
  availableStock: number;
  marketplacePrice: number;
  minQuantity: number;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  minQty: number;
  maxQty: number;
  sellerResellerId: string;
  sellerName: string;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function RepairCenterMarketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [selectedShippingMethod, setSelectedShippingMethod] = useState("");
  const [userSelectedShipping, setUserSelectedShipping] = useState(false);
  const { toast } = useToast();

  const { data: catalog, isLoading } = useQuery<MarketplaceCatalogItem[]>({
    queryKey: ['/api/repair-center/marketplace/catalog'],
  });

  // Get current seller ID from cart
  const currentSellerId = cart[0]?.sellerResellerId || null;

  // Query seller's shipping methods
  const { data: shippingMethods, isLoading: shippingMethodsLoading } = useQuery<ShippingMethod[]>({
    queryKey: [`/api/shipping-methods/public?resellerId=${currentSellerId}`],
    enabled: !!currentSellerId,
  });

  // Query seller's payment configuration
  const { data: paymentConfig, isLoading: paymentConfigLoading } = useQuery<{
    bankTransfer: { enabled: boolean; iban: string | null; accountHolder: string | null; bankName: string | null; bic: string | null };
    stripe: { enabled: boolean };
    paypal: { enabled: boolean; email: string | null };
    satispay: { enabled: boolean };
    hasAnyMethod: boolean;
  }>({
    queryKey: [`/api/payment-config/${currentSellerId}/public`],
    enabled: !!currentSellerId,
  });

  // Calculate cart VAT summary
  const cartVatSummary = useMemo(() => {
    const items = cart.map(item => ({
      priceCents: item.unitPrice * item.quantity,
      quantity: 1,
      vatRate: item.vatRate,
    }));
    return calculateVatSummary(items);
  }, [cart]);
  const cartTotal = cartVatSummary.total;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate selected shipping cost
  const selectedShippingCost = useMemo(() => {
    if (!selectedShippingMethod || !shippingMethods) return 0;
    const method = shippingMethods.find(m => m.id === selectedShippingMethod);
    return method?.priceCents || 0;
  }, [selectedShippingMethod, shippingMethods]);

  // Grand total with shipping
  const grandTotal = cartTotal + selectedShippingCost;

  // Reset shipping and payment state when seller changes
  useEffect(() => {
    setSelectedShippingMethod("");
    setUserSelectedShipping(false);
  }, [currentSellerId]);

  // Auto-select first shipping method only if user hasn't made a selection
  useEffect(() => {
    if (!userSelectedShipping && shippingMethods && shippingMethods.length > 0 && !selectedShippingMethod) {
      setSelectedShippingMethod(shippingMethods[0].id);
    }
  }, [shippingMethods, userSelectedShipping, selectedShippingMethod]);

  // Set default payment method based on seller's enabled methods
  useEffect(() => {
    if (!paymentConfig) return;
    const methods: string[] = [];
    if (paymentConfig.bankTransfer?.enabled) methods.push('bank_transfer');
    if (paymentConfig.stripe?.enabled) methods.push('stripe');
    if (paymentConfig.paypal?.enabled) methods.push('paypal');
    if (paymentConfig.satispay?.enabled) methods.push('satispay');
    // Only auto-select if current method is not in available methods
    if (methods.length > 0 && !methods.includes(paymentMethod)) {
      setPaymentMethod(methods[0]);
    }
  }, [paymentConfig, currentSellerId, paymentMethod]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: { sellerResellerId: string; items: { productId: string; quantity: number }[]; paymentMethod: string; shippingMethodId: string; buyerNotes: string }) => {
      const res = await apiRequest('POST', '/api/repair-center/marketplace/orders', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ordine creato", description: "Il tuo ordine è stato inviato al rivenditore" });
      setCart([]);
      setCheckoutOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/marketplace/orders'] });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredCatalog = catalog?.filter(item =>
    item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const groupedBySeller = filteredCatalog.reduce((acc, item) => {
    if (!acc[item.sellerResellerId]) {
      acc[item.sellerResellerId] = {
        sellerName: item.sellerName,
        products: [],
      };
    }
    acc[item.sellerResellerId].products.push(item);
    return acc;
  }, {} as Record<string, { sellerName: string; products: MarketplaceCatalogItem[] }>);

  const addToCart = (item: MarketplaceCatalogItem) => {
    const cartSellerId = cart[0]?.sellerResellerId;
    if (cartSellerId && cartSellerId !== item.sellerResellerId) {
      toast({ 
        title: "Attenzione", 
        description: "Puoi acquistare solo da un rivenditore alla volta. Svuota il carrello per cambiare rivenditore.",
        variant: "destructive"
      });
      return;
    }

    const existing = cart.find(c => c.productId === item.product.id);
    if (existing) {
      setCart(cart.map(c => 
        c.productId === item.product.id 
          ? { ...c, quantity: Math.min(c.quantity + item.minQuantity, item.availableStock) }
          : c
      ));
    } else {
      setCart([...cart, {
        productId: item.product.id,
        product: item.product,
        quantity: item.minQuantity,
        unitPrice: item.marketplacePrice,
        vatRate: DEFAULT_VAT_RATE,
        minQty: item.minQuantity,
        maxQty: item.availableStock,
        sellerResellerId: item.sellerResellerId,
        sellerName: item.sellerName,
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

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Carrello vuoto", description: "Aggiungi prodotti al carrello", variant: "destructive" });
      return;
    }
    setCheckoutOpen(true);
  };

  const submitOrder = () => {
    // Validate shipping method is selected and belongs to current seller
    const validShippingMethods = shippingMethods?.map(m => m.id) || [];
    if (!selectedShippingMethod || !validShippingMethods.includes(selectedShippingMethod)) {
      toast({ title: "Errore", description: "Seleziona un metodo di spedizione valido", variant: "destructive" });
      return;
    }

    // Validate payment method is available
    if (!paymentConfig?.hasAnyMethod) {
      toast({ title: "Errore", description: "Il venditore non ha configurato metodi di pagamento", variant: "destructive" });
      return;
    }

    const sellerResellerId = cart[0].sellerResellerId;
    createOrderMutation.mutate({
      sellerResellerId,
      items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
      paymentMethod,
      shippingMethodId: selectedShippingMethod,
      buyerNotes: notes,
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
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Store className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Marketplace</h1>
              <p className="text-emerald-100">Acquista prodotti da tutti i rivenditori</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
              <Input
                placeholder="Cerca prodotti o rivenditori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-72 bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/70"
                data-testid="input-search-rc-marketplace"
              />
            </div>
            <Button 
              variant="outline" 
              className="relative bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg"
              onClick={handleCheckout}
              data-testid="button-rc-marketplace-cart"
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

      {Object.keys(groupedBySeller).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun prodotto disponibile</h3>
            <p className="text-muted-foreground">
              Al momento non ci sono prodotti disponibili nel marketplace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedBySeller).map(([sellerId, { sellerName, products }]) => (
            <div key={sellerId}>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{sellerName}</h2>
                <Badge variant="outline">{products.length} prodotti</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((item) => (
                  <Card key={item.product.id} className="hover-elevate overflow-hidden">
                    {item.product.imageUrl ? (
                      <div className="aspect-square w-full bg-muted">
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-muted flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{item.product.name}</CardTitle>
                          {item.product.sku && (
                            <CardDescription className="text-xs">{item.product.sku}</CardDescription>
                          )}
                        </div>
                        {item.product.category && (
                          <Badge variant="secondary" className="text-xs shrink-0">{item.product.category}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Prezzo:</span>
                        <span className="font-bold text-primary">{formatPrice(item.marketplacePrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Disponibilità:</span>
                        <Badge variant={item.availableStock > 10 ? "default" : "secondary"}>
                          {item.availableStock} pz
                        </Badge>
                      </div>
                      {item.minQuantity > 1 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Quantità min:</span>
                          <span className="text-sm">{item.minQuantity} pz</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={() => addToCart(item)}
                        disabled={item.availableStock < item.minQuantity}
                        data-testid={`button-rc-add-to-cart-${item.product.id}`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Riepilogo Ordine</DialogTitle>
            {cart.length > 0 && (
              <DialogDescription>
                Ordine da: {cart[0].sellerName}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-12 h-12 object-cover rounded-md border"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center border">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">{formatPrice(item.unitPrice)} / pz</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => updateCartQuantity(item.productId, -1)}
                      disabled={item.quantity <= item.minQty}
                      data-testid={`button-rc-decrease-${item.productId}`}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => updateCartQuantity(item.productId, 1)}
                      disabled={item.quantity >= item.maxQty}
                      data-testid={`button-rc-increase-${item.productId}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => removeFromCart(item.productId)}
                      data-testid={`button-rc-remove-${item.productId}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <span className="w-24 text-right font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="space-y-4">
            {/* Price breakdown with VAT */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Imponibile:</span>
                <span>{formatPrice(cartVatSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA (22%):</span>
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
                <span>Totale:</span>
                <span>{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Metodo di spedizione</Label>
              {shippingMethodsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !shippingMethods || shippingMethods.length === 0 ? (
                <Card className="border-muted bg-muted/10 p-3">
                  <p className="text-sm text-muted-foreground">Nessun metodo di spedizione disponibile</p>
                </Card>
              ) : (
                <Select value={selectedShippingMethod} onValueChange={(val) => { setSelectedShippingMethod(val); setUserSelectedShipping(true); }}>
                  <SelectTrigger data-testid="select-rc-shipping-method">
                    <SelectValue placeholder="Seleziona metodo di spedizione" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} - {method.priceCents === 0 ? 'Gratuita' : formatPrice(method.priceCents)}
                        {method.estimatedDays && ` (${method.estimatedDays} gg)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Metodo di pagamento</Label>
              {paymentConfigLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !paymentConfig?.hasAnyMethod ? (
                <Card className="border-destructive bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">Il venditore non ha configurato metodi di pagamento</p>
                </Card>
              ) : (
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-rc-payment-method">
                    <SelectValue placeholder="Seleziona metodo di pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentConfig?.bankTransfer?.enabled && (
                      <SelectItem value="bank_transfer">Bonifico Bancario</SelectItem>
                    )}
                    {paymentConfig?.stripe?.enabled && (
                      <SelectItem value="stripe">Carta di Credito</SelectItem>
                    )}
                    {paymentConfig?.paypal?.enabled && (
                      <SelectItem value="paypal">PayPal</SelectItem>
                    )}
                    {paymentConfig?.satispay?.enabled && (
                      <SelectItem value="satispay">Satispay</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Bank transfer details */}
            {paymentMethod === 'bank_transfer' && paymentConfig?.bankTransfer?.enabled && paymentConfig.bankTransfer.iban && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">Dati per il bonifico</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono font-medium">{paymentConfig.bankTransfer.iban}</span></p>
                    {paymentConfig.bankTransfer.accountHolder && (
                      <p><span className="text-muted-foreground">Intestatario:</span> {paymentConfig.bankTransfer.accountHolder}</p>
                    )}
                    {paymentConfig.bankTransfer.bankName && (
                      <p><span className="text-muted-foreground">Banca:</span> {paymentConfig.bankTransfer.bankName}</p>
                    )}
                    {paymentConfig.bankTransfer.bic && (
                      <p><span className="text-muted-foreground">BIC/SWIFT:</span> <span className="font-mono">{paymentConfig.bankTransfer.bic}</span></p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Indica il numero ordine nella causale del bonifico</p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <Label>Note per il venditore</Label>
              <Textarea 
                placeholder="Aggiungi note all'ordine..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-rc-buyer-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Annulla
            </Button>
            {paymentMethod === "paypal" && paymentConfig?.paypal?.enabled ? (
              <PayPalButton
                amount={(grandTotal / 100).toFixed(2)}
                currency="EUR"
                disabled={cart.length === 0 || createOrderMutation.isPending || !selectedShippingMethod}
                onSuccess={(paypalOrderId, captureData) => {
                  const sellerResellerId = cart[0].sellerResellerId;
                  createOrderMutation.mutate({
                    sellerResellerId,
                    items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
                    paymentMethod: "paypal",
                    shippingMethodId: selectedShippingMethod,
                    buyerNotes: notes + (notes ? "\n" : "") + `[PayPal Order ID: ${paypalOrderId}]`,
                  });
                }}
                onError={(error) => {
                  toast({
                    title: "Errore PayPal",
                    description: error,
                    variant: "destructive",
                  });
                }}
                onCancel={() => {
                  toast({
                    title: "Pagamento annullato",
                    description: "Hai annullato il pagamento PayPal",
                  });
                }}
              />
            ) : paymentMethod === "stripe" && paymentConfig?.stripe?.enabled ? (
              <StripeB2BCheckout
                items={cart.map(item => ({ productId: item.productId, quantity: item.quantity }))}
                shippingMethodId={selectedShippingMethod}
                notes={notes}
                totalAmount={grandTotal}
                sellerResellerId={cart[0]?.sellerResellerId}
                paymentIntentEndpoint="/api/repair-center/marketplace/orders/stripe-payment-intent"
                createOrderEndpoint="/api/repair-center/marketplace/orders"
                returnUrl="/repair-center/marketplace"
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/repair-center/marketplace/orders'] });
                  setCheckoutOpen(false);
                  setCart([]);
                  setNotes("");
                  toast({ title: "Ordine completato", description: "Pagamento ricevuto con successo" });
                }}
                onError={(error) => {
                  toast({ title: "Errore", description: error, variant: "destructive" });
                }}
              />
            ) : (
              <Button 
                onClick={submitOrder}
                disabled={createOrderMutation.isPending || cart.length === 0 || !selectedShippingMethod || shippingMethodsLoading || !paymentConfig?.hasAnyMethod}
                data-testid="button-rc-submit-marketplace-order"
              >
                <Send className="h-4 w-4 mr-2" />
                {createOrderMutation.isPending ? "Invio..." : "Invia Ordine"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
