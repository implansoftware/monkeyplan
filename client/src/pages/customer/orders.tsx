import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Eye, Calendar, CreditCard } from "lucide-react";
import type { SalesOrder } from "@shared/schema";

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    pending: t("common.waiting"),
    confirmed: t("common.confirmed"),
    processing: t("customerPages.processing"),
    ready_to_ship: t("customerPages.readyToShip"),
    shipped: t("customerPages.shipped"),
    delivered: t("common.delivered"),
    completed: t("common.completed"),
    cancelled: t("common.cancelled"),
    refunded: t("customerPages.refunded")
  };
}

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
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const [, setLocation] = useLocation();
  
  const { data: orders, isLoading } = useQuery<SalesOrder[]>({
    queryKey: ['/api/my-orders']
  });
  
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
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
        <h1 className="text-3xl font-bold">{t("customerPages.myOrders")}</h1>
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="text-orders-title">{t("customerPages.myOrders")}</h1>
              <p className="text-white/80 text-sm">{t("customerPages.viewAndManageOrders")}</p>
            </div>
          </div>
        </div>
      </div>
      
      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t("customerPages.nessunOrdine")}</h3>
            <p className="text-muted-foreground">{t("customerPages.noOrdersYetDesc")}</p>
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
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-lg" data-testid={`text-order-number-${order.id}`}>
                        {order.orderNumber}
                      </h3>
                      <Badge variant={statusColors[order.status] as any || "secondary"}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        <span data-testid={`text-order-total-${order.id}`}>{formatPrice(order.total)}</span>
                      </div>
                    </div>
                    
                    {order.shippingCity && (
                      <p className="text-sm text-muted-foreground">
                        {t("customerPages.shippingLabel")}: {order.shippingAddress}, {order.shippingCity}
                      </p>
                    )}
                  </div>
                  
                  <Button variant="outline" data-testid={`button-view-order-${order.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("customerPages.detailsButton")}
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
