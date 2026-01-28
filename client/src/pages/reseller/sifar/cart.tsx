import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { 
  ShoppingCart, Trash2, ArrowLeft, Package, Truck, Send, 
  Loader2, AlertTriangle, CheckCircle, Plus, Minus
} from "lucide-react";

interface SifarStore {
  id: string;
  storeCode: string;
  storeName: string | null;
  isDefault: boolean;
}

interface SifarCartItem {
  codiceArticolo: string;
  descArticolo: string;
  quantita: number;
  prezzo: number;
  prezzoIvato: number;
  totale: number;
  totaleIvato: number;
  disponibile: boolean;
}

interface SifarCartDetail {
  articoli: SifarCartItem[];
  totale: number;
  totaleIvato: number;
  inviabile: boolean;
}

interface SifarCourier {
  codiceCorriere: string;
  descCorriere: string;
  disponibile: boolean;
}

export default function SifarCartPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedStoreCode, setSelectedStoreCode] = useState<string>("");
  const [selectedCourier, setSelectedCourier] = useState<string>("");
  const [showConfirmOrder, setShowConfirmOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<{ numeroOrdine: string; idOrdine: string } | null>(null);

  const { data: stores = [], isLoading: loadingStores } = useQuery<SifarStore[]>({
    queryKey: ["/api/sifar/stores"],
  });

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreCode) {
      const defaultStore = stores.find(s => s.isDefault) || stores[0];
      setSelectedStoreCode(defaultStore.storeCode);
    }
  }, [stores, selectedStoreCode]);

  const { data: cart, isLoading: loadingCart, refetch: refetchCart } = useQuery<SifarCartDetail>({
    queryKey: ["/api/sifar/cart", selectedStoreCode],
    queryFn: async () => {
      if (!selectedStoreCode) return { articoli: [], totale: 0, totaleIvato: 0, inviabile: false };
      const res = await fetch(`/api/sifar/cart?storeCode=${selectedStoreCode}`);
      if (!res.ok) throw new Error("Errore nel caricamento carrello");
      return res.json();
    },
    enabled: !!selectedStoreCode,
  });

  const { data: couriers = [], isLoading: loadingCouriers } = useQuery<SifarCourier[]>({
    queryKey: ["/api/sifar/couriers", selectedStoreCode],
    queryFn: async () => {
      if (!selectedStoreCode) return [];
      const res = await fetch(`/api/sifar/couriers?storeCode=${selectedStoreCode}`);
      if (!res.ok) throw new Error("Errore nel caricamento corrieri");
      return res.json();
    },
    enabled: !!selectedStoreCode,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ articleCode, quantity }: { articleCode: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/sifar/cart/update", {
        storeCode: selectedStoreCode,
        articleCode,
        quantity,
      });
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (articleCode: string) => {
      const res = await apiRequest("DELETE", `/api/sifar/cart/remove?storeCode=${selectedStoreCode}&articleCode=${articleCode}`);
      return res;
    },
    onSuccess: () => {
      refetchCart();
      toast({ title: "Articolo rimosso dal carrello" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/sifar/cart/clear?storeCode=${selectedStoreCode}`);
      return res;
    },
    onSuccess: () => {
      refetchCart();
      toast({ title: "Carrello svuotato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const submitOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sifar/order", {
        storeCode: selectedStoreCode,
        courierId: selectedCourier,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setOrderResult(data);
      setShowConfirmOrder(false);
      refetchCart();
      toast({ title: "Ordine inviato", description: `Numero ordine: ${data.numeroOrdine}` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore nell'invio ordine", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  if (loadingStores) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nessun punto vendita configurato. Configura le credenziali SIFAR prima di continuare.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/reseller/sifar/catalog">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Carrello SIFAR</h1>
            <p className="text-muted-foreground">Rivedi e conferma il tuo ordine</p>
          </div>
        </div>
      </div>

      {orderResult && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Ordine inviato con successo! Numero ordine: <strong>{orderResult.numeroOrdine}</strong>
            </span>
            <Button variant="outline" size="sm" onClick={() => setOrderResult(null)}>
              Chiudi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Package className="h-5 w-5" />
                  Articoli nel Carrello
                </CardTitle>
                {cart && cart.articoli.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearCartMutation.mutate()}
                    disabled={clearCartMutation.isPending}
                    data-testid="button-clear-cart"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Svuota
                  </Button>
                )}
              </div>
              <CardDescription>
                Punto vendita: {stores.find(s => s.storeCode === selectedStoreCode)?.storeName || selectedStoreCode}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCart ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !cart || cart.articoli.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Il carrello è vuoto</p>
                  <Link href="/reseller/sifar/catalog">
                    <Button variant="outline" className="mt-4">
                      Sfoglia catalogo
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.articoli.map((item) => (
                    <div
                      key={item.codiceArticolo}
                      className="flex items-center justify-between p-4 border rounded-md"
                      data-testid={`cart-item-${item.codiceArticolo}`}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.descArticolo}</h4>
                        <div className="text-sm text-muted-foreground">
                          Cod: {item.codiceArticolo}
                        </div>
                        <div className="text-sm mt-1">
                          {formatPrice(item.prezzoIvato * 100)} cad.
                        </div>
                        {!item.disponibile && (
                          <Badge variant="destructive" className="mt-1">
                            Non disponibile
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              if (item.quantita > 1) {
                                updateQuantityMutation.mutate({
                                  articleCode: item.codiceArticolo,
                                  quantity: item.quantita - 1
                                });
                              }
                            }}
                            disabled={item.quantita <= 1 || updateQuantityMutation.isPending}
                            data-testid={`button-decrease-cart-${item.codiceArticolo}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantita}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantityMutation.mutate({
                              articleCode: item.codiceArticolo,
                              quantity: item.quantita + 1
                            })}
                            disabled={updateQuantityMutation.isPending}
                            data-testid={`button-increase-cart-${item.codiceArticolo}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right w-24">
                          <div className="font-bold">
                            {formatPrice(item.totaleIvato * 100)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItemMutation.mutate(item.codiceArticolo)}
                          disabled={removeItemMutation.isPending}
                          data-testid={`button-remove-${item.codiceArticolo}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Truck className="h-5 w-5" />
                Riepilogo Ordine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Corriere</Label>
                <Select 
                  value={selectedCourier} 
                  onValueChange={setSelectedCourier}
                  disabled={loadingCouriers || !cart || cart.articoli.length === 0}
                >
                  <SelectTrigger data-testid="select-courier">
                    <SelectValue placeholder={loadingCouriers ? "Caricamento..." : "Seleziona corriere"} />
                  </SelectTrigger>
                  <SelectContent>
                    {couriers.filter(c => c.disponibile).map(courier => (
                      <SelectItem key={courier.codiceCorriere} value={courier.codiceCorriere}>
                        {courier.descCorriere}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotale</span>
                  <span>{cart ? formatPrice(cart.totale * 100) : "€ 0,00"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>IVA</span>
                  <span>{cart ? formatPrice((cart.totaleIvato - cart.totale) * 100) : "€ 0,00"}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Totale</span>
                  <span>{cart ? formatPrice(cart.totaleIvato * 100) : "€ 0,00"}</span>
                </div>
              </div>

              {cart && !cart.inviabile && cart.articoli.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Alcuni articoli non sono disponibili. Rimuovili per procedere.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setShowConfirmOrder(true)}
                disabled={!cart || cart.articoli.length === 0 || !cart.inviabile || !selectedCourier}
                data-testid="button-checkout"
              >
                <Send className="h-4 w-4 mr-2" />
                Invia Ordine
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Dialog open={showConfirmOrder} onOpenChange={setShowConfirmOrder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Ordine</DialogTitle>
            <DialogDescription>
              Stai per inviare un ordine a SIFAR. Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Articoli:</span>
                <span>{cart?.articoli.reduce((sum, a) => sum + a.quantita, 0) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Corriere:</span>
                <span>{couriers.find(c => c.codiceCorriere === selectedCourier)?.descCorriere || "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Totale:</span>
                <span>{cart ? formatPrice(cart.totaleIvato * 100) : "€ 0,00"}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmOrder(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => submitOrderMutation.mutate()}
              disabled={submitOrderMutation.isPending}
              data-testid="button-confirm-order"
            >
              {submitOrderMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Conferma Ordine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
