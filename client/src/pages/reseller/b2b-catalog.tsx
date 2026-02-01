import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, ShippingMethod } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Package, Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Send, Box, Building2, Store, ArrowRight, Building } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, addVat, calculateVatSummary, DEFAULT_VAT_RATE } from "@/lib/utils";

interface B2BCatalogItem {
  product: Product;
  adminStock: number;
  b2bPrice: number;
  minimumOrderQuantity: number;
  ownerName?: string;
}

interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number; // IVA esclusa
  vatRate: number; // Aliquota IVA %
  minQty: number;
  maxQty: number;
}

interface PaymentConfigPublic {
  bankTransfer: {
    enabled: boolean;
    iban: string | null;
    accountHolder: string | null;
    bankName: string | null;
    bic: string | null;
  };
  stripe: { enabled: boolean };
  paypal: { enabled: boolean; email: string | null };
  satispay: { enabled: boolean };
  hasAnyMethod: boolean;
}

function formatPrice(cents: number): string {
  return formatCurrency(cents);
}

export default function ResellerB2BCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [selectedShippingMethod, setSelectedShippingMethod] = useState("");
  const { toast } = useToast();

  const { data: catalog, isLoading } = useQuery<B2BCatalogItem[]>({
    queryKey: ['/api/reseller/b2b-catalog'],
  });

  // Fetch admin's payment configuration for B2B orders
  const { data: paymentConfig, isLoading: paymentConfigLoading } = useQuery<PaymentConfigPublic>({
    queryKey: ['/api/admin/payment-config/public'],
  });

  // Fetch admin's shipping methods for B2B orders
  const { data: shippingMethods, isLoading: shippingMethodsLoading } = useQuery<ShippingMethod[]>({
    queryKey: ['/api/shipping-methods/public'],
    queryFn: async () => {
      const res = await fetch('/api/shipping-methods/public', { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento metodi di spedizione');
      return res.json();
    },
  });

  // Auto-select first shipping method when loaded
  useEffect(() => {
    if (shippingMethods && shippingMethods.length > 0 && !selectedShippingMethod) {
      setSelectedShippingMethod(shippingMethods[0].id);
    }
  }, [shippingMethods, selectedShippingMethod]);

  // Auto-select first available payment method when config loads
  useEffect(() => {
    if (!paymentConfig) return;
    
    const methods: string[] = [];
    if (paymentConfig.bankTransfer?.enabled) methods.push('bank_transfer');
    if (paymentConfig.stripe?.enabled) methods.push('stripe');
    if (paymentConfig.paypal?.enabled) methods.push('paypal');
    if (paymentConfig.satispay?.enabled) methods.push('satispay');
    
    if (methods.length > 0 && !methods.includes(paymentMethod)) {
      setPaymentMethod(methods[0]);
    }
  }, [paymentConfig, paymentMethod]);

  const createOrderMutation = useMutation({
    mutationFn: async (data: { items: { productId: string; quantity: number }[]; paymentMethod: string; shippingMethodId: string; notes: string }) => {
      const res = await apiRequest('POST', '/api/reseller/b2b-orders', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ordine creato", description: "Il tuo ordine è stato inviato per approvazione" });
      setCart([]);
      setCheckoutOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/b2b-orders'] });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
          ? { ...c, quantity: Math.min(c.quantity + item.minimumOrderQuantity, item.adminStock) }
          : c
      ));
    } else {
      setCart([...cart, {
        productId: item.product.id,
        product: item.product,
        quantity: item.minimumOrderQuantity,
        unitPrice: item.b2bPrice,
        vatRate: (item as any).vatRate ?? DEFAULT_VAT_RATE,
        minQty: item.minimumOrderQuantity,
        maxQty: item.adminStock,
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

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Carrello vuoto", description: "Aggiungi prodotti al carrello", variant: "destructive" });
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
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Catalogo B2B Admin</h1>
              <p className="text-white/80 text-sm">Ordina prodotti direttamente dall'Admin (fornitore centrale)</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search"
              />
            </div>
            <Button 
              variant="default" 
              className="relative"
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

      <Card className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Stai ordinando dall'Admin (fornitore centrale)
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Qui trovi i prodotti messi a disposizione dall'amministratore della piattaforma.
                </p>
              </div>
            </div>
            <Link href="/reseller/marketplace" data-testid="link-to-marketplace">
              <Button variant="outline" size="sm" className="border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                <Store className="h-4 w-4 mr-2" />
                Vai al Marketplace Rivenditori
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {filteredCatalog.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessun prodotto disponibile nel catalogo B2B Admin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCatalog.map((item) => {
            const inCart = cart.find(c => c.productId === item.product.id);
            return (
              <Card key={item.product.id} className="rounded-2xl" data-testid={`card-product-${item.product.id}`}>
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
                    <span className="text-muted-foreground">Prezzo B2B:</span>
                    <span className="font-semibold text-primary">{formatPrice(item.b2bPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Disponibilità:</span>
                    <Badge variant={item.adminStock > 10 ? "default" : item.adminStock > 0 ? "secondary" : "destructive"}>
                      {item.adminStock} pz
                    </Badge>
                  </div>
                  {item.minimumOrderQuantity > 1 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ordine min.:</span>
                      <span>{item.minimumOrderQuantity} pz</span>
                    </div>
                  )}
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
                        <span className="w-10 text-center font-medium">{inCart.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => updateCartQuantity(item.product.id, 1)}
                          disabled={inCart.quantity >= item.adminStock}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => removeFromCart(item.product.id)}
                        data-testid={`button-remove-${item.product.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => addToCart(item)}
                      disabled={item.adminStock < item.minimumOrderQuantity}
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
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Riepilogo Ordine B2B
            </DialogTitle>
            <DialogDescription>
              Verifica i prodotti e conferma l'ordine. L'ordine richiederà approvazione dall'amministratore.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prodotto</TableHead>
                  <TableHead className="text-right">Prezzo</TableHead>
                  <TableHead className="text-right">Qtà</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.productId} data-testid={`row-cart-${item.productId}`}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-3">
                        {item.product.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded border"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-muted rounded border flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          {item.product.sku && (
                            <div className="text-sm text-muted-foreground">{item.product.sku}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => updateCartQuantity(item.productId, -1)}
                          disabled={item.quantity <= item.minQty}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => updateCartQuantity(item.productId, 1)}
                          disabled={item.quantity >= item.maxQty}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <Separator className="my-1" />
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Totale Ordine:</span>
              <span className="text-primary">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shippingMethod">Metodo di Spedizione</Label>
              {shippingMethodsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !shippingMethods || shippingMethods.length === 0 ? (
                <Card className="border-muted bg-muted/10 p-3">
                  <p className="text-sm text-muted-foreground">Nessun metodo di spedizione configurato</p>
                </Card>
              ) : (
                <Select value={selectedShippingMethod} onValueChange={setSelectedShippingMethod}>
                  <SelectTrigger data-testid="select-shipping">
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
              <Label htmlFor="paymentMethod">Metodo di Pagamento</Label>
              {paymentConfigLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !paymentConfig?.hasAnyMethod ? (
                <Card className="border-destructive bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">L'admin non ha configurato metodi di pagamento</p>
                </Card>
              ) : (
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger data-testid="select-payment">
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
              
              {/* Show IBAN details when bank_transfer is selected */}
              {paymentMethod === "bank_transfer" && paymentConfig?.bankTransfer?.enabled && paymentConfig.bankTransfer.iban && (
                <Card className="mt-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Coordinate Bancarie Admin</h4>
                        <div className="grid gap-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">IBAN:</span>
                            <span className="font-mono font-medium text-blue-900 dark:text-blue-100" data-testid="text-admin-iban">{paymentConfig.bankTransfer.iban}</span>
                          </div>
                          {paymentConfig.bankTransfer.accountHolder && (
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">Intestatario:</span>
                              <span className="font-medium text-blue-900 dark:text-blue-100">{paymentConfig.bankTransfer.accountHolder}</span>
                            </div>
                          )}
                          {paymentConfig.bankTransfer.bankName && (
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">Banca:</span>
                              <span className="font-medium text-blue-900 dark:text-blue-100">{paymentConfig.bankTransfer.bankName}</span>
                            </div>
                          )}
                          {paymentConfig.bankTransfer.bic && (
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">BIC/SWIFT:</span>
                              <span className="font-mono font-medium text-blue-900 dark:text-blue-100">{paymentConfig.bankTransfer.bic}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          Inserisci il numero ordine nella causale del bonifico.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Aggiungi note per l'ordine..."
                rows={3}
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={submitOrder} 
              disabled={cart.length === 0 || createOrderMutation.isPending}
              data-testid="button-submit-order"
            >
              {createOrderMutation.isPending ? (
                "Invio in corso..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Invia Ordine
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
