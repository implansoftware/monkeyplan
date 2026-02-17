import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
  Clock, CheckCircle, XCircle, Truck, Ban, Eye, PackageCheck, 
  User, Building, Download, History, Package, Search, ListFilter
} from "lucide-react";
import type { Product } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

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
  requesterName?: string;
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

const statusConfig: Record<string, { labelKey: string; color: string; icon: any }> = {
  pending: { labelKey: "common.pending", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  approved: { labelKey: "common.approved", color: "bg-blue-500/20 text-blue-700", icon: CheckCircle },
  rejected: { labelKey: "common.rejected", color: "bg-red-500/20 text-red-700", icon: XCircle },
  shipped: { labelKey: "common.shipped", color: "bg-purple-500/20 text-purple-700", icon: Truck },
  received: { labelKey: "common.received", color: "bg-green-500/20 text-green-700", icon: PackageCheck },
  cancelled: { labelKey: "common.cancelled", color: "bg-gray-500/20 text-gray-700", icon: Ban },
};

const requesterTypeLabels: Record<string, { labelKey: string; icon: any }> = {
  repair_center: { labelKey: "admin.repairCenters.title", icon: Building },
  sub_reseller: { labelKey: "transfers.subReseller", icon: User },
};

export default function AdminTransferRequestsOverviewPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDecideDialog, setShowDecideDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvedItems, setApprovedItems] = useState<Array<{ id: string; approvedQuantity: number }>>([]);
  const [shippedItems, setShippedItems] = useState<Array<{ id: string; productId: string; shippedQuantity: number }>>([]);
  const [shipTrackingNumber, setShipTrackingNumber] = useState("");
  const [shipTrackingCarrier, setShipTrackingCarrier] = useState("");

  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["/api/admin/transfer-requests/overview"],
  });

  const decideMutation = useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      decision: 'approve' | 'reject'; 
      rejectionReason?: string;
      items?: Array<{ id: string; approvedQuantity: number }>;
    }) => {
      return apiRequest("PATCH", `/api/admin/transfer-requests/${params.requestId}/decide`, {
        decision: params.decision,
        rejectionReason: params.rejectionReason,
        items: params.items
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests"] });
      const action = variables.decision === 'approve' ? 'approvata' : 'rifiutata';
      toast({ title: t("common.success"), description: t("common.updatedSuccessfully") });
      setShowDecideDialog(false);
      setSelectedRequest(null);
      setApprovedItems([]);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async (params: { 
      requestId: string; 
      items: Array<{ id: string; productId: string; shippedQuantity: number }>;
      trackingNumber: string;
      trackingCarrier: string;
    }) => {
      return apiRequest("PATCH", `/api/admin/transfer-requests/${params.requestId}/ship`, params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests/overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests"] });
      toast({ title: t("warehouse.shipmentRegistered"), description: t("warehouse.shipmentRegisteredDesc") });
      setShowShipDialog(false);
      setSelectedRequest(null);
      setShippedItems([]);
      setShipTrackingNumber("");
      setShipTrackingCarrier("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const filterRequests = (requests: TransferRequest[]) => {
    return requests.filter(r => {
      const matchesSearch = searchTerm === "" || 
        r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.targetResellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status] || { labelKey: status, color: "bg-gray-500/20 text-gray-700", icon: Clock };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {t(config.labelKey)}
      </Badge>
    );
  };

  const renderRequestCard = (request: TransferRequest) => {
    const TypeIcon = requesterTypeLabels[request.requesterType]?.icon || User;
    const typeLabel = requesterTypeLabels[request.requesterType]?.labelKey ? t(requesterTypeLabels[request.requesterType].labelKey) : request.requesterType;
    
    return (
      <Card key={request.id} className="hover-elevate" data-testid={`card-admin-transfer-${request.id}`}>
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium font-mono">{request.requestNumber}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <TypeIcon className="h-3 w-3" />
                  <span>{request.requesterName || typeLabel}</span>
                  <span className="text-xs">→</span>
                  <span>{request.targetResellerName}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {renderStatusBadge(request.status)}
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="text-sm">
              <span className="text-muted-foreground">{t("transfers.productsLabel")}: </span>
              <span className="font-medium">{request.items.length}</span>
              <span className="text-muted-foreground ml-4">{t("transfers.totalPieces")}: </span>
              <span className="font-medium">
                {request.items.reduce((sum, item) => sum + item.requestedQuantity, 0)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t("transfers.created")}: {format(new Date(request.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
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
              data-testid={`button-admin-view-${request.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t("transfers.details")}
            </Button>
            
            {request.status === 'pending' && (
              <Button 
                size="sm"
                onClick={() => openDecideDialog(request)}
                data-testid={`button-admin-decide-${request.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {t("transfers.manage")}
              </Button>
            )}
            
            {request.status === 'approved' && (
              <Button 
                size="sm"
                onClick={() => openShipDialog(request)}
                data-testid={`button-admin-ship-${request.id}`}
              >
                <Truck className="h-4 w-4 mr-1" />
                {t("transfers.ship")}
              </Button>
            )}
            
            {request.ddtNumber && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => downloadDDT(request.id)}
                data-testid={`button-admin-ddt-${request.id}`}
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
      <div className="space-y-6" data-testid="page-admin-transfers-loading">
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
    <div className="space-y-6" data-testid="page-admin-transfer-requests">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("transfers.transfersOverview")}</h1>
              <p className="text-sm text-muted-foreground">{t("transfers.transfersOverviewDesc")}</p>
            </div>
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
                <p className="text-sm text-muted-foreground">{t("transfers.pendingLabel")}</p>
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
                <p className="text-sm text-muted-foreground">{t("transfers.toShip")}</p>
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
                <p className="text-sm text-muted-foreground">{t("transfers.inTransit")}</p>
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
                <p className="text-sm text-muted-foreground">{t("transfers.completed")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("products.searchProduct")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-admin-search-transfers"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-admin-status-filter">
            <SelectValue placeholder={t("common.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("repairs.allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("common.pending")}</SelectItem>
            <SelectItem value="approved">{t("common.approved")}</SelectItem>
            <SelectItem value="shipped">{t("common.shipped")}</SelectItem>
            <SelectItem value="received">{t("common.received")}</SelectItem>
            <SelectItem value="rejected">{t("common.rejected")}</SelectItem>
            <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="gap-2" data-testid="tab-admin-active">
            <ListFilter className="h-4 w-4" />
            {t("transfers.activeTab")}
            {(stats?.totalActive || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">{stats?.totalActive}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="tab-admin-history">
            <History className="h-4 w-4" />
            {t("transfers.historyTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {filterRequests(active).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t("transfers.noActiveRequests")}</p>
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
                <p className="text-muted-foreground">{t("transfers.noCompletedTransfers")}</p>
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
              {t("transfers.requestDetails")} {selectedRequest?.requestNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("transfers.statusLabel")}:</span>
                  <div className="mt-1">{renderStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("transfers.requesterType")}:</span>
                  <p className="font-medium">{requesterTypeLabels[selectedRequest.requesterType]?.label}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("transfers.requester")}:</span>
                  <p className="font-medium">{selectedRequest.requesterName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("transfers.targetReseller")}:</span>
                  <p className="font-medium">{selectedRequest.targetResellerName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("transfers.createdOn")}:</span>
                  <p className="font-medium">{format(new Date(selectedRequest.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
                {selectedRequest.ddtNumber && (
                  <div>
                    <span className="text-muted-foreground">DDT:</span>
                    <p className="font-mono">{selectedRequest.ddtNumber}</p>
                  </div>
                )}
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">{t("transfers.notesLabel")}:</span>
                  <p className="text-sm mt-1 p-2 bg-muted rounded">{selectedRequest.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">{t("sidebar.items.products")}</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">{t("transfers.productCol")}</th>
                        <th className="text-right p-2">{t("transfers.requestedCol")}</th>
                        <th className="text-right p-2">{t("transfers.approvedCol")}</th>
                        <th className="text-right p-2">{t("transfers.shippedCol")}</th>
                        <th className="text-right p-2">{t("transfers.receivedCol")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">
                            <span className="font-medium">{item.product?.name || t("common.product")}</span>
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

      {/* Decide Dialog */}
      <Dialog open={showDecideDialog} onOpenChange={setShowDecideDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("warehouse.manageRequest")}</DialogTitle>
            <DialogDescription>
              Approva o rifiuta la richiesta {selectedRequest?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">{t("common.product")}</th>
                      <th className="text-right p-2">{t("transfers.requested")}</th>
                      <th className="text-right p-2">{t("transfers.approved")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequest.items.map((item, idx) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.product?.name || t("common.product")}</td>
                        <td className="text-right p-2">{item.requestedQuantity}</td>
                        <td className="text-right p-2">
                          <Input
                            type="number"
                            min={0}
                            max={item.requestedQuantity}
                            value={approvedItems[idx]?.approvedQuantity || 0}
                            onChange={(e) => {
                              const newItems = [...approvedItems];
                              newItems[idx] = { ...newItems[idx], approvedQuantity: parseInt(e.target.value) || 0 };
                              setApprovedItems(newItems);
                            }}
                            className="w-20 h-8 text-right"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div>
                <Label>Motivo rifiuto (opzionale)</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("utility.rejectionReason")}
                  className="mt-1"
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
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("warehouse.registerShipment")}</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli della spedizione per {selectedRequest?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t("shipping.carrier")}</Label>
                  <Input
                    value={shipTrackingCarrier}
                    onChange={(e) => setShipTrackingCarrier(e.target.value)}
                    placeholder="es. DHL, UPS, BRT..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>{t("shipping.trackingNumber")}</Label>
                  <Input
                    value={shipTrackingNumber}
                    onChange={(e) => setShipTrackingNumber(e.target.value)}
                    placeholder={t("shipping.trackingNumberPlaceholder")}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">{t("common.product")}</th>
                      <th className="text-right p-2">{t("transfers.approved")}</th>
                      <th className="text-right p-2">{t("transfers.toShip")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequest.items.map((item, idx) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.product?.name || t("common.product")}</td>
                        <td className="text-right p-2">{item.approvedQuantity || item.requestedQuantity}</td>
                        <td className="text-right p-2">
                          <Input
                            type="number"
                            min={0}
                            max={item.approvedQuantity || item.requestedQuantity}
                            value={shippedItems[idx]?.shippedQuantity || 0}
                            onChange={(e) => {
                              const newItems = [...shippedItems];
                              newItems[idx] = { ...newItems[idx], shippedQuantity: parseInt(e.target.value) || 0 };
                              setShippedItems(newItems);
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
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={() => selectedRequest && shipMutation.mutate({ 
                requestId: selectedRequest.id,
                items: shippedItems,
                trackingNumber: shipTrackingNumber,
                trackingCarrier: shipTrackingCarrier 
              })}
              disabled={shipMutation.isPending}
            >
              <Truck className="h-4 w-4 mr-1" />
              Conferma Spedizione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
