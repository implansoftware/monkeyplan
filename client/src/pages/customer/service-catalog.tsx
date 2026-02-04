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
      toast({ title: "Ordine creato", description: "La tua richiesta è stata inviata. Vai a 'I Miei Ordini' per seguirla." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredCatalog = (catalog || []).filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOrderService = (service: ServiceItemWithPrice) => {
    setSelectedService(service);
    setIsOrderDialogOpen(true);
  };

  const handleSubmitOrder = () => {
    if (!selectedService) return;
    
    const selectedBrand = deviceBrands?.find(b => b.id === orderForm.brandId);
    const selectedModel = filteredModels?.find(m => m.id === orderForm.model);
    
    createOrderMutation.mutate({
      serviceItemId: selectedService.id,
      priceCents: selectedService.effectivePriceCents,
      deviceType: orderForm.deviceType || undefined,
      brand: selectedBrand?.name || undefined,
      model: selectedModel?.modelName || undefined,
      deviceModelId: orderForm.model || undefined,
      imei: orderForm.imei || undefined,
      serial: orderForm.serial || undefined,
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
            <h1 className="text-2xl font-bold text-white">Catalogo Servizi</h1>
            <p className="text-white/80 text-sm">Richiedi interventi di riparazione al tuo rivenditore</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Cerca servizi..."
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
            Nessun servizio disponibile
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
                    Richiedi
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
            <DialogTitle>Richiedi Intervento</DialogTitle>
            <DialogDescription>
              {selectedService && (
                <>
                  {selectedService.name} - {formatPrice(selectedService.effectivePriceCents)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo Dispositivo</Label>
              <Select
                value={orderForm.deviceType}
                onValueChange={(value) => setOrderForm({ ...orderForm, deviceType: value })}
              >
                <SelectTrigger data-testid="select-device-type">
                  <SelectValue placeholder="Seleziona tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Marca</Label>
              <Select
                value={orderForm.brandId}
                onValueChange={(value) => setOrderForm({ ...orderForm, brandId: value, model: "" })}
              >
                <SelectTrigger data-testid="select-brand">
                  <SelectValue placeholder="Seleziona marca..." />
                </SelectTrigger>
                <SelectContent>
                  {deviceBrands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Modello</Label>
              <Select
                value={orderForm.model}
                onValueChange={(value) => setOrderForm({ ...orderForm, model: value })}
                disabled={!orderForm.brandId}
              >
                <SelectTrigger data-testid="select-model">
                  <SelectValue placeholder="Seleziona modello..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredModels?.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>IMEI (opzionale)</Label>
                <Input
                  value={orderForm.imei}
                  onChange={(e) => setOrderForm({ ...orderForm, imei: e.target.value })}
                  placeholder="IMEI"
                  data-testid="input-imei"
                />
              </div>
              <div className="space-y-2">
                <Label>Seriale (opzionale)</Label>
                <Input
                  value={orderForm.serial}
                  onChange={(e) => setOrderForm({ ...orderForm, serial: e.target.value })}
                  placeholder="Numero seriale"
                  data-testid="input-serial"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrizione problema</Label>
              <Textarea
                value={orderForm.issueDescription}
                onChange={(e) => setOrderForm({ ...orderForm, issueDescription: e.target.value })}
                placeholder="Descrivi il problema..."
                data-testid="input-issue"
              />
            </div>

            <div className="space-y-2">
              <Label>Note aggiuntive (opzionale)</Label>
              <Textarea
                value={orderForm.customerNotes}
                onChange={(e) => setOrderForm({ ...orderForm, customerNotes: e.target.value })}
                placeholder="Altre informazioni utili..."
                data-testid="input-notes"
              />
            </div>

            <div className="space-y-2">
              <Label>Metodo di pagamento</Label>
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
                <p className="text-sm text-muted-foreground">Caricamento metodi di pagamento...</p>
              )}
              {orderForm.paymentMethod === "bank_transfer" && paymentMethods?.methods && (
                (() => {
                  const bankMethod = paymentMethods.methods.find(m => m.id === "bank_transfer");
                  if (!bankMethod?.details) return null;
                  return (
                    <div className="p-3 bg-muted rounded-md text-sm mt-2">
                      <p className="font-medium mb-1">Dati per il bonifico</p>
                      {bankMethod.details.accountHolder && (
                        <p><span className="text-muted-foreground">Intestatario:</span> {bankMethod.details.accountHolder}</p>
                      )}
                      {bankMethod.details.iban ? (
                        <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{bankMethod.details.iban}</span></p>
                      ) : (
                        <p className="text-amber-600">IBAN non ancora configurato - contatta il rivenditore</p>
                      )}
                      {bankMethod.details.bankName && (
                        <p><span className="text-muted-foreground">Banca:</span> {bankMethod.details.bankName}</p>
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
              Annulla
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
                  toast({ title: "Ordine completato!", description: "Pagamento effettuato con successo" });
                  setIsOrderDialogOpen(false);
                  setSelectedService(null);
                }}
                onError={(error) => {
                  toast({ title: "Errore pagamento", description: error, variant: "destructive" });
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
                      toast({ title: "Ordine completato!", description: "Pagamento PayPal effettuato" });
                      setIsOrderDialogOpen(false);
                      setSelectedService(null);
                    })
                    .catch((err: Error) => {
                      toast({ title: "Errore", description: err.message, variant: "destructive" });
                    });
                }}
                onError={(error) => {
                  toast({ title: "Errore PayPal", description: error, variant: "destructive" });
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
                Invia Richiesta
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
