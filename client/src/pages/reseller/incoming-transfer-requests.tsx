import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Inbox, Package, Search, Clock, CheckCircle, XCircle, 
  Truck, Ban, Eye, PackageCheck, User, Building, FileText, Download
} from "lucide-react";
import type { Product, User as UserType } from "@shared/schema";

type TransferRequestItem = {
  id: string;
  productId: string;
  requestedQuantity: number;
  approvedQuantity: number | null;
  shippedQuantity: number | null;
  receivedQuantity: number | null;
  product: Product | null;
  availableStock?: number;
};

type TransferRequest = {
  id: string;
  requestNumber: string;
  requesterType: 'repair_center' | 'sub_reseller';
  requesterId: string;
  requesterWarehouseId: string;
  sourceWarehouseId: string;
  targetResellerId: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'shipped' | 'received' | 'cancelled';
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  shippedAt: string | null;
  shippedBy: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  ddtNumber: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransferRequestItem[];
  sourceWarehouse?: { id: string; name: string } | null;
  requesterWarehouse?: { id: string; name: string } | null;
  requester?: UserType | null;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "In Attesa", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  approved: { label: "Approvata", color: "bg-blue-500/20 text-blue-700", icon: CheckCircle },
  rejected: { label: "Rifiutata", color: "bg-red-500/20 text-red-700", icon: XCircle },
  shipped: { label: "Spedita", color: "bg-purple-500/20 text-purple-700", icon: Truck },
  received: { label: "Ricevuta", color: "bg-green-500/20 text-green-700", icon: PackageCheck },
  cancelled: { label: "Annullata", color: "bg-gray-500/20 text-gray-700", icon: Ban },
};

const requesterTypeLabels: Record<string, { label: string; icon: any }> = {
  repair_center: { label: "Centro Riparazione", icon: Building },
  sub_reseller: { label: "Sub-Reseller", icon: User },
};

export default function IncomingTransferRequestsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDecideDialog, setShowDecideDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvedItems, setApprovedItems] = useState<Array<{ id: string; approvedQuantity: number }>>([]);
  const [shippedItems, setShippedItems] = useState<Array<{ id: string; productId: string; shippedQuantity: number }>>([]);
  const [shipTrackingNumber, setShipTrackingNumber] = useState("");
  const [shipTrackingCarrier, setShipTrackingCarrier] = useState("");

  const { data: requests = [], isLoading } = useQuery<TransferRequest[]>({
    queryKey: ["/api/reseller/incoming-transfer-requests"],
  });

  const decideMutation = useMutation({
    mutationFn: async (data: { 
      requestId: string; 
      decision: 'approve' | 'reject'; 
      rejectionReason?: string;
      items?: Array<{ id: string; approvedQuantity: number }>;
    }) => {
      return apiRequest("PATCH", `/api/reseller/incoming-transfer-requests/${data.requestId}/decide`, {
        decision: data.decision,
        rejectionReason: data.rejectionReason,
        items: data.items
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/incoming-transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/incoming-transfer-requests/summary"] });
      const action = variables.decision === 'approve' ? 'approvata' : 'rifiutata';
      toast({ title: "Richiesta " + action, description: `La richiesta è stata ${action} con successo` });
      setShowDecideDialog(false);
      setSelectedRequest(null);
      setApprovedItems([]);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async (data: { 
      requestId: string; 
      items: Array<{ id: string; productId: string; shippedQuantity: number }>;
      trackingNumber: string;
      trackingCarrier: string;
    }) => {
      return apiRequest("PATCH", `/api/reseller/incoming-transfer-requests/${data.requestId}/ship`, {
        items: data.items,
        trackingNumber: data.trackingNumber,
        trackingCarrier: data.trackingCarrier
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/incoming-transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/incoming-transfer-requests/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({ title: "Spedizione Confermata", description: "Gli articoli sono stati spediti e il DDT è stato generato automaticamente" });
      setShowShipDialog(false);
      setSelectedRequest(null);
      setShippedItems([]);
      setShipTrackingNumber("");
      setShipTrackingCarrier("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleViewDetails = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleOpenDecide = (request: TransferRequest) => {
    setSelectedRequest(request);
    setApprovedItems(request.items.map(item => ({
      id: item.id,
      approvedQuantity: item.requestedQuantity
    })));
    setShowDecideDialog(true);
  };

  const handleOpenShip = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShippedItems(request.items.map(item => ({
      id: item.id,
      productId: item.productId,
      shippedQuantity: item.approvedQuantity || 0
    })));
    setShowShipDialog(true);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.items.some(item => item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesType = typeFilter === "all" || req.requesterType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header - Modern Glass Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Inbox className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-title">Richieste in Arrivo</h1>
              <p className="text-sm text-white/80">Gestisci le richieste dai centri riparazione e sub-reseller</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                {pendingCount} in attesa
              </Badge>
            )}
            {approvedCount > 0 && (
              <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                {approvedCount} da spedire
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero, richiedente o prodotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-type-filter">
            <SelectValue placeholder="Filtra per tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="repair_center">Centri Riparazione</SelectItem>
            <SelectItem value="sub_reseller">Sub-Reseller</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRequests.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessuna richiesta trovata</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status]?.icon || Clock;
            const TypeInfo = requesterTypeLabels[request.requesterType];
            return (
              <Card key={request.id} className="rounded-2xl" data-testid={`card-request-${request.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <CardTitle className="text-lg">{request.requestNumber}</CardTitle>
                      <Badge className={statusConfig[request.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[request.status]?.label}
                      </Badge>
                      <Badge variant="outline">
                        {TypeInfo && <TypeInfo.icon className="h-3 w-3 mr-1" />}
                        {TypeInfo?.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {request.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenDecide(request)}
                          data-testid={`button-decide-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Gestisci
                        </Button>
                      )}
                      {request.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenShip(request)}
                          data-testid={`button-ship-${request.id}`}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Spedisci
                        </Button>
                      )}
                      {request.status === 'shipped' && request.ddtNumber && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/api/transfer-requests/${request.id}/ddt`, '_blank')}
                          data-testid={`button-ddt-${request.id}`}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          DDT
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(request)}
                        data-testid={`button-details-${request.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Richiedente:</span>{" "}
                      {request.requester?.fullName || request.requester?.username || "N/A"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data:</span>{" "}
                      {new Date(request.createdAt).toLocaleDateString('it-IT')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Articoli:</span>{" "}
                      {request.items.length} prodotti
                    </div>
                    <div>
                      <span className="text-muted-foreground">Destinazione:</span>{" "}
                      {request.requesterWarehouse?.name || "N/A"}
                    </div>
                  </div>
                  {request.notes && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <span className="text-muted-foreground">Note:</span> {request.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Richiesta {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stato:</span>{" "}
                  <Badge className={statusConfig[selectedRequest.status]?.color}>
                    {statusConfig[selectedRequest.status]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Tipo:</span>{" "}
                  {requesterTypeLabels[selectedRequest.requesterType]?.label}
                </div>
                <div>
                  <span className="text-muted-foreground">Richiedente:</span>{" "}
                  {selectedRequest.requester?.fullName || selectedRequest.requester?.username}
                </div>
                <div>
                  <span className="text-muted-foreground">Data Creazione:</span>{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString('it-IT')}
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <Label>Note:</Label>
                  <p className="text-sm mt-1">{selectedRequest.notes}</p>
                </div>
              )}

              <div>
                <Label>Articoli:</Label>
                <div className="mt-2 border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Prodotto</th>
                        <th className="text-center p-2">Richiesto</th>
                        <th className="text-center p-2">Approvato</th>
                        <th className="text-center p-2">Spedito</th>
                        <th className="text-center p-2">Ricevuto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.product?.imageUrl ? (
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{item.product?.name || "Prodotto"}</p>
                                <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-2">{item.requestedQuantity}</td>
                          <td className="text-center p-2">{item.approvedQuantity ?? "-"}</td>
                          <td className="text-center p-2">{item.shippedQuantity ?? "-"}</td>
                          <td className="text-center p-2">{item.receivedQuantity ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDecideDialog} onOpenChange={setShowDecideDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestisci Richiesta - {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Richiesta da: <span className="font-medium text-foreground">
                  {selectedRequest.requester?.fullName || selectedRequest.requester?.username}
                </span> ({requesterTypeLabels[selectedRequest.requesterType]?.label})
              </div>

              <div>
                <Label>Quantità Approvate:</Label>
                <div className="mt-2 space-y-2">
                  {selectedRequest.items.map((item, index) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 p-3 border rounded-md">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.product?.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product?.name || "Prodotto"}</p>
                        <p className="text-sm text-muted-foreground">
                          Richiesto: {item.requestedQuantity} | Disponibile: {item.availableStock ?? "N/A"}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={item.requestedQuantity}
                        value={approvedItems[index]?.approvedQuantity || 0}
                        onChange={(e) => {
                          const updated = [...approvedItems];
                          updated[index] = { 
                            ...updated[index], 
                            approvedQuantity: parseInt(e.target.value) || 0 
                          };
                          setApprovedItems(updated);
                        }}
                        className="w-24"
                        data-testid={`input-approve-${item.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo Rifiuto (opzionale se rifiutata)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Inserisci il motivo del rifiuto..."
                  data-testid="input-rejection-reason"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDecideDialog(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  decideMutation.mutate({
                    requestId: selectedRequest.id,
                    decision: 'reject',
                    rejectionReason
                  });
                }
              }}
              disabled={decideMutation.isPending}
              data-testid="button-reject"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rifiuta
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  decideMutation.mutate({
                    requestId: selectedRequest.id,
                    decision: 'approve',
                    items: approvedItems
                  });
                }
              }}
              disabled={decideMutation.isPending}
              data-testid="button-approve"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Spedisci - {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Corriere *</Label>
                  <Select value={shipTrackingCarrier} onValueChange={setShipTrackingCarrier}>
                    <SelectTrigger data-testid="select-carrier">
                      <SelectValue placeholder="Seleziona corriere" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brt">BRT/Bartolini</SelectItem>
                      <SelectItem value="gls">GLS</SelectItem>
                      <SelectItem value="dhl">DHL</SelectItem>
                      <SelectItem value="ups">UPS</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="poste_italiane">Poste Italiane</SelectItem>
                      <SelectItem value="sda">SDA</SelectItem>
                      <SelectItem value="tnt">TNT</SelectItem>
                      <SelectItem value="other">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tracking">Numero Tracking *</Label>
                  <Input
                    id="tracking"
                    placeholder="es. 1234567890"
                    value={shipTrackingNumber}
                    onChange={(e) => setShipTrackingNumber(e.target.value)}
                    data-testid="input-tracking-number"
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Il numero DDT verrà generato automaticamente alla conferma della spedizione.
              </p>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Quantità da spedire per ogni prodotto:
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedRequest.items.map((item, index) => (
                    <div key={item.id} className="flex flex-wrap items-center gap-3 p-3 border rounded-md">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.product?.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product?.name || "Prodotto"}</p>
                        <p className="text-sm text-muted-foreground">
                          Approvato: {item.approvedQuantity || 0}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={item.approvedQuantity || 0}
                        value={shippedItems[index]?.shippedQuantity || 0}
                        onChange={(e) => {
                          const updated = [...shippedItems];
                          updated[index] = { 
                            ...updated[index], 
                            shippedQuantity: parseInt(e.target.value) || 0 
                          };
                          setShippedItems(updated);
                        }}
                        className="w-24"
                        data-testid={`input-ship-${item.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (!shipTrackingCarrier) {
                  toast({ title: "Errore", description: "Seleziona un corriere", variant: "destructive" });
                  return;
                }
                if (!shipTrackingNumber.trim()) {
                  toast({ title: "Errore", description: "Inserisci il numero di tracking", variant: "destructive" });
                  return;
                }
                if (selectedRequest) {
                  shipMutation.mutate({
                    requestId: selectedRequest.id,
                    items: shippedItems,
                    trackingNumber: shipTrackingNumber.trim(),
                    trackingCarrier: shipTrackingCarrier
                  });
                }
              }}
              disabled={shipMutation.isPending || !shipTrackingCarrier || !shipTrackingNumber.trim()}
              data-testid="button-confirm-ship"
            >
              <Truck className="h-4 w-4 mr-1" />
              {shipMutation.isPending ? "Spedizione..." : "Conferma Spedizione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
