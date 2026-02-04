import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  CreditCard, 
  MapPin, 
  Truck,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import type { SalesOrder, SalesOrderItem, SalesOrderPayment, SalesOrderShipment } from "@shared/schema";

interface OrderDetailResponse {
  order: SalesOrder;
  items: SalesOrderItem[];
  payments: SalesOrderPayment[];
  shipments: SalesOrderShipment[];
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

const paymentStatusLabels: Record<string, string> = {
  pending: "In attesa",
  partial: "Parziale",
  paid: "Pagato",
  refunded: "Rimborsato"
};

export default function CustomerOrderDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/customer/orders/:id");
  const orderId = params?.id;
  
  const { data, isLoading, error } = useQuery<OrderDetailResponse>({
    queryKey: ['/api/my-orders', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/my-orders/${orderId}`);
      if (!res.ok) throw new Error("Ordine non trovato");
      return res.json();
    },
    enabled: !!orderId
  });
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value / 100);
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
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setLocation("/customer/orders")} data-testid="button-back">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna agli ordini
        </Button>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Ordine non trovato</h3>
            <p className="text-muted-foreground">L'ordine richiesto non esiste o non hai accesso</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { order, items, payments, shipments } = data;
  
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative">
          <Button 
            variant="ghost" 
            className="mb-4 text-white hover:bg-white/20"
            onClick={() => setLocation("/customer/orders")}
            data-testid="button-back-header"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna agli ordini
          </Button>
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-white" data-testid="text-order-number">
                  {order.orderNumber}
                </h1>
                <Badge 
                  variant={statusColors[order.status] as any || "secondary"}
                  className="bg-white/20 text-white border-white/30"
                >
                  {statusLabels[order.status] || order.status}
                </Badge>
              </div>
              <p className="text-white/80 text-sm">Effettuato il {formatDate(order.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Riepilogo ordine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotale</span>
              <span data-testid="text-subtotal">{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Sconto</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            {order.shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spedizione</span>
                <span>{formatPrice(order.shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA ({order.vatRate ?? 22}%)</span>
              <span>{formatPrice(order.taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Totale</span>
              <span data-testid="text-total">{formatPrice(order.total)}</span>
            </div>
            
            <Separator />
            
            {payments.length > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stato pagamento</span>
                  <Badge variant={payments.some(p => p.status === "completed") ? "default" : "secondary"}>
                    {payments.some(p => p.status === "completed") ? "Pagato" : "In attesa"}
                  </Badge>
                </div>
                {payments[0]?.method && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metodo</span>
                    <span className="capitalize">{payments[0].method.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Indirizzo di spedizione
            </CardTitle>
          </CardHeader>
          <CardContent>
            {order.shippingAddress ? (
              <div className="space-y-1">
                <p className="font-medium">{order.shippingAddress}</p>
                <p>{order.shippingPostalCode} {order.shippingCity}</p>
                {order.shippingProvince && <p>{order.shippingProvince}</p>}
                {order.shippingCountry && <p>{order.shippingCountry}</p>}
              </div>
            ) : (
              <p className="text-muted-foreground">Ritiro in sede</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Articoli ordinati ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg bg-muted/50"
                data-testid={`item-${item.id}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {item.productImage ? (
                      <img 
                        src={item.productImage} 
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.productSku && (
                      <p className="text-sm text-muted-foreground">SKU: {item.productSku}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Qtà: {item.quantity}</span>
                  <span className="text-muted-foreground">{formatPrice(item.unitPrice)} cad.</span>
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {shipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Spedizioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shipments.map((shipment) => (
                <div 
                  key={shipment.id} 
                  className="p-4 rounded-lg bg-muted/50 space-y-2"
                  data-testid={`shipment-${shipment.id}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {shipment.status === "delivered" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                      )}
                      <span className="font-medium capitalize">{shipment.status}</span>
                    </div>
                    {shipment.carrier && (
                      <span className="text-sm text-muted-foreground">{shipment.carrier}</span>
                    )}
                  </div>
                  {shipment.trackingNumber && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Tracking: </span>
                      <span className="font-mono">{shipment.trackingNumber}</span>
                    </p>
                  )}
                  {shipment.pickedUpAt && (
                    <p className="text-sm text-muted-foreground">
                      Spedito il {formatDate(shipment.pickedUpAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagamenti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex flex-wrap items-center justify-between p-4 rounded-lg bg-muted/50 gap-2"
                  data-testid={`payment-${payment.id}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">{formatPrice(payment.amount)}</span>
                    <span className="text-muted-foreground capitalize">{payment.method?.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(payment.paidAt || payment.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {order.customerNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{order.customerNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
