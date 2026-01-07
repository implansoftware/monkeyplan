import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { ShoppingCart, Plus, Minus, Trash2, Send, ArrowLeft, Package } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  b2bPrice: number;
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
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Carrello B2B</h1>
              <p className="text-sm text-muted-foreground">Gestisci i prodotti nel tuo carrello e completa l'ordine</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/repair-center/dispositivi')} data-testid="button-back-catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al Catalogo
            </Button>
            {cart.length > 0 && (
              <Button variant="destructive" className="shadow-lg shadow-primary/25" onClick={clearCart} data-testid="button-clear-cart">
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
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
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
