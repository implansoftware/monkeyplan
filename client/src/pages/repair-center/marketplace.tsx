import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product } from "@shared/schema";
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
import { Store, Search, ShoppingCart, Plus, Minus, Trash2, Send, Package, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const { data: catalog, isLoading } = useQuery<MarketplaceCatalogItem[]>({
    queryKey: ['/api/repair-center/marketplace/catalog'],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { sellerResellerId: string; items: { productId: string; quantity: number }[]; paymentMethod: string; buyerNotes: string }) => {
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
    const sellerResellerId = cart[0].sellerResellerId;
    createOrderMutation.mutate({
      sellerResellerId,
      items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
      paymentMethod,
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Marketplace Rivenditori</h1>
              <p className="text-sm text-muted-foreground">Acquista prodotti da tutti i rivenditori</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotti o rivenditori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-72"
                data-testid="input-search-rc-marketplace"
              />
            </div>
            <Button 
              variant="default" 
              className="relative shadow-lg shadow-primary/25"
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
              <div className="flex items-center gap-2 mb-4">
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
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(item.unitPrice)} / pz</p>
                  </div>
                  <div className="flex items-center gap-2">
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
            <div className="flex justify-between text-lg font-bold">
              <span>Totale:</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>

            <div className="space-y-2">
              <Label>Metodo di pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger data-testid="select-rc-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bonifico Bancario</SelectItem>
                  <SelectItem value="cash">Contanti</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            <Button 
              onClick={submitOrder}
              disabled={createOrderMutation.isPending || cart.length === 0}
              data-testid="button-rc-submit-marketplace-order"
            >
              <Send className="h-4 w-4 mr-2" />
              {createOrderMutation.isPending ? "Invio..." : "Invia Ordine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
