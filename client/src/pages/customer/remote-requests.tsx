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
import { Loader2, Plus, Package, Truck, Check, X, Clock, Send, Phone, MapPin } from "lucide-react";
import type { RemoteRepairRequest, RepairCenter, DeviceType, DeviceBrand } from "@shared/schema";
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

export default function CustomerRemoteRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RemoteRepairRequest | null>(null);

  const [newRequest, setNewRequest] = useState({
    deviceType: "",
    brand: "",
    model: "",
    imei: "",
    serial: "",
    issueDescription: "",
    customerNotes: "",
    resellerId: user?.resellerId || "",
    requestedCenterId: "",
  });

  const [shippingInfo, setShippingInfo] = useState({
    courierName: "",
    trackingNumber: "",
  });

  const { data: requests, isLoading } = useQuery<RemoteRepairRequest[]>({
    queryKey: ["/api/customer/remote-requests"],
  });

  const { data: repairCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  const { data: deviceTypes } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newRequest & { requestedCenterId: string | null }) => {
      const res = await apiRequest("POST", "/api/customer/remote-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setIsNewRequestOpen(false);
      setNewRequest({
        deviceType: "",
        brand: "",
        model: "",
        imei: "",
        serial: "",
        issueDescription: "",
        customerNotes: "",
        resellerId: user?.resellerId || "",
        requestedCenterId: "",
      });
      toast({
        title: "Richiesta inviata",
        description: "La tua richiesta di riparazione remota è stata inviata con successo",
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
      toast({
        title: "Spedizione confermata",
        description: "I dati della spedizione sono stati salvati",
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

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = {
      ...newRequest,
      requestedCenterId: newRequest.requestedCenterId === "none" || newRequest.requestedCenterId === "" ? null : newRequest.requestedCenterId,
    };
    createMutation.mutate(dataToSend);
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      shippingMutation.mutate({ id: selectedRequest.id, data: shippingInfo });
    }
  };

  const openShippingDialog = (request: RemoteRepairRequest) => {
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

  return (
    <div className="container max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Richieste di Riparazione Remota
          </h1>
          <p className="text-muted-foreground mt-1">
            Richiedi una riparazione senza recarti in negozio
          </p>
        </div>
        <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Richiesta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuova Richiesta di Riparazione</DialogTitle>
              <DialogDescription>
                Compila i dati del dispositivo e descrivi il problema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceType">Tipo Dispositivo</Label>
                  <Select
                    value={newRequest.deviceType}
                    onValueChange={(value) => setNewRequest({ ...newRequest, deviceType: value })}
                  >
                    <SelectTrigger data-testid="select-device-type">
                      <SelectValue placeholder="Seleziona tipo" />
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
                  <Label htmlFor="brand">Marca</Label>
                  <Select
                    value={newRequest.brand}
                    onValueChange={(value) => setNewRequest({ ...newRequest, brand: value })}
                  >
                    <SelectTrigger data-testid="select-brand">
                      <SelectValue placeholder="Seleziona marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceBrands?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.name}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modello</Label>
                <Input
                  id="model"
                  value={newRequest.model}
                  onChange={(e) => setNewRequest({ ...newRequest, model: e.target.value })}
                  placeholder="es. iPhone 14 Pro"
                  data-testid="input-model"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imei">IMEI (opzionale)</Label>
                  <Input
                    id="imei"
                    value={newRequest.imei}
                    onChange={(e) => setNewRequest({ ...newRequest, imei: e.target.value })}
                    placeholder="IMEI del dispositivo"
                    data-testid="input-imei"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial">Seriale (opzionale)</Label>
                  <Input
                    id="serial"
                    value={newRequest.serial}
                    onChange={(e) => setNewRequest({ ...newRequest, serial: e.target.value })}
                    placeholder="Numero di serie"
                    data-testid="input-serial"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="issueDescription">Descrizione Problema</Label>
                <Textarea
                  id="issueDescription"
                  value={newRequest.issueDescription}
                  onChange={(e) => setNewRequest({ ...newRequest, issueDescription: e.target.value })}
                  placeholder="Descrivi il problema del dispositivo in dettaglio..."
                  rows={4}
                  data-testid="input-issue-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerNotes">Note Aggiuntive (opzionale)</Label>
                <Textarea
                  id="customerNotes"
                  value={newRequest.customerNotes}
                  onChange={(e) => setNewRequest({ ...newRequest, customerNotes: e.target.value })}
                  placeholder="Altre informazioni utili..."
                  rows={2}
                  data-testid="input-customer-notes"
                />
              </div>
              {repairCenters && repairCenters.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="requestedCenterId">Centro di Riparazione Preferito (opzionale)</Label>
                  <Select
                    value={newRequest.requestedCenterId}
                    onValueChange={(value) => setNewRequest({ ...newRequest, requestedCenterId: value })}
                  >
                    <SelectTrigger data-testid="select-repair-center">
                      <SelectValue placeholder="Nessuna preferenza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nessuna preferenza</SelectItem>
                      {repairCenters.map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name} - {center.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-request">
                  {createMutation.isPending ? (
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
                      <span data-testid={`text-request-number-${request.id}`}>
                        {request.requestNumber}
                      </span>
                      <Badge {...statusLabels[request.status]} data-testid={`badge-status-${request.id}`}>
                        {statusLabels[request.status]?.label || request.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Creata il {format(new Date(request.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </CardDescription>
                  </div>
                  {request.status === 'awaiting_shipment' && (
                    <Button onClick={() => openShippingDialog(request)} data-testid={`button-ship-${request.id}`}>
                      <Truck className="h-4 w-4 mr-2" />
                      Invia Dati Spedizione
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  <div>
                    <p className="text-sm text-muted-foreground">Stato</p>
                    <p className="font-medium flex items-center gap-1">
                      {request.status === 'pending' && <Clock className="h-4 w-4 text-yellow-500" />}
                      {request.status === 'accepted' && <Check className="h-4 w-4 text-green-500" />}
                      {request.status === 'rejected' && <X className="h-4 w-4 text-red-500" />}
                      {request.status === 'in_transit' && <Truck className="h-4 w-4 text-blue-500" />}
                      {statusLabels[request.status]?.label || request.status}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Problema</p>
                  <p className="text-sm">{request.issueDescription}</p>
                </div>
                {request.rejectionReason && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm text-muted-foreground">Motivo Rifiuto</p>
                    <p className="text-sm text-destructive">{request.rejectionReason}</p>
                  </div>
                )}
                {request.trackingNumber && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">Tracking</p>
                    <p className="font-medium">{request.courierName}: {request.trackingNumber}</p>
                  </div>
                )}
                {request.customerAddress && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Indirizzo di Spedizione
                    </p>
                    <p className="text-sm">
                      {request.customerAddress}, {request.customerCap} {request.customerCity} ({request.customerProvince})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dati Spedizione</DialogTitle>
            <DialogDescription>
              Inserisci i dati del corriere e il numero di tracking
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courierName">Nome Corriere</Label>
              <Input
                id="courierName"
                value={shippingInfo.courierName}
                onChange={(e) => setShippingInfo({ ...shippingInfo, courierName: e.target.value })}
                placeholder="es. BRT, DHL, GLS..."
                data-testid="input-courier-name"
              />
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
              <Button type="button" variant="outline" onClick={() => setIsShippingOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={shippingMutation.isPending} data-testid="button-confirm-shipping">
                {shippingMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Conferma Spedizione"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
