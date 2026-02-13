import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Smartphone,
  Wrench,
  User,
  CheckCircle,
  Plus,
  Trash2,
  Euro,
  Search,
  Loader2,
} from "lucide-react";
import type { ServiceItem } from "@shared/schema";

interface ServiceItemWithPrice extends ServiceItem {
  effectivePriceCents: number;
  effectiveLaborMinutes: number;
  priceSource: "base" | "reseller" | "repair_center";
}

interface QuoteLineItem {
  serviceItemId: string | null;
  name: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  vatRate: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

const STEPS = [
  { id: "device", label: "Dispositivo", icon: Smartphone },
  { id: "services", label: "Servizi", icon: Wrench },
  { id: "customer", label: "Cliente", icon: User },
  { id: "summary", label: "Riepilogo", icon: CheckCircle },
];

export default function NewStandaloneQuote() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);

  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [deviceDescription, setDeviceDescription] = useState("");

  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState("30");

  const [serviceSearch, setServiceSearch] = useState("");

  const { data: deviceTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands = [] } = useQuery<any[]>({
    queryKey: ["/api/device-brands"],
  });

  const deviceModelsUrl = (() => {
    const params = new URLSearchParams();
    if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
    if (brandId) params.set("brandId", brandId);
    const qs = params.toString();
    return `/api/device-models${qs ? `?${qs}` : ""}`;
  })();

  const { data: deviceModels = [] } = useQuery<any[]>({
    queryKey: [deviceModelsUrl],
    enabled: !!deviceTypeId || !!brandId,
  });

  const servicesUrl = (() => {
    const params = new URLSearchParams();
    if (deviceTypeId) params.set("deviceTypeId", deviceTypeId);
    if (brandId) params.set("brandId", brandId);
    if (modelId) params.set("modelId", modelId);
    if (serviceSearch) params.set("search", serviceSearch);
    params.set("limit", "50");
    return `/api/service-items?${params}`;
  })();

  const { data: services = [], isLoading: servicesLoading } = useQuery<ServiceItemWithPrice[]>({
    queryKey: [servicesUrl],
    enabled: currentStep === 1,
  });

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/users?role=customer&limit=100"],
    enabled: currentStep === 2,
  });

  const filteredBrands = brandId ? deviceBrands : deviceBrands;

  const addServiceToQuote = (service: ServiceItemWithPrice) => {
    const existing = lineItems.find(li => li.serviceItemId === service.id);
    if (existing) {
      setLineItems(prev => prev.map(li =>
        li.serviceItemId === service.id
          ? { ...li, quantity: li.quantity + 1 }
          : li
      ));
    } else {
      setLineItems(prev => [...prev, {
        serviceItemId: service.id,
        name: service.name,
        description: service.description || "",
        quantity: 1,
        unitPriceCents: service.effectivePriceCents || service.defaultPriceCents,
        vatRate: service.vatRate || 22,
      }]);
    }
    toast({ title: `${service.name} aggiunto al preventivo` });
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, updates: Partial<QuoteLineItem>) => {
    setLineItems(prev => prev.map((li, i) => i === index ? { ...li, ...updates } : li));
  };

  const addCustomLineItem = () => {
    setLineItems(prev => [...prev, {
      serviceItemId: null,
      name: "",
      description: "",
      quantity: 1,
      unitPriceCents: 0,
      vatRate: 22,
    }]);
  };

  const subtotalCents = lineItems.reduce((sum, li) => sum + li.unitPriceCents * li.quantity, 0);
  const vatAmountCents = lineItems.reduce((sum, li) => sum + Math.round(li.unitPriceCents * li.quantity * li.vatRate / 100), 0);
  const totalCents = subtotalCents + vatAmountCents;

  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.fullName || selectedCustomer.username);
      setCustomerEmail(selectedCustomer.email || "");
      setCustomerPhone(selectedCustomer.phone || "");
    }
  }, [selectedCustomer]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const validUntil = validDays
        ? new Date(Date.now() + parseInt(validDays) * 86400000).toISOString()
        : null;

      return apiRequest("POST", "/api/standalone-quotes", {
          customerId: customerId || null,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          deviceTypeId: deviceTypeId || null,
          brandId: brandId || null,
          modelId: modelId || null,
          deviceDescription: deviceDescription || null,
          notes: notes || null,
          validUntil,
          status: "draft",
          items: lineItems.map(li => ({
            serviceItemId: li.serviceItemId,
            name: li.name,
            description: li.description || null,
            quantity: li.quantity,
            unitPriceCents: li.unitPriceCents,
            vatRate: li.vatRate,
          })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standalone-quotes"] });
      toast({ title: "Preventivo creato con successo" });
      const basePath = user?.role === "repair_center" ? "/repair-center" : "/reseller";
      navigate(`${basePath}/standalone-quotes`);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return lineItems.length > 0 && lineItems.every(li => li.name && li.unitPriceCents >= 0);
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const deviceTypeName = deviceTypes.find((dt: any) => dt.id === deviceTypeId)?.name || "";
  const brandName = deviceBrands.find((db: any) => db.id === brandId)?.name || "";
  const modelName = deviceModels.find((dm: any) => dm.id === modelId)?.modelName || "";

  const basePath = user?.role === "repair_center" ? "/repair-center" : "/reseller";

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`${basePath}/standalone-quotes`)}
          data-testid="button-back-quotes"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Nuovo Preventivo</h1>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {idx > 0 && <div className={`h-px w-6 ${isCompleted ? "bg-primary" : "bg-border"}`} />}
              <button
                onClick={() => idx <= currentStep && setCurrentStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground"
                }`}
                data-testid={`step-${step.id}`}
              >
                <StepIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seleziona Dispositivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Seleziona il tipo di dispositivo per filtrare i servizi compatibili.
              Puoi anche saltare questo passaggio per vedere tutti i servizi.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo Dispositivo</Label>
                <Select value={deviceTypeId} onValueChange={(v) => { setDeviceTypeId(v); setBrandId(""); setModelId(""); }}>
                  <SelectTrigger data-testid="select-device-type">
                    <SelectValue placeholder="Seleziona tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceTypes.map((dt: any) => (
                      <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Select value={brandId} onValueChange={(v) => { setBrandId(v); setModelId(""); }} disabled={!deviceTypeId}>
                  <SelectTrigger data-testid="select-brand">
                    <SelectValue placeholder="Seleziona marca..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceBrands.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Modello</Label>
                <Select value={modelId} onValueChange={setModelId} disabled={!brandId}>
                  <SelectTrigger data-testid="select-model">
                    <SelectValue placeholder="Seleziona modello..." />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceModels.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.modelName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrizione dispositivo (opzionale)</Label>
              <Input
                value={deviceDescription}
                onChange={(e) => setDeviceDescription(e.target.value)}
                placeholder="Es. iPhone 15 Pro Max 256GB Blu - graffi sul retro"
                data-testid="input-device-description"
              />
            </div>
            {(deviceTypeId || brandId || modelId) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Selezione:</span>
                {deviceTypeName && <Badge variant="secondary">{deviceTypeName}</Badge>}
                {brandName && <Badge variant="secondary">{brandName}</Badge>}
                {modelName && <Badge variant="secondary">{modelName}</Badge>}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDeviceTypeId(""); setBrandId(""); setModelId(""); }}
                  data-testid="button-clear-device"
                >
                  Cancella selezione
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Servizi Compatibili</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Cerca servizio..."
                  className="pl-9"
                  data-testid="input-search-services"
                />
              </div>

              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : services.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nessun servizio trovato per il dispositivo selezionato.
                </p>
              ) : (
                <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                  {services.map((service) => {
                    const isAdded = lineItems.some(li => li.serviceItemId === service.id);
                    return (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
                          isAdded ? "border-primary/50 bg-primary/5" : "hover-elevate"
                        }`}
                        data-testid={`service-card-${service.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{service.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                            <span>{service.code}</span>
                            <span>{service.category}</span>
                            {service.defaultLaborMinutes > 0 && (
                              <span>{service.defaultLaborMinutes} min</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-semibold">
                            {formatCurrency(service.effectivePriceCents || service.defaultPriceCents)}
                          </span>
                          <Button
                            size="sm"
                            variant={isAdded ? "secondary" : "default"}
                            onClick={() => addServiceToQuote(service)}
                            data-testid={`button-add-service-${service.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {isAdded ? "Aggiungi ancora" : "Aggiungi"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Voci del Preventivo ({lineItems.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={addCustomLineItem} data-testid="button-add-custom-item">
                <Plus className="h-4 w-4 mr-1" />
                Voce personalizzata
              </Button>
            </CardHeader>
            <CardContent>
              {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun servizio aggiunto. Seleziona dalla lista sopra o aggiungi una voce personalizzata.
                </p>
              ) : (
                <div className="space-y-3">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-md border">
                      <div className="flex-1 space-y-2">
                        {!item.serviceItemId ? (
                          <Input
                            value={item.name}
                            onChange={(e) => updateLineItem(idx, { name: e.target.value })}
                            placeholder="Nome voce personalizzata"
                            data-testid={`input-item-name-${idx}`}
                          />
                        ) : (
                          <div className="font-medium text-sm">{item.name}</div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Quantità</Label>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateLineItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                              data-testid={`input-item-qty-${idx}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Prezzo unit. (EUR)</Label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={(item.unitPriceCents / 100).toFixed(2)}
                              onChange={(e) => updateLineItem(idx, { unitPriceCents: Math.round(parseFloat(e.target.value || "0") * 100) })}
                              data-testid={`input-item-price-${idx}`}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">IVA %</Label>
                            <Select
                              value={String(item.vatRate)}
                              onValueChange={(v) => updateLineItem(idx, { vatRate: parseFloat(v) })}
                            >
                              <SelectTrigger data-testid={`select-vat-${idx}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="22">22%</SelectItem>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="4">4%</SelectItem>
                                <SelectItem value="0">0%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          Totale: {formatCurrency(item.unitPriceCents * item.quantity)} + IVA {formatCurrency(Math.round(item.unitPriceCents * item.quantity * item.vatRate / 100))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(idx)}
                        data-testid={`button-remove-item-${idx}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-end">
                    <div className="text-right space-y-1">
                      <div className="text-sm">Imponibile: <span className="font-semibold">{formatCurrency(subtotalCents)}</span></div>
                      <div className="text-sm">IVA: <span className="font-semibold">{formatCurrency(vatAmountCents)}</span></div>
                      <div className="text-lg font-bold">Totale: {formatCurrency(totalCents)}</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dati Cliente (opzionale)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Puoi associare il preventivo a un cliente esistente o inserire i dati manualmente. Lascia vuoto per un preventivo senza cliente.
            </p>
            <div className="space-y-1.5">
              <Label>Cliente esistente</Label>
              <Select value={customerId} onValueChange={(v) => {
                if (v === "__none__") {
                  setCustomerId("");
                  setCustomerName("");
                  setCustomerEmail("");
                  setCustomerPhone("");
                } else {
                  setCustomerId(v);
                }
              }}>
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Seleziona cliente (opzionale)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nessun cliente</SelectItem>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.fullName || c.username} {c.email ? `(${c.email})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Nome</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo"
                  disabled={!!customerId}
                  data-testid="input-customer-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@esempio.it"
                  disabled={!!customerId}
                  data-testid="input-customer-email"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefono</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+39 ..."
                  disabled={!!customerId}
                  data-testid="input-customer-phone"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Note</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note aggiuntive per il preventivo..."
                rows={3}
                data-testid="input-notes"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Validità preventivo (giorni)</Label>
              <Select value={validDays} onValueChange={setValidDays}>
                <SelectTrigger data-testid="select-validity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 giorni</SelectItem>
                  <SelectItem value="15">15 giorni</SelectItem>
                  <SelectItem value="30">30 giorni</SelectItem>
                  <SelectItem value="60">60 giorni</SelectItem>
                  <SelectItem value="90">90 giorni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riepilogo Preventivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(deviceTypeName || brandName || modelName || deviceDescription) && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Dispositivo</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {deviceTypeName && <Badge variant="secondary">{deviceTypeName}</Badge>}
                  {brandName && <Badge variant="secondary">{brandName}</Badge>}
                  {modelName && <Badge variant="secondary">{modelName}</Badge>}
                </div>
                {deviceDescription && <p className="text-sm text-muted-foreground">{deviceDescription}</p>}
              </div>
            )}

            <Separator />

            <div className="space-y-1">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4" /> Servizi ({lineItems.length})</h3>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">{formatCurrency(item.unitPriceCents * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <div className="text-right space-y-1">
                <div className="text-sm">Imponibile: <span className="font-semibold">{formatCurrency(subtotalCents)}</span></div>
                <div className="text-sm">IVA: <span className="font-semibold">{formatCurrency(vatAmountCents)}</span></div>
                <div className="text-lg font-bold flex items-center gap-1 justify-end">
                  <Euro className="h-5 w-5" />
                  Totale: {formatCurrency(totalCents)}
                </div>
              </div>
            </div>

            <Separator />

            {(customerName || customerEmail) && (
              <div className="space-y-1">
                <h3 className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Cliente</h3>
                <div className="text-sm space-y-0.5">
                  {customerName && <p>{customerName}</p>}
                  {customerEmail && <p className="text-muted-foreground">{customerEmail}</p>}
                  {customerPhone && <p className="text-muted-foreground">{customerPhone}</p>}
                </div>
              </div>
            )}
            {!customerName && !customerEmail && (
              <p className="text-sm text-muted-foreground">Nessun cliente associato</p>
            )}

            {notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">Note</h3>
                  <p className="text-sm text-muted-foreground">{notes}</p>
                </div>
              </>
            )}

            <p className="text-sm text-muted-foreground">
              Validità: {validDays} giorni dalla creazione
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
          data-testid="button-prev-step"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Indietro
        </Button>

        {currentStep < STEPS.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canGoNext()}
            data-testid="button-next-step"
          >
            Avanti
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || lineItems.length === 0}
            data-testid="button-create-quote"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Crea Preventivo
          </Button>
        )}
      </div>
    </div>
  );
}
