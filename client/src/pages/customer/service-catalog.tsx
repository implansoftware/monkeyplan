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
import { Loader2, ShoppingCart, Search, Wrench, Clock, Check, X, Package } from "lucide-react";
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

  const [orderForm, setOrderForm] = useState({
    deviceType: "",
    brandId: "",
    brand: "",
    model: "",
    imei: "",
    serial: "",
    issueDescription: "",
    customerNotes: "",
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

  const filteredModels = (deviceModels || []).filter(
    (model) => model.brandId === orderForm.brandId
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
                    {order.scheduledAt && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">Appuntamento:</span>{" "}
                        {format(new Date(order.scheduledAt), "dd MMM yyyy HH:mm", { locale: it })}
                      </p>
                    )}
                    {order.status === "pending" && (
                      <div className="pt-2">
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
                      </div>
                    )}
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
    </div>
  );
}
