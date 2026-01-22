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

export default function ResellerMarketplaceSales() {
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

  const approveMutation = useMutation({
    mutationFn: async ({ orderId, sellerNotes }: { orderId: string; sellerNotes: string }) => {
      const res = await apiRequest('POST', `/api/reseller/marketplace/orders/${orderId}/approve`, { sellerNotes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ordine approvato", description: "Lo stock è stato trasferito al magazzino dell'acquirente" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/marketplace/sales'] });
      setSelectedOrder(null);
      setSellerNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orderId, rejectionReason, sellerNotes }: { orderId: string; rejectionReason: string; sellerNotes: string }) => {
      const res = await apiRequest('POST', `/api/reseller/marketplace/orders/${orderId}/reject`, { rejectionReason, sellerNotes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ordine rifiutato", description: "L'acquirente è stato notificato" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/marketplace/sales'] });
      setRejectDialogOpen(false);
      setSelectedOrder(null);
      setRejectionReason("");
      setSellerNotes("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: async ({ orderId, trackingNumber, trackingCarrier }: { orderId: string; trackingNumber: string; trackingCarrier: string }) => {
      const res = await apiRequest('POST', `/api/reseller/marketplace/orders/${orderId}/ship`, { trackingNumber, trackingCarrier });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Spedizione confermata", description: "L'acquirente è stato notificato della spedizione" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/marketplace/sales'] });
      setShipDialogOpen(false);
      setSelectedOrder(null);
      setTrackingNumber("");
      setTrackingCarrier("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Vendite Marketplace</h1>
              <p className="text-sm text-muted-foreground">Ordini ricevuti da altri rivenditori</p>
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
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessuna vendita</h3>
            <p className="text-muted-foreground">
              Non hai ancora ricevuto ordini nel marketplace.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordine</TableHead>
                <TableHead>Acquirente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Totale</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
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
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusBadge(selectedOrder.status)}
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

              {selectedOrder.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Note per l'acquirente (opzionale)</Label>
                  <Textarea 
                    placeholder="Aggiungi note..."
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
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Chiudi
            </Button>
            
            {selectedOrder?.status === 'pending' && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                  data-testid="button-reject-order"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Rifiuta
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                  data-testid="button-approve-order"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {approveMutation.isPending ? "Approvo..." : "Approva"}
                </Button>
              </>
            )}
            
            {selectedOrder?.status === 'approved' && (
              <Button 
                onClick={() => setShipDialogOpen(true)}
                data-testid="button-ship-order"
              >
                <Truck className="h-4 w-4 mr-2" />
                Segna come Spedito
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Ordine</DialogTitle>
            <DialogDescription>
              Inserisci il motivo del rifiuto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo del rifiuto *</Label>
              <Textarea 
                placeholder="Es: Prodotto non più disponibile..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                data-testid="textarea-rejection-reason"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Note aggiuntive (opzionale)</Label>
              <Textarea 
                placeholder="Note aggiuntive..."
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
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
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rifiuto..." : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shipDialogOpen} onOpenChange={setShipDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Spedizione</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli della spedizione
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Corriere</Label>
              <Input 
                placeholder="Es: BRT, GLS, DHL..."
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                data-testid="input-tracking-carrier"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Numero di tracking</Label>
              <Input 
                placeholder="Numero di tracciamento..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                data-testid="input-tracking-number"
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
              {shipMutation.isPending ? "Confermo..." : "Conferma Spedizione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
