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
import { useState, useMemo } from "react";
import { 
  Inbox, Send, Clock, CheckCircle, XCircle, 
  Truck, Ban, Eye, PackageCheck, User, Building, Download, History,
  ArrowRightLeft, Package, Search, FileText, Plus, Warehouse, 
  Smartphone, ShoppingBag, Wrench, ArrowLeft, ArrowRight
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

  // New request wizard state (for sub-resellers)
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState("");

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

  // Search products for new request wizard (sub-resellers only)
  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (productSearch.trim()) params.set("query", productSearch.trim());
    if (productTypeFilter !== "all") params.set("productType", productTypeFilter);
    return params.toString();
  }, [productSearch, productTypeFilter]);

  const { data: searchResults = [], isLoading: isSearching } = useQuery<ProductWithStock[]>({
    queryKey: ["/api/reseller/sub-reseller/transfer-requests/search-products", searchParams],
    queryFn: async () => {
      const url = searchParams 
        ? `/api/reseller/sub-reseller/transfer-requests/search-products?${searchParams}`
        : "/api/reseller/sub-reseller/transfer-requests/search-products";
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
      return apiRequest("POST", "/api/reseller/sub-reseller/transfer-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/sub-reseller/transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/transfer-requests/overview"] });
      toast({ title: "Richiesta Inviata", description: "La richiesta di interscambio è stata inviata al reseller padre" });
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
      <Card key={request.id} className="rounded-2xl hover-elevate" data-testid={`card-transfer-${request.id}`}>
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
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <ArrowRightLeft className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Interscambio</h1>
              <p className="text-sm text-white/80">Gestisci le richieste di trasferimento prodotti</p>
            </div>
          </div>
          {stats?.isSubReseller && (
            <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg" onClick={() => setShowNewRequestDialog(true)} data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Richiesta
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
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
        <Card className="rounded-2xl">
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
        <Card className="rounded-2xl">
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
        <Card className="rounded-2xl">
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
            Ricevute
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
                <p className="text-muted-foreground">Nessuna richiesta ricevuta</p>
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
                    <div key={item.id} className="p-3 flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.product?.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.product?.name || 'Prodotto sconosciuto'}</p>
                        <p className="text-sm text-muted-foreground">{item.product?.sku}</p>
                      </div>
                      <div className="text-right text-sm flex-shrink-0">
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
                    <div key={item.id} className="p-3 flex items-center gap-3">
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
                        <p className="font-medium truncate">{item.product?.name || 'Prodotto'}</p>
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

      {/* New Request Dialog (Sub-resellers only) */}
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
              <div key={step} className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cerca prodotto per nome, SKU o marca..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                      data-testid="input-product-search"
                    />
                  </div>
                  <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                    <SelectTrigger className="w-[160px]" data-testid="select-product-type">
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
                          data-testid={`card-product-${item.product.id}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{item.product.sku}</span>
                                  {item.product.brand && <span>| {item.product.brand}</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary">
                                  {totalStock} disponibili
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Array.from(new Set(item.warehouses.map(w => w.ownerName))).filter(Boolean).join(', ') || `${item.warehouses.length} magazzin${item.warehouses.length === 1 ? 'o' : 'i'}`}
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
                    <div className="flex items-center gap-3">
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
                      data-testid={`card-warehouse-${wh.warehouseId}`}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-3">
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
                    data-testid="input-request-quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Note (opzionale)</Label>
                  <Textarea
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Note aggiuntive per la richiesta..."
                    data-testid="input-request-notes"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {wizardStep > 1 && (
              <Button variant="outline" onClick={() => setWizardStep(wizardStep - 1)} data-testid="button-wizard-back">
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
                data-testid="button-wizard-next-1"
              >
                Avanti
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            {wizardStep === 2 && (
              <Button
                onClick={() => setWizardStep(3)}
                disabled={!selectedWarehouse}
                data-testid="button-wizard-next-2"
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
                data-testid="button-submit-request"
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
