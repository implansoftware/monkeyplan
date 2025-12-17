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
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Truck, Package, Eye, MapPin, Calendar, 
  Plus, Navigation, CheckCircle, Store, Download,
  AlertTriangle, Clock, TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrderShipment, User as UserType } from "@shared/schema";

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

export default function AdminShipments() {
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<SalesOrderShipment | null>(null);
  
  const [newTrackingEvent, setNewTrackingEvent] = useState({
    status: "",
    location: "",
    description: ""
  });
  
  const { data: shipments, isLoading } = useQuery<SalesOrderShipment[]>({
    queryKey: ['/api/admin/shipments', { status: statusFilter, carrier: carrierFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      if (carrierFilter && carrierFilter !== "all") params.set('carrier', carrierFilter);
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
  
  const updateStatus = useMutation({
    mutationFn: async ({ shipmentId, status }: { shipmentId: string; status: string }) => {
      return await apiRequest('PUT', `/api/shipments/${shipmentId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shipments'] });
      toast({ title: "Stato spedizione aggiornato" });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shipments'] });
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
    return true;
  }) || [];
  
  const openTrackingDialog = (shipment: SalesOrderShipment) => {
    setSelectedShipment(shipment);
    setShowTrackingDialog(true);
  };
  
  const handleExport = () => {
    toast({ title: "Export", description: "Funzionalità in arrivo" });
  };
  
  const stats = {
    total: shipments?.length || 0,
    pending: shipments?.filter(s => s.status === 'pending').length || 0,
    inTransit: shipments?.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length || 0,
    delivered: shipments?.filter(s => s.status === 'delivered').length || 0,
    issues: shipments?.filter(s => ['failed_attempt', 'returned', 'lost'].includes(s.status)).length || 0
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-shipments-title">Spedizioni</h1>
          <p className="text-muted-foreground">Monitoraggio di tutte le spedizioni</p>
        </div>
        
        <Button variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Esporta
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="text-2xl font-bold" data-testid="stat-total-shipments">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In preparazione</p>
                <p className="text-2xl font-bold" data-testid="stat-pending-shipments">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Navigation className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In transito</p>
                <p className="text-2xl font-bold" data-testid="stat-transit-shipments">{stats.inTransit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Problemi</p>
                <p className="text-2xl font-bold" data-testid="stat-issues-shipments">{stats.issues}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
        
        <Select value={carrierFilter} onValueChange={setCarrierFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-carrier-filter">
            <Truck className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tutti i corrieri" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i corrieri</SelectItem>
            {carriers.map((carrier) => (
              <SelectItem key={carrier.value} value={carrier.value}>{carrier.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
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
      
      <Card>
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
                  <TableHead>Consegna stimata</TableHead>
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
                      <Badge variant="outline">
                        {carriers.find(c => c.value === shipment.carrier)?.label || shipment.carrier}
                      </Badge>
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
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
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
                  <h4 className="font-semibold">Aggiorna stato</h4>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <Button
                        key={status}
                        variant={selectedShipment.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateStatus.mutate({ shipmentId: selectedShipment.id, status })}
                        disabled={updateStatus.isPending}
                      >
                        {label}
                      </Button>
                    ))}
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
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
