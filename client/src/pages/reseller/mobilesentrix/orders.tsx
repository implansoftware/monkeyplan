import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowLeft, ShoppingCart, Clock, CheckCircle, Truck, XCircle, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type MobilesentrixOrder = {
  id: string;
  mobilesentrixOrderId: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  shippingMethod: string | null;
  trackingNumber: string | null;
  createdAt: string;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }> = {
  pending: { label: "In Attesa", variant: "secondary", icon: Clock },
  processing: { label: "In Elaborazione", variant: "default", icon: Package },
  shipped: { label: "Spedito", variant: "default", icon: Truck },
  completed: { label: "Completato", variant: "default", icon: CheckCircle },
  cancelled: { label: "Annullato", variant: "destructive", icon: XCircle },
};

export default function MobilesentrixOrdersPage() {
  const { data: orders, isLoading } = useQuery<MobilesentrixOrder[]>({
    queryKey: ["/api/mobilesentrix/orders"],
  });

  const formatPrice = (cents: number, currency: string = "USD") => {
    return (cents / 100).toFixed(2) + " " + currency;
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || { label: status, variant: "secondary" as const, icon: Clock };
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">I Miei Ordini MobileSentrix</h1>
            <p className="text-muted-foreground">Storico degli ordini effettuati su MobileSentrix</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reseller/mobilesentrix/catalog">
            <Button variant="outline" data-testid="button-back-catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Catalogo
            </Button>
          </Link>
          <Link href="/reseller/mobilesentrix/cart">
            <Button variant="outline" data-testid="button-view-cart">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrello
            </Button>
          </Link>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nessun ordine</h2>
            <p className="text-muted-foreground mb-4">Non hai ancora effettuato ordini su MobileSentrix</p>
            <Link href="/reseller/mobilesentrix/catalog">
              <Button data-testid="button-browse-catalog">
                <Package className="h-4 w-4 mr-2" />
                Sfoglia Catalogo
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = getStatusConfig(order.status);
            const StatusIcon = config.icon;
            
            return (
              <Card key={order.id} data-testid={`order-card-${order.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          Ordine #{order.orderNumber || order.mobilesentrixOrderId}
                        </h3>
                        <Badge variant={config.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>
                          {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: it })}
                        </span>
                        {order.shippingMethod && (
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {order.shippingMethod}
                          </span>
                        )}
                        {order.trackingNumber && (
                          <span className="flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Tracking: {order.trackingNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{formatPrice(order.totalAmount, order.currency)}</p>
                      <p className="text-xs text-muted-foreground">ID MobileSentrix: {order.mobilesentrixOrderId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
