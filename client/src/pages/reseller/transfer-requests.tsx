import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Inbox, Send, Clock, CheckCircle, XCircle, 
  Truck, Ban, Eye, PackageCheck, User, Building, Download, History,
  ArrowRightLeft, Package, Search, FileText
} from "lucide-react";
import type { Product, User as UserType } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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

type OverviewData = {
  incoming: TransferRequest[];
  outgoing: TransferRequest[];
  history: TransferRequest[];
  stats: {
    incomingPending: number;
    incomingApproved: number;
    incomingShipped: number;
    outgoingPending: number;
    outgoingShipped: number;
    totalHistory: number;
    isSubReseller: boolean;
  };
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

export default function TransferRequestsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("incoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDecideDialog, setShowDecideDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvedItems, setApprovedItems] = useState<Array<{ id: string; approvedQuantity: number }>>([]);
  const [shippedItems, setShippedItems] = useState<Array<{ id: string; productId: string; shippedQuantity: number }>>([]);
  const [receiveItems, setReceiveItems] = useState<Array<{ id: string; receivedQuantity: number }>>([]);
  const [shipTrackingNumber, setShipTrackingNumber] = useState("");
  const [shipTrackingCarrier, setShipTrackingCarrier] = useState("");

  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/reseller/transfer-requests/overview"],
  });

  const decideMutation = useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      decision: 'approve' | 'reject'; 
      rejectionReason?: string;
      items?: Array<{ id: string; approvedQuantity: number }>;
    }) => {
      return apiRequest("PATCH", `/api/reseller/incoming-transfer-requests/${params.requestId}/decide`, {
        decision: params.decision,
        rejectionReason: params.rejectionReason,
        items: params.items
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/transfer-requests/overview"] });
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
    mutationFn: async (params: { 
      requestId: string; 
      items: Array<{ id: string; productId: string; shippedQuantity: number }>;
      trackingNumber: string;
      trackingCarrier: string;
    }) => {
      return apiRequest("PATCH", `/api/reseller/incoming-transfer-requests/${params.requestId}/ship`, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/transfer-requests/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/incoming-transfer-requests"] });
      toast({ title: "Spedizione registrata", description: "La richiesta è stata contrassegnata come spedita" });
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

  const receiveMutation = useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      items: Array<{ id: string; receivedQuantity: number }>;
    }) => {
      return apiRequest("PATCH", `/api/reseller/sub-reseller/transfer-requests/${params.requestId}/receive`, {
        items: params.items
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/transfer-requests/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      toast({ title: "Merce ricevuta", description: "La ricezione è stata registrata con successo" });
      setShowReceiveDialog(false);
      setSelectedRequest(null);
      setReceiveItems([]);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filterRequests = (requests: TransferRequest[]) => {
    return requests.filter(r => {
      const matchesSearch = searchTerm === "" || 
        r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requester?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.items.some(item => item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const openDecideDialog = (request: TransferRequest) => {
    setSelectedRequest(request);
    setApprovedItems(request.items.map(item => ({ 
      id: item.id, 
      approvedQuantity: item.requestedQuantity 
    })));
    setShowDecideDialog(true);
  };

  const openShipDialog = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShippedItems(request.items.map(item => ({ 
      id: item.id, 
      productId: item.productId,
      shippedQuantity: item.approvedQuantity || item.requestedQuantity 
    })));
    setShowShipDialog(true);
  };

  const openReceiveDialog = (request: TransferRequest) => {
    setSelectedRequest(request);
    setReceiveItems(request.items.map(item => ({ 
      id: item.id, 
      receivedQuantity: item.shippedQuantity || item.approvedQuantity || item.requestedQuantity 
    })));
    setShowReceiveDialog(true);
  };

  const downloadDDT = async (requestId: string) => {
    try {
      const response = await fetch(`/api/transfer-requests/${requestId}/ddt`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Errore download DDT');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DDT-${selectedRequest?.ddtNumber || requestId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, color: "bg-gray-500/20 text-gray-700", icon: Clock };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const renderRequestCard = (request: TransferRequest, type: 'incoming' | 'outgoing' | 'history') => {
    const TypeIcon = requesterTypeLabels[request.requesterType]?.icon || User;
    const typeLabel = requesterTypeLabels[request.requesterType]?.label || request.requesterType;
    
    return (
      <Card key={request.id} className="hover-elevate" data-testid={`card-transfer-${request.id}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium font-mono">{request.requestNumber}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TypeIcon className="h-3 w-3" />
                  <span>{request.requester?.fullName || typeLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {renderStatusBadge(request.status)}
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Prodotti: </span>
              <span className="font-medium">{request.items.length}</span>
              <span className="text-muted-foreground ml-4">Tot. pezzi: </span>
              <span className="font-medium">
                {request.items.reduce((sum, item) => sum + item.requestedQuantity, 0)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Creata: {format(new Date(request.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
            </div>
            {request.ddtNumber && (
              <div className="text-sm">
                <span className="text-muted-foreground">DDT: </span>
                <span className="font-mono">{request.ddtNumber}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => { setSelectedRequest(request); setShowDetailsDialog(true); }}
              data-testid={`button-view-${request.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              Dettagli
            </Button>
            
            {type === 'incoming' && request.status === 'pending' && (
              <Button 
                size="sm"
                onClick={() => openDecideDialog(request)}
                data-testid={`button-decide-${request.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Gestisci
              </Button>
            )}
            
            {type === 'incoming' && request.status === 'approved' && (
              <Button 
                size="sm"
                onClick={() => openShipDialog(request)}
                data-testid={`button-ship-${request.id}`}
              >
                <Truck className="h-4 w-4 mr-1" />
                Spedisci
              </Button>
            )}
            
            {type === 'outgoing' && request.status === 'shipped' && (
              <Button 
                size="sm"
                onClick={() => openReceiveDialog(request)}
                data-testid={`button-receive-${request.id}`}
              >
                <PackageCheck className="h-4 w-4 mr-1" />
                Conferma Ricezione
              </Button>
            )}
            
            {request.ddtNumber && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => downloadDDT(request.id)}
                data-testid={`button-ddt-${request.id}`}
              >
                <Download className="h-4 w-4 mr-1" />
                DDT
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-transfer-requests-loading">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  const incoming = data?.incoming || [];
  const outgoing = data?.outgoing || [];
  const history = data?.history || [];
  const stats = data?.stats;

  return (
    <div className="space-y-6" data-testid="page-transfer-requests">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Interscambio</h1>
        <p className="text-muted-foreground">
          Gestisci le richieste di trasferimento prodotti
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Inbox className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.incomingPending || 0}</p>
                <p className="text-sm text-muted-foreground">In Attesa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.incomingApproved || 0}</p>
                <p className="text-sm text-muted-foreground">Da Spedire</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(stats?.incomingShipped || 0) + (stats?.outgoingShipped || 0)}</p>
                <p className="text-sm text-muted-foreground">In Transito</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <History className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalHistory || 0}</p>
                <p className="text-sm text-muted-foreground">Completate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero, richiedente o prodotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-transfers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filtra per stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="pending">In Attesa</SelectItem>
            <SelectItem value="approved">Approvate</SelectItem>
            <SelectItem value="shipped">Spedite</SelectItem>
            <SelectItem value="received">Ricevute</SelectItem>
            <SelectItem value="rejected">Rifiutate</SelectItem>
            <SelectItem value="cancelled">Annullate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming" className="gap-2" data-testid="tab-incoming">
            <Inbox className="h-4 w-4" />
            In Arrivo
            {(stats?.incomingPending || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">{stats?.incomingPending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2" data-testid="tab-outgoing" disabled={!stats?.isSubReseller}>
            <Send className="h-4 w-4" />
            Inviate
            {(stats?.outgoingPending || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">{stats?.outgoingPending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="tab-history">
            <History className="h-4 w-4" />
            Storico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-4">
          {filterRequests(incoming).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessuna richiesta in arrivo</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterRequests(incoming).map(r => renderRequestCard(r, 'incoming'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4">
          {!stats?.isSubReseller ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Le richieste in uscita sono disponibili solo per i sub-reseller
                </p>
              </CardContent>
            </Card>
          ) : filterRequests(outgoing).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessuna richiesta inviata</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterRequests(outgoing).map(r => renderRequestCard(r, 'outgoing'))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {filterRequests(history).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessun trasferimento completato</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterRequests(history).map(r => renderRequestCard(r, 'history'))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettagli Richiesta {selectedRequest?.requestNumber}</DialogTitle>
            <DialogDescription>
              Informazioni complete sulla richiesta di trasferimento
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Stato</Label>
                  <div className="mt-1">{renderStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo Richiedente</Label>
                  <p className="font-medium">{requesterTypeLabels[selectedRequest.requesterType]?.label}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Richiedente</Label>
                  <p className="font-medium">{selectedRequest.requester?.fullName || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data Richiesta</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}
                  </p>
                </div>
                {selectedRequest.trackingNumber && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Corriere</Label>
                      <p className="font-medium">{selectedRequest.trackingCarrier || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Tracking</Label>
                      <p className="font-mono">{selectedRequest.trackingNumber}</p>
                    </div>
                  </>
                )}
                {selectedRequest.ddtNumber && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">DDT</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono">{selectedRequest.ddtNumber}</span>
                      <Button size="sm" variant="outline" onClick={() => downloadDDT(selectedRequest.id)}>
                        <Download className="h-4 w-4 mr-1" />
                        Scarica
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-muted-foreground">Prodotti Richiesti</Label>
                <div className="mt-2 border rounded-lg divide-y">
                  {selectedRequest.items.map(item => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.product?.name || 'Prodotto sconosciuto'}</p>
                        <p className="text-sm text-muted-foreground">{item.product?.sku}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>Richiesti: <span className="font-medium">{item.requestedQuantity}</span></p>
                        {item.approvedQuantity !== null && (
                          <p>Approvati: <span className="font-medium">{item.approvedQuantity}</span></p>
                        )}
                        {item.shippedQuantity !== null && (
                          <p>Spediti: <span className="font-medium">{item.shippedQuantity}</span></p>
                        )}
                        {item.receivedQuantity !== null && (
                          <p>Ricevuti: <span className="font-medium">{item.receivedQuantity}</span></p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <Label className="text-muted-foreground">Note</Label>
                  <p className="mt-1">{selectedRequest.notes}</p>
                </div>
              )}
              
              {selectedRequest.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground text-red-600">Motivo Rifiuto</Label>
                  <p className="mt-1 text-red-600">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decide Dialog */}
      <Dialog open={showDecideDialog} onOpenChange={setShowDecideDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestisci Richiesta {selectedRequest?.requestNumber}</DialogTitle>
            <DialogDescription>
              Approva o rifiuta la richiesta di trasferimento
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Quantità da approvare per ogni prodotto</Label>
                <div className="mt-2 border rounded-lg divide-y">
                  {selectedRequest.items.map((item, idx) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || 'Prodotto'}</p>
                        <p className="text-sm text-muted-foreground">
                          Richiesti: {item.requestedQuantity}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={item.requestedQuantity}
                        value={approvedItems[idx]?.approvedQuantity || 0}
                        onChange={(e) => {
                          const newItems = [...approvedItems];
                          newItems[idx] = { id: item.id, approvedQuantity: parseInt(e.target.value) || 0 };
                          setApprovedItems(newItems);
                        }}
                        className="w-24"
                        data-testid={`input-approve-qty-${item.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Motivo rifiuto (opzionale)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Inserisci il motivo del rifiuto..."
                  className="mt-1"
                  data-testid="textarea-rejection-reason"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => selectedRequest && decideMutation.mutate({
                requestId: selectedRequest.id,
                decision: 'reject',
                rejectionReason
              })}
              disabled={decideMutation.isPending}
              data-testid="button-reject-request"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rifiuta
            </Button>
            <Button
              onClick={() => selectedRequest && decideMutation.mutate({
                requestId: selectedRequest.id,
                decision: 'approve',
                items: approvedItems
              })}
              disabled={decideMutation.isPending}
              data-testid="button-approve-request"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Spedisci Richiesta {selectedRequest?.requestNumber}</DialogTitle>
            <DialogDescription>
              Inserisci i dati di spedizione
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Corriere</Label>
                  <Input
                    value={shipTrackingCarrier}
                    onChange={(e) => setShipTrackingCarrier(e.target.value)}
                    placeholder="Es. DHL, UPS, BRT..."
                    className="mt-1"
                    data-testid="input-ship-carrier"
                  />
                </div>
                <div>
                  <Label>Numero Tracking</Label>
                  <Input
                    value={shipTrackingNumber}
                    onChange={(e) => setShipTrackingNumber(e.target.value)}
                    placeholder="Numero spedizione..."
                    className="mt-1"
                    data-testid="input-ship-tracking"
                  />
                </div>
              </div>
              
              <div>
                <Label>Quantità da spedire</Label>
                <div className="mt-2 border rounded-lg divide-y">
                  {selectedRequest.items.map((item, idx) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || 'Prodotto'}</p>
                        <p className="text-sm text-muted-foreground">
                          Approvati: {item.approvedQuantity || item.requestedQuantity}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={item.approvedQuantity || item.requestedQuantity}
                        value={shippedItems[idx]?.shippedQuantity || 0}
                        onChange={(e) => {
                          const newItems = [...shippedItems];
                          newItems[idx] = { 
                            id: item.id, 
                            productId: item.productId,
                            shippedQuantity: parseInt(e.target.value) || 0 
                          };
                          setShippedItems(newItems);
                        }}
                        className="w-24"
                        data-testid={`input-ship-qty-${item.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => selectedRequest && shipMutation.mutate({
                requestId: selectedRequest.id,
                items: shippedItems,
                trackingNumber: shipTrackingNumber,
                trackingCarrier: shipTrackingCarrier
              })}
              disabled={shipMutation.isPending}
              data-testid="button-confirm-ship"
            >
              <Truck className="h-4 w-4 mr-1" />
              Conferma Spedizione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Conferma Ricezione {selectedRequest?.requestNumber}</DialogTitle>
            <DialogDescription>
              Conferma le quantità ricevute
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>Quantità ricevute</Label>
                <div className="mt-2 border rounded-lg divide-y">
                  {selectedRequest.items.map((item, idx) => (
                    <div key={item.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name || 'Prodotto'}</p>
                        <p className="text-sm text-muted-foreground">
                          Spediti: {item.shippedQuantity || item.approvedQuantity || item.requestedQuantity}
                        </p>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        max={item.shippedQuantity || item.approvedQuantity || item.requestedQuantity}
                        value={receiveItems[idx]?.receivedQuantity || 0}
                        onChange={(e) => {
                          const newItems = [...receiveItems];
                          newItems[idx] = { 
                            id: item.id, 
                            receivedQuantity: parseInt(e.target.value) || 0 
                          };
                          setReceiveItems(newItems);
                        }}
                        className="w-24"
                        data-testid={`input-receive-qty-${item.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => selectedRequest && receiveMutation.mutate({
                requestId: selectedRequest.id,
                items: receiveItems
              })}
              disabled={receiveMutation.isPending}
              data-testid="button-confirm-receive"
            >
              <PackageCheck className="h-4 w-4 mr-1" />
              Conferma Ricezione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
