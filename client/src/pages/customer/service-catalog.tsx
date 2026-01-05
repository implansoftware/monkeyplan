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
import { Loader2, ShoppingCart, Search, Wrench, Clock, Check, X, Package, Truck, MapPin, Download, Banknote, Building } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ServiceItem, ServiceOrder, DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type ServiceItemWithPrice = ServiceItem & {
  effectivePriceCents: number;
  effectiveLaborMinutes: number;
  priceSource: string;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In attesa", variant: "secondary" },
  accepted: { label: "Accettato", variant: "default" },
  scheduled: { label: "Programmato", variant: "outline" },
  in_progress: { label: "In lavorazione", variant: "default" },
  completed: { label: "Completato", variant: "default" },
  cancelled: { label: "Annullato", variant: "destructive" },
};

export default function CustomerServiceCatalog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceItemWithPrice | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"catalog" | "orders">("catalog");
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<ServiceOrder | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryMethod: "in_person" as "in_person" | "shipping",
    shippingAddress: "",
    shippingCity: "",
    shippingCap: "",
    shippingProvince: "",
    courierName: "",
    trackingNumber: "",
  });

  const [orderForm, setOrderForm] = useState({
    deviceType: "",
    brandId: "",
    brand: "",
    model: "",
    imei: "",
    serial: "",
    issueDescription: "",
    customerNotes: "",
    paymentMethod: "in_person" as "in_person" | "bank_transfer",
  });

  const { data: catalog, isLoading: catalogLoading } = useQuery<ServiceItemWithPrice[]>({
    queryKey: ["/api/customer/service-catalog"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/customer/service-orders"],
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

  // Query per ottenere i dati del rivenditore (IBAN per bonifico)
  const { data: myReseller } = useQuery<{
    id: string;
    fullName: string;
    ragioneSociale: string | null;
    iban: string | null;
    email: string | null;
    phone: string | null;
  }>({
    queryKey: ["/api/customer/my-reseller"],
    enabled: !!user?.resellerId, // Solo se il cliente ha un reseller associato
    retry: false, // Non ritentare se fallisce
  });

  // Trova l'id del tipo dispositivo selezionato
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
      toast({ title: "Ordine creato", description: "La tua richiesta è stata inviata al rivenditore" });
      setActiveTab("orders");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/customer/service-orders/${orderId}/cancel`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/service-orders"] });
      toast({ title: "Ordine annullato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const setDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/customer/service-orders/${orderId}/set-delivery`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/service-orders"] });
      setIsDeliveryDialogOpen(false);
      setSelectedOrderForDelivery(null);
      setDeliveryForm({
        deliveryMethod: "in_person",
        shippingAddress: "",
        shippingCity: "",
        shippingCap: "",
        shippingProvince: "",
        courierName: "",
        trackingNumber: "",
      });
      if (data.deliveryMethod === "shipping") {
        toast({ title: "Spedizione confermata", description: "DDT generato. Puoi scaricarlo dalla scheda ordine." });
      } else {
        toast({ title: "Consegna di persona confermata", description: "Porta il dispositivo al rivenditore." });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const downloadDdtMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("GET", `/api/customer/service-orders/${orderId}/ddt`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSetDelivery = (order: ServiceOrder) => {
    setSelectedOrderForDelivery(order);
    setIsDeliveryDialogOpen(true);
  };

  const handleSubmitDelivery = () => {
    if (!selectedOrderForDelivery) return;
    setDeliveryMutation.mutate({
      orderId: selectedOrderForDelivery.id,
      data: deliveryForm
    });
  };

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
      deviceType: orderForm.deviceType,
      deviceModelId: selectedModel?.id,
      brand: selectedBrand?.name || orderForm.brand,
      model: selectedModel?.modelName || orderForm.model,
      imei: orderForm.imei,
      serial: orderForm.serial,
      issueDescription: orderForm.issueDescription,
      customerNotes: orderForm.customerNotes,
      paymentMethod: orderForm.paymentMethod,
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Catalogo Servizi</h1>
          <p className="text-muted-foreground">Richiedi interventi di riparazione al tuo rivenditore</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "catalog" ? "default" : "outline"}
          onClick={() => setActiveTab("catalog")}
          data-testid="button-tab-catalog"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Catalogo
        </Button>
        <Button
          variant={activeTab === "orders" ? "default" : "outline"}
          onClick={() => setActiveTab("orders")}
          data-testid="button-tab-orders"
        >
          <Package className="w-4 h-4 mr-2" />
          I Miei Ordini
          {orders && orders.filter(o => o.status === "pending").length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {orders.filter(o => o.status === "pending").length}
            </Badge>
          )}
        </Button>
      </div>

      {activeTab === "catalog" && (
        <>
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
        </>
      )}

      {activeTab === "orders" && (
        <>
          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : !orders || orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Non hai ancora effettuato ordini
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} data-testid={`card-order-${order.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                        <CardDescription>
                          {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                        </CardDescription>
                      </div>
                      <Badge variant={statusLabels[order.status]?.variant || "outline"}>
                        {statusLabels[order.status]?.label || order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.brand && order.model && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Dispositivo:</span> {order.brand} {order.model}
                      </p>
                    )}
                    {order.issueDescription && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Problema:</span> {order.issueDescription}
                      </p>
                    )}
                    <p className="text-sm font-medium">
                      Importo: {formatPrice(order.priceCents)}
                    </p>
                    
                    {(order as any).paymentMethod === "bank_transfer" && (
                      <div className="p-3 bg-muted rounded-md text-sm" data-testid={`bank-info-${order.id}`}>
                        <p className="font-medium mb-1">Pagamento con bonifico</p>
                        {myReseller ? (
                          <>
                            <p><span className="text-muted-foreground">Intestatario:</span> {myReseller.ragioneSociale || myReseller.fullName}</p>
                            {myReseller.iban ? (
                              <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{myReseller.iban}</span></p>
                            ) : (
                              <p className="text-amber-600">IBAN non ancora configurato - contatta il rivenditore</p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">Contatta il rivenditore per le coordinate bancarie</p>
                        )}
                      </div>
                    )}
                    
                    {order.scheduledAt && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Appuntamento:</span>{" "}
                        {format(new Date(order.scheduledAt), "dd MMM yyyy HH:mm", { locale: it })}
                      </p>
                    )}
                    
                    {order.deliveryMethod && (
                      <div className="pt-2 border-t mt-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {order.deliveryMethod === "shipping" ? (
                            <><Truck className="w-4 h-4" /> Spedizione</>
                          ) : (
                            <><MapPin className="w-4 h-4" /> Consegna di persona</>
                          )}
                        </p>
                        {order.deliveryMethod === "shipping" && order.trackingNumber && (
                          <p className="text-sm text-muted-foreground">
                            Tracking: {order.trackingNumber}
                          </p>
                        )}
                        {order.deviceReceivedAt && (
                          <Badge variant="default" className="mt-1">
                            <Check className="w-3 h-3 mr-1" /> Dispositivo ricevuto
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="pt-2 flex flex-wrap gap-2">
                      {order.status === "pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => cancelOrderMutation.mutate(order.id)}
                          disabled={cancelOrderMutation.isPending}
                          data-testid={`button-cancel-order-${order.id}`}
                        >
                          {cancelOrderMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <X className="w-4 h-4 mr-2" />
                          )}
                          Annulla
                        </Button>
                      )}
                      
                      {["accepted", "scheduled"].includes(order.status) && !order.deliveryMethod && (
                        <Button
                          size="sm"
                          onClick={() => handleSetDelivery(order)}
                          data-testid={`button-set-delivery-${order.id}`}
                        >
                          <Truck className="w-4 h-4 mr-2" />
                          Scegli come consegnare
                        </Button>
                      )}
                      
                      {order.ddtUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDdtMutation.mutate(order.id)}
                          disabled={downloadDdtMutation.isPending}
                          data-testid={`button-download-ddt-${order.id}`}
                        >
                          {downloadDdtMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Scarica DDT
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
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
                onValueChange={(value) => {
                  const brand = deviceBrands?.find(b => b.id === value);
                  setOrderForm({
                    ...orderForm,
                    brandId: value,
                    brand: brand?.name || "",
                    model: "",
                  });
                }}
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

            <div className="grid grid-cols-2 gap-4">
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
              <Label>Descrizione Problema</Label>
              <Textarea
                value={orderForm.issueDescription}
                onChange={(e) => setOrderForm({ ...orderForm, issueDescription: e.target.value })}
                placeholder="Descrivi il problema del dispositivo..."
                rows={3}
                data-testid="textarea-issue"
              />
            </div>

            <div className="space-y-2">
              <Label>Note Aggiuntive (opzionale)</Label>
              <Textarea
                value={orderForm.customerNotes}
                onChange={(e) => setOrderForm({ ...orderForm, customerNotes: e.target.value })}
                placeholder="Altre informazioni utili..."
                rows={2}
                data-testid="textarea-notes"
              />
            </div>

            <div className="space-y-2">
              <Label>Metodo di Pagamento</Label>
              <RadioGroup
                value={orderForm.paymentMethod}
                onValueChange={(value: "in_person" | "bank_transfer") => 
                  setOrderForm({ ...orderForm, paymentMethod: value })
                }
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2 p-3 rounded-md border hover-elevate cursor-pointer"
                     onClick={() => setOrderForm({ ...orderForm, paymentMethod: "in_person" })}>
                  <RadioGroupItem value="in_person" id="payment-in-person" data-testid="radio-payment-in-person" />
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="payment-in-person" className="cursor-pointer flex-1">
                    Pagamento in negozio
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-md border hover-elevate cursor-pointer"
                     onClick={() => setOrderForm({ ...orderForm, paymentMethod: "bank_transfer" })}>
                  <RadioGroupItem value="bank_transfer" id="payment-bank-transfer" data-testid="radio-payment-bank-transfer" />
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="payment-bank-transfer" className="cursor-pointer flex-1">
                    Bonifico bancario
                  </Label>
                </div>
              </RadioGroup>

              {orderForm.paymentMethod === "bank_transfer" && myReseller && (
                <div className="mt-3 p-4 bg-muted rounded-lg border" data-testid="bank-transfer-info">
                  <p className="text-sm font-medium mb-2">Coordinate bancarie per il bonifico:</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Intestatario:</span> {myReseller.ragioneSociale || myReseller.fullName}</p>
                    {myReseller.iban ? (
                      <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono font-medium">{myReseller.iban}</span></p>
                    ) : (
                      <p className="text-amber-600">IBAN non configurato dal rivenditore</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={createOrderMutation.isPending}
              data-testid="button-submit-order"
            >
              {createOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Conferma Ordine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Come vuoi consegnare il dispositivo?</DialogTitle>
            <DialogDescription>
              {selectedOrderForDelivery && (
                <>Ordine {selectedOrderForDelivery.orderNumber}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <RadioGroup
              value={deliveryForm.deliveryMethod}
              onValueChange={(value: "in_person" | "shipping") => 
                setDeliveryForm({ ...deliveryForm, deliveryMethod: value })
              }
            >
              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover-elevate">
                <RadioGroupItem value="in_person" id="in_person" />
                <div className="flex-1">
                  <Label htmlFor="in_person" className="cursor-pointer font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Consegno di persona
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Porta il dispositivo direttamente al rivenditore
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover-elevate">
                <RadioGroupItem value="shipping" id="shipping" />
                <div className="flex-1">
                  <Label htmlFor="shipping" className="cursor-pointer font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Spedisco il dispositivo
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Spedisci via corriere e ricevi un DDT automatico
                  </p>
                </div>
              </div>
            </RadioGroup>

            {deliveryForm.deliveryMethod === "shipping" && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Indirizzo di partenza</h4>
                
                <div className="space-y-2">
                  <Label>Indirizzo *</Label>
                  <Input
                    value={deliveryForm.shippingAddress}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, shippingAddress: e.target.value })}
                    placeholder="Via/Piazza e numero civico"
                    data-testid="input-shipping-address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Città *</Label>
                    <Input
                      value={deliveryForm.shippingCity}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, shippingCity: e.target.value })}
                      placeholder="Città"
                      data-testid="input-shipping-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CAP *</Label>
                    <Input
                      value={deliveryForm.shippingCap}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, shippingCap: e.target.value })}
                      placeholder="00000"
                      data-testid="input-shipping-cap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia *</Label>
                    <Input
                      value={deliveryForm.shippingProvince}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, shippingProvince: e.target.value })}
                      placeholder="XX"
                      maxLength={2}
                      data-testid="input-shipping-province"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Corriere (opzionale)</Label>
                    <Input
                      value={deliveryForm.courierName}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, courierName: e.target.value })}
                      placeholder="Nome corriere"
                      data-testid="input-courier-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking (opzionale)</Label>
                    <Input
                      value={deliveryForm.trackingNumber}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
                      placeholder="Numero tracking"
                      data-testid="input-tracking-number"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmitDelivery}
              disabled={setDeliveryMutation.isPending || (
                deliveryForm.deliveryMethod === "shipping" && (
                  !deliveryForm.shippingAddress || 
                  !deliveryForm.shippingCity || 
                  !deliveryForm.shippingCap || 
                  !deliveryForm.shippingProvince
                )
              )}
              data-testid="button-confirm-delivery"
            >
              {setDeliveryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
