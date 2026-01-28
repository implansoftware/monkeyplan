import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, MapPin, CreditCard, Truck, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Cart, CartItem, CustomerAddress } from "@shared/schema";

interface CartItemWithProduct extends CartItem {
  product: { name: string; images?: string[] } | null;
}

export default function ShopCheckout() {
  const { resellerId } = useParams<{ resellerId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>("");
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>("");
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  const [deliveryType, setDeliveryType] = useState<string>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [customerNotes, setCustomerNotes] = useState("");
  const [showAddAddressDialog, setShowAddAddressDialog] = useState(false);
  
  const { data: cartData, isLoading: isLoadingCart } = useQuery<{ cart: Cart; items: CartItemWithProduct[] }>({
    queryKey: ['/api/shop', resellerId, 'cart'],
    queryFn: async () => {
      const res = await fetch(`/api/shop/${resellerId}/cart`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento carrello');
      return res.json();
    }
  });
  
  const { data: addresses, isLoading: isLoadingAddresses } = useQuery<CustomerAddress[]>({
    queryKey: ['/api/customer-addresses'],
    enabled: !!user
  });
  
  const addAddressForm = useForm({
    defaultValues: {
      recipientName: user?.fullName || "",
      phone: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      country: "IT",
      label: ""
    }
  });
  
  const addAddress = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/customer-addresses', data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-addresses'] });
      setShowAddAddressDialog(false);
      setSelectedShippingAddress(data.id);
      toast({ title: "Indirizzo aggiunto" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const placeOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/shop/${resellerId}/checkout`, {
        shippingAddressId: selectedShippingAddress,
        billingAddressId: sameBillingAddress ? selectedShippingAddress : selectedBillingAddress,
        deliveryType,
        paymentMethod,
        customerNotes
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop', resellerId, 'cart'] });
      toast({ title: "Ordine confermato!", description: `Ordine #${data.orderNumber}` });
      setLocation(`/customer/orders/${data.order?.id || ''}`);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const cart = cartData?.cart;
  const items = cartData?.items || [];
  
  if (!user) {
    setLocation('/auth');
    return null;
  }
  
  if (items.length === 0 && !isLoadingCart) {
    setLocation(`/shop/${resellerId}`);
    return null;
  }
  
  const defaultAddress = addresses?.find(a => a.isDefault);
  if (defaultAddress && !selectedShippingAddress) {
    setSelectedShippingAddress(defaultAddress.id);
  }
  
  const canPlaceOrder = selectedShippingAddress && paymentMethod;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(`/shop/${resellerId}/cart`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-checkout-title">Checkout</h1>
          <p className="text-muted-foreground">Completa il tuo ordine</p>
        </div>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <MapPin className="h-5 w-5" />
                Indirizzo di spedizione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAddresses ? (
                <p>Caricamento indirizzi...</p>
              ) : addresses?.length === 0 ? (
                <p className="text-muted-foreground">Nessun indirizzo salvato</p>
              ) : (
                <RadioGroup value={selectedShippingAddress} onValueChange={setSelectedShippingAddress}>
                  {addresses?.map((addr) => (
                    <div key={addr.id} className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate">
                      <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} />
                      <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
                        <div className="font-medium">{addr.recipientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {addr.address}, {addr.postalCode} {addr.city} ({addr.province})
                        </div>
                        {addr.phone && <div className="text-sm text-muted-foreground">{addr.phone}</div>}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              <Dialog open={showAddAddressDialog} onOpenChange={setShowAddAddressDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" data-testid="button-add-address">
                    <Plus className="mr-2 h-4 w-4" />
                    Aggiungi nuovo indirizzo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuovo indirizzo</DialogTitle>
                  </DialogHeader>
                  <Form {...addAddressForm}>
                    <form onSubmit={addAddressForm.handleSubmit((data) => addAddress.mutate(data))} className="space-y-4">
                      <FormField
                        control={addAddressForm.control}
                        name="recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome destinatario</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-recipient-name" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addAddressForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Indirizzo</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Via/Piazza, numero civico" data-testid="input-address" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={addAddressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Città</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-city" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addAddressForm.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Provincia</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="MI" maxLength={2} data-testid="input-province" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={addAddressForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CAP</FormLabel>
                              <FormControl>
                                <Input {...field} maxLength={5} data-testid="input-postal-code" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addAddressForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefono</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" data-testid="input-phone" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={addAddress.isPending}>
                        {addAddress.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salva indirizzo
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Truck className="h-5 w-5" />
                Metodo di consegna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate">
                  <RadioGroupItem value="shipping" id="delivery-shipping" />
                  <Label htmlFor="delivery-shipping" className="flex-1 cursor-pointer">
                    <div className="font-medium">Spedizione standard</div>
                    <div className="text-sm text-muted-foreground">Consegna in 3-5 giorni lavorativi</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate">
                  <RadioGroupItem value="express" id="delivery-express" />
                  <Label htmlFor="delivery-express" className="flex-1 cursor-pointer">
                    <div className="font-medium">Spedizione express</div>
                    <div className="text-sm text-muted-foreground">Consegna in 1-2 giorni lavorativi</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate">
                  <RadioGroupItem value="pickup" id="delivery-pickup" />
                  <Label htmlFor="delivery-pickup" className="flex-1 cursor-pointer">
                    <div className="font-medium">Ritiro in negozio</div>
                    <div className="text-sm text-muted-foreground">Ritira presso il punto vendita</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodo di pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate">
                  <RadioGroupItem value="card" id="payment-card" />
                  <Label htmlFor="payment-card" className="flex-1 cursor-pointer">
                    <div className="font-medium">Carta di credito/debito</div>
                    <div className="text-sm text-muted-foreground">Visa, Mastercard, American Express</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate">
                  <RadioGroupItem value="paypal" id="payment-paypal" />
                  <Label htmlFor="payment-paypal" className="flex-1 cursor-pointer">
                    <div className="font-medium">PayPal</div>
                    <div className="text-sm text-muted-foreground">Paga con il tuo account PayPal</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate">
                  <RadioGroupItem value="bank_transfer" id="payment-transfer" />
                  <Label htmlFor="payment-transfer" className="flex-1 cursor-pointer">
                    <div className="font-medium">Bonifico bancario</div>
                    <div className="text-sm text-muted-foreground">Riceverai le coordinate dopo l'ordine</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Note per l'ordine</CardTitle>
              <CardDescription>Aggiungi eventuali istruzioni o richieste speciali</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Es: Citofono rotto, chiamare al telefono..."
                rows={3}
                data-testid="input-customer-notes"
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Riepilogo ordine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="line-clamp-1">{item.product?.name} x{item.quantity}</span>
                    <span>{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <span>Subtotale</span>
                <span>{formatPrice(cart?.subtotal || 0)}</span>
              </div>
              {(cart?.discount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Sconto</span>
                  <span>-{formatPrice(cart?.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Spedizione</span>
                <span>{(cart?.shippingCost || 0) > 0 ? formatPrice(cart?.shippingCost || 0) : 'Gratuita'}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Totale</span>
                <span data-testid="text-checkout-total">{formatPrice(cart?.total || 0)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => placeOrder.mutate()}
                disabled={!canPlaceOrder || placeOrder.isPending}
                data-testid="button-place-order"
              >
                {placeOrder.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Elaborazione...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Conferma ordine
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
