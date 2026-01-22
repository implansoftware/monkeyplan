import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
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
import { Package, Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Send, Box, Building2, Store, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  unitPrice: number;
  minQty: number;
  maxQty: number;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export default function ResellerB2BCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const { toast } = useToast();

  const { data: catalog, isLoading } = useQuery<B2BCatalogItem[]>({
    queryKey: ['/api/reseller/b2b-catalog'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { items: { productId: string; quantity: number }[]; paymentMethod: string; notes: string }) => {
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

  const cartTotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Catalogo B2B Admin</h1>
              <p className="text-muted-foreground text-sm">Ordina prodotti direttamente dall'Admin (fornitore centrale)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
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
        <Card>
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
              <Card key={item.product.id} data-testid={`card-product-${item.product.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{item.product.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
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
                      <div className="flex items-center gap-1">
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
            <DialogTitle className="flex items-center gap-2">
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
                      <div className="flex items-center gap-3">
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

          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Totale Ordine:</span>
            <span className="text-primary">{formatPrice(cartTotal)}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Metodo di Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-payment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bonifico Bancario</SelectItem>
                </SelectContent>
              </Select>
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
