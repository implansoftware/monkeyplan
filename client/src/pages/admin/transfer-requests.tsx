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
  Truck, Ban, Eye, PackageCheck, User, Building, Warehouse
} from "lucide-react";
import type { Product } from "@shared/schema";
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
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: TransferRequestItem[];
  requesterName?: string;
  sourceWarehouseName?: string;
  requesterWarehouseName?: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "pending", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
  approved: { label: "approved", color: "bg-blue-500/20 text-blue-700", icon: CheckCircle },
  rejected: { label: "rejected", color: "bg-red-500/20 text-red-700", icon: XCircle },
  shipped: { label: "shipped", color: "bg-purple-500/20 text-purple-700", icon: Truck },
  received: { label: "received", color: "bg-green-500/20 text-green-700", icon: PackageCheck },
  cancelled: { label: "cancelled", color: "bg-gray-500/20 text-gray-700", icon: Ban },
};

const requesterTypeLabels: Record<string, { label: string; icon: any }> = {
  repair_center: { label: "repairCenter", icon: Building },
  sub_reseller: { label: "subReseller", icon: User },
};

export default function AdminTransferRequestsPage() {
  const { t } = useTranslation();
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

  const { data: requests = [], isLoading } = useQuery<TransferRequest[]>({
    queryKey: ["/api/admin/transfer-requests"],
  });

  const decideMutation = useMutation({
    mutationFn: async (data: { 
      requestId: string; 
      decision: 'approve' | 'reject'; 
      rejectionReason?: string;
      items?: Array<{ id: string; approvedQuantity: number }>;
    }) => {
      return apiRequest("PATCH", `/api/admin/transfer-requests/${data.requestId}/decide`, {
        decision: data.decision,
        rejectionReason: data.rejectionReason,
        items: data.items
      });
    },
    onSuccess: (_, variables) => {
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
    mutationFn: async (data: { 
      requestId: string; 
      items: Array<{ id: string; productId: string; shippedQuantity: number }>;
    }) => {
      return apiRequest("PATCH", `/api/admin/transfer-requests/${data.requestId}/ship`, {
        items: data.items
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfer-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      toast({ title: t("warehouse.shipmentConfirmed"), description: t("warehouse.shipmentConfirmedDesc") });
      setShowShipDialog(false);
      setSelectedRequest(null);
      setShippedItems([]);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="p-6 space-y-6" data-testid="admin-transfer-requests-page">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">{t("transfers.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("transfers.description")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pendingCount > 0 && (
              <Badge className="bg-yellow-500/20 text-yellow-700" data-testid="badge-pending-count">
                {pendingCount} {t("transfers.pendingCount")}
              </Badge>
            )}
            {approvedCount > 0 && (
              <Badge className="bg-blue-500/20 text-blue-700" data-testid="badge-approved-count">
                {approvedCount} {t("transfers.toShip")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Inbox className="h-5 w-5" />
            {t("transfers.filters")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchProduct")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("repairs.allStatuses")}</SelectItem>
                <SelectItem value="pending">{t("common.pending")}</SelectItem>
                <SelectItem value="approved">{t("common.approved")}</SelectItem>
                <SelectItem value="rejected">{t("common.rejected")}</SelectItem>
                <SelectItem value="shipped">{t("common.shipped")}</SelectItem>
                <SelectItem value="received">{t("common.received")}</SelectItem>
                <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger data-testid="select-type-filter">
                <SelectValue placeholder={t("warehouse.requesterType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                <SelectItem value="repair_center">{t("roles.repairCenter")}</SelectItem>
                <SelectItem value="sub_reseller">{t("transfers.subReseller")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("hr.noRequestsFound")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => {
            const StatusIcon = statusConfig[request.status]?.icon || Clock;
            const TypeInfo = requesterTypeLabels[request.requesterType];
            const TypeIcon = TypeInfo?.icon || User;
            
            return (
              <Card key={request.id} data-testid={`card-request-${request.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 flex-wrap">
                        <span className="font-mono font-semibold" data-testid={`text-request-number-${request.id}`}>
                          {request.requestNumber}
                        </span>
                        <Badge className={statusConfig[request.status]?.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`common.statusLabels.${statusConfig[request.status]?.label}`)}
                        </Badge>
                        <Badge variant="outline" className="flex flex-wrap items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {t(`transfers.${TypeInfo?.label}`)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{t("warehouse.from")}: {request.requesterName || "N/D"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <Warehouse className="h-4 w-4" />
                          <span>{t("warehouse.source")}: {request.sourceWarehouseName || "N/D"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <Warehouse className="h-4 w-4" />
                          <span>{t("warehouse.dest")}: {request.requesterWarehouseName || "N/D"}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {request.items.slice(0, 3).map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            {item.product?.name || t("common.product")} x{item.requestedQuantity}
                          </Badge>
                        ))}
                        {request.items.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{request.items.length - 3} {t("transfers.others")}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {t("transfers.created")} {new Date(request.createdAt).toLocaleDateString('it-IT', { 
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewDetails(request)}
                        data-testid={`button-view-${request.id}`}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t("common.details")}
                      </Button>
                      
                      {request.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => handleOpenDecide(request)}
                          data-testid={`button-decide-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {t("transfers.manage")}
                        </Button>
                      )}
                      
                      {request.status === 'approved' && (
                        <Button 
                          size="sm"
                          variant="default"
                          onClick={() => handleOpenShip(request)}
                          data-testid={`button-ship-${request.id}`}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          {t("transfers.ship")}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("warehouse.requestDetails")} {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("common.status")}</Label>
                  <Badge className={statusConfig[selectedRequest.status]?.color}>
                    {t(`common.statusLabels.${statusConfig[selectedRequest.status]?.label}`)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("transfers.requesterType")}</Label>
                  <p>{t(`transfers.${requesterTypeLabels[selectedRequest.requesterType]?.label}`)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("transfers.requester")}</Label>
                  <p>{selectedRequest.requesterName || "N/D"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("transfers.creationDate")}</Label>
                  <p>{new Date(selectedRequest.createdAt).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
              
              {selectedRequest.notes && (
                <div>
                  <Label className="text-muted-foreground">{t("common.notes")}</Label>
                  <p className="text-sm">{selectedRequest.notes}</p>
                </div>
              )}
              
              {selectedRequest.rejectionReason && (
                <div>
                  <Label className="text-muted-foreground">{t("transfers.rejectionReason")}</Label>
                  <p className="text-sm text-red-600">{selectedRequest.rejectionReason}</p>
                </div>
              )}
              
              <div>
                <Label className="text-muted-foreground mb-2 block">{t("transfers.requestedItems")}</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">{t("common.product")}</th>
                        <th className="text-center p-2">{t("transfers.requested")}</th>
                        <th className="text-center p-2">{t("transfers.approvedQty")}</th>
                        <th className="text-center p-2">{t("transfers.shippedQty")}</th>
                        <th className="text-center p-2">{t("transfers.receivedQty")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.product?.name || "N/D"}</td>
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
            <DialogTitle>{t("warehouse.manageRequest")} {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">{t("transfers.quantityToApprove")}</Label>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2">{t("common.product")}</th>
                        <th className="text-center p-2">{t("transfers.requested")}</th>
                        <th className="text-center p-2">{t("transfers.toApprove")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item, idx) => (
                        <tr key={item.id} className="border-t">
                          <td className="p-2">{item.product?.name || "N/D"}</td>
                          <td className="text-center p-2">{item.requestedQuantity}</td>
                          <td className="text-center p-2">
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
                              className="w-20 text-center mx-auto"
                              data-testid={`input-approved-qty-${item.id}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <Label>{t("suppliers.rejectionReason")}</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder={t("utility.rejectionReason")}
                  data-testid="textarea-rejection-reason"
                />
              </div>
              
              <DialogFooter className="flex gap-2">
                <Button 
                  variant="destructive" 
                  onClick={() => decideMutation.mutate({ 
                    requestId: selectedRequest.id, 
                    decision: 'reject',
                    rejectionReason 
                  })}
                  disabled={decideMutation.isPending}
                  data-testid="button-reject"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {t("common.reject")}
                </Button>
                <Button 
                  onClick={() => decideMutation.mutate({ 
                    requestId: selectedRequest.id, 
                    decision: 'approve',
                    items: approvedItems 
                  })}
                  disabled={decideMutation.isPending}
                  data-testid="button-approve"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {t("common.approve")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("warehouse.shipRequest")} {selectedRequest?.requestNumber}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("transfers.shipConfirmDesc")}
              </p>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">{t("common.product")}</th>
                      <th className="text-center p-2">{t("transfers.approvedQty")}</th>
                      <th className="text-center p-2">{t("transfers.toShipQty")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRequest.items.map((item, idx) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2">{item.product?.name || "N/D"}</td>
                        <td className="text-center p-2">{item.approvedQuantity || 0}</td>
                        <td className="text-center p-2">
                          <Input
                            type="number"
                            min={0}
                            max={item.approvedQuantity || 0}
                            value={shippedItems[idx]?.shippedQuantity || 0}
                            onChange={(e) => {
                              const newItems = [...shippedItems];
                              newItems[idx] = { ...newItems[idx], shippedQuantity: parseInt(e.target.value) || 0 };
                              setShippedItems(newItems);
                            }}
                            className="w-20 text-center mx-auto"
                            data-testid={`input-shipped-qty-${item.id}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => shipMutation.mutate({ 
                    requestId: selectedRequest.id, 
                    items: shippedItems 
                  })}
                  disabled={shipMutation.isPending}
                  data-testid="button-confirm-ship"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  {t("b2b.confirmShipment")}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
