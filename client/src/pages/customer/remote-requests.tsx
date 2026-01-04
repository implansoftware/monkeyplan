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
import { Loader2, Plus, Package, Truck, Check, X, Clock, Send, Phone, MapPin, Upload, Image } from "lucide-react";
import type { RemoteRepairRequest, RepairCenter, DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";
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
    brandId: "", // ID for filtering models
    brand: "", // Name for database
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

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const { data: deviceModels } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models"],
  });

  // Filter models by selected brand
  const filteredModels = (deviceModels || []).filter(
    (model) => model.brandId === newRequest.brandId
  );

  const createMutation = useMutation({
    mutationFn: async (data: Omit<typeof newRequest, 'requestedCenterId'> & { requestedCenterId: string | null; photos?: string[] }) => {
      const res = await apiRequest("POST", "/api/customer/remote-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setIsNewRequestOpen(false);
      setNewRequest({
        deviceType: "",
        brandId: "",
        brand: "",
        model: "",
        imei: "",
        serial: "",
        issueDescription: "",
        customerNotes: "",
        resellerId: user?.resellerId || "",
        requestedCenterId: "",
      });
      // Reset photos
      setSelectedPhotos([]);
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
      setPhotoPreviewUrls([]);
      setUploadedPhotoUrls([]);
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({
        title: "Troppi file",
        description: "Puoi caricare al massimo 5 foto",
        variant: "destructive",
      });
      return;
    }
    setSelectedPhotos(files);
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls(urls);
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...selectedPhotos];
    newPhotos.splice(index, 1);
    setSelectedPhotos(newPhotos);
    
    const newUrls = [...photoPreviewUrls];
    URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setPhotoPreviewUrls(newUrls);
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (selectedPhotos.length === 0) return [];
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedPhotos.forEach(photo => {
        formData.append("photos", photo);
      });
      
      const response = await fetch("/api/customer/remote-requests/upload-photos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const { photos } = await response.json();
      return photos;
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First upload photos if any
      let photoUrls: string[] = [];
      if (selectedPhotos.length > 0) {
        photoUrls = await uploadPhotos();
      }
      
      const dataToSend = {
        ...newRequest,
        requestedCenterId: newRequest.requestedCenterId === "none" || newRequest.requestedCenterId === "" ? null : newRequest.requestedCenterId,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
      };
      createMutation.mutate(dataToSend);
    } catch (error: any) {
      toast({
        title: "Errore upload foto",
        description: error.message,
        variant: "destructive",
      });
    }
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
                    value={newRequest.brandId || "none"}
                    onValueChange={(value) => {
                      const selectedBrand = deviceBrands?.find(b => b.id === value);
                      setNewRequest({ 
                        ...newRequest, 
                        brandId: value === "none" ? "" : value,
                        brand: selectedBrand?.name || "", 
                        model: "" 
                      });
                    }}
                  >
                    <SelectTrigger data-testid="select-brand">
                      <SelectValue placeholder="Seleziona marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleziona marca</SelectItem>
                      {deviceBrands?.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modello</Label>
                <Select
                  value={newRequest.model || "none"}
                  onValueChange={(value) => setNewRequest({ ...newRequest, model: value === "none" ? "" : value })}
                  disabled={!newRequest.brandId}
                >
                  <SelectTrigger data-testid="select-model">
                    <SelectValue placeholder={newRequest.brandId ? "Seleziona modello" : "Seleziona prima la marca"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleziona modello</SelectItem>
                    {filteredModels.map((model) => (
                      <SelectItem key={model.id} value={model.modelName}>
                        {model.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label>Foto del Dispositivo (opzionale, max 5)</Label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                      data-testid="input-photos"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover-elevate">
                      <Upload className="h-4 w-4" />
                      <span>Seleziona foto</span>
                    </div>
                  </label>
                  {selectedPhotos.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedPhotos.length} foto selezionate
                    </span>
                  )}
                </div>
                {photoPreviewUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`button-remove-photo-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createMutation.isPending || isUploading} data-testid="button-submit-request">
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
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => window.open(`/api/customer/remote-requests/${request.id}/ddt`, '_blank')}
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
                            data-testid={`img-photo-${request.id}-${index}`}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
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
                {request.status === 'repair_created' && request.repairOrderId && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      La riparazione è stata avviata! Il centro di riparazione sta lavorando al tuo dispositivo.
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
