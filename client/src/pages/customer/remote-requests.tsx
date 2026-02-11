import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Package, Truck, Check, X, Clock, Send, MapPin, Upload, Image, Trash2, Smartphone, FileText, Euro, CreditCard, Store, Download, Search, ChevronRight, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import type { RemoteRepairRequest, RemoteRepairRequestDevice, DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type EnrichedRequest = RemoteRepairRequest & {
  devices: RemoteRepairRequestDevice[];
  centerName?: string | null;
  centerAddress?: string | null;
  centerCity?: string | null;
  centerCap?: string | null;
  centerProvince?: string | null;
  centerPhone?: string | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: any }> = {
  pending: { label: "In attesa", variant: "secondary", icon: Clock },
  assigned: { label: "Assegnata", variant: "outline" },
  accepted: { label: "Accettata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" },
  awaiting_shipment: { label: "Attesa spedizione", variant: "outline", icon: Package },
  in_transit: { label: "In transito", variant: "default", icon: Truck },
  received: { label: "Ricevuto", variant: "default", icon: Check },
  repair_created: { label: "In riparazione", variant: "default" },
  cancelled: { label: "Annullata", variant: "destructive" },
  quoted: { label: "Preventivo ricevuto", variant: "outline", icon: Euro },
  quote_accepted: { label: "Preventivo accettato", variant: "default" },
  quote_declined: { label: "Preventivo rifiutato", variant: "destructive" },
};

interface DeviceModelResult {
  id: string;
  modelName: string;
  brand?: string | null;
  brandId?: string | null;
  typeId?: string | null;
  deviceClass?: string | null;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function DeviceModelAutocomplete({
  value,
  onChange,
  deviceTypes,
  deviceBrands,
}: {
  value: string;
  onChange: (updates: Partial<DeviceEntry>) => void;
  deviceTypes?: DeviceType[];
  deviceBrands?: DeviceBrand[];
}) {
  const [search, setSearch] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const { data: suggestions = [], isLoading } = useQuery<DeviceModelResult[]>({
    queryKey: ["/api/device-models", { search: debouncedSearch }],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [];
      const params = new URLSearchParams({ search: debouncedSearch, limit: "15" });
      const res = await fetch(`/api/device-models?${params}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: debouncedSearch.length >= 2 && isFocused && !selectedId,
  });

  useEffect(() => {
    setIsOpen(suggestions.length > 0 && isFocused && debouncedSearch.length >= 2 && !selectedId);
  }, [suggestions, isFocused, debouncedSearch, selectedId]);

  const handleSelect = (model: DeviceModelResult) => {
    const brandName = model.brand || deviceBrands?.find(b => b.id === model.brandId)?.name || "";
    const typeName = deviceTypes?.find(t => t.id === model.typeId)?.name || "";
    const displayText = brandName ? `${brandName} ${model.modelName}` : model.modelName;
    setSearch(displayText);
    setSelectedId(model.id);
    onChange({
      deviceType: typeName,
      brandId: model.brandId || "",
      brand: brandName,
      model: model.modelName,
      productSearch: displayText,
    });
    setIsOpen(false);
  };

  const handleInputChange = (val: string) => {
    setSearch(val);
    setSelectedId(null);
    if (!val) {
      onChange({ deviceType: "", brandId: "", brand: "", model: "", productSearch: "" });
    } else {
      onChange({ deviceType: "", brandId: "", brand: "", model: "", productSearch: val });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { setIsFocused(true); if (!selectedId) setIsOpen(suggestions.length > 0); }}
          onBlur={() => setTimeout(() => { setIsFocused(false); setIsOpen(false); }, 200)}
          onKeyDown={handleKeyDown}
          placeholder="Cerca dispositivo (es. iPhone 15, Galaxy S24...)"
          className="pl-9"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          data-testid="input-device-search"
        />
        {isLoading && isFocused && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-[240px] overflow-y-auto" role="listbox">
          {suggestions.map((model) => {
            const brandName = model.brand || deviceBrands?.find(b => b.id === model.brandId)?.name || "";
            const typeName = deviceTypes?.find(t => t.id === model.typeId)?.name || "";
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                className="w-full text-left px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-2 transition-colors"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(model); }}
                data-testid={`suggestion-${model.id}`}
              >
                <span className="font-medium truncate">
                  {brandName ? `${brandName} ` : ""}{model.modelName}
                </span>
                {typeName && (
                  <Badge variant="outline" className="text-xs flex-shrink-0">{typeName}</Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface DeviceEntry {
  deviceType: string;
  brandId: string;
  brand: string;
  model: string;
  productSearch: string;
  imei: string;
  serial: string;
  quantity: number;
  issueDescription: string;
  photos: File[];
  photoPreviewUrls: string[];
}

const emptyDevice = (): DeviceEntry => ({
  deviceType: "",
  brandId: "",
  brand: "",
  model: "",
  productSearch: "",
  imei: "",
  serial: "",
  quantity: 1,
  issueDescription: "",
  photos: [],
  photoPreviewUrls: [],
});

function StripePaymentForm({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + "/customer/remote-requests" },
        redirect: "if_required",
      });
      if (error) {
        onError(error.message || "Errore nel pagamento");
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess();
      } else {
        onError("Pagamento non completato");
      }
    } catch (err: any) {
      onError(err.message || "Errore imprevisto");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full" data-testid="button-stripe-submit">
        {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
        {isProcessing ? "Elaborazione..." : "Paga Ora"}
      </Button>
    </form>
  );
}

function DeviceFormCard({
  device,
  index,
  total,
  onUpdate,
  onRemove,
  onPhotoChange,
  onRemovePhoto,
  deviceTypes,
  deviceBrands,
}: {
  device: DeviceEntry;
  index: number;
  total: number;
  onUpdate: (updates: Partial<DeviceEntry>) => void;
  onRemove: () => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (photoIndex: number) => void;
  deviceTypes?: DeviceType[];
  deviceBrands?: DeviceBrand[];
}) {
  return (
    <div className="space-y-4 p-4 border rounded-md bg-muted/20" data-testid={`card-device-form-${index}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>
          <span className="text-sm font-medium">Dispositivo {index + 1}</span>
        </div>
        {total > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            data-testid={`button-remove-device-${index}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Quale dispositivo vuoi riparare?</Label>
        <DeviceModelAutocomplete
          value={device.productSearch}
          onChange={(updates) => onUpdate(updates)}
          deviceTypes={deviceTypes}
          deviceBrands={deviceBrands}
        />
        {device.brand && device.model && (
          <div className="flex items-center gap-1.5 mt-1">
            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs text-muted-foreground">
              {device.deviceType && <span>{device.deviceType} — </span>}
              {device.brand} {device.model}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Descrivi il problema</Label>
        <Textarea
          value={device.issueDescription}
          onChange={(e) => onUpdate({ issueDescription: e.target.value })}
          placeholder="Cosa non funziona? Descrivi il difetto in dettaglio..."
          rows={3}
          data-testid={`input-issue-${index}`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quantità</Label>
          <Input
            type="number"
            min={1}
            value={device.quantity}
            onChange={(e) => onUpdate({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
            data-testid={`input-quantity-${index}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">IMEI (opzionale)</Label>
          <Input
            value={device.imei}
            onChange={(e) => onUpdate({ imei: e.target.value })}
            placeholder="Codice IMEI"
            data-testid={`input-imei-${index}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Seriale (opzionale)</Label>
          <Input
            value={device.serial}
            onChange={(e) => onUpdate({ serial: e.target.value })}
            placeholder="Numero di serie"
            data-testid={`input-serial-${index}`}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Foto del difetto (opzionale, max 5)</Label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer" data-testid={`label-upload-photos-${index}`}>
            <input type="file" accept="image/*" multiple onChange={onPhotoChange} className="hidden" data-testid={`input-photos-${index}`} />
            <Button type="button" variant="outline" size="sm" asChild>
              <div>
                <Upload className="h-4 w-4 mr-1.5" />
                Carica foto
              </div>
            </Button>
          </label>
          {device.photos.length > 0 && (
            <span className="text-xs text-muted-foreground">{device.photos.length} foto selezionat{device.photos.length === 1 ? "a" : "e"}</span>
          )}
        </div>
        {device.photoPreviewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {device.photoPreviewUrls.map((url, pi) => (
              <div key={pi} className="relative group">
                <img src={url} alt={`Preview ${pi + 1}`} className="w-14 h-14 object-cover rounded-md border" data-testid={`img-preview-${index}-${pi}`} />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(pi)}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-photo-${index}-${pi}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onShip,
  onAcceptQuote,
  onDeclineQuote,
  onStripePayment,
  onPayPalPayment,
  onCapturePayPal,
  isProcessingPayment,
  pendingPaypalCapture,
  acceptQuotePending,
  declineQuotePending,
}: {
  request: EnrichedRequest;
  onShip: (r: EnrichedRequest) => void;
  onAcceptQuote: (id: string, method: string) => void;
  onDeclineQuote: (id: string) => void;
  onStripePayment: (r: EnrichedRequest) => void;
  onPayPalPayment: (r: EnrichedRequest) => void;
  onCapturePayPal: (requestId: string, orderID: string) => void;
  isProcessingPayment: boolean;
  pendingPaypalCapture: { token: string; requestId?: string } | null;
  acceptQuotePending: boolean;
  declineQuotePending: boolean;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const sc = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };
  const deviceCount = request.devices?.length || 0;
  const totalQty = request.devices?.reduce((s, d) => s + (d.quantity || 1), 0) || 0;
  const hasQuote = request.quoteAmount && request.status !== 'quote_declined';
  const needsAction = request.status === 'quoted' || request.status === 'awaiting_shipment' || (request.status === 'quote_accepted' && request.paymentStatus !== 'paid');

  return (
    <Card className={needsAction ? "border-primary/30" : ""} data-testid={`card-request-${request.id}`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`toggle-request-${request.id}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" data-testid={`text-request-number-${request.id}`}>{request.requestNumber}</span>
                <Badge variant={sc.variant} data-testid={`badge-status-${request.id}`}>
                  {sc.label}
                </Badge>
                {needsAction && (
                  <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Azione richiesta
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{format(new Date(request.createdAt), "d MMM yyyy", { locale: it })}</span>
                <span>·</span>
                <span>{deviceCount} dispositiv{deviceCount === 1 ? "o" : "i"}{totalQty > deviceCount ? ` (${totalQty} unità)` : ""}</span>
                {request.quoteAmount && request.status !== 'quote_declined' && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-foreground">{(request.quoteAmount / 100).toFixed(2)} EUR</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="border-t pt-4" />

          {request.status === "awaiting_shipment" && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-md">
              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1">Spedisci i dispositivi al centro di riparazione</span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); window.open(`/api/customer/remote-requests/${request.id}/ddt`, "_blank"); }}
                  data-testid={`button-download-ddt-${request.id}`}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  DDT
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onShip(request); }}
                  data-testid={`button-ship-${request.id}`}
                >
                  <Truck className="h-4 w-4 mr-1.5" />
                  Inserisci Tracking
                </Button>
              </div>
            </div>
          )}

          {request.devices?.map((device) => (
            <div key={device.id} className="p-3 border rounded-md space-y-2" data-testid={`device-${device.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{device.brand} {device.model}</p>
                    <p className="text-xs text-muted-foreground">{device.deviceType} · Qtà: {device.quantity}</p>
                  </div>
                </div>
                <Badge variant={statusConfig[device.status]?.variant || "secondary"} className="text-xs shrink-0">
                  {statusConfig[device.status]?.label || device.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{device.issueDescription}</p>
              {device.photos && device.photos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {device.photos.map((photo: string, pi: number) => (
                    <a key={pi} href={photo} target="_blank" rel="noopener noreferrer" data-testid={`link-photo-${device.id}-${pi}`}>
                      <img src={photo} alt={`Foto ${pi + 1}`} className="w-12 h-12 object-cover rounded-md border transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasQuote && (
            <div className="p-4 border rounded-md bg-muted/20 space-y-3" data-testid={`quote-card-${request.id}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Preventivo</span>
                </div>
                <Badge variant={request.paymentStatus === 'paid' ? 'default' : 'outline'}>
                  {request.paymentStatus === 'paid' ? 'Pagato' : request.status === 'quote_accepted' ? 'Da pagare' : request.status === 'quoted' ? 'In attesa' : 'Accettato'}
                </Badge>
              </div>
              <div>
                <p className="text-xl font-bold" data-testid={`text-quote-amount-${request.id}`}>
                  {(request.quoteAmount! / 100).toFixed(2)} EUR
                </p>
                {request.quoteDescription && <p className="text-sm text-muted-foreground mt-1">{request.quoteDescription}</p>}
                {request.quoteValidUntil && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Valido fino al {format(new Date(request.quoteValidUntil), "d MMMM yyyy", { locale: it })}
                  </p>
                )}
              </div>

              {request.status === 'quoted' && (
                <div className="space-y-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Scegli come procedere:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onAcceptQuote(request.id, 'in_store'); }}
                      disabled={acceptQuotePending}
                      data-testid={`button-pay-in-store-${request.id}`}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      In Negozio
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); onAcceptQuote(request.id, 'online_stripe'); }}
                      disabled={acceptQuotePending}
                      data-testid={`button-pay-stripe-${request.id}`}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Carta
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onAcceptQuote(request.id, 'online_paypal'); }}
                      disabled={acceptQuotePending}
                      data-testid={`button-pay-paypal-${request.id}`}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      PayPal
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDeclineQuote(request.id); }}
                    disabled={declineQuotePending}
                    data-testid={`button-decline-quote-${request.id}`}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Rifiuta preventivo
                  </Button>
                </div>
              )}

              {request.status === 'quote_accepted' && request.paymentStatus !== 'paid' && (
                <div className="space-y-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">Completa il pagamento per procedere:</p>
                  <div className="flex flex-wrap gap-2">
                    {request.paymentMethod === 'online_stripe' && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); onStripePayment(request); }}
                        disabled={isProcessingPayment}
                        data-testid={`button-checkout-stripe-${request.id}`}
                      >
                        {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                        Paga con Carta
                      </Button>
                    )}
                    {request.paymentMethod === 'online_paypal' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); onPayPalPayment(request); }}
                          disabled={isProcessingPayment}
                          data-testid={`button-checkout-paypal-${request.id}`}
                        >
                          {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                          {request.paypalOrderId ? 'Riprova PayPal' : 'Apri PayPal'}
                        </Button>
                        {pendingPaypalCapture && pendingPaypalCapture.token === request.paypalOrderId && (
                          <Button
                            onClick={(e) => { e.stopPropagation(); onCapturePayPal(request.id, request.paypalOrderId!); }}
                            disabled={isProcessingPayment}
                            data-testid={`button-retry-paypal-${request.id}`}
                          >
                            {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            Conferma Pagamento
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {request.paymentStatus === 'paid' && (
                <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">Pagamento completato</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch(`/api/invoices/by-remote-request/${request.id}`, { credentials: 'include' });
                        if (!res.ok) {
                          toast({ title: "Fattura non disponibile", description: "La fattura potrebbe non essere stata ancora generata.", variant: "destructive" });
                          return;
                        }
                        const invoice = await res.json();
                        window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
                      } catch {
                        toast({ title: "Errore", description: "Impossibile scaricare la fattura.", variant: "destructive" });
                      }
                    }}
                    data-testid={`button-download-invoice-${request.id}`}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Fattura
                  </Button>
                </div>
              )}
              {request.paymentMethod === 'in_store' && request.paymentStatus !== 'paid' && request.status !== 'quoted' && (
                <p className="text-xs text-muted-foreground pt-2">Pagherai direttamente in negozio alla consegna.</p>
              )}
            </div>
          )}

          {request.status === 'quote_declined' && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
              <X className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">Preventivo rifiutato. La richiesta è stata chiusa.</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-xs text-muted-foreground mb-0.5">Motivo rifiuto</p>
              <p className="text-sm text-destructive">{request.rejectionReason}</p>
            </div>
          )}

          {request.trackingNumber && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-md">
              <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Tracking spedizione</p>
                <p className="text-sm font-medium">{request.courierName}: {request.trackingNumber}</p>
              </div>
            </div>
          )}

          {request.centerName && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-md">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Centro assegnato</p>
                <p className="text-sm font-medium">{request.centerName}</p>
                {request.centerAddress && (
                  <p className="text-xs text-muted-foreground">{request.centerAddress}{request.centerCity ? `, ${request.centerCity}` : ""}</p>
                )}
              </div>
            </div>
          )}

          {request.customerNotes && (
            <div className="text-sm">
              <p className="text-xs text-muted-foreground mb-0.5">Le tue note</p>
              <p className="text-muted-foreground">{request.customerNotes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function CustomerRemoteRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrichedRequest | null>(null);

  const [devices, setDevices] = useState<DeviceEntry[]>([emptyDevice()]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [requestedCenterId, setRequestedCenterId] = useState("");

  const [shippingInfo, setShippingInfo] = useState({
    courierName: "",
    trackingNumber: "",
  });

  const [isUploading, setIsUploading] = useState(false);

  const { data: requests, isLoading } = useQuery<EnrichedRequest[]>({
    queryKey: ["/api/customer/remote-requests"],
  });

  const { data: deviceTypes } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const updateDevice = (index: number, updates: Partial<DeviceEntry>) => {
    setDevices((prev) => prev.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const addDevice = () => {
    setDevices((prev) => [...prev, emptyDevice()]);
  };

  const removeDevice = (index: number) => {
    setDevices((prev) => {
      const removed = prev[index];
      removed.photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDevicePhotoChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({ title: "Troppi file", description: "Massimo 5 foto per dispositivo", variant: "destructive" });
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    updateDevice(index, { photos: files, photoPreviewUrls: urls });
  };

  const removeDevicePhoto = (deviceIndex: number, photoIndex: number) => {
    setDevices((prev) =>
      prev.map((d, i) => {
        if (i !== deviceIndex) return d;
        const newPhotos = [...d.photos];
        newPhotos.splice(photoIndex, 1);
        const newUrls = [...d.photoPreviewUrls];
        URL.revokeObjectURL(newUrls[photoIndex]);
        newUrls.splice(photoIndex, 1);
        return { ...d, photos: newPhotos, photoPreviewUrls: newUrls };
      })
    );
  };

  const uploadPhotos = async (photos: File[]): Promise<string[]> => {
    if (photos.length === 0) return [];
    const formData = new FormData();
    photos.forEach((p) => formData.append("photos", p));
    const response = await fetch("/api/customer/remote-requests/upload-photos", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) throw new Error(await response.text());
    const { photos: urls } = await response.json();
    return urls;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customer/remote-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setIsNewRequestOpen(false);
      devices.forEach((d) => d.photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u)));
      setDevices([emptyDevice()]);
      setCustomerNotes("");
      setRequestedCenterId("");
      toast({ title: "Richiesta inviata", description: "La tua richiesta di riparazione è stata inviata con successo. Riceverai un preventivo a breve." });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const shippingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof shippingInfo }) => {
      const res = await apiRequest("PATCH", `/api/customer/remote-requests/${id}/shipping`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setIsShippingOpen(false);
      setSelectedRequest(null);
      setShippingInfo({ courierName: "", trackingNumber: "" });
      toast({ title: "Spedizione confermata", description: "I dati della spedizione sono stati salvati" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<EnrichedRequest | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const acceptQuoteMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod: string }) => {
      const res = await apiRequest("PATCH", `/api/customer/remote-requests/${id}/accept-quote`, { paymentMethod });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      if (data.paymentMethod === 'in_store') {
        toast({ title: "Preventivo accettato", description: "Puoi ora procedere con la spedizione. Pagherai in negozio." });
      } else {
        toast({ title: "Preventivo accettato", description: "Procedi con il pagamento online" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const declineQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/customer/remote-requests/${id}/decline-quote`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      toast({ title: "Preventivo rifiutato", description: "La richiesta è stata chiusa" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const initiateStripePayment = async (request: EnrichedRequest) => {
    try {
      setIsProcessingPayment(true);
      setPaymentRequest(request);
      const res = await apiRequest("POST", "/api/customer/remote-requests/stripe-payment", { requestId: request.id });
      const data = await res.json();
      setStripeClientSecret(data.clientSecret);
      setStripePromise(loadStripe(data.publishableKey));
      setIsPaymentOpen(true);
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Errore avvio pagamento", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const initiatePayPalPayment = async (request: EnrichedRequest) => {
    try {
      setIsProcessingPayment(true);
      const res = await apiRequest("POST", "/api/customer/remote-requests/paypal-create", { requestId: request.id });
      const data = await res.json();
      const approveUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.orderID}`;
      window.location.href = approveUrl;
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Errore avvio PayPal", variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const capturePayPalPayment = async (requestId: string, orderID: string) => {
    try {
      setIsProcessingPayment(true);
      const res = await apiRequest("POST", "/api/customer/remote-requests/paypal-capture", { requestId, orderID });
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setPaymentRequest(null);
      toast({ title: "Pagamento PayPal completato", description: "Puoi ora procedere con la spedizione del dispositivo" });
    } catch (error: any) {
      toast({ title: "Errore conferma PayPal", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const [pendingPaypalCapture, setPendingPaypalCapture] = useState<{token: string, requestId?: string} | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalToken = urlParams.get('token');
    if (!paypalToken) return;
    if (pendingPaypalCapture?.token === paypalToken) return;
    setPendingPaypalCapture({ token: paypalToken });
  }, []);

  useEffect(() => {
    if (!pendingPaypalCapture || !requests || pendingPaypalCapture.requestId) return;
    
    const matchingRequest = (requests as EnrichedRequest[]).find(
      (r: EnrichedRequest) => r.paypalOrderId === pendingPaypalCapture.token && r.paymentStatus !== 'paid'
    );
    
    if (matchingRequest) {
      setPendingPaypalCapture(prev => prev ? { ...prev, requestId: matchingRequest.id } : null);
      (async () => {
        try {
          setIsProcessingPayment(true);
          const res = await apiRequest("POST", "/api/customer/remote-requests/paypal-capture", { 
            requestId: matchingRequest.id, 
            orderID: pendingPaypalCapture.token 
          });
          await res.json();
          queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
          window.history.replaceState({}, '', window.location.pathname);
          setPendingPaypalCapture(null);
          toast({ title: "Pagamento PayPal completato", description: "Puoi ora procedere con la spedizione del dispositivo" });
        } catch (error: any) {
          toast({ title: "Errore conferma PayPal", description: "Riprova cliccando il bottone qui sotto.", variant: "destructive" });
        } finally {
          setIsProcessingPayment(false);
        }
      })();
    }
  }, [requests, pendingPaypalCapture]);

  const confirmStripePayment = async (requestId: string) => {
    try {
      const res = await apiRequest("POST", "/api/customer/remote-requests/stripe-confirm", { requestId });
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setIsPaymentOpen(false);
      setStripeClientSecret(null);
      setStripePromise(null);
      setPaymentRequest(null);
      toast({ title: "Pagamento completato", description: "Puoi ora procedere con la spedizione del dispositivo" });
    } catch (error: any) {
      toast({ title: "Errore conferma", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (devices.length === 0) {
      toast({ title: "Errore", description: "Aggiungi almeno un dispositivo", variant: "destructive" });
      return;
    }
    for (const d of devices) {
      const hasDevice = (d.brand && d.model) || d.productSearch;
      if (!hasDevice || !d.issueDescription) {
        toast({ title: "Dati mancanti", description: "Seleziona un dispositivo e descrivi il problema per ogni dispositivo", variant: "destructive" });
        return;
      }
      if (d.quantity < 1) {
        toast({ title: "Errore", description: "La quantità deve essere almeno 1", variant: "destructive" });
        return;
      }
    }

    try {
      setIsUploading(true);
      const devicesData = await Promise.all(
        devices.map(async (d) => {
          let photoUrls: string[] = [];
          if (d.photos.length > 0) {
            photoUrls = await uploadPhotos(d.photos);
          }
          return {
            deviceType: d.deviceType || "Altro",
            brand: d.brand || (d.productSearch || "").split(" ")[0] || "N/D",
            model: d.model || d.productSearch || "N/D",
            imei: d.imei || undefined,
            serial: d.serial || undefined,
            quantity: d.quantity,
            issueDescription: d.issueDescription,
            photos: photoUrls.length > 0 ? photoUrls : undefined,
          };
        })
      );

      createMutation.mutate({
        resellerId: user?.resellerId || "",
        requestedCenterId: requestedCenterId === "none" || requestedCenterId === "" ? null : requestedCenterId,
        customerNotes: customerNotes || undefined,
        devices: devicesData,
      });
    } catch (error: any) {
      toast({ title: "Errore upload foto", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      shippingMutation.mutate({ id: selectedRequest.id, data: shippingInfo });
    }
  };

  const openShippingDialog = (request: EnrichedRequest) => {
    setSelectedRequest(request);
    setIsShippingOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalDeviceCount = devices.reduce((sum, d) => sum + d.quantity, 0);
  const actionRequiredCount = requests?.filter(r =>
    r.status === 'quoted' || r.status === 'awaiting_shipment' || (r.status === 'quote_accepted' && r.paymentStatus !== 'paid')
  ).length || 0;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Richiedi una Riparazione</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Invia i tuoi dispositivi da riparare senza recarti in negozio
          </p>
        </div>
        <Dialog open={isNewRequestOpen} onOpenChange={(open) => {
          setIsNewRequestOpen(open);
          if (!open) {
            devices.forEach((d) => d.photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u)));
            setDevices([emptyDevice()]);
            setCustomerNotes("");
            setRequestedCenterId("");
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Richiesta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuova Richiesta di Riparazione</DialogTitle>
              <DialogDescription>
                Aggiungi i dispositivi da riparare e descrivi il problema. Riceverai un preventivo dal centro di riparazione.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              {devices.map((device, idx) => (
                <DeviceFormCard
                  key={idx}
                  device={device}
                  index={idx}
                  total={devices.length}
                  onUpdate={(updates) => updateDevice(idx, updates)}
                  onRemove={() => removeDevice(idx)}
                  onPhotoChange={(e) => handleDevicePhotoChange(idx, e)}
                  onRemovePhoto={(pi) => removeDevicePhoto(idx, pi)}
                  deviceTypes={deviceTypes}
                  deviceBrands={deviceBrands}
                />
              ))}

              <Button type="button" variant="outline" className="w-full" onClick={addDevice} data-testid="button-add-device">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi altro dispositivo
              </Button>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Note aggiuntive (opzionale)</Label>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Altre informazioni utili per il centro..."
                  rows={2}
                  data-testid="input-customer-notes"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {devices.length} dispositiv{devices.length === 1 ? "o" : "i"} · {totalDeviceCount} unità
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)} data-testid="button-cancel-request">
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || isUploading} data-testid="button-submit-request">
                    {createMutation.isPending || isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Invia Richiesta
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {actionRequiredCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-md border border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm">
            Hai <span className="font-semibold">{actionRequiredCount}</span> richiest{actionRequiredCount === 1 ? "a" : "e"} che richied{actionRequiredCount === 1 ? "e" : "ono"} la tua attenzione
          </p>
        </div>
      )}

      {requests && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Send className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium" data-testid="text-empty-title">Nessuna richiesta ancora</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Hai un dispositivo da riparare? Invia una richiesta e riceverai un preventivo dal centro di riparazione.
          </p>
          <Button className="mt-4" onClick={() => setIsNewRequestOpen(true)} data-testid="button-empty-new-request">
            <Plus className="h-4 w-4 mr-2" />
            Crea la tua prima richiesta
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests?.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onShip={openShippingDialog}
              onAcceptQuote={(id, method) => acceptQuoteMutation.mutate({ id, paymentMethod: method })}
              onDeclineQuote={(id) => declineQuoteMutation.mutate(id)}
              onStripePayment={initiateStripePayment}
              onPayPalPayment={initiatePayPalPayment}
              onCapturePayPal={capturePayPalPayment}
              isProcessingPayment={isProcessingPayment}
              pendingPaypalCapture={pendingPaypalCapture}
              acceptQuotePending={acceptQuoteMutation.isPending}
              declineQuotePending={declineQuoteMutation.isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dati Spedizione</DialogTitle>
            <DialogDescription>
              Inserisci il corriere e il numero di tracking per la richiesta {selectedRequest?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Corriere</Label>
              <Select value={shippingInfo.courierName} onValueChange={(v) => setShippingInfo({ ...shippingInfo, courierName: v })}>
                <SelectTrigger data-testid="select-courier">
                  <SelectValue placeholder="Seleziona corriere" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRT">BRT</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="GLS">GLS</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="TNT">TNT</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="Poste Italiane">Poste Italiane</SelectItem>
                  <SelectItem value="SDA">SDA</SelectItem>
                  <SelectItem value="Nexive">Nexive</SelectItem>
                  <SelectItem value="Altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Numero Tracking</Label>
              <Input
                value={shippingInfo.trackingNumber}
                onChange={(e) => setShippingInfo({ ...shippingInfo, trackingNumber: e.target.value })}
                placeholder="Numero di tracking"
                data-testid="input-tracking-number"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsShippingOpen(false)} data-testid="button-cancel-shipping">
                Annulla
              </Button>
              <Button type="submit" disabled={shippingMutation.isPending} data-testid="button-confirm-shipping">
                {shippingMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
                Conferma Spedizione
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagamento con Carta</DialogTitle>
            <DialogDescription>
              Importo: {paymentRequest?.quoteAmount ? `${(paymentRequest.quoteAmount / 100).toFixed(2)} EUR` : ""}
            </DialogDescription>
          </DialogHeader>
          {stripePromise && stripeClientSecret && paymentRequest && (
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
              <StripePaymentForm
                onSuccess={() => confirmStripePayment(paymentRequest.id)}
                onError={(msg) => toast({ title: "Errore Pagamento", description: msg, variant: "destructive" })}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
