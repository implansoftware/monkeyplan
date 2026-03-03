import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShoppingCart, Search, Wrench, Clock, Banknote, Building, CreditCard, Wallet } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StripeB2BCheckout } from "@/components/StripeB2BCheckout";
import PayPalButton from "@/components/PayPalButton";
import type { ServiceItem, DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";

type ServiceItemWithPrice = ServiceItem & {
  effectivePriceCents: number;
  effectiveLaborMinutes: number;
  priceSource: string;
};

type PaymentMethod = {
  id: string;
  name: string;
  enabled: boolean;
  details?: {
    iban?: string;
    accountHolder?: string;
    bankName?: string;
    bic?: string;
    publishableKey?: string;
    clientId?: string;
  };
};

export default function CustomerServiceCatalog() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceItemWithPrice | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const [orderForm, setOrderForm] = useState({
    deviceType: "",
    brandId: "",
    brand: "",
    model: "",
    imei: "",
    serial: "",
    issueDescription: "",
    customerNotes: "",
    paymentMethod: "in_person" as string,
  });

  const { data: paymentMethods } = useQuery<{ methods: PaymentMethod[]; configSource: string }>({
    queryKey: ["/api/customer/payment-methods"],
    enabled: !!user,
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery<ServiceItemWithPrice[]>({
    queryKey: ["/api/customer/service-catalog"],
  });

  const { data: deviceTypes } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models"],
  });

  const { data: myReseller } = useQuery<{
    id: string;
    fullName: string;
    ragioneSociale: string | null;
    iban: string | null;
    email: string | null;
    phone: string | null;
  }>({
    queryKey: ["/api/customer/my-reseller"],
    enabled: !!user?.resellerId,
    retry: false,
  });

  const selectedDeviceType = deviceTypes?.find(t => t.name === orderForm.deviceType);
  
  const filteredModels = (deviceModels || []).filter(
    (model) => {
      const matchesBrand = model.brandId === orderForm.brandId;
      const matchesType = !selectedDeviceType || model.typeId === selectedDeviceType.id;
      return matchesBrand && matchesType;
    }
  );

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customer/service-orders", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/service-orders"] });
      setIsOrderDialogOpen(false);
      setSelectedService(null);
      setOrderForm({
        deviceType: "",
        brandId: "",
        brand: "",
        model: "",
        imei: "",
        serial: "",
        issueDescription: "",
        customerNotes: "",
        paymentMethod: "in_person",
      });
      toast({ title: "Ordine creato", description: t("customerPages.laTuaRichiestaStataInviataVaiAIMieiOr") });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const filteredCatalog = (catalog || []).filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOrderService = (service: ServiceItemWithPrice) => {
    setSelectedService(service);
    // Auto-populate device info from service compatibility settings
    const autoDeviceType = service.deviceTypeId
      ? (deviceTypes?.find(t => t.id === service.deviceTypeId)?.name || "")
      : "";
    const autoBrand = service.brandId
      ? (deviceBrands?.find(b => b.id === service.brandId)?.name || "")
      : "";
    setOrderForm(prev => ({
      ...prev,
      deviceType: autoDeviceType,
      brandId: service.brandId || "",
      brand: autoBrand,
      model: service.modelId || "",
      imei: "",
      serial: "",
      issueDescription: "",
      customerNotes: "",
    }));
    setIsOrderDialogOpen(true);
  };

  // Build compatibility label for display in the dialog
  const getCompatibilityLabel = (service: ServiceItemWithPrice) => {
    const parts: string[] = [];
    if (service.deviceTypeId) {
      const dt = deviceTypes?.find(t => t.id === service.deviceTypeId);
      if (dt) parts.push(dt.name);
    }
    if (service.brandId) {
      const br = deviceBrands?.find(b => b.id === service.brandId);
      if (br) parts.push(br.name);
    }
    if (service.modelId) {
      const mo = deviceModels?.find(m => m.id === service.modelId);
      if (mo) parts.push(mo.modelName);
    }
    return parts.join(" · ");
  };

  const handleSubmitOrder = () => {
    if (!selectedService) return;
    const resolvedBrand = orderForm.brand || (deviceBrands?.find(b => b.id === orderForm.brandId)?.name);
    const resolvedModel = deviceModels?.find(m => m.id === orderForm.model)?.modelName;
    createOrderMutation.mutate({
      serviceItemId: selectedService.id,
      priceCents: selectedService.effectivePriceCents,
      deviceType: orderForm.deviceType || undefined,
      brand: resolvedBrand || undefined,
      model: resolvedModel || undefined,
      deviceModelId: orderForm.model || undefined,
      issueDescription: orderForm.issueDescription || undefined,
      customerNotes: orderForm.customerNotes || undefined,
      paymentMethod: orderForm.paymentMethod,
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("sidebar.items.serviceCatalog")}</h1>
            <p className="text-white/80 text-sm">{t("customerPages.requestRepairFromCatalog")}</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder={t("customerPages.cercaServizi")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search-services"
        />
      </div>

      {catalogLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredCatalog.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("customerPages.noServicesAvailable")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCatalog.map((service) => (
            <Card key={service.id} className="hover-elevate" data-testid={`card-service-${service.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.code}</CardDescription>
                  </div>
                  {service.category && (
                    <Badge variant="outline">{service.category}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.description && (
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xl font-bold" data-testid={`text-price-${service.id}`}>
                      {formatPrice(service.effectivePriceCents)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~{service.effectiveLaborMinutes} min
                    </p>
                  </div>
                  <Button onClick={() => handleOrderService(service)} data-testid={`button-order-${service.id}`}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {t("customerPages.requestService")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("customerPages.requestIntervention")}</DialogTitle>
            <DialogDescription>
              {selectedService && (
                <>
                  {selectedService.name} - {formatPrice(selectedService.effectivePriceCents)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Compatibility info banner - shown when the service has device restrictions */}
            {selectedService && getCompatibilityLabel(selectedService) && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <Wrench className="h-4 w-4 shrink-0 text-primary" />
                <span>{getCompatibilityLabel(selectedService)}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("customerPages.issueDescription")}</Label>
              <Textarea
                value={orderForm.issueDescription}
                onChange={(e) => setOrderForm({ ...orderForm, issueDescription: e.target.value })}
                placeholder={t("customerPages.describeProblemPlaceholder")}
                data-testid="input-issue"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("customerPages.additionalNotesOptionalLabel")}</Label>
              <Textarea
                value={orderForm.customerNotes}
                onChange={(e) => setOrderForm({ ...orderForm, customerNotes: e.target.value })}
                placeholder={t("customerPages.otherUsefulInfo")}
                data-testid="input-notes"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("license.paymentMethod")}</Label>
              {paymentMethods?.methods && paymentMethods.methods.length > 0 ? (
                <RadioGroup
                  value={orderForm.paymentMethod}
                  onValueChange={(value) => setOrderForm({ ...orderForm, paymentMethod: value })}
                >
                  {paymentMethods.methods.map((method) => {
                    const getIcon = (id: string) => {
                      switch (id) {
                        case "in_person": return <Banknote className="w-4 h-4" />;
                        case "bank_transfer": return <Building className="w-4 h-4" />;
                        case "card": return <CreditCard className="w-4 h-4" />;
                        case "paypal": return <Wallet className="w-4 h-4" />;
                        default: return <Banknote className="w-4 h-4" />;
                      }
                    };
                    return (
                      <div key={method.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={method.id} id={method.id} data-testid={`radio-pay-${method.id}`} />
                        <Label htmlFor={method.id} className="flex flex-wrap items-center gap-2 cursor-pointer">
                          {getIcon(method.id)}
                          {method.name}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              ) : (
                <p className="text-sm text-muted-foreground">{t("customerPages.caricamentoMetodiDiPagamento")}</p>
              )}
              {orderForm.paymentMethod === "bank_transfer" && paymentMethods?.methods && (
                (() => {
                  const bankMethod = paymentMethods.methods.find(m => m.id === "bank_transfer");
                  if (!bankMethod?.details) return null;
                  return (
                    <div className="p-3 bg-muted rounded-md text-sm mt-2">
                      <p className="font-medium mb-1">{t("customerPages.bankTransferData")}</p>
                      {bankMethod.details.accountHolder && (
                        <p><span className="text-muted-foreground">{t("customerPages.accountHolder")}</span> {bankMethod.details.accountHolder}</p>
                      )}
                      {bankMethod.details.iban ? (
                        <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{bankMethod.details.iban}</span></p>
                      ) : (
                        <p className="text-amber-600">{t("customerPages.ibanNotConfiguredService")}</p>
                      )}
                      {bankMethod.details.bankName && (
                        <p><span className="text-muted-foreground">{t("customerPages.bankLabel")}</span> {bankMethod.details.bankName}</p>
                      )}
                      {bankMethod.details.bic && (
                        <p><span className="text-muted-foreground">BIC/SWIFT:</span> <span className="font-mono">{bankMethod.details.bic}</span></p>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            
            {orderForm.paymentMethod === "card" && selectedService ? (
              <StripeB2BCheckout
                items={[]}
                totalAmount={selectedService.effectivePriceCents}
                orderData={{
                  serviceItemId: selectedService.id,
                  priceCents: selectedService.effectivePriceCents,
                  deviceType: orderForm.deviceType || undefined,
                  brand: deviceBrands?.find(b => b.id === orderForm.brandId)?.name || undefined,
                  model: filteredModels?.find(m => m.id === orderForm.model)?.modelName || undefined,
                  deviceModelId: orderForm.model || undefined,
                  imei: orderForm.imei || undefined,
                  serial: orderForm.serial || undefined,
                  issueDescription: orderForm.issueDescription || undefined,
                  customerNotes: orderForm.customerNotes || undefined,
                  paymentMethod: "card",
                }}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/customer/service-orders"] });
                  toast({ title: t("customerPages.orderCompleted"), description: t("customerPages.paymentSuccessful") });
                  setIsOrderDialogOpen(false);
                  setSelectedService(null);
                }}
                onError={(error) => {
                  toast({ title: t("customerPages.errorePagamento"), description: error, variant: "destructive" });
                }}
                paymentIntentEndpoint="/api/customer/service-orders/stripe-payment-intent"
                createOrderEndpoint="/api/customer/service-orders"
                returnUrl="/customer/service-orders"
              />
            ) : orderForm.paymentMethod === "paypal" && selectedService ? (
              <PayPalButton
                amount={(selectedService.effectivePriceCents / 100).toFixed(2)}
                currency="EUR"
                serviceItemId={selectedService.id}
                onSuccess={(paypalOrderId) => {
                  apiRequest('POST', '/api/customer/service-orders', {
                    serviceItemId: selectedService.id,
                    priceCents: selectedService.effectivePriceCents,
                    deviceType: orderForm.deviceType || undefined,
                    brand: deviceBrands?.find(b => b.id === orderForm.brandId)?.name || undefined,
                    model: filteredModels?.find(m => m.id === orderForm.model)?.modelName || undefined,
                    deviceModelId: orderForm.model || undefined,
                    imei: orderForm.imei || undefined,
                    serial: orderForm.serial || undefined,
                    issueDescription: orderForm.issueDescription || undefined,
                    customerNotes: orderForm.customerNotes ? `${orderForm.customerNotes}\n[PayPal: ${paypalOrderId}]` : `[PayPal: ${paypalOrderId}]`,
                    paymentMethod: "paypal",
                  })
                    .then(res => res.json())
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ["/api/customer/service-orders"] });
                      toast({ title: t("customerPages.orderCompleted"), description: t("customerPages.paypalPaymentCompleted") });
                      setIsOrderDialogOpen(false);
                      setSelectedService(null);
                    })
                    .catch((err: Error) => {
                      toast({ title: t("auth.error"), description: err.message, variant: "destructive" });
                    });
                }}
                onError={(error) => {
                  toast({ title: t("b2b.errorePayPal"), description: error, variant: "destructive" });
                }}
                createOrderEndpoint="/api/customer/service-orders/paypal-create"
                captureOrderEndpoint="/api/customer/service-orders/paypal-capture"
              />
            ) : (
              <Button onClick={handleSubmitOrder} disabled={createOrderMutation.isPending} data-testid="button-submit-order">
                {createOrderMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {t("customerPages.sendRequest")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
