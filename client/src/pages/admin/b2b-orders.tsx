import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ResellerPurchaseOrder, ResellerPurchaseOrderItem, Product, User, ShippingMethod } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Package, ShoppingBag, Clock, CheckCircle, XCircle, Truck, PackageCheck, 
  Eye, ThumbsUp, ThumbsDown, Send, User as UserIcon
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface B2BOrderWithDetails extends ResellerPurchaseOrder {
  items: (ResellerPurchaseOrderItem & { product?: Product })[];
  reseller: { id: string; fullName: string; email: string } | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  draft: { label: "Bozza", variant: "outline", icon: Clock },
  pending: { label: "In Attesa", variant: "secondary", icon: Clock },
  approved: { label: "Approvato", variant: "default", icon: CheckCircle },
  rejected: { label: "Rifiutato", variant: "destructive", icon: XCircle },
  shipped: { label: "Spedito", variant: "default", icon: Truck },
  received: { label: "Ricevuto", variant: "default", icon: PackageCheck },
  cancelled: { label: "Annullato", variant: "destructive", icon: XCircle },
};

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "Bonifico Bancario",
  stripe: "Stripe",
  paypal: "PayPal",
  credit: "Credito Reseller",
};

export default function AdminB2BOrders() {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<B2BOrderWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<B2BOrderWithDetails[]>({
    queryKey: ['/api/admin/b2b-orders'],
  });

  const { data: shippingMethods } = useQuery<ShippingMethod[]>({
    queryKey: ['/api/shipping-methods/public'],
  });

  const getShippingMethodName = (methodId: string | null | undefined): string => {
    if (!methodId) return "Non specificato";
    const method = shippingMethods?.find(m => m.id === methodId);
    return method?.name || "Metodo sconosciuto";
  };

  const approveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest('POST', `/api/admin/b2b-orders/${orderId}/approve`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderApproved"), description: t("b2b.orderApprovedDesc") });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/b2b-orders'] });
      setDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const res = await apiRequest('POST', `/api/admin/b2b-orders/${orderId}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderRejectedToast"), description: t("b2b.resellerNotified") });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/b2b-orders'] });
      setRejectDialogOpen(false);
      setDetailOpen(false);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber, carrier }: { orderId: string; trackingNumber: string; carrier: string }) => {
      const res = await apiRequest('POST', `/api/admin/b2b-orders/${orderId}/ship`, { trackingNumber, carrier });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("b2b.orderShipped"), description: t("b2b.trackingRegistered") });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/b2b-orders'] });
      setShipDialogOpen(false);
      setDetailOpen(false);
      setTrackingNumber("");
      setCarrier("");
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const openDetail = (order: B2BOrderWithDetails) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleApprove = () => {
    if (selectedOrder) {
      approveMutation.mutate(selectedOrder.id);
    }
  };

  const handleReject = () => {
    if (selectedOrder) {
      rejectMutation.mutate({ orderId: selectedOrder.id, reason: rejectReason });
    }
  };

  const handleShip = () => {
    if (selectedOrder) {
      shipMutation.mutate({ orderId: selectedOrder.id, trackingNumber, carrier });
    }
  };

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const approvedOrders = orders?.filter(o => o.status === 'approved') || [];
  const shippedOrders = orders?.filter(o => o.status === 'shipped') || [];
  const completedOrders = orders?.filter(o => ['received', 'cancelled', 'rejected'].includes(o.status)) || [];

  const OrderRow = ({ order }: { order: B2BOrderWithDetails }) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    
    return (
      <TableRow 
        className="hover-elevate cursor-pointer" 
        onClick={() => openDetail(order)} 
        data-testid={`row-order-${order.id}`}
      >
        <TableCell className="font-medium">{order.orderNumber}</TableCell>
        <TableCell>
          <div className="flex flex-wrap items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div>{order.reseller?.fullName || "—"}</div>
              <div className="text-xs text-muted-foreground">{order.reseller?.email}</div>
            </div>
          </div>
        </TableCell>
        <TableCell>
          {order.createdAt && format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
        </TableCell>
        <TableCell className="text-right">{order.items?.length || 0}</TableCell>
        <TableCell className="text-right font-medium">{formatPrice(order.total || 0)}</TableCell>
        <TableCell>
          {paymentMethodLabels[order.paymentMethod || 'bank_transfer']}
        </TableCell>
        <TableCell>
          <Badge variant={status.variant} className="flex flex-wrap items-center gap-1 w-fit">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          Ordini B2B Reseller
        </h1>
        <p className="text-muted-foreground">Gestisci gli ordini di acquisto dai reseller</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.pending")}</CardDescription>
            <CardTitle className="text-2xl">{pendingOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.approved")}</CardDescription>
            <CardTitle className="text-2xl">{approvedOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.shipped")}</CardDescription>
            <CardTitle className="text-2xl">{shippedOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("common.completed")}</CardDescription>
            <CardTitle className="text-2xl">{completedOrders.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="h-4 w-4 mr-1" />
            In Attesa ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            <CheckCircle className="h-4 w-4 mr-1" />
            Approvati ({approvedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="shipped" data-testid="tab-shipped">
            <Truck className="h-4 w-4 mr-1" />
            Spediti ({shippedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            <PackageCheck className="h-4 w-4 mr-1" />
            Completati ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'shipped', 'completed'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N. Ordine</TableHead>
                    <TableHead>{t("admin.resellers.reseller")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead className="text-right">Articoli</TableHead>
                    <TableHead className="text-right">{t("common.total")}</TableHead>
                    <TableHead>{t("common.payment")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tab === 'pending' ? pendingOrders :
                    tab === 'approved' ? approvedOrders :
                    tab === 'shipped' ? shippedOrders :
                    completedOrders
                  ).map(order => <OrderRow key={order.id} order={order} />)}
                  {(tab === 'pending' ? pendingOrders :
                    tab === 'approved' ? approvedOrders :
                    tab === 'shipped' ? shippedOrders :
                    completedOrders
                  ).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nessun ordine in questa categoria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{t("suppliers.orderNumber")} {selectedOrder.orderNumber}</DialogTitle>
                    <DialogDescription>
                      <span className="flex flex-wrap items-center gap-2 mt-1">
                        <UserIcon className="h-4 w-4" />
                        {selectedOrder.reseller?.fullName} ({selectedOrder.reseller?.email})
                      </span>
                    </DialogDescription>
                  </div>
                  <Badge variant={statusConfig[selectedOrder.status]?.variant || "secondary"}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("products.product")}</TableHead>
                      <TableHead className="text-right">Prezzo B2B</TableHead>
                      <TableHead className="text-right">Qtà</TableHead>
                      <TableHead className="text-right">{t("common.total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt="" className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              {item.productSku && <div className="text-sm text-muted-foreground">{item.productSku}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(item.unitPrice || 0)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">{formatPrice(item.totalPrice || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Imponibile:</span>
                    <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (22%):</span>
                    <span>{formatPrice(Math.round((selectedOrder.subtotal || 0) * 0.22))}</span>
                  </div>
                  {(selectedOrder.shippingCost || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Costo Spedizione:</span>
                      <span>{formatPrice(selectedOrder.shippingCost || 0)}</span>
                    </div>
                  )}
                  {(selectedOrder.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Sconto:</span>
                      <span>-{formatPrice(selectedOrder.discountAmount || 0)}</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{t("common.total")}:</span>
                    <span className="text-primary">{formatPrice(selectedOrder.total || 0)}</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagamento:</span>
                    <span>{paymentMethodLabels[selectedOrder.paymentMethod || 'bank_transfer']}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spedizione:</span>
                    <span data-testid="text-shipping-method">{getShippingMethodName(selectedOrder.shippingMethodId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creato il:</span>
                    <span>{selectedOrder.createdAt && format(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.resellerNotes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">Note del reseller:</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.resellerNotes}</p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                  <p className="text-sm font-medium">Tracking:</p>
                  <p className="text-sm">
                    {selectedOrder.trackingCarrier}: {selectedOrder.trackingNumber}
                  </p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Chiudi
                </Button>
                
                {selectedOrder.status === 'pending' && selectedOrder.paymentMethod === 'bank_transfer' && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => setRejectDialogOpen(true)}
                      data-testid="button-reject"
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Rifiuta
                    </Button>
                    <Button 
                      onClick={handleApprove}
                      disabled={approveMutation.isPending}
                      data-testid="button-approve"
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {approveMutation.isPending ? "Approvazione..." : "Approva"}
                    </Button>
                  </>
                )}

                {selectedOrder.status === 'approved' && (
                  <Button 
                    onClick={() => setShipDialogOpen(true)}
                    data-testid="button-ship"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Segna come Spedito
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("b2b.rejectOrder")}</DialogTitle>
            <DialogDescription>
              Inserisci il motivo del rifiuto. Il reseller verrà notificato.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">{t("b2b.rejectionReason")}</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("b2b.rejectExample")}
                rows={3}
                data-testid="input-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rifiuto in corso..." : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("b2b.markAsShipped")}</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli della spedizione per notificare il reseller.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="carrier">{t("shipping.carrier")}</Label>
              <Input
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder={t("shipping.carrierExample")}
                data-testid="input-carrier"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">{t("shipping.trackingNumber")}</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={t("shipping.enterTracking")}
                data-testid="input-tracking"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipDialogOpen(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleShip}
              disabled={shipMutation.isPending}
              data-testid="button-confirm-ship"
            >
              <Send className="h-4 w-4 mr-2" />
              {shipMutation.isPending ? "Registrazione..." : "Conferma Spedizione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
