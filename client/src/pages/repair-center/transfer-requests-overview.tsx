import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, CheckCircle, XCircle, Truck, Ban, Eye, PackageCheck, 
  Download, History, Package, Search, ListFilter, Send, ArrowLeftRight,
  Plus, Smartphone, Wrench, ShoppingBag, Warehouse, ArrowRight, ArrowLeft
} from "lucide-react";
import type { Product } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type ProductWithStock = {
  product: Product;
  productType: string;
  warehouses: Array<{
    warehouseId: string;
    warehouseName: string;
    ownerType: string;
    ownerId: string;
    ownerName: string;
    quantity: number;
  }>;
};

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
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [receiveItems, setReceiveItems] = useState<Array<{ id: string; receivedQuantity: number }>>([]);

  // Wizard state for new request
  const [wizardStep, setWizardStep] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState("");

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

  // Search products for new request wizard
  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (productSearch.trim()) params.set("query", productSearch.trim());
    if (productTypeFilter !== "all") params.set("productType", productTypeFilter);
    return params.toString();
  }, [productSearch, productTypeFilter]);

  const { data: searchResults = [], isLoading: isSearching } = useQuery<ProductWithStock[]>({
    queryKey: ["/api/repair-center/transfer-requests/search-products", searchParams],
    queryFn: async () => {
      const url = searchParams 
        ? `/api/repair-center/transfer-requests/search-products?${searchParams}`
        : "/api/repair-center/transfer-requests/search-products";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: showNewRequestDialog && wizardStep === 1,
  });

  const resetWizard = () => {
    setWizardStep(1);
    setProductSearch("");
    setProductTypeFilter("all");
    setSelectedProduct(null);
    setSelectedWarehouse("");
    setRequestQuantity(1);
    setRequestNotes("");
  };

  const createRequestMutation = useMutation({
    mutationFn: async (data: { notes: string; sourceWarehouseId: string; items: Array<{ productId: string; quantity: number }> }) => {
      return apiRequest("POST", "/api/repair-center/transfer-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/transfer-requests/overview"] });
      toast({ title: "Richiesta Inviata", description: "La richiesta di interscambio è stata inviata al reseller" });
      setShowNewRequestDialog(false);
      resetWizard();
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
            <div className="flex flex-wrap items-center gap-3">
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
            <div className="flex flex-wrap items-center gap-2">
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <ArrowLeftRight className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Overview Trasferimenti</h1>
              <p className="text-emerald-100">
                Visualizza lo stato delle tue richieste di trasferimento prodotti
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" variant="outline" onClick={() => setShowNewRequestDialog(true)} data-testid="button-rc-new-request">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Richiesta
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
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
            <div className="flex flex-wrap items-center gap-3">
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
            <div className="flex flex-wrap items-center gap-3">
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
            <div className="flex flex-wrap items-center gap-3">
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

      <div className="flex flex-wrap items-center gap-4 flex-wrap">
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
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-rc-status-filter">
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
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Package className="h-5 w-5" />
              Dettagli Richiesta {selectedRequest?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                            <div className="flex flex-wrap items-center gap-3">
                              {item.product?.imageUrl ? (
                                <img 
                                  src={item.product.imageUrl} 
                                  alt={item.product?.name || "Prodotto"} 
                                  className="w-10 h-10 object-cover rounded-md border"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                  <Package className="w-5 h-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <span className="font-medium">{item.product?.name || 'Prodotto'}</span>
                                {item.product?.sku && (
                                  <span className="text-muted-foreground text-xs block">SKU: {item.product.sku}</span>
                                )}
                              </div>
                            </div>
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
                        <td className="p-2">
                          <div className="flex flex-wrap items-center gap-3">
                            {item.product?.imageUrl ? (
                              <img 
                                src={item.product.imageUrl} 
                                alt={item.product?.name || "Prodotto"} 
                                className="w-10 h-10 object-cover rounded-md border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">{item.product?.name || 'Prodotto'}</span>
                          </div>
                        </td>
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

      {/* New Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={(open) => {
        setShowNewRequestDialog(open);
        if (!open) resetWizard();
      }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nuova Richiesta Interscambio</DialogTitle>
            <DialogDescription>
              {wizardStep === 1 && "Cerca il prodotto che vuoi richiedere"}
              {wizardStep === 2 && "Seleziona il magazzino da cui richiedere"}
              {wizardStep === 3 && "Conferma quantità e invia richiesta"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-wrap items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  wizardStep === step 
                    ? "bg-primary text-primary-foreground" 
                    : wizardStep > step 
                      ? "bg-green-500 text-white" 
                      : "bg-muted text-muted-foreground"
                }`}>
                  {wizardStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && <div className={`w-12 h-1 ${wizardStep > step ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca prodotto per nome, SKU o marca..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-rc-product-search"
                    />
                  </div>
                  <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-rc-product-type">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      <SelectItem value="ricambio">Ricambi</SelectItem>
                      <SelectItem value="accessorio">Accessori</SelectItem>
                      <SelectItem value="dispositivo">Dispositivi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isSearching && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                )}

                {!isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nessun prodotto disponibile trovato</p>
                    <p className="text-sm">Prova a modificare i criteri di ricerca</p>
                  </div>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="grid gap-2 max-h-[40vh] overflow-y-auto p-1 -m-1">
                    {searchResults.map((item) => {
                      const typeIcon = item.productType === 'dispositivo' ? Smartphone 
                        : item.productType === 'accessorio' ? ShoppingBag : Wrench;
                      const TypeIcon = typeIcon;
                      const totalStock = item.warehouses.reduce((sum, w) => sum + w.quantity, 0);
                      
                      return (
                        <Card 
                          key={item.product.id} 
                          className={`cursor-pointer transition-colors hover-elevate ${
                            selectedProduct?.product.id === item.product.id ? "ring-2 ring-primary" : ""
                          }`}
                          onClick={() => {
                            setSelectedProduct(item);
                            setSelectedWarehouse("");
                            if (item.warehouses.length === 1) {
                              setSelectedWarehouse(item.warehouses[0].warehouseId);
                            }
                          }}
                          data-testid={`card-rc-product-${item.product.id}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                {item.product.imageUrl ? (
                                  <img 
                                    src={item.product.imageUrl} 
                                    alt={item.product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <TypeIcon className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.product.name}</p>
                                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                  <span>{item.product.sku}</span>
                                  {item.product.brand && <span>| {item.product.brand}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary">
                                  {totalStock} disponibili
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Array.from(new Set(item.warehouses.map(w => w.ownerName))).join(', ')}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 2 && selectedProduct && (
              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {selectedProduct.product.imageUrl ? (
                          <img 
                            src={selectedProduct.product.imageUrl} 
                            alt={selectedProduct.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{selectedProduct.product.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedProduct.product.sku}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Label>Seleziona il magazzino sorgente</Label>
                <div className="grid gap-2">
                  {selectedProduct.warehouses.map((wh) => (
                    <Card
                      key={wh.warehouseId}
                      className={`cursor-pointer transition-colors hover-elevate ${
                        selectedWarehouse === wh.warehouseId ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedWarehouse(wh.warehouseId)}
                      data-testid={`card-rc-warehouse-${wh.warehouseId}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-3">
                            <Warehouse className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{wh.warehouseName}</p>
                              <p className="text-sm text-muted-foreground">{wh.ownerName}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-lg px-3">
                            {wh.quantity}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {wizardStep === 3 && selectedProduct && selectedWarehouse && (
              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                        {selectedProduct.product.imageUrl ? (
                          <img 
                            src={selectedProduct.product.imageUrl} 
                            alt={selectedProduct.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{selectedProduct.product.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedProduct.product.sku}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Warehouse className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {selectedProduct.warehouses.find(w => w.warehouseId === selectedWarehouse)?.warehouseName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Disponibili: {selectedProduct.warehouses.find(w => w.warehouseId === selectedWarehouse)?.quantity}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Quantità richiesta</Label>
                  <Input
                    type="number"
                    min={1}
                    max={selectedProduct.warehouses.find(w => w.warehouseId === selectedWarehouse)?.quantity || 1}
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(parseInt(e.target.value) || 1)}
                    data-testid="input-rc-request-quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Note (opzionale)</Label>
                  <Textarea
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Note aggiuntive per la richiesta..."
                    data-testid="input-rc-request-notes"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {wizardStep > 1 && (
              <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)} data-testid="button-rc-wizard-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Indietro
              </Button>
            )}
            {wizardStep === 1 && (
              <Button variant="outline" onClick={() => {
                setShowNewRequestDialog(false);
                resetWizard();
              }}>
                Annulla
              </Button>
            )}
            {wizardStep === 1 && (
              <Button
                onClick={() => setWizardStep(2)}
                disabled={!selectedProduct}
                data-testid="button-rc-wizard-next-1"
              >
                Avanti
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {wizardStep === 2 && (
              <Button
                onClick={() => setWizardStep(3)}
                disabled={!selectedWarehouse}
                data-testid="button-rc-wizard-next-2"
              >
                Avanti
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {wizardStep === 3 && (
              <Button
                onClick={() => createRequestMutation.mutate({
                  notes: requestNotes,
                  sourceWarehouseId: selectedWarehouse,
                  items: [{ productId: selectedProduct!.product.id, quantity: requestQuantity }]
                })}
                disabled={createRequestMutation.isPending || requestQuantity < 1 || !selectedWarehouse || !selectedProduct}
                data-testid="button-rc-submit-request"
              >
                {createRequestMutation.isPending ? "Invio..." : "Invia Richiesta"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
