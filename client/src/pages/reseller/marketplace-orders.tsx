import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Package, CheckCircle2, XCircle, Truck, Clock, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

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
  sellerName: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
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

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "In attesa", variant: "secondary" },
    approved: { label: "Approvato", variant: "default" },
    rejected: { label: "Rifiutato", variant: "destructive" },
    processing: { label: "In elaborazione", variant: "secondary" },
    shipped: { label: "Spedito", variant: "default" },
    received: { label: "Ricevuto", variant: "default" },
    cancelled: { label: "Annullato", variant: "destructive" },
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

export default function ResellerMarketplaceOrders() {
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrder | null>(null);
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<MarketplaceOrder[]>({
    queryKey: ['/api/reseller/marketplace/orders'],
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest('POST', `/api/reseller/marketplace/orders/${orderId}/receive`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ricezione confermata", description: "L'ordine è stato segnato come ricevuto" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/marketplace/orders'] });
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

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

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">I Miei Ordini Marketplace</h1>
              <p className="text-sm text-muted-foreground">Ordini effettuati ad altri rivenditori</p>
            </div>
          </div>
        </div>
      </div>

      {(!orders || orders.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun ordine</h3>
            <p className="text-muted-foreground">
              Non hai ancora effettuato ordini nel marketplace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordine</TableHead>
                <TableHead>Venditore</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Totale</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.sellerName}</TableCell>
                  <TableCell>{format(new Date(order.createdAt), 'dd MMM yyyy', { locale: it })}</TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      {getStatusBadge(order.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedOrder(order)}
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Dettagli
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ordine {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>
              Da: {selectedOrder?.sellerName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedOrder.createdAt), 'dd MMMM yyyy HH:mm', { locale: it })}
                </span>
              </div>

              {selectedOrder.rejectionReason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Motivo rifiuto:</p>
                  <p className="text-sm">{selectedOrder.rejectionReason}</p>
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

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Prodotti</h4>
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
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

              <div className="flex justify-between text-lg font-bold">
                <span>Totale:</span>
                <span>{formatPrice(selectedOrder.total)}</span>
              </div>

              {selectedOrder.buyerNotes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Le tue note:</p>
                  <p className="text-sm">{selectedOrder.buyerNotes}</p>
                </div>
              )}

              {selectedOrder.sellerNotes && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Note del venditore:</p>
                  <p className="text-sm">{selectedOrder.sellerNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Chiudi
            </Button>
            {selectedOrder?.status === 'shipped' && (
              <Button 
                onClick={() => confirmReceiptMutation.mutate(selectedOrder.id)}
                disabled={confirmReceiptMutation.isPending}
                data-testid="button-confirm-receipt"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {confirmReceiptMutation.isPending ? "Conferma..." : "Conferma Ricezione"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
