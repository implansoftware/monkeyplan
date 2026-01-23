import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, Truck, Package, Eye, MapPin, Calendar, 
  Plus, Navigation, CheckCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrderShipment } from "@shared/schema";

const statusLabels: Record<string, string> = {
  pending: "In preparazione",
  picked_up: "Ritirato",
  in_transit: "In transito",
  out_for_delivery: "In consegna",
  delivered: "Consegnato",
  failed_attempt: "Tentativo fallito",
  returned: "Reso",
  lost: "Smarrito"
};

const statusColors: Record<string, string> = {
  pending: "secondary",
  picked_up: "default",
  in_transit: "default",
  out_for_delivery: "default",
  delivered: "default",
  failed_attempt: "destructive",
  returned: "destructive",
  lost: "destructive"
};

const carriers = [
  { value: "brt", label: "BRT" },
  { value: "dhl", label: "DHL" },
  { value: "ups", label: "UPS" },
  { value: "gls", label: "GLS" },
  { value: "tnt", label: "TNT" },
  { value: "poste", label: "Poste Italiane" },
  { value: "fedex", label: "FedEx" },
  { value: "sda", label: "SDA" },
  { value: "altro", label: "Altro" }
];

export default function ResellerShipments() {
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<SalesOrderShipment | null>(null);
  
  const [newShipment, setNewShipment] = useState({
    orderId: "",
    carrier: "",
    trackingNumber: "",
    notes: ""
  });
  
  const [newTrackingEvent, setNewTrackingEvent] = useState({
    status: "",
    location: "",
    description: ""
  });
  
  const { data: shipments, isLoading } = useQuery<SalesOrderShipment[]>({
    queryKey: ['/api/shipments', { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      const res = await fetch(`/api/shipments?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento spedizioni');
      return res.json();
    }
  });
  
  const { data: trackingEvents } = useQuery({
    queryKey: ['/api/shipments', selectedShipment?.id, 'tracking'],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/${selectedShipment?.id}/tracking`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Errore nel caricamento tracking');
      return res.json();
    },
    enabled: !!selectedShipment
  });
  
  const createShipment = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/shipments', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      toast({ title: "Spedizione creata" });
      setShowCreateDialog(false);
      setNewShipment({ orderId: "", carrier: "", trackingNumber: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const addTrackingEvent = useMutation({
    mutationFn: async ({ shipmentId, event }: { shipmentId: string; event: any }) => {
      return await apiRequest('POST', `/api/shipments/${shipmentId}/tracking`, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shipments', selectedShipment?.id, 'tracking'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shipments'] });
      toast({ title: "Evento tracciamento aggiunto" });
      setNewTrackingEvent({ status: "", location: "", description: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredShipments = shipments?.filter(shipment => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (!shipment.trackingNumber?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (statusFilter && statusFilter !== "all" && shipment.status !== statusFilter) {
      return false;
    }
    return true;
  }) || [];
  
  const openTrackingDialog = (shipment: SalesOrderShipment) => {
    setSelectedShipment(shipment);
    setShowTrackingDialog(true);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-shipments-title">Spedizioni</h1>
              <p className="text-white/80 text-sm">Tracciamento e gestione spedizioni</p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-shipment" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Nuova spedizione
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero tracking..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {filteredShipments.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nessuna spedizione trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Corriere</TableHead>
                  <TableHead>Data spedizione</TableHead>
                  <TableHead>Data consegna stimata</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id} data-testid={`row-shipment-${shipment.id}`}>
                    <TableCell className="font-mono" data-testid={`text-tracking-${shipment.id}`}>
                      {shipment.trackingNumber || "-"}
                    </TableCell>
                    <TableCell>
                      {carriers.find(c => c.value === shipment.carrier)?.label || shipment.carrier}
                    </TableCell>
                    <TableCell>{formatDate(shipment.pickedUpAt)}</TableCell>
                    <TableCell>{formatDate(shipment.estimatedDelivery)}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[shipment.status] as any || "secondary"}>
                        {statusLabels[shipment.status] || shipment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTrackingDialog(shipment)}
                          data-testid={`button-track-${shipment.id}`}
                        >
                          <Navigation className="mr-2 h-4 w-4" />
                          Traccia
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova spedizione</DialogTitle>
            <DialogDescription>Crea una nuova spedizione per un ordine</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ID Ordine</Label>
              <Input
                value={newShipment.orderId}
                onChange={(e) => setNewShipment({ ...newShipment, orderId: e.target.value })}
                placeholder="ID dell'ordine"
                data-testid="input-order-id"
              />
            </div>
            <div className="space-y-2">
              <Label>Corriere</Label>
              <Select 
                value={newShipment.carrier} 
                onValueChange={(value) => setNewShipment({ ...newShipment, carrier: value })}
              >
                <SelectTrigger data-testid="select-carrier">
                  <SelectValue placeholder="Seleziona corriere" />
                </SelectTrigger>
                <SelectContent>
                  {carriers.map((carrier) => (
                    <SelectItem key={carrier.value} value={carrier.value}>
                      {carrier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Numero tracking</Label>
              <Input
                value={newShipment.trackingNumber}
                onChange={(e) => setNewShipment({ ...newShipment, trackingNumber: e.target.value })}
                placeholder="Numero di tracking"
                data-testid="input-tracking-number"
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={newShipment.notes}
                onChange={(e) => setNewShipment({ ...newShipment, notes: e.target.value })}
                placeholder="Note opzionali..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => createShipment.mutate(newShipment)}
              disabled={!newShipment.orderId || !newShipment.carrier || createShipment.isPending}
            >
              Crea spedizione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tracciamento spedizione</DialogTitle>
            <DialogDescription>
              {selectedShipment?.trackingNumber && (
                <span className="font-mono">{selectedShipment.trackingNumber}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedShipment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Corriere:</span>{" "}
                  {carriers.find(c => c.value === selectedShipment.carrier)?.label}
                </div>
                <div>
                  <span className="text-muted-foreground">Stato:</span>{" "}
                  <Badge variant={statusColors[selectedShipment.status] as any}>
                    {statusLabels[selectedShipment.status]}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Data spedizione:</span>{" "}
                  {formatDate(selectedShipment.pickedUpAt)}
                </div>
                <div>
                  <span className="text-muted-foreground">Consegna stimata:</span>{" "}
                  {formatDate(selectedShipment.estimatedDelivery)}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Aggiungi evento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stato</Label>
                    <Select
                      value={newTrackingEvent.status}
                      onValueChange={(value) => setNewTrackingEvent({ ...newTrackingEvent, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona stato" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Località</Label>
                    <Input
                      value={newTrackingEvent.location}
                      onChange={(e) => setNewTrackingEvent({ ...newTrackingEvent, location: e.target.value })}
                      placeholder="Es: Milano Hub"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrizione</Label>
                  <Textarea
                    value={newTrackingEvent.description}
                    onChange={(e) => setNewTrackingEvent({ ...newTrackingEvent, description: e.target.value })}
                    placeholder="Descrizione evento..."
                    rows={2}
                  />
                </div>
                <Button
                  onClick={() => addTrackingEvent.mutate({ 
                    shipmentId: selectedShipment.id, 
                    event: newTrackingEvent 
                  })}
                  disabled={!newTrackingEvent.status || addTrackingEvent.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Aggiungi evento
                </Button>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Cronologia eventi</h4>
                {Array.isArray(trackingEvents) && trackingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {(trackingEvents as any[]).map((event: any, index: number) => (
                      <div key={event.id || index} className="flex gap-3 p-3 rounded-lg border">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary">
                              {statusLabels[event.status] || event.status}
                            </Badge>
                            {event.location && (
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm">{event.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(event.eventTime)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nessun evento registrato</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
