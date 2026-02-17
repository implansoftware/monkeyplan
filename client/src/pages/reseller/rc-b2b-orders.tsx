import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, Clock, Check, X, Truck, FileCheck, Eye, ShoppingBag, Building2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Product } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

interface Order {
  id: string;
  orderNumber: string;
  repairCenterId: string;
  resellerId: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingMethodId?: string;
  shippingMethodName?: string;
  notes?: string;
  rejectionReason?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  approvedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: OrderItem[];
  repairCenter?: { id: string; name: string };
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function getPaymentMethodName(method: string): string {
  const names: Record<string, string> = {
    bank_transfer: 'Bonifico Bancario',
    stripe: 'Carta di Credito (Stripe)',
    paypal: 'PayPal',
    cash: 'Contanti',
    credit: 'Credito',
  };
  return names[method] || method;
}

function getStatusBadge(status: string, t: (key: string) => string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("common.pending"), variant: "secondary" },
    approved: { label: t("repairs.status.approved"), variant: "default" },
    paid: { label: t("common.paid"), variant: "default" },
    shipped: { label: t("b2b.status.shipped"), variant: "default" },
    delivered: { label: t("repairs.status.delivered"), variant: "default" },
    rejected: { label: t("b2b.status.cancelled"), variant: "destructive" },
    cancelled: { label: t("repairs.status.cancelled"), variant: "destructive" },
  };
  
  const config = statusMap[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function ResellerRCB2BOrders() {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/reseller/rc-b2b-orders'],
  });
  
  // Fetch shipping methods for displaying names
  const { data: shippingMethods } = useQuery<{ id: string; name: string; priceCents: number }[]>({
    queryKey: ['/api/reseller/shipping-methods'],
  });
  
  const getShippingMethodName = (order: Order) => {
    if (order.shippingMethodName) return order.shippingMethodName;
    if (!order.shippingMethodId || !shippingMethods) return 'Non specificato';
    const method = shippingMethods.find(m => m.id === order.shippingMethodId);
    return method?.name || 'Non specificato';
  };

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest('POST', `/api/reseller/rc-b2b-orders/${orderId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderApproved"), description: "Stock trasferito al centro riparazione" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/rc-b2b-orders'] });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const res = await apiRequest('POST', `/api/reseller/rc-b2b-orders/${orderId}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderRejectedToast") });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/rc-b2b-orders'] });
      setSelectedOrder(null);
      setShowRejectDialog(false);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber, carrier }: { orderId: string; trackingNumber: string; carrier: string }) => {
      const res = await apiRequest('POST', `/api/reseller/rc-b2b-orders/${orderId}/ship`, { trackingNumber, carrier });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderShipped") });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/rc-b2b-orders'] });
      setSelectedOrder(null);
      setShowShipDialog(false);
      setTrackingNumber("");
      setCarrier("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Ordini B2B dai Centri Riparazione</h1>
              <p className="text-sm text-white/80">Gestisci gli ordini ricevuti dai tuoi centri riparazione</p>
            </div>
          </div>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessun ordine B2B dai centri riparazione</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.order")}</TableHead>
                  <TableHead>{t("roles.repairCenter")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("b2b.items")}</TableHead>
                  <TableHead className="text-right">{t("common.total")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.repairCenter?.name || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status, t)}</TableCell>
                    <TableCell>{order.items.length} articoli</TableCell>
                    <TableCell className="text-right font-semibold">{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                        data-testid={`button-view-${order.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedOrder && !showRejectDialog && !showShipDialog} onOpenChange={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                Ordine {selectedOrder.orderNumber}
                {getStatusBadge(selectedOrder.status, t)}
              </DialogTitle>
              <DialogDescription>
                Da: {selectedOrder.repairCenter?.name || 'Centro sconosciuto'} - 
                {format(new Date(selectedOrder.createdAt), " dd MMMM yyyy 'alle' HH:mm", { locale: it })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.product")}</TableHead>
                    <TableHead className="text-center">{t("common.qty")}</TableHead>
                    <TableHead className="text-right">{t("products.unitPrice")}</TableHead>
                    <TableHead className="text-right">{t("common.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatPrice(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Imponibile:</span>
                  <span>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (22%):</span>
                  <span>{formatPrice(Math.round((selectedOrder.subtotal || selectedOrder.total) * 0.22))}</span>
                </div>
                {(selectedOrder.shippingCost || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Spedizione:</span>
                    <span>{formatPrice(selectedOrder.shippingCost)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Totale Ordine:</span>
                  <span className="text-lg font-bold">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Metodo di Pagamento</p>
                  <p className="font-medium">{getPaymentMethodName(selectedOrder.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Metodo di Spedizione</p>
                  <p className="font-medium">{getShippingMethodName(selectedOrder)}</p>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm text-muted-foreground">Note: {selectedOrder.notes}</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2">
              {selectedOrder.status === 'pending' && (
                <>
                  <Button 
                    variant="destructive"
                    onClick={() => setShowRejectDialog(true)}
                    data-testid="button-reject"
                  >
                    <X className="h-4 w-4 mr-2" />{t("common.reject")}</Button>
                  <Button 
                    onClick={() => approveMutation.mutate(selectedOrder.id)}
                    disabled={approveMutation.isPending}
                    data-testid="button-approve"
                  >
                    <Check className="h-4 w-4 mr-2" />{t("common.approve")}</Button>
                </>
              )}
              {(selectedOrder.status === 'approved' || selectedOrder.status === 'paid') && (
                <Button 
                  onClick={() => setShowShipDialog(true)}
                  data-testid="button-ship"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Segna Spedito
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>{t("common.close")}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("b2b.rejectOrder")}</DialogTitle>
            <DialogDescription>Indica il motivo del rifiuto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo Rifiuto</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("utility.rejectionReason")}
                data-testid="input-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>{t("common.cancel")}</Button>
            <Button 
              variant="destructive"
              onClick={() => selectedOrder && rejectMutation.mutate({ orderId: selectedOrder.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Conferma Rifiuto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spedizione Ordine</DialogTitle>
            <DialogDescription>Inserisci i dettagli della spedizione</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Numero Tracking</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="es. 1Z999AA10123456784"
                data-testid="input-tracking"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("shipping.carrier")}</Label>
              <Input
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder="es. UPS, DHL, BRT..."
                data-testid="input-carrier"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipDialog(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => selectedOrder && shipMutation.mutate({ 
                orderId: selectedOrder.id, 
                trackingNumber, 
                carrier 
              })}
              disabled={shipMutation.isPending}
              data-testid="button-confirm-ship"
            >
              <Truck className="h-4 w-4 mr-2" />
              Conferma Spedizione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
