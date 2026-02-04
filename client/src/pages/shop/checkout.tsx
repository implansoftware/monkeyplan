import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, MapPin, CreditCard, Truck, Check, Loader2, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Cart, CartItem, CustomerAddress, ShippingMethod } from "@shared/schema";
import PayPalButton from "@/components/PayPalButton";
import { StripeB2BCheckout } from "@/components/StripeB2BCheckout";

interface CartItemWithProduct extends CartItem {
  product: { name: string; images?: string[]; vatRate?: number } | null;
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


export default function ShopCheckout() {
  const { resellerId } = useParams<{ resellerId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<string>("");
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<string>("");
  const [sameBillingAddress, setSameBillingAddress] = useState(true);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [customerNotes, setCustomerNotes] = useState("");
  const [showAddAddressDialog, setShowAddAddressDialog] = useState(false);
  
  const { data: cartData, isLoading: isLoadingCart } = useQuery<{ cart: Cart; items: CartItemWithProduct[]; customerVatRate?: number }>({
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
  
  // Fetch reseller's payment configuration
  const { data: paymentConfig, isLoading: isLoadingPaymentConfig } = useQuery<PaymentConfigPublic>({
    queryKey: ['/api/payment-config', resellerId, 'public'],
    queryFn: async () => {
      const res = await fetch(`/api/payment-config/${resellerId}/public`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento metodi di pagamento');
      return res.json();
    },
    enabled: !!resellerId
  });
  
  // Fetch reseller's shipping methods
  const { data: shippingMethods, isLoading: isLoadingShipping } = useQuery<ShippingMethod[]>({
    queryKey: ['/api/shipping-methods/public', resellerId],
    queryFn: async () => {
      const res = await fetch(`/api/shipping-methods/public?resellerId=${resellerId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento metodi di spedizione');
      return res.json();
    },
    enabled: !!resellerId
  });
  
  // Set first shipping method as default
  useEffect(() => {
    if (shippingMethods && shippingMethods.length > 0 && !selectedShippingMethod) {
      setSelectedShippingMethod(shippingMethods[0].id);
    }
  }, [shippingMethods, selectedShippingMethod]);
  
  // Set first enabled payment method as default
  useEffect(() => {
    if (paymentConfig) {
      if (paymentConfig.stripe.enabled) {
        setPaymentMethod("card");
      } else if (paymentConfig.bankTransfer.enabled) {
        setPaymentMethod("bank_transfer");
      } else if (paymentConfig.paypal.enabled) {
        setPaymentMethod("paypal");
      } else if (paymentConfig.satispay.enabled) {
        setPaymentMethod("satispay");
      } else {
        setPaymentMethod("");
      }
    }
  }, [paymentConfig]);
  
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
        shippingMethodId: selectedShippingMethod,
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
  
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
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
  
  const selectedMethod = shippingMethods?.find(m => m.id === selectedShippingMethod);
  const shippingCost = selectedMethod ? selectedMethod.priceCents / 100 : 0;
  const grandTotal = (cart?.subtotal || 0) - (cart?.discount || 0) + shippingCost;
  const canPlaceOrder = selectedShippingAddress && selectedShippingMethod && paymentMethod && paymentConfig?.hasAnyMethod;
  
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
              {isLoadingShipping ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !shippingMethods || shippingMethods.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Nessun metodo di consegna disponibile.</p>
                </div>
              ) : (
                <RadioGroup value={selectedShippingMethod} onValueChange={setSelectedShippingMethod}>
                  {shippingMethods.map((method) => (
                    <div key={method.id} className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate" data-testid={`shipping-method-${method.id}`}>
                      <RadioGroupItem value={method.id} id={`shipping-${method.id}`} />
                      <Label htmlFor={`shipping-${method.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{method.name}</span>
                          <span className="font-semibold">
                            {method.priceCents === 0 ? 'Gratuita' : formatPrice(method.priceCents / 100)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {method.isPickup 
                            ? 'Ritiro presso il punto vendita' 
                            : method.estimatedDays 
                              ? `Consegna in ${method.estimatedDays} giorni lavorativi`
                              : 'Tempi di consegna variabili'
                          }
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodo di pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPaymentConfig ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !paymentConfig?.hasAnyMethod ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p>Nessun metodo di pagamento disponibile.</p>
                  <p className="text-sm">Contatta il venditore per maggiori informazioni.</p>
                </div>
              ) : (
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  {paymentConfig.stripe.enabled && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate" data-testid="payment-option-card">
                      <RadioGroupItem value="card" id="payment-card" />
                      <Label htmlFor="payment-card" className="flex-1 cursor-pointer">
                        <div className="font-medium">Carta di credito/debito</div>
                        <div className="text-sm text-muted-foreground">Visa, Mastercard, American Express</div>
                      </Label>
                    </div>
                  )}
                  {paymentConfig.paypal.enabled && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate" data-testid="payment-option-paypal">
                      <RadioGroupItem value="paypal" id="payment-paypal" />
                      <Label htmlFor="payment-paypal" className="flex-1 cursor-pointer">
                        <div className="font-medium">PayPal</div>
                        <div className="text-sm text-muted-foreground">Paga con il tuo account PayPal</div>
                      </Label>
                    </div>
                  )}
                  {paymentConfig.bankTransfer.enabled && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate" data-testid="payment-option-bank-transfer">
                      <RadioGroupItem value="bank_transfer" id="payment-transfer" />
                      <Label htmlFor="payment-transfer" className="flex-1 cursor-pointer">
                        <div className="font-medium">Bonifico bancario</div>
                        <div className="text-sm text-muted-foreground">Le coordinate bancarie saranno mostrate di seguito</div>
                      </Label>
                    </div>
                  )}
                  {paymentConfig.satispay.enabled && (
                    <div className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate" data-testid="payment-option-satispay">
                      <RadioGroupItem value="satispay" id="payment-satispay" />
                      <Label htmlFor="payment-satispay" className="flex-1 cursor-pointer">
                        <div className="font-medium">Satispay</div>
                        <div className="text-sm text-muted-foreground">Paga con la tua app Satispay</div>
                      </Label>
                    </div>
                  )}
                </RadioGroup>
              )}
              
              {/* Show IBAN details when bank_transfer is selected */}
              {paymentMethod === "bank_transfer" && paymentConfig?.bankTransfer.enabled && paymentConfig.bankTransfer.iban && (
                <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">Coordinate Bancarie</h4>
                        <div className="grid gap-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">IBAN:</span>
                            <span className="font-mono font-medium text-blue-900 dark:text-blue-100" data-testid="text-iban">{paymentConfig.bankTransfer.iban}</span>
                          </div>
                          {paymentConfig.bankTransfer.accountHolder && (
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">Intestatario:</span>
                              <span className="font-medium text-blue-900 dark:text-blue-100" data-testid="text-account-holder">{paymentConfig.bankTransfer.accountHolder}</span>
                            </div>
                          )}
                          {paymentConfig.bankTransfer.bankName && (
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">Banca:</span>
                              <span className="font-medium text-blue-900 dark:text-blue-100" data-testid="text-bank-name">{paymentConfig.bankTransfer.bankName}</span>
                            </div>
                          )}
                          {paymentConfig.bankTransfer.bic && (
                            <div className="flex justify-between">
                              <span className="text-blue-700 dark:text-blue-300">BIC/SWIFT:</span>
                              <span className="font-mono font-medium text-blue-900 dark:text-blue-100" data-testid="text-bic">{paymentConfig.bankTransfer.bic}</span>
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
                <span data-testid="text-shipping-cost">
                  {shippingCost > 0 ? formatPrice(shippingCost) : 'Gratuita'}
                </span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Totale</span>
                <span data-testid="text-checkout-total">{formatPrice((cart?.subtotal || 0) - (cart?.discount || 0) + shippingCost)}</span>
              </div>
              {items.length > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>di cui IVA</span>
                  <span data-testid="text-checkout-vat">
                    {formatPrice(
                      (() => {
                        const vatRate = cartData?.customerVatRate ?? 22;
                        if (vatRate === 0) return 0;
                        const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
                        return totalPrice - (totalPrice / (1 + vatRate / 100));
                      })()
                    )}
                  </span>
                </div>
              )}
            </CardContent>
            <CardFooter>
              {paymentMethod === "paypal" && canPlaceOrder ? (
                <PayPalButton
                  amount={(grandTotal / 100).toFixed(2)}
                  currency="EUR"
                  onSuccess={(orderId) => {
                    apiRequest('POST', `/api/shop/${resellerId}/checkout`, {
                      shippingAddressId: selectedShippingAddress,
                      billingAddressId: sameBillingAddress ? selectedShippingAddress : selectedBillingAddress,
                      shippingMethodId: selectedShippingMethod,
                      paymentMethod: "paypal",
                      customerNotes: customerNotes ? `${customerNotes}\n[PayPal Order ID: ${orderId}]` : `[PayPal Order ID: ${orderId}]`
                    })
                      .then(res => res.json())
                      .then((data: any) => {
                        queryClient.invalidateQueries({ queryKey: ['/api/shop', resellerId, 'cart'] });
                        toast({ title: "Ordine confermato!", description: `Ordine #${data.orderNumber}` });
                        setLocation(`/customer/orders/${data.order?.id || ''}`);
                      })
                      .catch((error: any) => {
                        toast({ title: "Errore", description: error.message, variant: "destructive" });
                      });
                  }}
                  onError={(error) => {
                    toast({ title: "Errore PayPal", description: error, variant: "destructive" });
                  }}
                  onCancel={() => {
                    toast({ title: "Pagamento annullato", description: "Hai annullato il pagamento PayPal" });
                  }}
                />
              ) : paymentMethod === "card" && canPlaceOrder ? (
                <StripeB2BCheckout
                  totalAmount={grandTotal}
                  paymentIntentEndpoint={`/api/shop/${resellerId}/stripe-payment-intent`}
                  createOrderEndpoint={`/api/shop/${resellerId}/checkout`}
                  orderData={{
                    shippingAddressId: selectedShippingAddress,
                    billingAddressId: sameBillingAddress ? selectedShippingAddress : selectedBillingAddress,
                    shippingMethodId: selectedShippingMethod,
                    paymentMethod: "card",
                    customerNotes
                  }}
                  shippingMethodId={selectedShippingMethod}
                  onSuccess={(order) => {
                    queryClient.invalidateQueries({ queryKey: ['/api/shop', resellerId, 'cart'] });
                    toast({ title: "Ordine confermato!", description: `Ordine #${order.orderNumber}` });
                    setLocation(`/customer/orders/${order.order?.id || order.id || ''}`);
                  }}
                  onError={(error) => {
                    toast({ title: "Errore pagamento", description: error, variant: "destructive" });
                  }}
                />
              ) : (
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
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
