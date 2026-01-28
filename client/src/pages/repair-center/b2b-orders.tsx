import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Package, Clock, Check, X, Truck, FileCheck, Eye, ShoppingBag } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Product } from "@shared/schema";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  paymentMethod: string;
  notes?: string;
  rejectionReason?: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  approvedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: OrderItem[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "In Attesa", variant: "secondary" },
    approved: { label: "Approvato", variant: "default" },
    paid: { label: "Pagato", variant: "default" },
    shipped: { label: "Spedito", variant: "default" },
    delivered: { label: "Consegnato", variant: "default" },
    rejected: { label: "Rifiutato", variant: "destructive" },
    cancelled: { label: "Annullato", variant: "destructive" },
  };
  
  const config = statusMap[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getStatusIcon(status: string) {
  const icons: Record<string, typeof Clock> = {
    pending: Clock,
    approved: Check,
    paid: Check,
    shipped: Truck,
    delivered: FileCheck,
    rejected: X,
    cancelled: X,
  };
  const Icon = icons[status] || Clock;
  return <Icon className="h-4 w-4" />;
}

export default function RepairCenterB2BOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/repair-center/b2b-orders'],
  });

  const receiveMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest('POST', `/api/repair-center/b2b-orders/${orderId}/receive`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ricezione confermata", description: "L'ordine è stato segnato come ricevuto" });
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/b2b-orders'] });
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
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Ordini B2B</h1>
              <p className="text-emerald-100">Ordini effettuati al rivenditore</p>
            </div>
          </div>
          <Link href="/repair-center/b2b-catalog">
            <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" data-testid="button-new-order">
              <Package className="h-4 w-4 mr-2" />
              Nuovo Ordine
            </Button>
          </Link>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nessun ordine B2B effettuato</p>
            <Link href="/repair-center/b2b-catalog">
              <Button className="mt-4" variant="outline">
                Vai al Catalogo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordine</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Articoli</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "dd MMM yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusIcon(order.status)}
                        {getStatusBadge(order.status)}
                      </div>
                    </TableCell>
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

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                Ordine {selectedOrder.orderNumber}
                {getStatusBadge(selectedOrder.status)}
              </DialogTitle>
              <DialogDescription>
                Creato il {format(new Date(selectedOrder.createdAt), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prodotto</TableHead>
                    <TableHead className="text-center">Qtà</TableHead>
                    <TableHead className="text-right">Prezzo Unit.</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item) => {
                    const imageUrl = item.product?.imageUrl || item.productImage;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-3">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={item.productName}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span>{item.productName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatPrice(item.totalPrice)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="flex justify-between items-center border-t pt-4">
                <span className="text-lg font-bold">Totale Ordine:</span>
                <span className="text-lg font-bold">{formatPrice(selectedOrder.total)}</span>
              </div>
              
              {selectedOrder.notes && (
                <div className="bg-muted p-3 rounded">
                  <p className="text-sm text-muted-foreground">Note: {selectedOrder.notes}</p>
                </div>
              )}
              
              {selectedOrder.rejectionReason && (
                <div className="bg-destructive/10 p-3 rounded border border-destructive">
                  <p className="text-sm text-destructive">Motivo Rifiuto: {selectedOrder.rejectionReason}</p>
                </div>
              )}
              
              {selectedOrder.trackingNumber && (
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded">
                  <p className="text-sm">
                    <strong>Tracking:</strong> {selectedOrder.trackingNumber}
                    {selectedOrder.carrier && ` (${selectedOrder.carrier})`}
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              {selectedOrder.status === 'shipped' && (
                <Button 
                  onClick={() => receiveMutation.mutate(selectedOrder.id)}
                  disabled={receiveMutation.isPending}
                  data-testid="button-confirm-receipt"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Conferma Ricezione
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Chiudi
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
