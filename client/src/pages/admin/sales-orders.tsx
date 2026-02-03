import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Eye, Package, Calendar, User, CreditCard, 
  CheckCircle, XCircle, Truck, AlertCircle, Store, Download,
  FileText, TrendingUp, ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrder, SalesOrderItem, User as UserType } from "@shared/schema";

interface OrderDetailResponse {
  order: SalesOrder;
  items: SalesOrderItem[];
  payments: any[];
  shipments: any[];
  history: any[];
}

const statusLabels: Record<string, string> = {
  pending: "In attesa",
  confirmed: "Confermato",
  processing: "In elaborazione",
  ready_to_ship: "Pronto per spedizione",
  shipped: "Spedito",
  delivered: "Consegnato",
  completed: "Completato",
  cancelled: "Annullato",
  refunded: "Rimborsato"
};

const statusColors: Record<string, string> = {
  pending: "secondary",
  confirmed: "default",
  processing: "default",
  ready_to_ship: "default",
  shipped: "default",
  delivered: "default",
  completed: "default",
  cancelled: "destructive",
  refunded: "destructive"
};

const statusTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['completed', 'refunded'],
  completed: [],
  cancelled: [],
  refunded: []
};

export default function AdminSalesOrders() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resellerFilter, setResellerFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  
  const { data: orders, isLoading } = useQuery<SalesOrder[]>({
    queryKey: ['/api/admin/sales-orders', { status: statusFilter, resellerId: resellerFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      if (resellerFilter && resellerFilter !== "all") params.set('resellerId', resellerFilter);
      const res = await fetch(`/api/sales-orders?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento ordini');
      return res.json();
    }
  });
  
  const { data: resellers } = useQuery<UserType[]>({
    queryKey: ['/api/users', { role: 'reseller' }],
    queryFn: async () => {
      const res = await fetch('/api/users?role=reseller', { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento reseller');
      return res.json();
    }
  });
  
  const { data: orderDetail, isLoading: isLoadingDetail } = useQuery<OrderDetailResponse>({
    queryKey: ['/api/sales-orders', selectedOrder?.id],
    queryFn: async () => {
      const res = await fetch(`/api/sales-orders/${selectedOrder?.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento dettagli ordine');
      return res.json();
    },
    enabled: !!selectedOrder?.id && showDetailDialog
  });
  
  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status, reason }: { orderId: string; status: string; reason?: string }) => {
      return await apiRequest('PUT', `/api/sales-orders/${orderId}/status`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sales-orders'] });
      toast({ title: "Stato ordine aggiornato" });
      setShowStatusDialog(false);
      setSelectedOrder(null);
      setNewStatus("");
      setStatusReason("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredOrders = orders?.filter(order => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (!order.orderNumber.toLowerCase().includes(searchLower) &&
          !order.shippingRecipient?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  }) || [];
  
  const openStatusDialog = (order: SalesOrder) => {
    setSelectedOrder(order);
    setNewStatus("");
    setStatusReason("");
    setShowStatusDialog(true);
  };
  
  const openDetailDialog = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };
  
  const handleStatusChange = () => {
    if (!selectedOrder || !newStatus) return;
    updateStatus.mutate({ 
      orderId: selectedOrder.id, 
      status: newStatus, 
      reason: statusReason || undefined 
    });
  };
  
  const handleExport = () => {
    toast({ title: "Export", description: "Funzionalità in arrivo" });
  };
  
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    processing: orders?.filter(o => ['confirmed', 'processing', 'ready_to_ship'].includes(o.status)).length || 0,
    shipped: orders?.filter(o => ['shipped', 'delivered'].includes(o.status)).length || 0,
    totalRevenue: orders?.reduce((sum, o) => sum + o.total, 0) || 0
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
          <h1 className="text-3xl font-bold" data-testid="text-admin-sales-orders-title">Ordini di vendita</h1>
          <p className="text-muted-foreground">Gestione completa degli ordini di tutti i reseller</p>
        </div>
        
        <Button variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="mr-2 h-4 w-4" />
          Esporta
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale ordini</p>
                <p className="text-2xl font-bold" data-testid="stat-total-orders">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In attesa</p>
                <p className="text-2xl font-bold" data-testid="stat-pending-orders">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In lavorazione</p>
                <p className="text-2xl font-bold" data-testid="stat-processing-orders">{stats.processing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fatturato</p>
                <p className="text-2xl font-bold" data-testid="stat-revenue">{formatPrice(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero ordine o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select value={resellerFilter} onValueChange={setResellerFilter}>
          <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-reseller-filter">
            <Store className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tutti i reseller" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i reseller</SelectItem>
            {resellers?.map((reseller) => (
              <SelectItem key={reseller.id} value={reseller.id || "unknown"}>
                {reseller.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
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
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nessun ordine trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordine</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Totale</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {resellers?.find(r => r.id === order.resellerId)?.fullName || order.resellerId?.slice(0, 8) || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.shippingRecipient || 'N/A'}
                        {order.shippingCity && (
                          <div className="text-muted-foreground text-xs">
                            {order.shippingCity} ({order.shippingProvince})
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-order-total-${order.id}`}>
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[order.status] as any || "secondary"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailDialog(order)}
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {statusTransitions[order.status]?.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openStatusDialog(order)}
                            data-testid={`button-change-status-${order.id}`}
                          >
                            Aggiorna
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dettaglio ordine</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 pr-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Stato</Label>
                    <div className="mt-1">
                      <Badge variant={statusColors[selectedOrder.status] as any}>
                        {statusLabels[selectedOrder.status]}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Totale</Label>
                    <p className="text-lg font-semibold">{formatPrice(selectedOrder.total)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data creazione</Label>
                    <p>{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reseller</Label>
                    <p>{resellers?.find(r => r.id === selectedOrder.resellerId)?.fullName || 'N/A'}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Indirizzo spedizione</Label>
                  <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">{selectedOrder.shippingRecipient}</p>
                    <p>{selectedOrder.shippingAddress}</p>
                    <p>{selectedOrder.shippingPostalCode} {selectedOrder.shippingCity} ({selectedOrder.shippingProvince})</p>
                    <p>{selectedOrder.shippingCountry}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Prodotti</Label>
                  <div className="mt-1 space-y-2">
                    {isLoadingDetail ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : orderDetail?.items && orderDetail.items.length > 0 ? (
                      orderDetail.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.productImage ? (
                              <img 
                                src={item.productImage} 
                                alt={item.productName || 'Prodotto'} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.productName || 'Prodotto'}</p>
                            <p className="text-sm text-muted-foreground">
                              Qtà: {item.quantity} x {formatPrice(item.unitPrice)}
                            </p>
                          </div>
                          <p className="font-semibold flex-shrink-0">{formatPrice(item.totalPrice)}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm p-3 bg-muted/50 rounded-lg">Nessun prodotto</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Riepilogo</Label>
                  <div className="mt-1 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotale</span>
                      <span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spedizione</span>
                      <span>{formatPrice(selectedOrder.shippingCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tasse</span>
                      <span>{formatPrice(selectedOrder.taxAmount)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Totale</span>
                      <span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
                
                {selectedOrder.customerNotes && (
                  <div>
                    <Label className="text-muted-foreground">Note cliente</Label>
                    <p className="mt-1 p-3 bg-muted/50 rounded-lg">{selectedOrder.customerNotes}</p>
                  </div>
                )}
                {selectedOrder.internalNotes && (
                  <div>
                    <Label className="text-muted-foreground">Note interne</Label>
                    <p className="mt-1 p-3 bg-muted/50 rounded-lg">{selectedOrder.internalNotes}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiorna stato ordine</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ordine: {selectedOrder.orderNumber}</p>
                <p className="text-sm">
                  Stato attuale: <Badge variant="secondary">{statusLabels[selectedOrder.status]}</Badge>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Nuovo stato</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona nuovo stato" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusTransitions[selectedOrder.status]?.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(newStatus === 'cancelled' || newStatus === 'refunded') && (
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Inserisci il motivo..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleStatusChange}
              disabled={!newStatus || updateStatus.isPending}
            >
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
