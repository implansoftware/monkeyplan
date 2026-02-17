import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Link } from "wouter";
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
import { Loader2, Package, Truck, Check, X, Clock, CheckCircle2, XCircle, PackageCheck, MapPin, Image, Smartphone, FileText, Euro, SkipForward } from "lucide-react";
import type { RemoteRepairRequest, RemoteRepairRequestDevice } from "@shared/schema";

type EnrichedRemoteRequest = RemoteRepairRequest & { devices: RemoteRepairRequestDevice[] };
import { format } from "date-fns";
import { it } from "date-fns/locale";


export default function RepairCenterRemoteRequests() {
  const { t } = useTranslation();
  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("b2b.status.pending"), variant: "secondary" },
    assigned: { label: t("remoteRequests.assigned"), variant: "outline" },
    accepted: { label: t("remoteRequests.accepted"), variant: "default" },
    rejected: { label: t("common.rejected"), variant: "destructive" },
    awaiting_shipment: { label: t("remoteRequests.awaitingShipment"), variant: "outline" },
    in_transit: { label: t("shipping.inTransit"), variant: "default" },
    received: { label: t("repairs.status.received"), variant: "default" },
    repair_created: { label: t("remoteRequests.repairCreated"), variant: "default" },
    cancelled: { label: t("common.cancelled"), variant: "destructive" },
    quoted: { label: t("remote.preventivoInviato"), variant: "outline" },
    quote_accepted: { label: t("remoteRequests.quoteAccepted"), variant: "default" },
    quote_declined: { label: t("remoteRequests.quoteDeclined"), variant: "destructive" },
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isReadyOpen, setIsReadyOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isForceReceivedOpen, setIsForceReceivedOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RemoteRepairRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [forceReceivedNotes, setForceReceivedNotes] = useState("");
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [quoteValidDays, setQuoteValidDays] = useState("7");
  const [shippingAddress, setShippingAddress] = useState({
    centerNotes: "",
    customerAddress: "",
    customerCity: "",
    customerCap: "",
    customerProvince: "",
  });

  const { data: requests, isLoading } = useQuery<EnrichedRemoteRequest[]>({
    queryKey: ["/api/repair-center/remote-requests"],
  });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/accept`, {});
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs"] });
      toast({
        title: t("remoteRequests.requestAccepted"),
        description: t("remote.laRichiestaStataAccettataConSuccesso"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const quoteMutation = useMutation({
    mutationFn: async ({ id, quoteAmount, quoteDescription, quoteValidDays }: { id: string; quoteAmount: number; quoteDescription: string; quoteValidDays: number }) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/quote`, { quoteAmount, quoteDescription, quoteValidDays });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      setIsQuoteOpen(false);
      setSelectedRequest(null);
      setQuoteAmount("");
      setQuoteDescription("");
      setQuoteValidDays("7");
      toast({
        title: t("remote.preventivoInviato"),
        description: t("remote.ilPreventivoStatoInviatoAlCliente"),
      });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const skipQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/skip-quote`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      toast({
        title: t("remoteRequests.quoteSkipped"),
        description: t("remote.ilClientePuProcedereDirettamenteConLaSpedi"),
      });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/reject`, { rejectionReason: reason });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs"] });
      setIsRejectOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      toast({
        title: t("remoteRequests.requestRejected"),
        description: t("remote.laRichiestaStataRifiutata"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const readyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof shippingAddress }) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/ready-for-shipping`, data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs"] });
      setIsReadyOpen(false);
      setSelectedRequest(null);
      setShippingAddress({
        centerNotes: "",
        customerAddress: "",
        customerCity: "",
        customerCap: "",
        customerProvince: "",
      });
      toast({
        title: t("remoteRequests.readyForShipment"),
        description: t("remote.ilClienteStatoNotificatoEPuProcedereCon"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const receivedMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/received`, {});
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs"] });
      toast({
        title: t("remoteRequests.deviceReceived"),
        description: data.repairOrders?.length ? (data.repairOrders.length === 1 ? t("remoteRequests.repairsCreated", { count: data.repairOrders.length }) : t("remoteRequests.repairsCreatedPlural", { count: data.repairOrders.length })) : t("remoteRequests.deviceMarkedReceived"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forceReceivedMutation = useMutation({
    mutationFn: async ({ id, centerNotes }: { id: string; centerNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/force-received`, { centerNotes });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/repairs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests/pending-count"] });
      setIsForceReceivedOpen(false);
      setSelectedRequest(null);
      setForceReceivedNotes("");
      toast({
        title: t("remoteRequests.receptionConfirmed"),
        description: data.repairOrders?.length ? (data.repairOrders.length === 1 ? t("remoteRequests.repairsCreated", { count: data.repairOrders.length }) : t("remoteRequests.repairsCreatedPlural", { count: data.repairOrders.length })) : t("remoteRequests.forcedReceptionSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/repair-center/remote-requests/${id}/cancel`, { cancellationReason: reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/remote-requests/pending-count"] });
      setIsCancelOpen(false);
      setSelectedRequest(null);
      setCancellationReason("");
      toast({
        title: t("remoteRequests.requestCancelled"),
        description: t("remote.laRichiestaStataAnnullata"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openRejectDialog = (request: RemoteRepairRequest) => {
    setSelectedRequest(request);
    setIsRejectOpen(true);
  };

  const openReadyDialog = (request: RemoteRepairRequest) => {
    setSelectedRequest(request);
    setIsReadyOpen(true);
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      rejectMutation.mutate({ id: selectedRequest.id, reason: rejectionReason });
    }
  };

  const handleReady = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      readyMutation.mutate({ id: selectedRequest.id, data: shippingAddress });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending' || r.status === 'assigned') || [];
  const activeRequests = requests?.filter(r => ['accepted', 'quoted', 'quote_accepted', 'quote_declined', 'awaiting_shipment', 'in_transit'].includes(r.status)) || [];
  const completedRequests = requests?.filter(r => ['received', 'repair_created', 'rejected', 'cancelled'].includes(r.status)) || [];

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Truck className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">{t("sidebar.items.remoteRequests")}</h1>
              <p className="text-emerald-100">{t("remote.gestisciLeRichiesteDiRiparazioneInviateDaiC")}</p>
            </div>
          </div>
        </div>
      </div>

      {requests && requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("remote.nessunaRichiesta")}</h3>
            <p className="text-muted-foreground text-center mt-2">
              Non ci sono richieste di riparazione remota al momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                In Attesa di Risposta ({pendingRequests.length})
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="border-yellow-200" data-testid={`card-pending-${request.id}`}>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg flex flex-wrap items-center gap-2">
                            {request.requestNumber}
                            <Badge {...statusLabels[request.status]}>
                              {statusLabels[request.status]?.label}
                            </Badge>
                            {request.devices?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Smartphone className="h-3 w-3 mr-1" />
                                {request.devices.length} dispositiv{request.devices.length === 1 ? 'o' : 'i'}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Ricevuta il {format(new Date(request.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => openRejectDialog(request)}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rifiuta
                          </Button>
                          <Button
                            onClick={() => acceptMutation.mutate(request.id)}
                            disabled={acceptMutation.isPending}
                            data-testid={`button-accept-${request.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Accetta
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {request.quoteAmount != null && request.quoteAmount > 0 && (
                        <div className="p-3 rounded-md border bg-muted/50 mb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{t("remote.preventivoInviato")}</span>
                              <Badge variant={request.status === 'quote_accepted' ? 'default' : request.status === 'quote_declined' ? 'destructive' : 'outline'} className="text-xs">
                                {request.status === 'quoted' ? 'In attesa risposta' : request.status === 'quote_accepted' ? 'Accettato' : request.status === 'quote_declined' ? 'Rifiutato' : 'Inviato'}
                              </Badge>
                            </div>
                            <p className="text-lg font-bold">{(request.quoteAmount / 100).toFixed(2)} EUR</p>
                          </div>
                          {request.quoteDescription && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Descrizione lavori</p>
                              <p className="text-sm">{request.quoteDescription}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                            {request.quotedAt && <span>{t("remoteRequests.inviatoIl")} {format(new Date(request.quotedAt), "d MMM yyyy, HH:mm", { locale: it })}</span>}
                            {request.quoteValidUntil && <span>{t("remoteRequests.validoFinoAl")} {format(new Date(request.quoteValidUntil), "d MMM yyyy", { locale: it })}</span>}
                          </div>
                          {request.paymentMethod && <p className="text-xs text-muted-foreground mt-1">{t("remoteRequests.pagamento")}: {request.paymentMethod === 'in_store' ? t("remoteRequests.inNegozio") : request.paymentMethod === 'online_stripe' ? 'Stripe' : 'PayPal'} ({request.paymentStatus === 'paid' ? t("remoteRequests.pagato") : t("remoteRequests.inAttesa")})</p>}
                        </div>
                      )}
                      <div className="space-y-3">
                        {request.devices?.map((device) => (
                          <div key={device.id} className="p-3 border rounded-md space-y-2" data-testid={`device-${device.id}`}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">{t("repairs.device")}</p>
                                <p className="text-sm font-medium">{device.deviceType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("remote.marcaModello")}</p>
                                <p className="text-sm font-medium">{device.brand} {device.model}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("common.quantity")}</p>
                                <p className="text-sm font-medium">{device.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("common.status")}</p>
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
                      </div>
                      {request.customerNotes && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">Note cliente</p>
                          <p className="text-sm">{request.customerNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                In Lavorazione ({activeRequests.length})
              </h2>
              <div className="space-y-4">
                {activeRequests.map((request) => (
                  <Card key={request.id} data-testid={`card-active-${request.id}`}>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg flex flex-wrap items-center gap-2">
                            {request.requestNumber}
                            <Badge {...statusLabels[request.status]}>
                              {statusLabels[request.status]?.label}
                            </Badge>
                            {request.devices?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Smartphone className="h-3 w-3 mr-1" />
                                {request.devices.length} dispositiv{request.devices.length === 1 ? 'o' : 'i'}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(request.createdAt), "d MMMM yyyy", { locale: it })}
                          </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {request.status === 'accepted' && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => skipQuoteMutation.mutate(request.id)}
                                disabled={skipQuoteMutation.isPending}
                                data-testid={`button-skip-quote-${request.id}`}
                              >
                                <SkipForward className="h-4 w-4 mr-2" />
                                Salta Preventivo
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsQuoteOpen(true);
                                }}
                                data-testid={`button-send-quote-${request.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Invia Preventivo
                              </Button>
                            </>
                          )}
                          {request.status === 'quoted' && (
                            <>
                              <Badge variant="outline">{t("remoteRequests.inAttesaRispostaCliente")}</Badge>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setQuoteAmount(((request.quoteAmount || 0) / 100).toFixed(2));
                                  setQuoteDescription(request.quoteDescription || "");
                                  setIsQuoteOpen(true);
                                }}
                                data-testid={`button-edit-quote-${request.id}`}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Modifica Preventivo
                              </Button>
                            </>
                          )}
                          {request.status === 'quote_declined' && (
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                setQuoteAmount(((request.quoteAmount || 0) / 100).toFixed(2));
                                setQuoteDescription(request.quoteDescription || "");
                                setIsQuoteOpen(true);
                              }}
                              data-testid={`button-resend-quote-${request.id}`}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Reinvia Preventivo
                            </Button>
                          )}
                          {request.status === 'quote_accepted' && (
                            <Badge variant="default">{t("remote.pagamentoInCorso")}</Badge>
                          )}
                          {request.status === 'awaiting_shipment' && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsCancelOpen(true);
                                }}
                                data-testid={`button-cancel-${request.id}`}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Annulla
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setIsForceReceivedOpen(true);
                                }}
                                data-testid={`button-force-received-${request.id}`}
                              >
                                <PackageCheck className="h-4 w-4 mr-2" />
                                Conferma Manuale
                              </Button>
                            </>
                          )}
                          {request.status === 'in_transit' && (
                            <Button
                              onClick={() => receivedMutation.mutate(request.id)}
                              disabled={receivedMutation.isPending}
                              data-testid={`button-received-${request.id}`}
                            >
                              <PackageCheck className="h-4 w-4 mr-2" />
                              Conferma Ricezione
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("auth.customerTab")}</p>
                          <p className="font-medium">{(request as any).customerName || '-'}</p>
                          {(request as any).customerEmail && (
                            <p className="text-xs text-muted-foreground">{(request as any).customerEmail}</p>
                          )}
                          {(request as any).customerPhone && (
                            <p className="text-xs text-muted-foreground">{(request as any).customerPhone}</p>
                          )}
                        </div>
                      </div>
                      {request.quoteAmount != null && request.quoteAmount > 0 && (
                        <div className="p-3 rounded-md border bg-muted/50 mb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{t("remote.preventivoInviato")}</span>
                              <Badge variant={request.status === 'quote_accepted' ? 'default' : request.status === 'quote_declined' ? 'destructive' : 'outline'} className="text-xs">
                                {request.status === 'quoted' ? 'In attesa risposta' : request.status === 'quote_accepted' ? 'Accettato' : request.status === 'quote_declined' ? 'Rifiutato' : 'Inviato'}
                              </Badge>
                            </div>
                            <p className="text-lg font-bold">{(request.quoteAmount / 100).toFixed(2)} EUR</p>
                          </div>
                          {request.quoteDescription && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Descrizione lavori</p>
                              <p className="text-sm">{request.quoteDescription}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                            {request.quotedAt && <span>{t("remoteRequests.inviatoIl")} {format(new Date(request.quotedAt), "d MMM yyyy, HH:mm", { locale: it })}</span>}
                            {request.quoteValidUntil && <span>{t("remoteRequests.validoFinoAl")} {format(new Date(request.quoteValidUntil), "d MMM yyyy", { locale: it })}</span>}
                          </div>
                          {request.paymentMethod && <p className="text-xs text-muted-foreground mt-1">{t("remoteRequests.pagamento")}: {request.paymentMethod === 'in_store' ? t("remoteRequests.inNegozio") : request.paymentMethod === 'online_stripe' ? 'Stripe' : 'PayPal'} ({request.paymentStatus === 'paid' ? t("remoteRequests.pagato") : t("remoteRequests.inAttesa")})</p>}
                        </div>
                      )}
                      <div className="space-y-3">
                        {request.devices?.map((device) => (
                          <div key={device.id} className="p-3 border rounded-md space-y-2" data-testid={`device-${device.id}`}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">{t("repairs.device")}</p>
                                <p className="text-sm font-medium">{device.deviceType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("remote.marcaModello")}</p>
                                <p className="text-sm font-medium">{device.brand} {device.model}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("common.quantity")}</p>
                                <p className="text-sm font-medium">{device.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("common.status")}</p>
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
                      </div>
                      {request.trackingNumber && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          <p className="text-sm">
                            <span className="font-medium">Tracking:</span> {request.courierName}: {request.trackingNumber}
                          </p>
                        </div>
                      )}
                      {request.customerNotes && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground">Note cliente</p>
                          <p className="text-sm">{request.customerNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Completate ({completedRequests.length})
              </h2>
              <div className="space-y-4">
                {completedRequests.slice(0, 5).map((request) => (
                  <Card key={request.id} className="opacity-75" data-testid={`card-completed-${request.id}`}>
                    <CardHeader className="py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                          {request.devices?.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {request.devices.length} dispositiv{request.devices.length === 1 ? 'o' : 'i'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {request.devices?.map(d => `${d.brand} ${d.model}`).join(', ') || '-'}
                          </span>
                          {request.devices?.some(d => d.repairOrderId && d.status === 'repair_created') && (
                            <Link href={`/repair-center/repairs/${request.devices.find(d => d.repairOrderId)?.repairOrderId}`}>
                              <Button size="sm" variant="outline" data-testid={`button-view-repair-${request.id}`}>
                                Vai alla Lavorazione
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("remoteRequests.rifiutaRichiesta")}</DialogTitle>
            <DialogDescription>
              Indica il motivo del rifiuto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">{t("common.reason")}</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t("remoteRequests.explainRejectionReason")}
                rows={3}
                data-testid="input-rejection-reason"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" variant="destructive" disabled={rejectMutation.isPending} data-testid="button-confirm-reject">
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("transfers.confirmRejection")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReadyOpen} onOpenChange={setIsReadyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("remoteRequests.richiediSpedizione")}</DialogTitle>
            <DialogDescription>
              Inserisci l'indirizzo dove il cliente deve spedire il dispositivo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReady} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerAddress">{t("profile.indirizzo")}</Label>
              <Input
                id="customerAddress"
                value={shippingAddress.customerAddress}
                onChange={(e) => setShippingAddress({ ...shippingAddress, customerAddress: e.target.value })}
                placeholder={t("settings.placeholderAddress")}
                data-testid="input-address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerCap">CAP</Label>
                <Input
                  id="customerCap"
                  value={shippingAddress.customerCap}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, customerCap: e.target.value })}
                  placeholder="00000"
                  data-testid="input-cap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCity">{t("profile.citta")}</Label>
                <Input
                  id="customerCity"
                  value={shippingAddress.customerCity}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, customerCity: e.target.value })}
                  placeholder={t("profile.citta")}
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerProvince">{t("profile.provincia")}</Label>
                <Input
                  id="customerProvince"
                  value={shippingAddress.customerProvince}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, customerProvince: e.target.value })}
                  placeholder="RM"
                  maxLength={2}
                  data-testid="input-province"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="centerNotes">{t("remoteRequests.noteClienteOpzionale")}</Label>
              <Textarea
                id="centerNotes"
                value={shippingAddress.centerNotes}
                onChange={(e) => setShippingAddress({ ...shippingAddress, centerNotes: e.target.value })}
                placeholder={t("remoteRequests.shippingInstructions")}
                rows={2}
                data-testid="input-center-notes"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsReadyOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={readyMutation.isPending} data-testid="button-confirm-ready">
                {readyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("common.confirm")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("remote.annullaRichiesta")}</DialogTitle>
            <DialogDescription>
              Il cliente non ha spedito il dispositivo. Vuoi annullare questa richiesta?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">{t("common.reasonOptional")}</Label>
              <Textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder={t("remoteRequests.placeholderCancellationReason")}
                rows={3}
                data-testid="input-cancellation-reason"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)}>
                {t("common.back")}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedRequest && cancelMutation.mutate({ id: selectedRequest.id, reason: cancellationReason })}
                disabled={cancelMutation.isPending}
                data-testid="button-confirm-cancel"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("transfers.cancelRequestTitle")
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("standalone.sendQuote")}</DialogTitle>
            <DialogDescription>
              Inserisci l'importo e la descrizione del preventivo per il cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedRequest && quoteAmount) {
              quoteMutation.mutate({
                id: selectedRequest.id,
                quoteAmount: Math.round(parseFloat(quoteAmount) * 100),
                quoteDescription,
                quoteValidDays: parseInt(quoteValidDays) || 7,
              });
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quoteAmount">{t("remote.importoEUR")}</Label>
              <Input
                id="quoteAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder="Es: 150.00"
                required
                data-testid="input-quote-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteDescription">{t("remoteRequests.descrizioneLavori")}</Label>
              <Textarea
                id="quoteDescription"
                value={quoteDescription}
                onChange={(e) => setQuoteDescription(e.target.value)}
                placeholder={t("remoteRequests.describePlannedWork")}
                rows={3}
                data-testid="input-quote-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteValidDays">{t("remote.validitGiorni")}</Label>
              <Input
                id="quoteValidDays"
                type="number"
                min="1"
                max="90"
                value={quoteValidDays}
                onChange={(e) => setQuoteValidDays(e.target.value)}
                data-testid="input-quote-valid-days"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQuoteOpen(false)}>
                {t("profile.cancel")}
              </Button>
              <Button type="submit" disabled={quoteMutation.isPending || !quoteAmount} data-testid="button-confirm-quote">
                {quoteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("remoteRequests.sendQuote")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isForceReceivedOpen} onOpenChange={setIsForceReceivedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("remote.confermaRicezioneManuale")}</DialogTitle>
            <DialogDescription>
              {t("remoteRequests.forceReceivedDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forceReceivedNotes">{t("remoteRequests.noteOpzionale")}</Label>
              <Textarea
                id="forceReceivedNotes"
                value={forceReceivedNotes}
                onChange={(e) => setForceReceivedNotes(e.target.value)}
                placeholder={t("remoteRequests.placeholderForceReceived")}
                rows={3}
                data-testid="input-force-received-notes"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsForceReceivedOpen(false)}>
                {t("common.back")}
              </Button>
              <Button 
                onClick={() => selectedRequest && forceReceivedMutation.mutate({ id: selectedRequest.id, centerNotes: forceReceivedNotes })}
                disabled={forceReceivedMutation.isPending}
                data-testid="button-confirm-force-received"
              >
                {forceReceivedMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("transfers.confirmReception")
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
