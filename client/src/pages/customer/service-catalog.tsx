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
import { Loader2, ShoppingCart, Search, Wrench, Clock, Banknote, Building } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ServiceItem, DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";

type ServiceItemWithPrice = ServiceItem & {
  effectivePriceCents: number;
  effectiveLaborMinutes: number;
  priceSource: string;
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
    paymentMethod: "in_person" as "in_person" | "bank_transfer",
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
              <RadioGroup
                value={orderForm.paymentMethod}
                onValueChange={(value) => setOrderForm({ ...orderForm, paymentMethod: value as "in_person" | "bank_transfer" })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_person" id="in_person" data-testid="radio-pay-in-person" />
                  <Label htmlFor="in_person" className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <Banknote className="w-4 h-4" />
                    Pagamento di persona
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" data-testid="radio-pay-transfer" />
                  <Label htmlFor="bank_transfer" className="flex flex-wrap items-center gap-2 cursor-pointer">
                    <Building className="w-4 h-4" />
                    Bonifico bancario
                  </Label>
                </div>
              </RadioGroup>
              {orderForm.paymentMethod === "bank_transfer" && myReseller && (
                <div className="p-3 bg-muted rounded-md text-sm mt-2">
                  <p className="font-medium mb-1">Dati per il bonifico</p>
                  <p><span className="text-muted-foreground">Intestatario:</span> {myReseller.ragioneSociale || myReseller.fullName}</p>
                  {myReseller.iban ? (
                    <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{myReseller.iban}</span></p>
                  ) : (
                    <p className="text-amber-600">IBAN non ancora configurato - contatta il rivenditore</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmitOrder} disabled={createOrderMutation.isPending} data-testid="button-submit-order">
              {createOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
              )}
              Invia Richiesta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
