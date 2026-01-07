import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ShoppingBag, Search, Filter, Package, ShoppingCart, Trash2, 
  Loader2, AlertTriangle, CheckCircle, ExternalLink, ChevronLeft, 
  ChevronRight, Eye, Truck, Clock, Euro, Smartphone, Battery, Monitor
} from "lucide-react";

interface TrovausatiCredential {
  id: string;
  marketplaceApiKey: string | null;
  marketplaceId: string | null;
  isActive: boolean;
}

interface MarketplaceProduct {
  type: "product";
  id: number;
  attributes: {
    brand: string;
    model: string;
    full_price: number;
    price: number;
    vat_type: number;
    image_url: string;
    color: string;
    description: string;
    condition: string;
    screen_condition: string;
    battery_condition: string;
    battery_perc: number;
    accessories: string;
    warranty: string;
    purchase_proof_data: string;
    anomalies: string;
  };
}

interface MarketplaceOrder {
  id: number;
  attributes: {
    status: string;
    reference: string;
    total_products: number;
    price: number;
    created_at?: string;
    products?: Array<{
      id: number;
      properties: {
        brand: string;
        model: string;
        price: number;
      };
    }>;
  };
}

export default function TrovausatiMarketplacePage() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [cart, setCart] = useState<MarketplaceProduct[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderReference, setOrderReference] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  const { data: credential, isLoading: loadingCredential } = useQuery<TrovausatiCredential | null>({
    queryKey: ["/api/trovausati/credentials"],
  });

  const { data: products = [], isLoading: loadingProducts, refetch: refetchProducts } = useQuery<MarketplaceProduct[]>({
    queryKey: ["/api/trovausati/marketplace/products", page],
    queryFn: async () => {
      const res = await fetch(`/api/trovausati/marketplace/products?page=${page}&limit=25`);
      if (!res.ok) throw new Error("Errore nel caricamento prodotti");
      return res.json();
    },
    enabled: !!credential?.isActive && !!credential?.marketplaceId,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery<MarketplaceOrder[]>({
    queryKey: ["/api/trovausati/marketplace/orders"],
    enabled: !!credential?.isActive && activeTab === "orders",
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const productIds = cart.map(p => p.id);
      const res = await apiRequest("POST", "/api/trovausati/marketplace/orders", {
        productIds,
        reference: orderReference || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/marketplace/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/marketplace/products"] });
      setCart([]);
      setShowCheckout(false);
      setOrderReference("");
      toast({ 
        title: "Ordine effettuato", 
        description: `Ordine #${data.id || "N/A"} creato con successo` 
      });
      setActiveTab("orders");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const addToCart = (product: MarketplaceProduct) => {
    if (cart.find(p => p.id === product.id)) {
      toast({ title: "Già nel carrello", description: "Questo prodotto è già nel carrello" });
      return;
    }
    setCart([...cart, product]);
    toast({ title: "Aggiunto al carrello", description: `${product.attributes.brand} ${product.attributes.model}` });
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(p => p.id !== productId));
  };

  const cartTotal = cart.reduce((sum, p) => sum + p.attributes.price, 0);

  const filteredProducts = products.filter(p => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.attributes.brand.toLowerCase().includes(search) ||
      p.attributes.model.toLowerCase().includes(search) ||
      p.attributes.color.toLowerCase().includes(search)
    );
  });

  const getConditionBadge = (condition: string) => {
    const conditionMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "never_used": { label: "Mai usato", variant: "default" },
      "great": { label: "Ottimo", variant: "default" },
      "good": { label: "Buono", variant: "secondary" },
      "average": { label: "Medio", variant: "outline" },
      "poor": { label: "Discreto", variant: "destructive" },
    };
    const config = conditionMap[condition] || { label: condition, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "pending": { label: "In attesa", variant: "outline" },
      "confirmed": { label: "Confermato", variant: "default" },
      "shipped": { label: "Spedito", variant: "secondary" },
      "delivered": { label: "Consegnato", variant: "default" },
    };
    const config = statusMap[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loadingCredential) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!credential || !credential.isActive) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Il Marketplace B2B non è configurato o attivo. 
            <a href="/reseller/trovausati/settings" className="ml-1 underline">Configura le credenziali</a>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!credential.marketplaceId) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Marketplace ID non configurato. Contatta l'assistenza TrovaUsati per ottenere il tuo ID marketplace.
          </AlertDescription>
        </Alert>
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
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Marketplace B2B TrovaUsati</h1>
              <p className="text-sm text-muted-foreground">Acquista dispositivi usati certificati</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowCart(true)}
            className="relative shadow-lg shadow-primary/25"
            data-testid="button-open-cart"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Carrello
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {cart.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2" data-testid="tab-products">
            <Package className="h-4 w-4" />
            Prodotti
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2" data-testid="tab-orders">
            <Truck className="h-4 w-4" />
            I Miei Ordini
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca per marca, modello, colore..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-products"
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={() => refetchProducts()} data-testid="button-refresh-products">
                  <Filter className="h-4 w-4 mr-2" />
                  Aggiorna
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun prodotto trovato</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden" data-testid={`product-card-${product.id}`}>
                      <div className="aspect-square relative bg-muted">
                        {product.attributes.image_url ? (
                          <img
                            src={product.attributes.image_url}
                            alt={`${product.attributes.brand} ${product.attributes.model}`}
                            className="w-full h-full object-contain p-4"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Smartphone className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          {getConditionBadge(product.attributes.condition)}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold truncate">
                          {product.attributes.brand} {product.attributes.model}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {product.attributes.color}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Battery className="h-3 w-3" />
                          <span>{product.attributes.battery_perc}%</span>
                          <Monitor className="h-3 w-3 ml-2" />
                          <span>{product.attributes.screen_condition}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div>
                            {product.attributes.full_price > product.attributes.price && (
                              <span className="text-sm text-muted-foreground line-through mr-2">
                                €{(product.attributes.full_price / 100).toFixed(2)}
                              </span>
                            )}
                            <span className="text-lg font-bold text-primary">
                              €{(product.attributes.price / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setSelectedProduct(product)}
                          data-testid={`button-view-product-${product.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Dettagli
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => addToCart(product)}
                          disabled={cart.some(p => p.id === product.id)}
                          data-testid={`button-add-to-cart-${product.id}`}
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {cart.some(p => p.id === product.id) ? "Nel carrello" : "Aggiungi"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Precedente
              </Button>
              <span className="text-sm text-muted-foreground">Pagina {page + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={products.length < 25}
                data-testid="button-next-page"
              >
                Successiva
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Storico Ordini
              </CardTitle>
              <CardDescription>I tuoi ordini sul marketplace TrovaUsati</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessun ordine effettuato</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} data-testid={`order-card-${order.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Ordine #{order.id}</span>
                              {getStatusBadge(order.attributes.status)}
                            </div>
                            {order.attributes.reference && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Rif: {order.attributes.reference}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              €{(order.attributes.price / 100).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {order.attributes.total_products} prodotti
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedProduct.attributes.brand} {selectedProduct.attributes.model}
                </DialogTitle>
                <DialogDescription>{selectedProduct.attributes.color}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  {selectedProduct.attributes.image_url ? (
                    <img
                      src={selectedProduct.attributes.image_url}
                      alt={`${selectedProduct.attributes.brand} ${selectedProduct.attributes.model}`}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Smartphone className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getConditionBadge(selectedProduct.attributes.condition)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Battery className="h-4 w-4 text-muted-foreground" />
                      <span>Batteria: {selectedProduct.attributes.battery_perc}% - {selectedProduct.attributes.battery_condition}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span>Schermo: {selectedProduct.attributes.screen_condition}</span>
                    </div>
                    {selectedProduct.attributes.warranty && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <span>Garanzia: {selectedProduct.attributes.warranty}</span>
                      </div>
                    )}
                  </div>
                  {selectedProduct.attributes.description && (
                    <div>
                      <Label>Descrizione</Label>
                      <p className="text-sm text-muted-foreground">{selectedProduct.attributes.description}</p>
                    </div>
                  )}
                  {selectedProduct.attributes.anomalies && (
                    <div>
                      <Label>Anomalie</Label>
                      <p className="text-sm text-muted-foreground">{selectedProduct.attributes.anomalies}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      {selectedProduct.attributes.full_price > selectedProduct.attributes.price && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                          €{(selectedProduct.attributes.full_price / 100).toFixed(2)}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-primary">
                        €{(selectedProduct.attributes.price / 100).toFixed(2)}
                      </span>
                    </div>
                    <Button 
                      onClick={() => {
                        addToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      disabled={cart.some(p => p.id === selectedProduct.id)}
                      data-testid="button-add-to-cart-detail"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {cart.some(p => p.id === selectedProduct.id) ? "Nel carrello" : "Aggiungi al carrello"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carrello ({cart.length})
            </DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Il carrello è vuoto</p>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-80">
                <div className="space-y-2">
                  {cart.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center gap-3 p-3 border rounded-lg"
                      data-testid={`cart-item-${product.id}`}
                    >
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        {product.attributes.image_url ? (
                          <img
                            src={product.attributes.image_url}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Smartphone className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {product.attributes.brand} {product.attributes.model}
                        </p>
                        <p className="text-sm text-muted-foreground">{product.attributes.color}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{(product.attributes.price / 100).toFixed(2)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(product.id)}
                        data-testid={`button-remove-from-cart-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <span className="font-semibold">Totale</span>
                <span className="text-xl font-bold">€{(cartTotal / 100).toFixed(2)}</span>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCart(false)}>
                  Continua acquisti
                </Button>
                <Button onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="button-checkout">
                  Procedi all'ordine
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Ordine</DialogTitle>
            <DialogDescription>
              Stai per ordinare {cart.length} prodotti per un totale di €{(cartTotal / 100).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="orderReference">Riferimento ordine (opzionale)</Label>
              <Input
                id="orderReference"
                placeholder="Es. ORD-2026-001"
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value)}
                data-testid="input-order-reference"
              />
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Confermando l'ordine, i prodotti saranno riservati e riceverai le istruzioni per il pagamento.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => placeOrderMutation.mutate()}
              disabled={placeOrderMutation.isPending}
              data-testid="button-confirm-order"
            >
              {placeOrderMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Conferma Ordine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
