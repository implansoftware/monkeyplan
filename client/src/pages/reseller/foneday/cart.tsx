import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  ShoppingCart, Package, Trash2, Loader2, Settings, AlertTriangle,
  Send, ArrowLeft, Plus, Minus, CreditCard
} from "lucide-react";
import { Link } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FonedayCartItem = {
  id: number;
  product_id: number;
  product_sku: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  stock: number;
};

type FonedayCart = {
  items: FonedayCartItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
};

type FonedayCredential = {
  id: string;
  isActive: boolean;
};

type FonedayShippingMethod = {
  id: string;
  name: string;
  price: number;
  estimated_days: string;
};

type ShippingAddress = {
  name: string;
  company: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postal_code: string;
  country_code: string;
  phone: string;
  email: string;
};

const initialAddress: ShippingAddress = {
  name: "",
  company: "",
  address_line1: "",
  address_line2: "",
  city: "",
  postal_code: "",
  country_code: "IT",
  phone: "",
  email: "",
};

export default function FonedayCartPage() {
  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("");
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [notes, setNotes] = useState("");

  const { data: credential, isLoading: loadingCredential } = useQuery<FonedayCredential | null>({
    queryKey: ["/api/foneday/credentials"],
  });

  const { data: cart, isLoading: loadingCart, refetch: refetchCart } = useQuery<FonedayCart>({
    queryKey: ["/api/foneday/cart"],
    enabled: !!credential?.isActive,
  });

  const { data: shippingMethods = [] } = useQuery<FonedayShippingMethod[]>({
    queryKey: ["/api/foneday/shipping-methods"],
    enabled: !!credential?.isActive && showCheckout,
  });

  const updateCartMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const res = await apiRequest("PUT", `/api/foneday/cart/items/${itemId}`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("DELETE", `/api/foneday/cart/items/${itemId}`);
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
      toast({ title: "Rimosso dal carrello" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/foneday/cart");
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
      const res = await apiRequest("POST", "/api/foneday/orders", {
        shippingMethodId: selectedShipping,
        shippingAddress: address,
        notes: notes || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      refetchCart();
      setShowCheckout(false);
      setAddress(initialAddress);
      setNotes("");
      setSelectedShipping("");
      toast({
        title: "Ordine inviato",
        description: `Ordine #${data.order_number} creato con successo`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const handleQuantityChange = (item: FonedayCartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty < 1) return;
    if (newQty > item.stock) {
      toast({ title: "Quantità non disponibile", variant: "destructive" });
      return;
    }
    updateCartMutation.mutate({ itemId: item.id, quantity: newQty });
  };

  const isAddressValid = () => {
    return (
      address.name.trim() &&
      address.address_line1.trim() &&
      address.city.trim() &&
      address.postal_code.trim() &&
      address.phone.trim() &&
      address.email.trim()
    );
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
          <AlertDescription className="flex items-center justify-between">
            <span>Credenziali Foneday non configurate.</span>
            <Link href="/reseller/foneday/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configura
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Carrello Foneday</h1>
            <p className="text-muted-foreground">Gestisci i prodotti nel carrello e completa l'ordine</p>
          </div>
        </div>
        <Link href="/reseller/foneday/catalog">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al Catalogo
          </Button>
        </Link>
      </div>

      {loadingCart ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Carrello vuoto</h3>
            <p className="text-muted-foreground mb-4">
              Non hai ancora aggiunto prodotti al carrello
            </p>
            <Link href="/reseller/foneday/catalog">
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Vai al Catalogo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Prodotti ({cart.items.length})</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearCartMutation.mutate()}
                  disabled={clearCartMutation.isPending}
                >
                  {clearCartMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="ml-2">Svuota</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product_name}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                      <p className="text-sm font-medium mt-1">{formatPrice(item.price)} cad.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item, -1)}
                          disabled={item.quantity <= 1 || updateCartMutation.isPending}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(item, 1)}
                          disabled={item.quantity >= item.stock || updateCartMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCartMutation.mutate(item.id)}
                        disabled={removeFromCartMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {showCheckout && (
              <Card>
                <CardHeader>
                  <CardTitle>Indirizzo di Spedizione</CardTitle>
                  <CardDescription>Inserisci i dati per la consegna</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome e Cognome *</Label>
                      <Input
                        id="name"
                        value={address.name}
                        onChange={(e) => setAddress({ ...address, name: e.target.value })}
                        data-testid="input-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Azienda</Label>
                      <Input
                        id="company"
                        value={address.company}
                        onChange={(e) => setAddress({ ...address, company: e.target.value })}
                        data-testid="input-company"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address1">Indirizzo *</Label>
                    <Input
                      id="address1"
                      value={address.address_line1}
                      onChange={(e) => setAddress({ ...address, address_line1: e.target.value })}
                      data-testid="input-address1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address2">Indirizzo 2</Label>
                    <Input
                      id="address2"
                      value={address.address_line2}
                      onChange={(e) => setAddress({ ...address, address_line2: e.target.value })}
                      data-testid="input-address2"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">Città *</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        data-testid="input-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal">CAP *</Label>
                      <Input
                        id="postal"
                        value={address.postal_code}
                        onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                        data-testid="input-postal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Paese</Label>
                      <Select
                        value={address.country_code}
                        onValueChange={(val) => setAddress({ ...address, country_code: val })}
                      >
                        <SelectTrigger data-testid="select-country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IT">Italia</SelectItem>
                          <SelectItem value="DE">Germania</SelectItem>
                          <SelectItem value="FR">Francia</SelectItem>
                          <SelectItem value="ES">Spagna</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        data-testid="input-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={address.email}
                        onChange={(e) => setAddress({ ...address, email: e.target.value })}
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Note (opzionale)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Istruzioni speciali per la consegna..."
                      data-testid="input-notes"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Riepilogo Ordine</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotale</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA</span>
                    <span>{formatPrice(cart.tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Totale</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                </div>

                {showCheckout && (
                  <div className="space-y-2">
                    <Label>Metodo di Spedizione</Label>
                    <Select value={selectedShipping} onValueChange={setSelectedShipping}>
                      <SelectTrigger data-testid="select-shipping">
                        <SelectValue placeholder="Seleziona spedizione" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name} - {formatPrice(method.price)} ({method.estimated_days})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {!showCheckout ? (
                  <Button
                    className="w-full"
                    onClick={() => setShowCheckout(true)}
                    data-testid="button-checkout"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Procedi all'Ordine
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => submitOrderMutation.mutate()}
                      disabled={
                        submitOrderMutation.isPending ||
                        !selectedShipping ||
                        !isAddressValid()
                      }
                      data-testid="button-submit-order"
                    >
                      {submitOrderMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Invia Ordine
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowCheckout(false)}
                    >
                      Annulla
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {showCheckout && !isAddressValid() && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Compila tutti i campi obbligatori (*) per procedere
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
