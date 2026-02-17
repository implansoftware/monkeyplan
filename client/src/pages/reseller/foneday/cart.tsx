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
import { useTranslation } from "react-i18next";

type FonedayCartItem = {
  sku: string;
  quantity: number;
  title: string;
  price: string;
  note: string | null;
};

type FonedayCartResponse = {
  cart: FonedayCartItem[];
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("");
  const [address, setAddress] = useState<ShippingAddress>(initialAddress);
  const [notes, setNotes] = useState("");

  const { data: credential, isLoading: loadingCredential } = useQuery<FonedayCredential | null>({
    queryKey: ["/api/foneday/credentials"],
  });

  const { data: cartData, isLoading: loadingCart, refetch: refetchCart } = useQuery<FonedayCartResponse>({
    queryKey: ["/api/foneday/cart"],
    enabled: !!credential?.isActive,
  });

  const { data: shippingMethods = [] } = useQuery<FonedayShippingMethod[]>({
    queryKey: ["/api/foneday/shipping-methods"],
    enabled: !!credential?.isActive && showCheckout,
  });

  const cart = cartData?.cart || [];

  const removeFromCartMutation = useMutation({
    mutationFn: async ({ sku, quantity }: { sku: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/foneday/cart/remove", { sku, quantity });
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
      toast({ title: t("cart.removedFromCart") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ sku, quantity }: { sku: string; quantity: number }) => {
      const res = await apiRequest("POST", "/api/foneday/cart/add", { sku, quantity });
      return res.json();
    },
    onSuccess: () => {
      refetchCart();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
        title: t("cart.orderSubmitted"),
        description: t("integrations.orderCreatedSuccess", { number: data.order_number }),
      });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(numPrice);
  };

  const handleQuantityIncrease = (item: FonedayCartItem) => {
    addToCartMutation.mutate({ sku: item.sku, quantity: 1 });
  };

  const handleQuantityDecrease = (item: FonedayCartItem) => {
    if (item.quantity <= 1) {
      removeFromCartMutation.mutate({ sku: item.sku, quantity: 1 });
    } else {
      removeFromCartMutation.mutate({ sku: item.sku, quantity: 1 });
    }
  };

  const handleRemoveItem = (item: FonedayCartItem) => {
    removeFromCartMutation.mutate({ sku: item.sku, quantity: item.quantity });
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

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      return sum + price;
    }, 0);
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
            <span>{t("integrations.credentialsNotConfigured")}</span>
            <Link href="/reseller/foneday/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {t("integrations.configure")}
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
        <div className="flex flex-wrap items-center gap-3">
          <ShoppingCart className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">{t("cart.fonedayCart")}</h1>
            <p className="text-muted-foreground">{t("integrations.manageCartAndOrder")}</p>
          </div>
        </div>
        <Link href="/reseller/foneday/catalog">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("cart.backToCatalog")}
          </Button>
        </Link>
      </div>

      {loadingCart ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : cart.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("pos.emptyCart")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("integrations.noProductsCartYet")}
            </p>
            <Link href="/reseller/foneday/catalog">
              <Button>
                <Package className="h-4 w-4 mr-2" />
                {t("cart.goToCatalog")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>{t("integrations.productsCount", { count: cart.length })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.sku}
                    className="flex items-center justify-between p-4 border rounded-md"
                    data-testid={`cart-item-${item.sku}`}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      {item.note && (
                        <p className="text-sm text-muted-foreground">{t("common.note")}: {item.note}</p>
                      )}
                      <p className="text-sm font-medium mt-1">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityDecrease(item)}
                          disabled={removeFromCartMutation.isPending}
                          data-testid={`button-cart-minus-${item.sku}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityIncrease(item)}
                          disabled={addToCartMutation.isPending}
                          data-testid={`button-cart-plus-${item.sku}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item)}
                        disabled={removeFromCartMutation.isPending}
                        data-testid={`button-cart-remove-${item.sku}`}
                      >
                        <Trash2 className="h-4 w-4" />
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
                <CardTitle>{t("reports.summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>{t("common.subtotal")}</span>
                  <span className="font-medium">{formatPrice(calculateTotal())}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("common.total")}</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>

                {!showCheckout ? (
                  <Button
                    className="w-full"
                    onClick={() => setShowCheckout(true)}
                    data-testid="button-checkout"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("cart.proceedToCheckout")}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="font-medium">{t("cart.shippingAddress")}</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>{t("common.name")} *</Label>
                        <Input
                          value={address.name}
                          onChange={(e) => setAddress({ ...address, name: e.target.value })}
                          placeholder={t("auth.fullName")}
                          data-testid="input-shipping-name"
                        />
                      </div>
                      <div>
                        <Label>{t("common.company")}</Label>
                        <Input
                          value={address.company}
                          onChange={(e) => setAddress({ ...address, company: e.target.value })}
                          placeholder={t("cart.companyNameOptional")}
                          data-testid="input-shipping-company"
                        />
                      </div>
                      <div>
                        <Label>{t("integrations.addressRequired")}</Label>
                        <Input
                          value={address.address_line1}
                          onChange={(e) => setAddress({ ...address, address_line1: e.target.value })}
                          placeholder={t("cart.streetAddress")}
                          data-testid="input-shipping-address1"
                        />
                      </div>
                      <div>
                        <Label>{t("integrations.address2")}</Label>
                        <Input
                          value={address.address_line2}
                          onChange={(e) => setAddress({ ...address, address_line2: e.target.value })}
                          placeholder={t("cart.apartmentScalePlaceholder")}
                          data-testid="input-shipping-address2"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label>{t("integrations.cityRequired")}</Label>
                          <Input
                            value={address.city}
                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                            placeholder={t("common.city")}
                            data-testid="input-shipping-city"
                          />
                        </div>
                        <div>
                          <Label>{t("integrations.postalCodeRequired")}</Label>
                          <Input
                            value={address.postal_code}
                            onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                            placeholder={t("common.zip")}
                            data-testid="input-shipping-postal"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>{t("integrations.phoneRequired")}</Label>
                        <Input
                          value={address.phone}
                          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                          placeholder="+39 xxx xxx xxxx"
                          data-testid="input-shipping-phone"
                        />
                      </div>
                      <div>
                        <Label>{t("integrations.emailRequired")}</Label>
                        <Input
                          type="email"
                          value={address.email}
                          onChange={(e) => setAddress({ ...address, email: e.target.value })}
                          placeholder={t("foneday.emailPlaceholder")}
                          data-testid="input-shipping-email"
                        />
                      </div>
                    </div>

                    {shippingMethods.length > 0 && (
                      <div>
                        <Label>{t("cart.shippingMethodRequired")}</Label>
                        <Select value={selectedShipping} onValueChange={setSelectedShipping}>
                          <SelectTrigger data-testid="select-shipping-method">
                            <SelectValue placeholder={t("cart.selectMethodPlaceholder")} />
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

                    <div>
                      <Label>{t("common.notes")}</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={t("cart.orderNotesPlaceholder")}
                        data-testid="input-order-notes"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCheckout(false)}
                        className="flex-1"
                        data-testid="button-cancel-checkout"
                      >{t("common.cancel")}</Button>
                      <Button
                        onClick={() => submitOrderMutation.mutate()}
                        disabled={!isAddressValid() || submitOrderMutation.isPending}
                        className="flex-1"
                        data-testid="button-submit-order"
                      >
                        {submitOrderMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {t("cart.submitOrder")}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
