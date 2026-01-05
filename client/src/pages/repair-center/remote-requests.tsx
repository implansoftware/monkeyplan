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
import { Loader2, Package, Truck, Check, X, Clock, CheckCircle2, XCircle, PackageCheck, MapPin, Image } from "lucide-react";
import type { RemoteRepairRequest } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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
};

export default function RepairCenterRemoteRequests() {
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
  const [shippingAddress, setShippingAddress] = useState({
    centerNotes: "",
    customerAddress: "",
    customerCity: "",
    customerCap: "",
    customerProvince: "",
  });

  const { data: requests, isLoading } = useQuery<RemoteRepairRequest[]>({
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
        title: "Richiesta accettata",
        description: "La richiesta è stata accettata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
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
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
        title: "Pronto per spedizione",
        description: "Il cliente è stato notificato e può procedere con la spedizione",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
        title: "Dispositivo ricevuto",
        description: data.repairOrder ? `Lavorazione ${data.repairOrder.orderNumber} creata` : "Dispositivo contrassegnato come ricevuto",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
        title: "Ricezione confermata",
        description: data.repairOrder ? `Lavorazione ${data.repairOrder.orderNumber} creata` : "Ricezione forzata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
        title: "Richiesta annullata",
        description: "La richiesta è stata annullata",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
  const activeRequests = requests?.filter(r => ['accepted', 'awaiting_shipment', 'in_transit'].includes(r.status)) || [];
  const completedRequests = requests?.filter(r => ['received', 'repair_created', 'rejected', 'cancelled'].includes(r.status)) || [];

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Richieste di Riparazione Remota
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestisci le richieste di riparazione inviate dai clienti
        </p>
      </div>

      {requests && requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nessuna richiesta</h3>
            <p className="text-muted-foreground text-center mt-2">
              Non ci sono richieste di riparazione remota al momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {request.requestNumber}
                            <Badge {...statusLabels[request.status]}>
                              {statusLabels[request.status]?.label}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Ricevuta il {format(new Date(request.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Dispositivo</p>
                          <p className="font-medium">{request.deviceType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Marca</p>
                          <p className="font-medium">{request.brand}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Modello</p>
                          <p className="font-medium">{request.model}</p>
                        </div>
                        {request.imei && (
                          <div>
                            <p className="text-sm text-muted-foreground">IMEI</p>
                            <p className="font-medium">{request.imei}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Problema</p>
                        <p className="text-sm">{request.issueDescription}</p>
                      </div>
                      {request.photos && request.photos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                            <Image className="h-3 w-3" /> Foto del dispositivo
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {request.photos.map((photo, index) => (
                              <a
                                key={index}
                                href={photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={photo}
                                  alt={`Foto ${index + 1}`}
                                  className="w-24 h-24 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {request.customerNotes && (
                        <div className="mt-2">
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
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {request.requestNumber}
                            <Badge {...statusLabels[request.status]}>
                              {statusLabels[request.status]?.label}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(request.createdAt), "d MMMM yyyy", { locale: it })}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Cliente</p>
                          <p className="font-medium">{request.customerName || '-'}</p>
                          {request.customerEmail && (
                            <p className="text-xs text-muted-foreground">{request.customerEmail}</p>
                          )}
                          {request.customerPhone && (
                            <p className="text-xs text-muted-foreground">{request.customerPhone}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Dispositivo</p>
                          <p className="font-medium">{request.brand} {request.model}</p>
                          {request.imei && (
                            <p className="text-xs text-muted-foreground">IMEI: {request.imei}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Problema</p>
                          <p className="text-sm">{request.issueDescription}</p>
                        </div>
                      </div>
                      {request.trackingNumber && (
                        <div className="mt-3 p-2 bg-muted rounded-md">
                          <p className="text-sm">
                            <span className="font-medium">Tracking:</span> {request.courierName}: {request.trackingNumber}
                          </p>
                        </div>
                      )}
                      {request.photos && request.photos.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-2">Foto dispositivo</p>
                          <div className="flex gap-2 flex-wrap">
                            {request.photos.map((photo: string, index: number) => (
                              <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={photo}
                                  alt={`Foto ${index + 1}`}
                                  className="w-20 h-20 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">
                            {request.brand} {request.model}
                          </span>
                          {request.repairOrderId && request.status === 'repair_created' && (
                            <Link href={`/repair-center/repairs/${request.repairOrderId}`}>
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
            <DialogTitle>Rifiuta Richiesta</DialogTitle>
            <DialogDescription>
              Indica il motivo del rifiuto
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Motivo</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Spiega il motivo del rifiuto..."
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
                  "Conferma Rifiuto"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isReadyOpen} onOpenChange={setIsReadyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Richiedi Spedizione</DialogTitle>
            <DialogDescription>
              Inserisci l'indirizzo dove il cliente deve spedire il dispositivo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReady} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerAddress">Indirizzo</Label>
              <Input
                id="customerAddress"
                value={shippingAddress.customerAddress}
                onChange={(e) => setShippingAddress({ ...shippingAddress, customerAddress: e.target.value })}
                placeholder="Via/Piazza..."
                data-testid="input-address"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
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
                <Label htmlFor="customerCity">Città</Label>
                <Input
                  id="customerCity"
                  value={shippingAddress.customerCity}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, customerCity: e.target.value })}
                  placeholder="Città"
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerProvince">Provincia</Label>
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
              <Label htmlFor="centerNotes">Note per il cliente (opzionale)</Label>
              <Textarea
                id="centerNotes"
                value={shippingAddress.centerNotes}
                onChange={(e) => setShippingAddress({ ...shippingAddress, centerNotes: e.target.value })}
                placeholder="Istruzioni per la spedizione..."
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
                  "Conferma"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annulla Richiesta</DialogTitle>
            <DialogDescription>
              Il cliente non ha spedito il dispositivo. Vuoi annullare questa richiesta?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancellationReason">Motivo (opzionale)</Label>
              <Textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Es: cliente non reperibile, richiesta scaduta..."
                rows={3}
                data-testid="input-cancellation-reason"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)}>
                Indietro
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
                  "Annulla Richiesta"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isForceReceivedOpen} onOpenChange={setIsForceReceivedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Ricezione Manuale</DialogTitle>
            <DialogDescription>
              Usa questa opzione se hai ricevuto il dispositivo ma il cliente non ha inserito i dati di spedizione nel sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forceReceivedNotes">Note (opzionale)</Label>
              <Textarea
                id="forceReceivedNotes"
                value={forceReceivedNotes}
                onChange={(e) => setForceReceivedNotes(e.target.value)}
                placeholder="Es: dispositivo consegnato a mano..."
                rows={3}
                data-testid="input-force-received-notes"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsForceReceivedOpen(false)}>
                Indietro
              </Button>
              <Button 
                onClick={() => selectedRequest && forceReceivedMutation.mutate({ id: selectedRequest.id, centerNotes: forceReceivedNotes })}
                disabled={forceReceivedMutation.isPending}
                data-testid="button-confirm-force-received"
              >
                {forceReceivedMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Conferma Ricezione"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
