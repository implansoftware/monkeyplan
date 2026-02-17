import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { 
  SupplierReturn, 
  Supplier,
  RepairCenter,
  SupplierOrder,
  Product,
} from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Package,
  Truck,
  FileText,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  Trash2,
  Building2,
  Undo2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Ban,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface SupplierReturnWithDetails extends SupplierReturn {
  supplier?: Supplier;
  repairCenter?: RepairCenter;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "draft", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  requested: { label: "requested", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Send },
  approved: { label: "approved", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", icon: CheckCircle },
  shipped: { label: "shipped", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Truck },
  received: { label: "received", color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300", icon: Package },
  refunded: { label: "refunded", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: DollarSign },
  rejected: { label: "rejected", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: Ban },
  cancelled: { label: "cancelled", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
};

const REASON_LABELS: Record<string, string> = {
  defective: "defective",
  wrong_item: "wrongItem",
  damaged: "damaged",
  not_as_described: "notAsDescribed",
  excess_stock: "excessStock",
  other: "other",
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy", { locale: it });
}

export default function SupplierReturnsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SupplierReturnWithDetails | null>(null);
  
  // Create form controlled states
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formRepairCenterId, setFormRepairCenterId] = useState("");
  const [formOrderId, setFormOrderId] = useState("__none__");
  const [formReason, setFormReason] = useState("");
  const [formReasonDetails, setFormReasonDetails] = useState("");
  const [formTotalAmount, setFormTotalAmount] = useState("");
  
  // Queries
  const { data: returns = [], isLoading } = useQuery<SupplierReturnWithDetails[]>({
    queryKey: ["/api/supplier-returns"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  const { data: supplierOrders = [] } = useQuery<SupplierOrder[]>({
    queryKey: ["/api/supplier-orders"],
  });

  // Mutations
  const createReturnMutation = useMutation({
    mutationFn: async (data: Partial<SupplierReturn>) => {
      return apiRequest("POST", "/api/supplier-returns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      setCreateDialogOpen(false);
      toast({ title: t("suppliers.returnCreated"), description: t("suppliers.returnCreatedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateReturnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierReturn> }) => {
      return apiRequest("PATCH", `/api/supplier-returns/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      toast({ title: t("suppliers.returnUpdated"), description: t("common.savedSuccessfully") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteReturnMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/supplier-returns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      setDetailsDialogOpen(false);
      setSelectedReturn(null);
      toast({ title: t("suppliers.returnDeleted") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  // Reset form when dialog opens/closes
  const resetCreateForm = () => {
    setFormSupplierId("");
    setFormRepairCenterId("");
    setFormOrderId("__none__");
    setFormReason("");
    setFormReasonDetails("");
    setFormTotalAmount("");
  };

  const handleCreateDialogChange = (open: boolean) => {
    if (open) {
      resetCreateForm();
    }
    setCreateDialogOpen(open);
  };

  // Filter orders by selected supplier
  const filteredOrders = supplierOrders.filter(o => 
    o.supplierId === formSupplierId && 
    (o.status === "received" || o.status === "partially_received")
  );

  // When supplier changes, reset order selection
  const handleSupplierChange = (supplierId: string) => {
    setFormSupplierId(supplierId);
    setFormOrderId("__none__");
    setFormTotalAmount("");
  };

  // When order is selected, auto-fill total amount
  const handleOrderSelect = (orderId: string) => {
    setFormOrderId(orderId);
    if (orderId && orderId !== "__none__") {
      const order = supplierOrders.find(o => o.id === orderId);
      if (order && order.totalAmount) {
        setFormTotalAmount((order.totalAmount / 100).toFixed(2));
      }
    }
  };

  // Handlers
  const handleCreateReturn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const supplierOrderId = formOrderId !== "__none__" ? formOrderId : undefined;
    const totalAmount = Math.round(parseFloat(formTotalAmount || "0") * 100);
    
    if (!formSupplierId || !formRepairCenterId || !formReason) {
      toast({ title: t("common.error"), description: t("suppliers.fillRequiredFields"), variant: "destructive" });
      return;
    }
    
    await createReturnMutation.mutateAsync({
      supplierId: formSupplierId,
      repairCenterId: formRepairCenterId,
      supplierOrderId,
      reason: formReason as any,
      reasonDetails: formReasonDetails || undefined,
      totalAmount,
    });
  };

  const handleStatusChange = async (returnId: string, newStatus: string) => {
    // Use the dedicated status endpoint which handles timestamps correctly on the backend
    try {
      await apiRequest("POST", `/api/supplier-returns/${returnId}/status`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      const statusLabel = STATUS_CONFIG[newStatus]?.label || newStatus;
      toast({ title: t("admin.resellers.statusUpdated"), description: `${t("suppliers.returnUpdatedTo")} ${statusLabel}` });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const openReturnDetails = (returnItem: SupplierReturnWithDetails) => {
    setSelectedReturn(returnItem);
    setDetailsDialogOpen(true);
  };

  // Filter returns
  const filteredReturns = returns.filter(ret => {
    const matchesSearch = searchTerm === "" || 
      ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.rmaNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || ret.status === filterStatus;
    const matchesSupplier = filterSupplier === "all" || ret.supplierId === filterSupplier;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("suppliers.supplierReturns")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("suppliers.supplierReturnsDesc")}
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-return">
          <Plus className="h-4 w-4 mr-2" />
          {t("suppliers.newReturn")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-filter-status">
            <SelectValue placeholder={t("common.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("repairs.allStatuses")}</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{t(`common.statusLabels.${config.label}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-filter-supplier">
            <SelectValue placeholder={t("suppliers.supplier")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("suppliers.allSuppliers")}</SelectItem>
            {suppliers.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Undo2 className="h-5 w-5" />
            {t("suppliers.returnList")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">{t("suppliers.noReturnsFound")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("suppliers.createNewReturnHint")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.number")}</TableHead>
                  <TableHead>{t("suppliers.supplier")}</TableHead>
                  <TableHead>{t("admin.repairCenters.center")}</TableHead>
                  <TableHead>{t("common.reason")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("suppliers.value")}</TableHead>
                  <TableHead>RMA</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map(ret => {
                  const statusConfig = STATUS_CONFIG[ret.status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusConfig.icon;
                  const supplier = suppliers.find(s => s.id === ret.supplierId);
                  const center = repairCenters.find(c => c.id === ret.repairCenterId);
                  
                  return (
                    <TableRow 
                      key={ret.id} 
                      className="cursor-pointer hover-elevate"
                      onClick={() => openReturnDetails(ret)}
                      data-testid={`row-return-${ret.id}`}
                    >
                      <TableCell className="font-medium">
                        {ret.returnNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {supplier?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{center?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {t(`suppliers.returnReasons.${ret.reason}`) || ret.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {t(`common.statusLabels.${statusConfig.label}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ret.totalAmount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ret.rmaNumber || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(ret.createdAt)}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${ret.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openReturnDetails(ret)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("common.details")}
                            </DropdownMenuItem>
                            {ret.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "requested")}>
                                <Send className="h-4 w-4 mr-2" />
                                {t("suppliers.sendRequest")}
                              </DropdownMenuItem>
                            )}
                            {ret.status === "requested" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "approved")}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t("suppliers.markApproved")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "rejected")}>
                                  <Ban className="h-4 w-4 mr-2" />
                                  {t("suppliers.markRejected")}
                                </DropdownMenuItem>
                              </>
                            )}
                            {ret.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "shipped")}>
                                <Truck className="h-4 w-4 mr-2" />
                                {t("suppliers.markShipped")}
                              </DropdownMenuItem>
                            )}
                            {ret.status === "shipped" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "received")}>
                                <Package className="h-4 w-4 mr-2" />
                                {t("suppliers.markReceived")}
                              </DropdownMenuItem>
                            )}
                            {ret.status === "received" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "refunded")}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                {t("suppliers.markRefunded")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {ret.status === "draft" && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm(t("suppliers.deleteReturn"))) {
                                    deleteReturnMutation.mutate(ret.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t("common.delete")}
                              </DropdownMenuItem>
                            )}
                            {ret.status !== "draft" && ret.status !== "cancelled" && ret.status !== "refunded" && ret.status !== "rejected" && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleStatusChange(ret.id, "cancelled")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                {t("suppliers.cancelReturn")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Return Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={handleCreateDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("suppliers.newReturnRequest")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReturn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierId">{t("suppliers.supplier")} *</Label>
              <Select value={formSupplierId} onValueChange={handleSupplierChange}>
                <SelectTrigger data-testid="select-new-supplier">
                  <SelectValue placeholder={t("suppliers.selectSupplier")} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.isActive).map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="repairCenterId">{t("admin.repairCenters.repairCenters")} *</Label>
              <Select value={formRepairCenterId} onValueChange={setFormRepairCenterId}>
                <SelectTrigger data-testid="select-new-center">
                  <SelectValue placeholder={t("utility.selectRepairCenter")} />
                </SelectTrigger>
                <SelectContent>
                  {repairCenters.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supplierOrderId">{t("suppliers.originalOrder")}</Label>
              <Select 
                value={formOrderId} 
                onValueChange={handleOrderSelect}
                disabled={!formSupplierId}
              >
                <SelectTrigger data-testid="select-new-order">
                  <SelectValue placeholder={formSupplierId ? t("suppliers.linkToOrder") : t("suppliers.selectSupplierFirst")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("suppliers.noLinkedOrder")}</SelectItem>
                  {filteredOrders.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.orderNumber} - {formatCurrency(o.totalAmount || 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formSupplierId && filteredOrders.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("suppliers.noOrdersForSupplier")}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">{t("suppliers.returnReason")} *</Label>
              <Select value={formReason} onValueChange={setFormReason}>
                <SelectTrigger data-testid="select-reason">
                  <SelectValue placeholder={t("suppliers.selectReason")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {t(`suppliers.returnReasons.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reasonDetails">{t("suppliers.reasonDetails")}</Label>
              <Textarea
                id="reasonDetails"
                value={formReasonDetails}
                onChange={(e) => setFormReasonDetails(e.target.value)}
                placeholder={t("suppliers.describeIssue")}
                className="resize-none"
                rows={3}
                data-testid="textarea-reason"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalAmount">{t("suppliers.returnValue")} (€)</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0"
                value={formTotalAmount}
                onChange={(e) => setFormTotalAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-total"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit"
                disabled={createReturnMutation.isPending}
                data-testid="button-submit-return"
              >
                {createReturnMutation.isPending ? t("admin.repairCenters.creating") : t("suppliers.createReturn")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {selectedReturn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-3">
                  <span>{t("suppliers.returnNumber")} {selectedReturn.returnNumber}</span>
                  <Badge className={STATUS_CONFIG[selectedReturn.status]?.color}>
                    {t(`common.statusLabels.${STATUS_CONFIG[selectedReturn.status]?.label}`)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[calc(90vh-120px)]">
                <Tabs defaultValue="info" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="info">{t("common.information")}</TabsTrigger>
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("suppliers.supplier")}</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {suppliers.find(s => s.id === selectedReturn.supplierId)?.name || "-"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("roles.repairCenter")}</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {repairCenters.find(c => c.id === selectedReturn.repairCenterId)?.name || "-"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("suppliers.returnReason")}</Label>
                        <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          {t(`suppliers.returnReasons.${selectedReturn.reason}`) || selectedReturn.reason}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("suppliers.originalOrder")}</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {selectedReturn.supplierOrderId 
                            ? supplierOrders.find(o => o.id === selectedReturn.supplierOrderId)?.orderNumber
                            : t("common.none")}
                        </div>
                      </div>
                    </div>
                    
                    {selectedReturn.reasonDetails && (
                      <div className="space-y-2">
                        <Label>{t("suppliers.reasonDetails")}</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {selectedReturn.reasonDetails}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{t("suppliers.returnValue")}</Label>
                        <div className="p-3 bg-muted rounded-md text-lg font-bold">
                          {formatCurrency(selectedReturn.totalAmount)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("suppliers.refundedAmount")}</Label>
                        <div className="p-3 bg-muted rounded-md text-lg font-bold text-green-600">
                          {selectedReturn.refundAmount != null 
                            ? formatCurrency(selectedReturn.refundAmount) 
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {selectedReturn.status === "received" && (
                      <div className="space-y-2">
                        <Label htmlFor="refundAmount">{t("suppliers.refundAmount")} (€)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="refundAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={selectedReturn.refundAmount ? (selectedReturn.refundAmount / 100).toFixed(2) : ""}
                            placeholder={(selectedReturn.totalAmount / 100).toFixed(2)}
                            data-testid="input-refund"
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById("refundAmount") as HTMLInputElement;
                              const refundAmount = Math.round(parseFloat(input.value || "0") * 100);
                              updateReturnMutation.mutate({
                                id: selectedReturn.id,
                                data: { refundAmount }
                              });
                            }}
                          >
                            {t("common.save")}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <Label>{t("common.createdAt")}</Label>
                        <div>{formatDate(selectedReturn.createdAt)}</div>
                      </div>
                      {selectedReturn.requestedAt && (
                        <div className="space-y-2">
                          <Label>{t("suppliers.requestedAt")}</Label>
                          <div>{formatDate(selectedReturn.requestedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.approvedAt && (
                        <div className="space-y-2">
                          <Label>{t("suppliers.approvedAt")}</Label>
                          <div>{formatDate(selectedReturn.approvedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.shippedAt && (
                        <div className="space-y-2">
                          <Label>{t("suppliers.shippedAt")}</Label>
                          <div>{formatDate(selectedReturn.shippedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.receivedAt && (
                        <div className="space-y-2">
                          <Label>{t("suppliers.receivedAt")}</Label>
                          <div>{formatDate(selectedReturn.receivedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.refundedAt && (
                        <div className="space-y-2">
                          <Label>{t("suppliers.refundedAt")}</Label>
                          <div>{formatDate(selectedReturn.refundedAt)}</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tracking" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rmaNumber">Numero RMA</Label>
                      <Input
                        id="rmaNumber"
                        defaultValue={selectedReturn.rmaNumber || ""}
                        placeholder={t("suppliers.returnAuthNumber")}
                        onBlur={(e) => {
                          updateReturnMutation.mutate({
                            id: selectedReturn.id,
                            data: { rmaNumber: e.target.value || null }
                          });
                        }}
                        data-testid="input-rma"
                      />
                      <p className="text-xs text-muted-foreground">
                        Numero di autorizzazione al reso fornito dal fornitore
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trackingCarrier">{t("shipping.carrier")}</Label>
                        <Input
                          id="trackingCarrier"
                          defaultValue={selectedReturn.trackingCarrier || ""}
                          placeholder={t("shipping.carrierExample")}
                          onBlur={(e) => {
                            updateReturnMutation.mutate({
                              id: selectedReturn.id,
                              data: { trackingCarrier: e.target.value || null }
                            });
                          }}
                          data-testid="input-carrier"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trackingNumber">{t("shipping.trackingNumber")}</Label>
                        <Input
                          id="trackingNumber"
                          defaultValue={selectedReturn.trackingNumber || ""}
                          placeholder={t("shipping.enterTracking")}
                          onBlur={(e) => {
                            updateReturnMutation.mutate({
                              id: selectedReturn.id,
                              data: { trackingNumber: e.target.value || null }
                            });
                          }}
                          data-testid="input-tracking"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
