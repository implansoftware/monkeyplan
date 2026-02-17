import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TrendingUp, Package, CheckCircle2, XCircle, Truck, Clock, Eye, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface MarketplaceOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string | null;
  productImageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  buyerResellerId: string;
  sellerResellerId: string;
  buyerName: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
  buyerNotes: string | null;
  sellerNotes: string | null;
  rejectionReason: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  createdAt: string;
  approvedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  items: MarketplaceOrderItem[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function getStatusBadge(status: string, t: (key: string) => string) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("hr.pending"), variant: "secondary" },
    approved: { label: t("repairs.status.approved"), variant: "default" },
    rejected: { label: t("b2b.status.cancelled"), variant: "destructive" },
    processing: { label: t("marketplace.processing"), variant: "secondary" },
    shipped: { label: t("b2b.status.shipped"), variant: "default" },
    received: { label: t("repairs.status.received"), variant: "default" },
    cancelled: { label: t("repairs.status.cancelled"), variant: "destructive" },
  };
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'approved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
    case 'shipped': return <Truck className="h-4 w-4 text-blue-500" />;
    case 'received': return <Package className="h-4 w-4 text-green-500" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

export default function ResellerMarketplaceSales() {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<MarketplaceOrder[]>({
    queryKey: ['/api/reseller/marketplace/sales'],
  });

  const { data: shippingMethods } = useQuery<{ id: string; name: string }[]>({
    queryKey: ['/api/shipping-methods/public'],
  });

  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: t("settings.bankTransfer"),
    stripe: t("suppliers.creditCard"),
    paypal: "PayPal",
    credit: t("marketplace.creditFido"),
  };

  const getPaymentMethodName = (method: string | null | undefined): string => {
    if (!method) return t("common.notSpecified");
    return paymentMethodLabels[method] || method;
  };

  const getShippingMethodName = (order: MarketplaceOrder): string => {
    if (order.shippingMethodName) return order.shippingMethodName;
    if (!order.shippingMethodId) return t("common.notSpecified");
    const method = shippingMethods?.find(m => m.id === order.shippingMethodId);
    return method?.name || t("common.unknownMethod");
  };

  const approveMutation = useMutation({
    mutationFn: async ({ orderId, sellerNotes }: { orderId: string; sellerNotes: string }) => {
      const res = await apiRequest('POST', `/api/reseller/marketplace/orders/${orderId}/approve`, { sellerNotes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderApproved"), description: t("marketplace.stockTransferred") });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/marketplace/sales'] });
      setSelectedOrder(null);
      setSellerNotes("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, rejectionReason, sellerNotes }: { orderId: string; rejectionReason: string; sellerNotes: string }) => {
      const res = await apiRequest('POST', `/api/reseller/marketplace/orders/${orderId}/reject`, { rejectionReason, sellerNotes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderRejectedToast"), description: t("marketplace.buyerNotifiedRejection") });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/marketplace/sales'] });
      setRejectDialogOpen(false);
      setSelectedOrder(null);
      setRejectionReason("");
      setSellerNotes("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber, trackingCarrier }: { orderId: string; trackingNumber: string; trackingCarrier: string }) => {
      const res = await apiRequest('POST', `/api/reseller/marketplace/orders/${orderId}/ship`, { trackingNumber, trackingCarrier });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("shipping.shipmentConfirmed"), description: t("shipping.buyerNotified") });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/marketplace/sales'] });
      setShipDialogOpen(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      setTrackingCarrier("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleApprove = () => {
    if (!selectedOrder) return;
    approveMutation.mutate({ orderId: selectedOrder.id, sellerNotes });
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    rejectMutation.mutate({ orderId: selectedOrder.id, rejectionReason, sellerNotes });
  };

  const handleShip = () => {
    if (!selectedOrder) return;
    shipMutation.mutate({ orderId: selectedOrder.id, trackingNumber, trackingCarrier });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-2">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  const pendingCount = orders?.filter(o => o.status === 'pending').length || 0;
  const approvedCount = orders?.filter(o => o.status === 'approved').length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t("marketplace.sales")}</h1>
              <p className="text-sm text-white/80">Ordini ricevuti da altri rivenditori</p>
            </div>
          </div>
          <div className="flex gap-4">
            {pendingCount > 0 && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Clock className="h-4 w-4 mr-1" />
                {pendingCount} in attesa
              </Badge>
            )}
            {approvedCount > 0 && (
              <Badge variant="default" className="text-sm px-3 py-1">
                <Package className="h-4 w-4 mr-1" />
                {approvedCount} da spedire
              </Badge>
            )}
          </div>
        </div>
      </div>

      {(!orders || orders.length === 0) ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("marketplace.noSales")}</h3>
            <p className="text-muted-foreground">
              Non hai ancora ricevuto ordini nel marketplace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.order")}</TableHead>
                <TableHead>{t("marketplace.buyer")}</TableHead>
                <TableHead>{t("common.date")}</TableHead>
                <TableHead>{t("common.total")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} data-testid={`row-sale-${order.id}`}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.buyerName}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'dd MMM yyyy', { locale: it })}</TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status, t)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      data-testid={`button-view-sale-${order.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Gestisci
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!selectedOrder && !rejectDialogOpen && !shipDialogOpen} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ordine {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Da: {selectedOrder?.buyerName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusBadge(selectedOrder.status, t)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy HH:mm', { locale: it })}
                </span>
              </div>

              {selectedOrder.buyerNotes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Note dell'acquirente:</p>
                  <p className="text-sm">{selectedOrder.buyerNotes}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">{t("products.title")}</h4>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center gap-3 p-2 bg-muted/50 rounded">
                    <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                      {item.productImageUrl ? (
                        <img 
                          src={item.productImageUrl} 
                          alt={item.productName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      {item.productSku && <p className="text-xs text-muted-foreground">{item.productSku}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p>{item.quantity} x {formatPrice(item.unitPrice)}</p>
                      <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Imponibile:</span>
                  <span>{formatPrice(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (22%):</span>
                  <span>{formatPrice(Math.round(selectedOrder.subtotal * 0.22))}</span>
                </div>
                {selectedOrder.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("shipping.shippingLabel")}:</span>
                    <span>{formatPrice(selectedOrder.shippingCost)}</span>
                  </div>
                )}
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Sconto:</span>
                    <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Totale:</span>
                  <span>{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Payment and Shipping Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t("license.paymentMethod")}</p>
                  <p className="font-medium" data-testid="text-payment-method">{getPaymentMethodName(selectedOrder.paymentMethod)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Metodo di spedizione</p>
                  <p className="font-medium" data-testid="text-shipping-method">{getShippingMethodName(selectedOrder)}</p>
                </div>
              </div>

              {selectedOrder.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Note per l'acquirente (opzionale)</Label>
                  <Textarea 
                    placeholder={t("common.addNotesPlaceholder")}
                    value={sellerNotes}
                    onChange={(e) => setSellerNotes(e.target.value)}
                    data-testid="textarea-seller-notes"
                  />
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Tracking:</p>
                  <p className="text-sm">
                    {selectedOrder.trackingCarrier && `${selectedOrder.trackingCarrier}: `}
                    {selectedOrder.trackingNumber}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>{t("common.close")}</Button>
            
            {selectedOrder?.status === 'pending' && selectedOrder.paymentMethod === 'bank_transfer' && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                  data-testid="button-reject-order"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />{t("common.reject")}</Button>
                <Button 
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  data-testid="button-approve-order"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {approveMutation.isPending ? t("marketplace.approvingOrder") : t("common.approve")}
                </Button>
              </>
            )}
            
            {selectedOrder?.status === 'approved' && (
              <Button 
                onClick={() => setShipDialogOpen(true)}
                data-testid="button-ship-order"
              >
                <Truck className="h-4 w-4 mr-2" />{t("b2b.markAsShipped")}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("b2b.rejectOrder")}</DialogTitle>
            <DialogDescription>
              {t("marketplace.enterRejectReason")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("marketplace.rejectReasonRequired")}</Label>
              <Textarea 
                placeholder={t("marketplace.cancelReasonPlaceholder")}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                data-testid="textarea-rejection-reason"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Note aggiuntive (opzionale)</Label>
              <Textarea 
                placeholder={t("utility.additionalNotes")}
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? t("common.rejecting") : t("common.confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shipping.confirmShipment")}</DialogTitle>
            <DialogDescription>
              {t("shipping.enterShipmentDetails")}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("shipping.carrier")}</Label>
              <Input 
                placeholder={t("marketplace.carrierPlaceholder")}
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                data-testid="input-tracking-carrier"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{t("shipping.trackingNumber")}</Label>
              <Input 
                placeholder={t("shipping.trackingPlaceholder")}
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                data-testid="input-tracking-number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleShip}
              disabled={shipMutation.isPending}
              data-testid="button-confirm-ship"
            >
              <Send className="h-4 w-4 mr-2" />
              {shipMutation.isPending ? t("common.confirming") : t("shipping.confirmShipment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
