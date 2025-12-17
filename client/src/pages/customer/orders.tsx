import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Eye, Calendar, CreditCard } from "lucide-react";
import type { SalesOrder } from "@shared/schema";

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

export default function CustomerOrders() {
  const [, setLocation] = useLocation();
  
  const { data: orders, isLoading } = useQuery<SalesOrder[]>({
    queryKey: ['/api/my-orders']
  });
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">I miei ordini</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-orders-title">I miei ordini</h1>
        <p className="text-muted-foreground">Visualizza e gestisci i tuoi ordini</p>
      </div>
      
      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nessun ordine</h3>
            <p className="text-muted-foreground">Non hai ancora effettuato ordini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className="hover-elevate cursor-pointer"
              onClick={() => setLocation(`/customer/orders/${order.id}`)}
              data-testid={`card-order-${order.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg" data-testid={`text-order-number-${order.id}`}>
                        {order.orderNumber}
                      </h3>
                      <Badge variant={statusColors[order.status] as any || "secondary"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        <span data-testid={`text-order-total-${order.id}`}>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                    
                    {order.shippingCity && (
                      <p className="text-sm text-muted-foreground">
                        Spedizione: {order.shippingAddress}, {order.shippingCity}
                      </p>
                    )}
                  </div>
                  
                  <Button variant="outline" data-testid={`button-view-order-${order.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    Dettagli
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
