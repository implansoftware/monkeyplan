import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, CheckCircle, XCircle, Truck, Ban, Eye, PackageCheck, 
  Download, History, Package, Search, ListFilter, Send
} from "lucide-react";
import type { Product } from "@shared/schema";
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
  targetResellerName?: string;
};

type OverviewData = {
  active: TransferRequest[];
  history: TransferRequest[];
  stats: {
    pending: number;
    approved: number;
    shipped: number;
    totalHistory: number;
    totalActive: number;
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

export default function RepairCenterTransferRequestsOverviewPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [receiveItems, setReceiveItems] = useState<Array<{ id: string; receivedQuantity: number }>>([]);

  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/repair-center/transfer-requests/overview"],
  });

  const receiveMutation = useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      items: Array<{ id: string; receivedQuantity: number }>;
    }) => {
      return apiRequest("PATCH", `/api/repair-center/transfer-requests/${params.requestId}/receive`, {
        items: params.items
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/transfer-requests/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/transfer-requests"] });
      toast({ title: "Merce ricevuta", description: "La ricezione è stata registrata con successo" });
      setShowReceiveDialog(false);
      setSelectedRequest(null);
      setReceiveItems([]);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return apiRequest("PATCH", `/api/repair-center/transfer-requests/${requestId}/cancel`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/transfer-requests/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/transfer-requests"] });
      toast({ title: "Richiesta annullata", description: "La richiesta è stata annullata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filterRequests = (requests: TransferRequest[]) => {
    return requests.filter(r => {
      const matchesSearch = searchTerm === "" || 
        r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.items.some(item => item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
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

  const renderRequestCard = (request: TransferRequest) => {
    return (
      <Card key={request.id} className="hover-elevate" data-testid={`card-rc-transfer-${request.id}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium font-mono">{request.requestNumber}</p>
                <div className="text-sm text-muted-foreground">
                  Da: {request.sourceWarehouse?.name || 'Magazzino'}
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
            {request.trackingNumber && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tracking: </span>
                <span className="font-mono">{request.trackingCarrier} - {request.trackingNumber}</span>
              </div>
            )}
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
              data-testid={`button-rc-view-${request.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              Dettagli
            </Button>
            
            {request.status === 'pending' && (
              <Button 
                size="sm"
                variant="destructive"
                onClick={() => cancelMutation.mutate(request.id)}
                disabled={cancelMutation.isPending}
                data-testid={`button-rc-cancel-${request.id}`}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Annulla
              </Button>
            )}
            
            {request.status === 'shipped' && (
              <Button 
                size="sm"
                onClick={() => openReceiveDialog(request)}
                data-testid={`button-rc-receive-${request.id}`}
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
                data-testid={`button-rc-ddt-${request.id}`}
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
      <div className="space-y-6" data-testid="page-rc-transfers-loading">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  const active = data?.active || [];
  const history = data?.history || [];
  const stats = data?.stats;

  return (
    <div className="space-y-6" data-testid="page-rc-transfer-requests">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Le Mie Richieste</h1>
        <p className="text-muted-foreground">
          Visualizza lo stato delle tue richieste di trasferimento prodotti
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
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
                <p className="text-2xl font-bold">{stats?.approved || 0}</p>
                <p className="text-sm text-muted-foreground">Approvate</p>
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
                <p className="text-2xl font-bold">{stats?.shipped || 0}</p>
                <p className="text-sm text-muted-foreground">In Arrivo</p>
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
            placeholder="Cerca per numero o prodotto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-rc-search-transfers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-rc-status-filter">
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="gap-2" data-testid="tab-rc-active">
            <Send className="h-4 w-4" />
            Attive
            {(stats?.totalActive || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">{stats?.totalActive}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="tab-rc-history">
            <History className="h-4 w-4" />
            Storico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {filterRequests(active).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nessuna richiesta attiva</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filterRequests(active).map(request => renderRequestCard(request))}
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
              {filterRequests(history).map(request => renderRequestCard(request))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Dettagli Richiesta {selectedRequest?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stato:</span>
                  <div className="mt-1">{renderStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Magazzino Origine:</span>
                  <p className="font-medium">{selectedRequest.sourceWarehouse?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Creata il:</span>
                  <p className="font-medium">{format(new Date(selectedRequest.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
                {selectedRequest.trackingNumber && (
                  <div>
                    <span className="text-muted-foreground">Tracking:</span>
                    <p className="font-mono">{selectedRequest.trackingCarrier} - {selectedRequest.trackingNumber}</p>
                  </div>
                )}
                {selectedRequest.ddtNumber && (
                  <div>
                    <span className="text-muted-foreground">DDT:</span>
                    <p className="font-mono">{selectedRequest.ddtNumber}</p>
                  </div>
                )}
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Note:</span>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedRequest.notes}</p>
                </div>
              )}
              
              {selectedRequest.rejectionReason && (
                <div>
                  <span className="text-sm text-muted-foreground">Motivo Rifiuto:</span>
                  <p className="text-sm mt-1 p-2 bg-red-50 dark:bg-red-900/20 rounded text-red-700 dark:text-red-300">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Prodotti</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">Prodotto</th>
                        <th className="text-right p-2">Richiesti</th>
                        <th className="text-right p-2">Approvati</th>
                        <th className="text-right p-2">Spediti</th>
                        <th className="text-right p-2">Ricevuti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">
                            <span className="font-medium">{item.product?.name || 'Prodotto'}</span>
                            <span className="text-muted-foreground text-xs ml-2">{item.product?.sku}</span>
                          </td>
                          <td className="text-right p-2">{item.requestedQuantity}</td>
                          <td className="text-right p-2">{item.approvedQuantity ?? '-'}</td>
                          <td className="text-right p-2">{item.shippedQuantity ?? '-'}</td>
                          <td className="text-right p-2">{item.receivedQuantity ?? '-'}</td>
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

      {/* Receive Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conferma Ricezione</DialogTitle>
            <DialogDescription>
              Conferma le quantità ricevute per {selectedRequest?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Prodotto</th>
                      <th className="text-right p-2">Spediti</th>
                      <th className="text-right p-2">Ricevuti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequest.items.map((item, idx) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.product?.name || 'Prodotto'}</td>
                        <td className="text-right p-2">{item.shippedQuantity || item.approvedQuantity || item.requestedQuantity}</td>
                        <td className="text-right p-2">
                          <Input
                            type="number"
                            min={0}
                            max={item.shippedQuantity || item.approvedQuantity || item.requestedQuantity}
                            value={receiveItems[idx]?.receivedQuantity || 0}
                            onChange={(e) => {
                              const newItems = [...receiveItems];
                              newItems[idx] = { ...newItems[idx], receivedQuantity: parseInt(e.target.value) || 0 };
                              setReceiveItems(newItems);
                            }}
                            className="w-20 h-8 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => selectedRequest && receiveMutation.mutate({ 
                requestId: selectedRequest.id,
                items: receiveItems
              })}
              disabled={receiveMutation.isPending}
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
