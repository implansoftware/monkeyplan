import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, Send, ArrowLeft, Package, Building } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  b2bPrice: number;
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
  hasAnyMethod: boolean;
}

const CART_STORAGE_KEY = 'rc-b2b-cart';

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function RepairCenterCart() {
  const [, navigate] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const { toast } = useToast();

  // Fetch parent reseller's payment configuration
  const { data: paymentConfig } = useQuery<PaymentConfigPublic>({
    queryKey: ['/api/repair-center/parent-payment-config'],
  });

  useEffect(() => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch {
        setCart([]);
      }
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: { items: { productId: string; quantity: number }[]; paymentMethod: string; notes: string }) => {
      const res = await apiRequest('POST', '/api/repair-center/b2b-orders', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ordine creato", description: "Il tuo ordine è stato inviato al rivenditore per approvazione" });
      saveCart([]);
      setCheckoutOpen(false);
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/b2b-orders'] });
      navigate('/repair-center/b2b-orders');
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateQuantity = (productId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(newCart);
  };

  const removeFromCart = (productId: string) => {
    const newCart = cart.filter(item => item.productId !== productId);
    saveCart(newCart);
    toast({ title: "Prodotto rimosso", description: "Prodotto rimosso dal carrello" });
  };

  const clearCart = () => {
    saveCart([]);
    toast({ title: "Carrello svuotato", description: "Tutti i prodotti sono stati rimossi" });
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.b2bPrice * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Carrello vuoto", description: "Aggiungi prodotti al carrello prima di procedere", variant: "destructive" });
      return;
    }
    setCheckoutOpen(true);
  };

  const submitOrder = () => {
    createOrderMutation.mutate({
      items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
      paymentMethod,
      notes,
    });
  };

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
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">Carrello</h1>
              <p className="text-emerald-100">Gestisci i prodotti nel tuo carrello e completa l'ordine</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" onClick={() => navigate('/repair-center/dispositivi')} data-testid="button-back-catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al Catalogo
            </Button>
            {cart.length > 0 && (
              <Button variant="outline" className="bg-red-500/80 backdrop-blur-sm text-white border-red-400/50 hover:bg-red-600/80 shadow-lg" onClick={clearCart} data-testid="button-clear-cart">
                <Trash2 className="h-4 w-4 mr-2" />
                Svuota Carrello
              </Button>
            )}
          </div>
        </div>
      </div>

      {cart.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Il carrello è vuoto</h3>
            <p className="text-muted-foreground mb-6">Aggiungi prodotti dal catalogo dispositivi per iniziare</p>
            <Button onClick={() => navigate('/repair-center/dispositivi')} data-testid="button-go-catalog">
              <Package className="h-4 w-4 mr-2" />
              Vai al Catalogo Dispositivi
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prodotti nel Carrello ({cartItemCount})</CardTitle>
                <CardDescription>Modifica le quantità o rimuovi prodotti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`cart-item-${item.productId}`}>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.b2bPrice)} cad.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, -1)}
                          disabled={item.quantity <= 1}
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-10 text-center font-medium">{item.quantity}</span>
                        <Button 
                          size="icon" 
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, 1)}
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="w-24 text-right font-semibold">
                        {formatPrice(item.b2bPrice * item.quantity)}
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => removeFromCart(item.productId)}
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riepilogo Ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Prodotti:</span>
                  <span>{cartItemCount}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Totale:</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleCheckout} data-testid="button-checkout">
                  <Send className="h-4 w-4 mr-2" />
                  Procedi all'Ordine
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Gli ordini B2B vengono inviati al tuo rivenditore per approvazione. 
                  Una volta approvati, i prodotti verranno trasferiti nel tuo magazzino.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conferma Ordine B2B</DialogTitle>
            <DialogDescription>Verifica i prodotti e conferma l'ordine al rivenditore</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-64">
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantità: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">{formatPrice(item.b2bPrice * item.quantity)}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-method">Metodo di Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bonifico Bancario</SelectItem>
                  <SelectItem value="cash">Contanti alla Consegna</SelectItem>
                  <SelectItem value="credit">Credito Rivenditore</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Show IBAN details when bank_transfer is selected */}
              {paymentMethod === "bank_transfer" && paymentConfig?.bankTransfer.enabled && paymentConfig.bankTransfer.iban && (
                <Card className="mt-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Coordinate Bancarie Rivenditore</h4>
                        <div className="grid gap-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">IBAN:</span>
                            <span className="font-mono font-medium text-blue-900 dark:text-blue-100" data-testid="text-reseller-iban">{paymentConfig.bankTransfer.iban}</span>
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
              <Label htmlFor="notes">Note Ordine (opzionale)</Label>
              <Textarea
                id="notes"
                placeholder="Aggiungi note per il rivenditore..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-notes"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Totale Ordine:</span>
            <span className="text-2xl font-bold text-primary">{formatPrice(cartTotal)}</span>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)} data-testid="button-cancel-checkout">
              Annulla
            </Button>
            <Button 
              onClick={submitOrder} 
              disabled={createOrderMutation.isPending}
              data-testid="button-confirm-order"
            >
              {createOrderMutation.isPending ? (
                "Invio in corso..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Conferma Ordine
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
