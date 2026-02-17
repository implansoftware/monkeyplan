import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Package, ArrowLeft, ShoppingCart, Clock, CheckCircle, Truck, XCircle, ExternalLink, Eye, MapPin, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

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

type OrderDetails = {
  entity_id: string;
  increment_id: string;
  status: string;
  grand_total: string;
  subtotal: string;
  shipping_amount: string;
  tax_amount: string;
  discount_amount: string;
  created_at: string;
  updated_at: string;
  shipping_description: string;
  tracking_number: string | null;
  payment_method: string;
  customer_email: string;
  addresses: Array<{
    firstname: string;
    lastname: string;
    street: string;
    city: string;
    postcode: string;
    country_id: string;
    telephone: string;
    company: string;
    address_type: string;
  }>;
  order_items: Array<{
    item_id: string;
    sku: string;
    name: string;
    qty_ordered: string;
    price: string;
    base_row_total: string;
  }>;
};

function getStatusConfigMap(t: (key: string) => string): Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }> {
  return {
    pending: { label: t("common.pending"), variant: "secondary", icon: Clock },
    processing: { label: "In Elaborazione", variant: "default", icon: Package },
    shipped: { label: t("b2b.status.shipped"), variant: "default", icon: Truck },
    Shipped: { label: t("b2b.status.shipped"), variant: "default", icon: Truck },
    complete: { label: t("common.completed"), variant: "default", icon: CheckCircle },
    completed: { label: t("common.completed"), variant: "default", icon: CheckCircle },
    cancelled: { label: t("repairs.status.cancelled"), variant: "destructive", icon: XCircle },
    canceled: { label: t("repairs.status.cancelled"), variant: "destructive", icon: XCircle },
  };
}

export default function MobilesentrixOrdersPage() {
  const { t } = useTranslation();
  const statusConfig = getStatusConfigMap(t);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery<MobilesentrixOrder[]>({
    queryKey: ["/api/mobilesentrix/orders"],
  });

  const formatPrice = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null || amount === '') {
      return "0,00 €";
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return "0,00 €";
    }
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(numAmount);
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || { label: status, variant: "secondary" as const, icon: Clock };
  };

  const handleViewDetails = async (order: MobilesentrixOrder) => {
    const orderId = order.mobilesentrixOrderId;
    if (orderId.startsWith('pending-')) {
      setDetailsError("Ordine in elaborazione. I dettagli saranno disponibili a breve.");
      setSelectedOrderId(orderId);
      return;
    }
    
    setSelectedOrderId(orderId);
    setLoadingDetails(true);
    setDetailsError(null);
    setOrderDetails(null);
    
    try {
      const response = await apiRequest("GET", `/api/mobilesentrix/orders/${orderId}/details`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setOrderDetails(data.data);
      } else {
        setDetailsError(data.message || "Impossibile caricare i dettagli");
      }
    } catch (error: any) {
      setDetailsError(error.message || "Errore nel caricamento dei dettagli");
    } finally {
      setLoadingDetails(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const shippingAddress = orderDetails?.addresses?.find(a => a.address_type === 'shipping');
  const billingAddress = orderDetails?.addresses?.find(a => a.address_type === 'billing');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">I Miei Ordini MobileSentrix</h1>
            <p className="text-muted-foreground">Storico degli ordini effettuati su MobileSentrix</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/reseller/mobilesentrix/catalog">
            <Button variant="outline" data-testid="button-back-catalog">
              <ArrowLeft className="h-4 w-4 mr-2" />{t("shop.catalog")}</Button>
          </Link>
          <Link href="/reseller/mobilesentrix/cart">
            <Button variant="outline" data-testid="button-view-cart">
              <ShoppingCart className="h-4 w-4 mr-2" />{t("pos.cart")}</Button>
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
              <Card key={order.id} data-testid={`order-card-${order.id}`} className="hover-elevate cursor-pointer" onClick={() => handleViewDetails(order)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          Ordine #{order.orderNumber || order.mobilesentrixOrderId}
                        </h3>
                        <Badge variant={config.variant} className="flex flex-wrap items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span>
                          {format(new Date(order.createdAt), "d MMMM yyyy, HH:mm", { locale: it })}
                        </span>
                        {order.shippingMethod && (
                          <span className="flex flex-wrap items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {order.shippingMethod}
                          </span>
                        )}
                        {order.trackingNumber && (
                          <span className="flex flex-wrap items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Tracking: {order.trackingNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-2xl font-bold">{formatPrice(order.totalAmount / 100)}</p>
                        <p className="text-xs text-muted-foreground">ID MobileSentrix: {order.mobilesentrixOrderId}</p>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-view-order-${order.id}`}>
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Package className="h-5 w-5" />
              Dettagli Ordine #{orderDetails?.increment_id || selectedOrderId}
            </DialogTitle>
            <DialogDescription>
              Informazioni complete sull'ordine
            </DialogDescription>
          </DialogHeader>

          {loadingDetails && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {detailsError && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{detailsError}</p>
            </div>
          )}

          {orderDetails && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">{t("common.subtotal")}</p>
                  <p className="text-lg font-semibold">{formatPrice(orderDetails.subtotal)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">{t("common.shipment")}</p>
                  <p className="text-lg font-semibold">{formatPrice(orderDetails.shipping_amount)}</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">{t("common.taxes")}</p>
                  <p className="text-lg font-semibold">{formatPrice(orderDetails.tax_amount)}</p>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-md">
                  <p className="text-sm text-muted-foreground">{t("common.total")}</p>
                  <p className="text-lg font-bold">{formatPrice(orderDetails.grand_total)}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-md">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Truck className="h-4 w-4" />
                    <h4 className="font-semibold">{t("common.shipment")}</h4>
                  </div>
                  <p className="text-sm">{orderDetails.shipping_description || "N/A"}</p>
                  {orderDetails.tracking_number && (
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Tracking:</span> {orderDetails.tracking_number}
                    </p>
                  )}
                </div>
                <div className="p-4 border rounded-md">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <h4 className="font-semibold">{t("common.payment")}</h4>
                  </div>
                  <p className="text-sm">{orderDetails.payment_method || "N/A"}</p>
                </div>
              </div>

              {shippingAddress && (
                <div className="p-4 border rounded-md">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    <h4 className="font-semibold">Indirizzo di Spedizione</h4>
                  </div>
                  <p className="text-sm">
                    {shippingAddress.firstname} {shippingAddress.lastname}
                    {shippingAddress.company && <span className="block text-muted-foreground">{shippingAddress.company}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shippingAddress.street}<br />
                    {shippingAddress.postcode} {shippingAddress.city}, {shippingAddress.country_id}
                  </p>
                  {shippingAddress.telephone && (
                    <p className="text-sm text-muted-foreground mt-1">Tel: {shippingAddress.telephone}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Articoli Ordinati ({orderDetails.order_items?.length || 0})</h4>
                <div className="space-y-2">
                  {orderDetails.order_items?.map((item, index) => {
                    const qty = parseFloat(item.qty_ordered) || 1;
                    const unitPrice = parseFloat(item.price) || 0;
                    const rowTotal = item.base_row_total ? parseFloat(item.base_row_total) : (unitPrice * qty);
                    
                    return (
                      <div key={item.item_id || index} className="flex items-start gap-3 p-3 border rounded-md">
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.name || t("common.product")}</p>
                          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(unitPrice)} cad.</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm">Qtà: {qty}</p>
                          <p className="font-semibold">{formatPrice(rowTotal)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>Creato: {format(new Date(orderDetails.created_at), "d MMMM yyyy, HH:mm", { locale: it })}</p>
                {orderDetails.updated_at && (
                  <p>Aggiornato: {format(new Date(orderDetails.updated_at), "d MMMM yyyy, HH:mm", { locale: it })}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
