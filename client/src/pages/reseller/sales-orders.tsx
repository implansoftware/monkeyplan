import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Eye, Package, Calendar, User, CreditCard, 
  CheckCircle, XCircle, Truck, AlertCircle, ShoppingBag, ArrowLeft,
  MapPin, Phone, Mail, FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrder, SalesOrderItem, SalesOrderPayment, SalesOrderShipment } from "@shared/schema";

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

interface OrderDetailResponse {
  order: SalesOrder;
  items: SalesOrderItem[];
  payments: SalesOrderPayment[];
  shipments: SalesOrderShipment[];
}

export default function ResellerSalesOrders() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/reseller/sales-orders/:id");
  const orderId = params?.id;
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [shippingCarrierName, setShippingCarrierName] = useState("");
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  
  const { data: orders, isLoading } = useQuery<SalesOrder[]>({
    queryKey: ['/api/sales-orders', { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      const res = await fetch(`/api/sales-orders?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento ordini');
      return res.json();
    },
    enabled: !orderId
  });
  
  const { data: orderDetail, isLoading: isLoadingDetail } = useQuery<OrderDetailResponse>({
    queryKey: ['/api/sales-orders', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/sales-orders/${orderId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento dettagli ordine');
      return res.json();
    },
    enabled: !!orderId
  });
  
  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status, reason, carrier, carrierName, trackingNumber }: { 
      orderId: string; 
      status: string; 
      reason?: string;
      carrier?: string;
      carrierName?: string;
      trackingNumber?: string;
    }) => {
      return await apiRequest('PUT', `/api/sales-orders/${orderId}/status`, { 
        status, 
        reason,
        carrier,
        carrierName,
        trackingNumber
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-orders'] });
      toast({ title: "Stato ordine aggiornato" });
      setShowStatusDialog(false);
      setSelectedOrder(null);
      setNewStatus("");
      setStatusReason("");
      setShippingCarrier("");
      setShippingCarrierName("");
      setShippingTrackingNumber("");
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
      if (!order.orderNumber.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (statusFilter && statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    return true;
  }) || [];
  
  const openStatusDialog = (order: SalesOrder) => {
    setSelectedOrder(order);
    setNewStatus("");
    setStatusReason("");
    setShippingCarrier("");
    setShippingCarrierName("");
    setShippingTrackingNumber("");
    setShowStatusDialog(true);
  };
  
  const handleStatusChange = () => {
    if (!selectedOrder || !newStatus) return;
    
    // Validate shipping fields if status is shipped
    if (newStatus === 'shipped' && !shippingCarrier) {
      toast({ title: "Errore", description: "Seleziona un corriere", variant: "destructive" });
      return;
    }
    if (newStatus === 'shipped' && shippingCarrier === 'other' && !shippingCarrierName) {
      toast({ title: "Errore", description: "Inserisci il nome del corriere", variant: "destructive" });
      return;
    }
    
    updateStatus.mutate({ 
      orderId: selectedOrder.id, 
      status: newStatus, 
      reason: statusReason || undefined,
      carrier: newStatus === 'shipped' ? shippingCarrier : undefined,
      carrierName: newStatus === 'shipped' ? shippingCarrierName : undefined,
      trackingNumber: newStatus === 'shipped' ? shippingTrackingNumber : undefined
    });
  };
  
  if (orderId) {
    if (isLoadingDetail) {
      return (
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
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
    
    if (!orderDetail) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setLocation('/reseller/sales-orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna agli ordini
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Ordine non trovato</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    const { order, items, payments, shipments } = orderDetail;
    
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" onClick={() => setLocation('/reseller/sales-orders')} data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" /> Torna agli ordini
          </Button>
        </div>
        
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-order-detail-title">
                  Ordine {order.orderNumber}
                </h1>
                <p className="text-white/80 text-sm">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <Badge 
              variant={statusColors[order.status] as any || "secondary"}
              className="text-sm px-3 py-1"
            >
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <MapPin className="h-5 w-5" /> Indirizzo di spedizione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{order.shippingRecipient || 'N/A'}</p>
              <p className="text-muted-foreground">{order.shippingAddress}</p>
              <p className="text-muted-foreground">
                {order.shippingPostalCode} {order.shippingCity} ({order.shippingProvince})
              </p>
              {order.shippingPhone && (
                <p className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> {order.shippingPhone}
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <CreditCard className="h-5 w-5" /> Riepilogo pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotale</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sconto</span>
                  <span className="text-green-600">-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spedizione</span>
                <span>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Gratuita'}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Totale</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Package className="h-5 w-5" /> Prodotti ordinati
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nessun prodotto</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prodotto</TableHead>
                    <TableHead className="text-center">Quantità</TableHead>
                    <TableHead className="text-right">Prezzo unit.</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-3">
                          {item.productImage ? (
                            <img 
                              src={item.productImage} 
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.productSku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.productSku}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {payments.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <CreditCard className="h-5 w-5" /> Pagamenti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metodo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status === 'completed' ? 'Completato' : 
                           payment.status === 'pending' ? 'In attesa' : payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatPrice(payment.amount)}</TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {shipments.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Truck className="h-5 w-5" /> Spedizioni
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Corriere</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Data spedizione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell>{shipment.carrier || 'N/A'}</TableCell>
                      <TableCell>
                        {shipment.trackingNumber ? (
                          shipment.trackingUrl ? (
                            <a href={shipment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              {shipment.trackingNumber}
                            </a>
                          ) : shipment.trackingNumber
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={shipment.status === 'delivered' ? 'default' : 'secondary'}>
                          {shipment.status === 'delivered' ? 'Consegnato' : 
                           shipment.status === 'in_transit' ? 'In transito' : 
                           shipment.status === 'pending' ? 'In preparazione' : shipment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{shipment.createdAt ? formatDate(shipment.createdAt) : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {order.customerNotes && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <FileText className="h-5 w-5" /> Note cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{order.customerNotes}</p>
            </CardContent>
          </Card>
        )}
        
        {statusTransitions[order.status]?.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={() => openStatusDialog(order)} data-testid="button-change-status">
              Aggiorna stato ordine
            </Button>
          </div>
        )}
        
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
                
                {newStatus === 'cancelled' && (
                  <div className="space-y-2">
                    <Label>Motivo annullamento</Label>
                    <Textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Inserisci il motivo dell'annullamento..."
                      rows={3}
                    />
                  </div>
                )}
                
                {newStatus === 'shipped' && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <Truck className="h-4 w-4" />
                      Dati spedizione
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Corriere *</Label>
                      <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                        <SelectTrigger data-testid="select-carrier">
                          <SelectValue placeholder="Seleziona corriere" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dhl">DHL</SelectItem>
                          <SelectItem value="ups">UPS</SelectItem>
                          <SelectItem value="fedex">FedEx</SelectItem>
                          <SelectItem value="gls">GLS</SelectItem>
                          <SelectItem value="brt">BRT</SelectItem>
                          <SelectItem value="sda">SDA</SelectItem>
                          <SelectItem value="poste_italiane">Poste Italiane</SelectItem>
                          <SelectItem value="other">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {shippingCarrier === 'other' && (
                      <div className="space-y-2">
                        <Label>Nome corriere *</Label>
                        <Input
                          value={shippingCarrierName}
                          onChange={(e) => setShippingCarrierName(e.target.value)}
                          placeholder="Inserisci nome corriere..."
                          data-testid="input-carrier-name"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>Numero tracking</Label>
                      <Input
                        value={shippingTrackingNumber}
                        onChange={(e) => setShippingTrackingNumber(e.target.value)}
                        placeholder="Inserisci numero tracking..."
                        data-testid="input-tracking-number"
                      />
                    </div>
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
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-sales-orders-title">Ordini Vendita</h1>
              <p className="text-white/80 text-sm">Gestione ordini clienti</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per numero ordine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
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
      
      <Card className="rounded-2xl">
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
                          onClick={() => setLocation(`/reseller/sales-orders/${order.id}`)}
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
                            Aggiorna stato
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
              
              {newStatus === 'cancelled' && (
                <div className="space-y-2">
                  <Label>Motivo annullamento</Label>
                  <Textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="Inserisci il motivo dell'annullamento..."
                    rows={3}
                  />
                </div>
              )}
              
              {newStatus === 'shipped' && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <Truck className="h-4 w-4" />
                    Dati spedizione
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Corriere *</Label>
                    <Select value={shippingCarrier} onValueChange={setShippingCarrier}>
                      <SelectTrigger data-testid="select-carrier-list">
                        <SelectValue placeholder="Seleziona corriere" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dhl">DHL</SelectItem>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="gls">GLS</SelectItem>
                        <SelectItem value="brt">BRT</SelectItem>
                        <SelectItem value="sda">SDA</SelectItem>
                        <SelectItem value="poste_italiane">Poste Italiane</SelectItem>
                        <SelectItem value="other">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {shippingCarrier === 'other' && (
                    <div className="space-y-2">
                      <Label>Nome corriere *</Label>
                      <Input
                        value={shippingCarrierName}
                        onChange={(e) => setShippingCarrierName(e.target.value)}
                        placeholder="Inserisci nome corriere..."
                        data-testid="input-carrier-name-list"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Numero tracking</Label>
                    <Input
                      value={shippingTrackingNumber}
                      onChange={(e) => setShippingTrackingNumber(e.target.value)}
                      placeholder="Inserisci numero tracking..."
                      data-testid="input-tracking-number-list"
                    />
                  </div>
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
