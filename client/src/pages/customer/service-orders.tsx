import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Clock, Check, X, Package, Truck, MapPin, Download, Banknote, Building, ClipboardList } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ServiceOrder } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";


export default function CustomerServiceOrders() {
  const { t } = useTranslation();
  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("b2b.status.pending"), variant: "secondary" },
    accepted: { label: t("standalone.accepted"), variant: "default" },
    scheduled: { label: t("customerPages.scheduledLabel"), variant: "outline" },
    in_progress: { label: t("tickets.status.inProgress"), variant: "default" },
    completed: { label: t("repairs.status.completed"), variant: "default" },
    cancelled: { label: t("repairs.status.cancelled"), variant: "destructive" },
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<ServiceOrder | null>(null);
  const [deliveryForm, setDeliveryForm] = useState({
    deliveryMethod: "in_person" as "in_person" | "shipping",
    shippingAddress: "",
    shippingCity: "",
    shippingCap: "",
    shippingProvince: "",
    courierName: "",
    trackingNumber: "",
  });

  const { data: orders, isLoading } = useQuery<ServiceOrder[]>({
    queryKey: ["/api/customer/service-orders"],
  });

  const { data: myReseller } = useQuery<{
    id: string;
    fullName: string;
    ragioneSociale: string | null;
    iban: string | null;
    email: string | null;
    phone: string | null;
    indirizzo: string | null;
    cap: string | null;
    citta: string | null;
    provincia: string | null;
  }>({
    queryKey: ["/api/customer/my-reseller"],
    enabled: !!user?.resellerId,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/customer/service-orders/${orderId}/cancel`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/service-orders"] });
      toast({ title: t("customerPages.orderCancelled") });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const setDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/customer/service-orders/${orderId}/set-delivery`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/service-orders"] });
      setIsDeliveryDialogOpen(false);
      setSelectedOrderForDelivery(null);
      setDeliveryForm({
        deliveryMethod: "in_person",
        shippingAddress: "",
        shippingCity: "",
        shippingCap: "",
        shippingProvince: "",
        courierName: "",
        trackingNumber: "",
      });
      if (data.deliveryMethod === "shipping") {
        toast({ title: t("customerPages.shippingConfirmedDdt"), description: t("customerPages.ddtGenerated") });
      } else {
        toast({ title: t("customerPages.inPersonConfirmed"), description: t("customerPages.bringDeviceToReseller") });
      }
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const downloadDdtMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("GET", `/api/customer/service-orders/${orderId}/ddt`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSetDelivery = (order: ServiceOrder) => {
    setSelectedOrderForDelivery(order);
    setIsDeliveryDialogOpen(true);
  };

  const handleSubmitDelivery = () => {
    if (!selectedOrderForDelivery) return;

    const data: any = {
      deliveryMethod: deliveryForm.deliveryMethod,
    };

    if (deliveryForm.deliveryMethod === "shipping") {
      data.shippingAddress = myReseller?.indirizzo || "";
      data.shippingCity = myReseller?.citta || "";
      data.shippingCap = myReseller?.cap || "";
      data.shippingProvince = myReseller?.provincia || "";
      data.courierName = deliveryForm.courierName;
      data.trackingNumber = deliveryForm.trackingNumber;
    }

    setDeliveryMutation.mutate({ orderId: selectedOrderForDelivery.id, data });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="relative flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t("sidebar.items.myOrders")}</h1>
              <p className="text-white/80 text-sm">{t("customerPages.gestisciITuoiOrdiniDiServizio")}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
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
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("sidebar.items.myOrders")}</h1>
            <p className="text-white/80 text-sm">{t("customerPages.gestisciITuoiOrdiniDiServizio")}</p>
          </div>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t("customerPages.noOrdersYetServiceDesc")}</p>
            <p className="text-sm mt-2">{t("customerPages.goToServiceCatalog")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} data-testid={`card-order-${order.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    <CardDescription>
                      {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                    </CardDescription>
                  </div>
                  <Badge variant={statusLabels[order.status]?.variant || "outline"}>
                    {statusLabels[order.status]?.label || order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.brand && order.model && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("customerPages.deviceLabel2")}</span> {order.brand} {order.model}
                  </p>
                )}
                {order.issueDescription && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("customerPages.issueLabel")}</span> {order.issueDescription}
                  </p>
                )}
                <p className="text-sm font-medium">
                  {t("customerPages.amountLabel")} {formatPrice(order.priceCents)}
                </p>

                {(order as any).paymentMethod === "bank_transfer" && (
                  <div className="p-3 bg-muted rounded-md text-sm" data-testid={`bank-info-${order.id}`}>
                    <p className="font-medium mb-1">{t("customerPages.pagamentoConBonifico")}</p>
                    {myReseller ? (
                      <>
                        <p><span className="text-muted-foreground">{t("customerPages.accountHolder")}</span> {myReseller.ragioneSociale || myReseller.fullName}</p>
                        {myReseller.iban ? (
                          <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{myReseller.iban}</span></p>
                        ) : (
                          <p className="text-amber-600">{t("customerPages.ibanNotConfigured")}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground">{t("customerPages.contactResellerBank")}</p>
                    )}
                  </div>
                )}

                {order.scheduledAt && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("customerPages.appointmentLabel")}:</span>{" "}
                    {format(new Date(order.scheduledAt), "dd MMM yyyy HH:mm", { locale: it })}
                  </p>
                )}

                {order.deliveryMethod && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {order.deliveryMethod === "shipping" ? (
                        <><Truck className="w-4 h-4" /> {t("common.shipment")}</>
                      ) : (
                        <><MapPin className="w-4 h-4" /> {t("customerPages.inPersonDelivery")}</>
                      )}
                    </p>
                    {order.deliveryMethod === "shipping" && order.trackingNumber && (
                      <p className="text-sm text-muted-foreground">
                        Tracking: {order.trackingNumber}
                      </p>
                    )}
                    {order.deviceReceivedAt && (
                      <Badge variant="default" className="mt-1">
                        <Check className="w-3 h-3 mr-1" /> {t("customerPages.deviceReceivedBadge")}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="pt-2 flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => cancelOrderMutation.mutate(order.id)}
                      disabled={cancelOrderMutation.isPending}
                      data-testid={`button-cancel-order-${order.id}`}
                    >
                      {cancelOrderMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      {t("customerPages.cancelOrder")}
                    </Button>
                  )}

                  {["accepted", "scheduled"].includes(order.status) && !order.deliveryMethod && (
                    <Button
                      size="sm"
                      onClick={() => handleSetDelivery(order)}
                      data-testid={`button-set-delivery-${order.id}`}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      {t("customerPages.chooseDelivery")}
                    </Button>
                  )}

                  {order.ddtUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDdtMutation.mutate(order.id)}
                      disabled={downloadDdtMutation.isPending}
                      data-testid={`button-download-ddt-${order.id}`}
                    >
                      {downloadDdtMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {t("customerPages.downloadDdt")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("customerPages.deliveryDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("customerPages.deliveryDialogDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup
              value={deliveryForm.deliveryMethod}
              onValueChange={(value) =>
                setDeliveryForm({ ...deliveryForm, deliveryMethod: value as "in_person" | "shipping" })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in_person" id="in_person" data-testid="radio-in-person" />
                <Label htmlFor="in_person" className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <MapPin className="w-4 h-4" />
                  {t("customerPages.inPersonDelivery")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="shipping" id="shipping" data-testid="radio-shipping" />
                <Label htmlFor="shipping" className="flex flex-wrap items-center gap-2 cursor-pointer">
                  <Truck className="w-4 h-4" />
                  {t("customerPages.shippingOption")}
                </Label>
              </div>
            </RadioGroup>

            {deliveryForm.deliveryMethod === "shipping" && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md border" data-testid="shipping-destination">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t("customerPages.shipTo")}</p>
                    <p className="text-sm font-medium" data-testid="text-ship-to-name">
                      {myReseller?.ragioneSociale || myReseller?.fullName || t("customerPages.resellerLabel")}
                    </p>
                    {myReseller?.indirizzo ? (
                      <p className="text-sm" data-testid="text-ship-to-address">
                        {myReseller.indirizzo}
                        {myReseller.cap || myReseller.citta ? (
                          <>, {[myReseller.cap, myReseller.citta].filter(Boolean).join(" ")}</>
                        ) : null}
                        {myReseller.provincia ? ` (${myReseller.provincia})` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t("customerPages.contactResellerAddress")}</p>
                    )}
                    {myReseller?.phone && (
                      <p className="text-xs text-muted-foreground mt-1">Tel: {myReseller.phone}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("shipping.carrier")}</Label>
                    <Input
                      value={deliveryForm.courierName}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, courierName: e.target.value })}
                      placeholder={t("customerPages.courierPlaceholder")}
                      data-testid="input-courier-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("shipping.trackingNumber")}</Label>
                    <Input
                      value={deliveryForm.trackingNumber}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, trackingNumber: e.target.value })}
                      placeholder={t("customerPages.trackingPlaceholder")}
                      data-testid="input-tracking-number"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              {t("customerPages.cancelButton")}
            </Button>
            <Button onClick={handleSubmitDelivery} disabled={setDeliveryMutation.isPending} data-testid="button-confirm-delivery">
              {setDeliveryMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t("customerPages.confirmButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
