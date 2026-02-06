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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Package, Truck, Check, X, Clock, Send, MapPin, Upload, Image, Globe, Trash2, Smartphone, FileText, Euro, CreditCard, Store } from "lucide-react";
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

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In attesa", variant: "secondary" },
  assigned: { label: "Assegnata", variant: "outline" },
  accepted: { label: "Accettata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" },
  awaiting_shipment: { label: "Attesa spedizione", variant: "outline" },
  in_transit: { label: "In transito", variant: "default" },
  received: { label: "Ricevuto", variant: "default" },
  repair_created: { label: "Riparazione creata", variant: "default" },
  cancelled: { label: "Annullata", variant: "destructive" },
  quoted: { label: "Preventivo ricevuto", variant: "outline" },
  quote_accepted: { label: "Preventivo accettato", variant: "default" },
  quote_declined: { label: "Preventivo rifiutato", variant: "destructive" },
};

interface DeviceEntry {
  deviceType: string;
  brandId: string;
  brand: string;
  model: string;
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

  const { data: deviceModels } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models"],
  });

  const getFilteredModels = (brandId: string) =>
    (deviceModels || []).filter((m) => m.brandId === brandId);

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
      toast({ title: "Richiesta inviata", description: "La tua richiesta di riparazione remota è stata inviata con successo" });
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
      window.open(approveUrl, "_blank");
      toast({ title: "PayPal", description: "Completa il pagamento nella finestra PayPal. Poi torna qui e conferma." });
      setPaymentRequest(request);
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
      if (!d.deviceType || !d.brand || !d.model || !d.issueDescription) {
        toast({ title: "Errore", description: "Compila tutti i campi obbligatori per ogni dispositivo", variant: "destructive" });
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
            deviceType: d.deviceType,
            brand: d.brand,
            model: d.model,
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

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">
                Richieste di Riparazione Remota
              </h1>
              <p className="text-white/80 text-sm">Richiedi una riparazione senza recarti in negozio</p>
            </div>
          </div>
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-request">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Richiesta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuova Richiesta di Riparazione</DialogTitle>
                <DialogDescription>Aggiungi uno o più dispositivi e descrivi il problema</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                {devices.map((device, idx) => (
                  <Card key={idx} data-testid={`card-device-form-${idx}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Dispositivo {idx + 1}
                        </CardTitle>
                        {devices.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDevice(idx)}
                            data-testid={`button-remove-device-${idx}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label>Tipo Dispositivo</Label>
                          <Select value={device.deviceType} onValueChange={(v) => updateDevice(idx, { deviceType: v })}>
                            <SelectTrigger data-testid={`select-device-type-${idx}`}>
                              <SelectValue placeholder="Seleziona tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {deviceTypes?.map((t) => (
                                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Marca</Label>
                          <Select
                            value={device.brandId || "none"}
                            onValueChange={(v) => {
                              const b = deviceBrands?.find((br) => br.id === v);
                              updateDevice(idx, { brandId: v === "none" ? "" : v, brand: b?.name || "", model: "" });
                            }}
                          >
                            <SelectTrigger data-testid={`select-brand-${idx}`}>
                              <SelectValue placeholder="Seleziona marca" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Seleziona marca</SelectItem>
                              {deviceBrands?.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Modello</Label>
                          <Select
                            value={device.model || "none"}
                            onValueChange={(v) => updateDevice(idx, { model: v === "none" ? "" : v })}
                            disabled={!device.brandId}
                          >
                            <SelectTrigger data-testid={`select-model-${idx}`}>
                              <SelectValue placeholder={device.brandId ? "Seleziona modello" : "Prima la marca"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Seleziona modello</SelectItem>
                              {getFilteredModels(device.brandId).map((m) => (
                                <SelectItem key={m.id} value={m.modelName}>{m.modelName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label>Quantità</Label>
                          <Input
                            type="number"
                            min={1}
                            value={device.quantity}
                            onChange={(e) => updateDevice(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            data-testid={`input-quantity-${idx}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>IMEI (opzionale)</Label>
                          <Input
                            value={device.imei}
                            onChange={(e) => updateDevice(idx, { imei: e.target.value })}
                            placeholder="IMEI"
                            data-testid={`input-imei-${idx}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Seriale (opzionale)</Label>
                          <Input
                            value={device.serial}
                            onChange={(e) => updateDevice(idx, { serial: e.target.value })}
                            placeholder="Numero di serie"
                            data-testid={`input-serial-${idx}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label>Descrizione Problema</Label>
                        <Textarea
                          value={device.issueDescription}
                          onChange={(e) => updateDevice(idx, { issueDescription: e.target.value })}
                          placeholder="Descrivi il problema del dispositivo in dettaglio..."
                          rows={3}
                          data-testid={`input-issue-${idx}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Foto (opzionale, max 5)</Label>
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer">
                            <input type="file" accept="image/*" multiple onChange={(e) => handleDevicePhotoChange(idx, e)} className="hidden" data-testid={`input-photos-${idx}`} />
                            <div className="flex flex-wrap items-center gap-2 px-4 py-2 border rounded-md hover-elevate">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Seleziona foto</span>
                            </div>
                          </label>
                          {device.photos.length > 0 && (
                            <span className="text-sm text-muted-foreground">{device.photos.length} foto</span>
                          )}
                        </div>
                        {device.photoPreviewUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {device.photoPreviewUrls.map((url, pi) => (
                              <div key={pi} className="relative group">
                                <img src={url} alt={`Preview ${pi + 1}`} className="w-16 h-16 object-cover rounded-md border" />
                                <button
                                  type="button"
                                  onClick={() => removeDevicePhoto(idx, pi)}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button type="button" variant="outline" className="w-full" onClick={addDevice} data-testid="button-add-device">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi altro dispositivo
                </Button>

                <div className="space-y-2">
                  <Label>Note Aggiuntive (opzionale)</Label>
                  <Textarea
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="Altre informazioni utili..."
                    rows={2}
                    data-testid="input-customer-notes"
                  />
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <div className="text-sm text-muted-foreground mr-auto">
                    {devices.length} dispositiv{devices.length === 1 ? "o" : "i"} - {totalDeviceCount} unit&agrave; totali
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || isUploading} data-testid="button-submit-request">
                    {createMutation.isPending || isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Invio...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Invia Richiesta
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {requests && requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nessuna richiesta</h3>
            <p className="text-muted-foreground text-center mt-2">
              Non hai ancora effettuato richieste di riparazione remota.
              <br />
              Clicca su "Nuova Richiesta" per iniziare.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests?.map((request) => (
            <Card key={request.id} data-testid={`card-request-${request.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span data-testid={`text-request-number-${request.id}`}>{request.requestNumber}</span>
                      <Badge {...statusLabels[request.status]} data-testid={`badge-status-${request.id}`}>
                        {statusLabels[request.status]?.label || request.status}
                      </Badge>
                      {request.devices && request.devices.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {request.devices.length} dispositiv{request.devices.length === 1 ? "o" : "i"}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Creata il {format(new Date(request.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </CardDescription>
                  </div>
                  {request.status === "awaiting_shipment" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(`/api/customer/remote-requests/${request.id}/ddt`, "_blank")}
                        data-testid={`button-download-ddt-${request.id}`}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Scarica DDT
                      </Button>
                      <Button onClick={() => openShippingDialog(request)} data-testid={`button-ship-${request.id}`}>
                        <Truck className="h-4 w-4 mr-2" />
                        Invia Dati Spedizione
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.devices?.map((device, di) => (
                  <div key={device.id} className="p-3 border rounded-md space-y-2" data-testid={`device-${device.id}`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Dispositivo</p>
                        <p className="text-sm font-medium">{device.deviceType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Marca / Modello</p>
                        <p className="text-sm font-medium">{device.brand} {device.model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Quantità</p>
                        <p className="text-sm font-medium">{device.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Stato</p>
                        <Badge variant={statusLabels[device.status]?.variant || "secondary"} className="text-xs">
                          {statusLabels[device.status]?.label || device.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Problema</p>
                      <p className="text-sm">{device.issueDescription}</p>
                    </div>
                    {device.photos && device.photos.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Image className="h-3 w-3" /> Foto
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {device.photos.map((photo: string, pi: number) => (
                            <a key={pi} href={photo} target="_blank" rel="noopener noreferrer">
                              <img src={photo} alt={`Foto ${pi + 1}`} className="w-16 h-16 object-cover rounded-md border hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {request.quoteAmount && request.status !== 'quote_declined' && (
                  <div className="p-4 border rounded-md bg-muted/30 space-y-3" data-testid={`quote-card-${request.id}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Euro className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">Preventivo</span>
                      </div>
                      <Badge variant={request.status === 'quote_accepted' || request.status === 'awaiting_shipment' ? 'default' : 'outline'}>
                        {request.paymentStatus === 'paid' ? 'Pagato' : request.status === 'quote_accepted' ? 'Da pagare' : request.status === 'quoted' ? 'In attesa di risposta' : 'Accettato'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-2xl font-bold" data-testid={`text-quote-amount-${request.id}`}>{(request.quoteAmount / 100).toFixed(2)} EUR</p>
                      {request.quoteDescription && <p className="text-sm text-muted-foreground mt-1">{request.quoteDescription}</p>}
                      {request.quoteValidUntil && <p className="text-xs text-muted-foreground mt-1">Valido fino al: {format(new Date(request.quoteValidUntil), "d MMMM yyyy", { locale: it })}</p>}
                    </div>
                    {request.status === 'quoted' && (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm font-medium">Come desideri pagare?</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => acceptQuoteMutation.mutate({ id: request.id, paymentMethod: 'in_store' })}
                            disabled={acceptQuoteMutation.isPending}
                            variant="outline"
                            data-testid={`button-pay-in-store-${request.id}`}
                          >
                            <Store className="h-4 w-4 mr-2" />
                            Pago in Negozio
                          </Button>
                          <Button
                            onClick={() => acceptQuoteMutation.mutate({ id: request.id, paymentMethod: 'online_stripe' })}
                            disabled={acceptQuoteMutation.isPending}
                            data-testid={`button-pay-stripe-${request.id}`}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Paga con Carta
                          </Button>
                          <Button
                            onClick={() => acceptQuoteMutation.mutate({ id: request.id, paymentMethod: 'online_paypal' })}
                            disabled={acceptQuoteMutation.isPending}
                            data-testid={`button-pay-paypal-${request.id}`}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Paga con PayPal
                          </Button>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => declineQuoteMutation.mutate(request.id)}
                          disabled={declineQuoteMutation.isPending}
                          data-testid={`button-decline-quote-${request.id}`}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rifiuta Preventivo
                        </Button>
                      </div>
                    )}
                    {request.status === 'quote_accepted' && request.paymentStatus !== 'paid' && (
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm font-medium">Completa il pagamento</p>
                        <div className="flex flex-wrap gap-2">
                          {request.paymentMethod === 'online_stripe' && (
                            <Button
                              onClick={() => initiateStripePayment(request)}
                              disabled={isProcessingPayment}
                              data-testid={`button-checkout-stripe-${request.id}`}
                            >
                              {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                              Paga con Carta
                            </Button>
                          )}
                          {request.paymentMethod === 'online_paypal' && (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                onClick={() => initiatePayPalPayment(request)}
                                disabled={isProcessingPayment}
                                data-testid={`button-checkout-paypal-${request.id}`}
                              >
                                {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                                {request.paypalOrderId ? 'Riprova PayPal' : 'Apri PayPal'}
                              </Button>
                              {request.paypalOrderId && (
                                <Button
                                  onClick={() => capturePayPalPayment(request.id, request.paypalOrderId!)}
                                  disabled={isProcessingPayment}
                                  data-testid={`button-confirm-paypal-${request.id}`}
                                >
                                  {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                                  Ho pagato, Conferma
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {request.paymentStatus === 'paid' && (
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          Pagamento completato
                        </p>
                      </div>
                    )}
                    {request.paymentMethod === 'in_store' && request.paymentStatus !== 'paid' && request.status !== 'quoted' && (
                      <p className="text-xs text-muted-foreground">Pagherai direttamente in negozio alla consegna del dispositivo.</p>
                    )}
                  </div>
                )}
                {request.status === 'quote_declined' && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <X className="h-4 w-4" /> Preventivo rifiutato. La richiesta è stata chiusa.
                    </p>
                  </div>
                )}
                {request.rejectionReason && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-muted-foreground">Motivo Rifiuto</p>
                    <p className="text-sm text-destructive">{request.rejectionReason}</p>
                  </div>
                )}
                {request.trackingNumber && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Tracking</p>
                    <p className="font-medium">{request.courierName}: {request.trackingNumber}</p>
                  </div>
                )}
                {request.customerAddress && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Indirizzo di Spedizione
                    </p>
                    <p className="text-sm">
                      {request.customerAddress}, {request.customerCap} {request.customerCity} ({request.customerProvince})
                    </p>
                  </div>
                )}
                {request.status === "repair_created" && (
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      La riparazione è stata avviata! Il centro sta lavorando ai tuoi dispositivi.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isPaymentOpen && stripeClientSecret && stripePromise && (
        <Dialog open={isPaymentOpen} onOpenChange={(open) => {
          if (!open) {
            setIsPaymentOpen(false);
            setStripeClientSecret(null);
            setStripePromise(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pagamento con Carta</DialogTitle>
              <DialogDescription>
                Importo: {paymentRequest?.quoteAmount ? (paymentRequest.quoteAmount / 100).toFixed(2) : '0.00'} EUR
              </DialogDescription>
            </DialogHeader>
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'stripe' } }}>
              <StripePaymentForm
                onSuccess={() => paymentRequest && confirmStripePayment(paymentRequest.id)}
                onError={(msg) => toast({ title: "Errore pagamento", description: msg, variant: "destructive" })}
              />
            </Elements>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dati Spedizione</DialogTitle>
            <DialogDescription>Inserisci i dati del corriere e il numero di tracking</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courierName">Nome Corriere</Label>
              <Select value={shippingInfo.courierName} onValueChange={(v) => setShippingInfo({ ...shippingInfo, courierName: v })}>
                <SelectTrigger data-testid="select-courier-name">
                  <SelectValue placeholder="Seleziona corriere..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRT">BRT (Bartolini)</SelectItem>
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
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Numero Tracking</Label>
              <Input
                id="trackingNumber"
                value={shippingInfo.trackingNumber}
                onChange={(e) => setShippingInfo({ ...shippingInfo, trackingNumber: e.target.value })}
                placeholder="Numero di tracking"
                data-testid="input-tracking-number"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsShippingOpen(false)}>Annulla</Button>
              <Button type="submit" disabled={shippingMutation.isPending} data-testid="button-confirm-shipping">
                {shippingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conferma Spedizione"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
