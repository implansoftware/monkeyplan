import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Package, Truck, Check, X, Clock, Send, MapPin, Smartphone, Euro, CreditCard, Store, Download, ChevronRight, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Link } from "wouter";
import type { RemoteRepairRequest, RemoteRepairRequestDevice } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type EnrichedRequest = RemoteRepairRequest & {
  devices: RemoteRepairRequestDevice[];
  centerName?: string | null;
  centerAddress?: string | null;
  centerCity?: string | null;
  centerCap?: string | null;
  centerProvince?: string | null;
  centerPhone?: string | null;
  branchName?: string | null;
  branchContactName?: string | null;
};


function StripePaymentForm({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsProcessing(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + "/customer/remote-requests" },
        redirect: "if_required",
      });
      if (error) {
        onError(error.message || t("customerPages.paymentError"));
      } else if (paymentIntent?.status === "succeeded") {
        onSuccess();
      } else {
        onError(t("customerPages.paymentNotCompleted"));
      }
    } catch (err: any) {
      onError(err.message || t("customerPages.unexpectedError"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isProcessing} className="w-full" data-testid="button-stripe-submit">
        {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
        {isProcessing ? t("common.processing") : t("customerPages.payNow")}
      </Button>
    </form>
  );
}

function RequestCard({
  request,
  onShip,
  onAcceptQuote,
  onDeclineQuote,
  onStripePayment,
  onPayPalPayment,
  onCapturePayPal,
  isProcessingPayment,
  pendingPaypalCapture,
  acceptQuotePending,
  declineQuotePending,
}: {
  request: EnrichedRequest;
  onShip: (r: EnrichedRequest) => void;
  onAcceptQuote: (id: string, method: string) => void;
  onDeclineQuote: (id: string) => void;
  onStripePayment: (r: EnrichedRequest) => void;
  onPayPalPayment: (r: EnrichedRequest) => void;
  onCapturePayPal: (requestId: string, orderID: string) => void;
  isProcessingPayment: boolean;
  pendingPaypalCapture: { token: string; requestId?: string } | null;
  acceptQuotePending: boolean;
  declineQuotePending: boolean;
}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: any }> = {
    pending: { label: t("b2b.status.pending"), variant: "secondary", icon: Clock },
    assigned: { label: t("remoteRequests.assigned"), variant: "outline" },
    accepted: { label: t("remoteRequests.accepted"), variant: "default" },
    rejected: { label: t("common.rejected"), variant: "destructive" },
    awaiting_shipment: { label: t("remoteRequests.awaitingShipment"), variant: "outline", icon: Package },
    in_transit: { label: t("shipping.inTransit"), variant: "default", icon: Truck },
    received: { label: t("repairs.status.received"), variant: "default", icon: Check },
    repair_created: { label: t("repairs.status.inRepair"), variant: "default" },
    cancelled: { label: t("common.cancelled"), variant: "destructive" },
    quoted: { label: t("remoteRequests.quoteReceived"), variant: "outline", icon: Euro },
    quote_accepted: { label: t("remoteRequests.quoteAccepted"), variant: "default" },
    quote_declined: { label: t("remoteRequests.quoteDeclined"), variant: "destructive" },
  };
  const sc = statusConfig[request.status] || { label: request.status, variant: "secondary" as const };
  const deviceCount = request.devices?.length || 0;
  const totalQty = request.devices?.reduce((s, d) => s + (d.quantity || 1), 0) || 0;
  const hasQuote = request.quoteAmount && request.status !== 'quote_declined';
  const needsAction = request.status === 'quoted' || request.status === 'awaiting_shipment' || (request.status === 'quote_accepted' && request.paymentStatus !== 'paid');

  return (
    <Card className={needsAction ? "border-primary/30" : ""} data-testid={`card-request-${request.id}`}>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        data-testid={`toggle-request-${request.id}`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" data-testid={`text-request-number-${request.id}`}>{request.requestNumber}</span>
                <Badge variant={sc.variant} data-testid={`badge-status-${request.id}`}>
                  {sc.label}
                </Badge>
                {needsAction && (
                  <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {t("customerPages.actionRequired")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span>{format(new Date(request.createdAt), "d MMM yyyy", { locale: it })}</span>
                <span>·</span>
                <span>{deviceCount === 1 ? t("remote.deviceCountLabel", { count: deviceCount }) : t("remote.deviceCountLabelPlural", { count: deviceCount })}{totalQty > deviceCount ? ` (${t("remote.unitsCount", { qty: totalQty })})` : ""}</span>
                {request.branchName && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-foreground">{request.branchName}</span>
                  </>
                )}
                {request.quoteAmount && request.status !== 'quote_declined' && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-foreground">{(request.quoteAmount / 100).toFixed(2)} EUR</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </div>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="border-t pt-4" />

          {request.status === "awaiting_shipment" && (
            <div className="space-y-3 p-4 border border-primary/20 rounded-md bg-primary/5" data-testid={`shipping-info-${request.id}`}>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm font-semibold">{t("customerPages.shipYourDevices")}</span>
              </div>
              {request.centerAddress ? (
                <div className="flex items-start gap-3 p-3 bg-background rounded-md border">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{t("customerPages.shipTo")}</p>
                    <p className="text-sm font-medium" data-testid={`text-ship-to-name-${request.id}`}>{request.centerName}</p>
                    <p className="text-sm" data-testid={`text-ship-to-address-${request.id}`}>
                      {request.centerAddress}
                      {request.centerCap || request.centerCity ? (
                        <>, {[request.centerCap, request.centerCity].filter(Boolean).join(" ")}</>
                      ) : null}
                      {request.centerProvince ? ` (${request.centerProvince})` : ""}
                    </p>
                    {request.centerPhone && (
                      <p className="text-xs text-muted-foreground mt-1">Tel: {request.centerPhone}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-background rounded-md border">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-sm text-muted-foreground">{t("customerPages.indirizzoDiSpedizioneInFaseDiAssegnazione")}</p>
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); window.open(`/api/customer/remote-requests/${request.id}/ddt`, "_blank"); }}
                  data-testid={`button-download-ddt-${request.id}`}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  {t("customerPages.downloadDDT")}
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onShip(request); }}
                  data-testid={`button-ship-${request.id}`}
                >
                  <Truck className="h-4 w-4 mr-1.5" />
                  {t("customerPages.enterTracking")}
                </Button>
              </div>
            </div>
          )}

          {request.devices?.map((device) => (
            <div key={device.id} className="p-3 border rounded-md space-y-2" data-testid={`device-${device.id}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{device.brand} {device.model}</p>
                    <p className="text-xs text-muted-foreground">{device.deviceType} · {t("remote.qtyLabel", { qty: device.quantity })}</p>
                  </div>
                </div>
                <Badge variant={statusConfig[device.status]?.variant || "secondary"} className="text-xs shrink-0">
                  {statusConfig[device.status]?.label || device.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{device.issueDescription}</p>
              {device.photos && device.photos.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {device.photos.map((photo: string, pi: number) => (
                    <a key={pi} href={photo} target="_blank" rel="noopener noreferrer" data-testid={`link-photo-${device.id}-${pi}`}>
                      <img src={photo} alt={t("customerPages.photoAlt", { number: pi + 1 })} className="w-12 h-12 object-cover rounded-md border transition-opacity" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasQuote && (
            <div className="p-4 border rounded-md bg-muted/20 space-y-3" data-testid={`quote-card-${request.id}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t("repairs.quote")}</span>
                </div>
                <Badge variant={request.paymentStatus === 'paid' ? 'default' : 'outline'}>
                  {request.paymentStatus === 'paid' ? t("customerPages.paidStatus") : request.status === 'quote_accepted' ? t("customerPages.toPayStatus") : request.status === 'quoted' ? t("customerPages.waitingStatus") : t("customerPages.acceptedStatus")}
                </Badge>
              </div>
              <div>
                <p className="text-xl font-bold" data-testid={`text-quote-amount-${request.id}`}>
                  {(request.quoteAmount! / 100).toFixed(2)} EUR
                </p>
                {request.quoteDescription && <p className="text-sm text-muted-foreground mt-1">{request.quoteDescription}</p>}
                {request.quoteValidUntil && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("customerPages.validUntil", { date: format(new Date(request.quoteValidUntil), "d MMMM yyyy", { locale: it }) })}
                  </p>
                )}
              </div>

              {request.status === 'quoted' && (
                <div className="space-y-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">{t("customerPages.chooseHowToProceed")}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onAcceptQuote(request.id, 'in_store'); }}
                      disabled={acceptQuotePending}
                      data-testid={`button-pay-in-store-${request.id}`}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      {t("customerPages.inStorePayment")}
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); onAcceptQuote(request.id, 'online_stripe'); }}
                      disabled={acceptQuotePending}
                      data-testid={`button-pay-stripe-${request.id}`}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {t("customerPages.cardLabel")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => { e.stopPropagation(); onAcceptQuote(request.id, 'online_paypal'); }}
                      disabled={acceptQuotePending}
                      data-testid={`button-pay-paypal-${request.id}`}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      PayPal
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => { e.stopPropagation(); onDeclineQuote(request.id); }}
                    disabled={declineQuotePending}
                    data-testid={`button-decline-quote-${request.id}`}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    {t("customerPages.declineQuote")}
                  </Button>
                </div>
              )}

              {request.status === 'quote_accepted' && request.paymentStatus !== 'paid' && (
                <div className="space-y-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">{t("customerPages.completePaymentToProceed")}</p>
                  <div className="flex flex-wrap gap-2">
                    {request.paymentMethod === 'online_stripe' && (
                      <Button
                        onClick={(e) => { e.stopPropagation(); onStripePayment(request); }}
                        disabled={isProcessingPayment}
                        data-testid={`button-checkout-stripe-${request.id}`}
                      >
                        {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                        {t("customerPages.payWithCard")}
                      </Button>
                    )}
                    {request.paymentMethod === 'online_paypal' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); onPayPalPayment(request); }}
                          disabled={isProcessingPayment}
                          data-testid={`button-checkout-paypal-${request.id}`}
                        >
                          {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                          {request.paypalOrderId ? t("customerPages.retryPayPal") : t("customerPages.openPayPal")}
                        </Button>
                        {pendingPaypalCapture && pendingPaypalCapture.token === request.paypalOrderId && (
                          <Button
                            onClick={(e) => { e.stopPropagation(); onCapturePayPal(request.id, request.paypalOrderId!); }}
                            disabled={isProcessingPayment}
                            data-testid={`button-retry-paypal-${request.id}`}
                          >
                            {isProcessingPayment ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                            {t("customerPages.confirmPayment")}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {request.paymentStatus === 'paid' && (
                <div className="flex items-center justify-between gap-2 flex-wrap pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">{t("customerPages.pagamentoCompletato")}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const res = await fetch(`/api/invoices/by-remote-request/${request.id}`, { credentials: 'include' });
                        if (!res.ok) {
                          toast({ title: t("customerPages.invoiceNotAvailable"), description: t("customerPages.invoiceMayNotBeGenerated"), variant: "destructive" });
                          return;
                        }
                        const invoice = await res.json();
                        window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
                      } catch {
                        toast({ title: t("auth.error"), description: t("remoteRequests.downloadInvoiceError"), variant: "destructive" });
                      }
                    }}
                    data-testid={`button-download-invoice-${request.id}`}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    {t("customerPages.invoiceLabel")}
                  </Button>
                </div>
              )}
              {request.paymentMethod === 'in_store' && request.paymentStatus !== 'paid' && request.status !== 'quoted' && (
                <p className="text-xs text-muted-foreground pt-2">{t("customerPages.payInStoreOnDelivery")}</p>
              )}
            </div>
          )}

          {request.status === 'quote_declined' && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
              <X className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{t("customerPages.preventivoRifiutatoLaRichiestaStataChiusa")}</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="p-3 bg-destructive/10 rounded-md">
              <p className="text-xs text-muted-foreground mb-0.5">{t("customerPages.rejectionReason")}</p>
              <p className="text-sm text-destructive">{request.rejectionReason}</p>
            </div>
          )}

          {request.trackingNumber && (
            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-md">
              <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{t("customerPages.shippingTracking")}</p>
                <p className="text-sm font-medium">{request.courierName}: {request.trackingNumber}</p>
              </div>
            </div>
          )}

          {request.centerName && request.status !== "awaiting_shipment" && (
            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-md">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{t("customerPages.repairCenterLabel")}</p>
                <p className="text-sm font-medium">{request.centerName}</p>
                {request.centerAddress && (
                  <p className="text-xs text-muted-foreground">
                    {request.centerAddress}
                    {request.centerCap || request.centerCity ? `, ${[request.centerCap, request.centerCity].filter(Boolean).join(" ")}` : ""}
                    {request.centerProvince ? ` (${request.centerProvince})` : ""}
                  </p>
                )}
                {request.centerPhone && (
                  <p className="text-xs text-muted-foreground">Tel: {request.centerPhone}</p>
                )}
              </div>
            </div>
          )}

          {request.customerNotes && (
            <div className="text-sm">
              <p className="text-xs text-muted-foreground mb-0.5">{t("customerPages.yourNotes")}</p>
              <p className="text-muted-foreground">{request.customerNotes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function CustomerRemoteRequests() {
  const { t } = useTranslation();
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: any }> = {
    pending: { label: t("b2b.status.pending"), variant: "secondary", icon: Clock },
    assigned: { label: t("remoteRequests.assigned"), variant: "outline" },
    accepted: { label: t("remoteRequests.accepted"), variant: "default" },
    rejected: { label: t("common.rejected"), variant: "destructive" },
    awaiting_shipment: { label: t("remoteRequests.awaitingShipment"), variant: "outline", icon: Package },
    in_transit: { label: t("shipping.inTransit"), variant: "default", icon: Truck },
    received: { label: t("repairs.status.received"), variant: "default", icon: Check },
    repair_created: { label: t("repairs.status.inRepair"), variant: "default" },
    cancelled: { label: t("common.cancelled"), variant: "destructive" },
    quoted: { label: t("remoteRequests.quoteReceived"), variant: "outline", icon: Euro },
    quote_accepted: { label: t("remoteRequests.quoteAccepted"), variant: "default" },
    quote_declined: { label: t("remoteRequests.quoteDeclined"), variant: "destructive" },
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrichedRequest | null>(null);

  const [shippingInfo, setShippingInfo] = useState({
    courierName: "",
    trackingNumber: "",
  });

  const { data: requests, isLoading } = useQuery<EnrichedRequest[]>({
    queryKey: ["/api/customer/remote-requests"],
  });

  const shippingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof shippingInfo }) => {
      const res = await apiRequest("PATCH", `/api/customer/remote-requests/${id}/shipping`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setIsShippingOpen(false);
      setSelectedRequest(null);
      setShippingInfo({ courierName: "", trackingNumber: "" });
      toast({ title: t("customerPages.shippingConfirmed"), description: t("customerPages.shippingDataSaved") });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<EnrichedRequest | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const acceptQuoteMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: string; paymentMethod: string }) => {
      const res = await apiRequest("PATCH", `/api/customer/remote-requests/${id}/accept-quote`, { paymentMethod });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      if (data.paymentMethod === 'in_store') {
        toast({ title: t("customerPages.quoteAcceptedToast"), description: t("customerPages.proceedWithShippingInStore") });
      } else {
        toast({ title: t("customerPages.quoteAcceptedToast"), description: t("customerPages.proceedWithOnlinePayment") });
      }
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const declineQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/customer/remote-requests/${id}/decline-quote`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      toast({ title: t("customerPages.quoteDeclinedToast"), description: t("customerPages.laRichiestaStataChiusa") });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const initiateStripePayment = async (request: EnrichedRequest) => {
    try {
      setIsProcessingPayment(true);
      setPaymentRequest(request);
      const res = await apiRequest("POST", "/api/customer/remote-requests/stripe-payment", { requestId: request.id });
      const data = await res.json();
      setStripeClientSecret(data.clientSecret);
      setStripePromise(loadStripe(data.publishableKey));
      setIsPaymentOpen(true);
    } catch (error: any) {
      toast({ title: t("auth.error"), description: error.message || t("customerPages.paymentStartError"), variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const initiatePayPalPayment = async (request: EnrichedRequest) => {
    try {
      setIsProcessingPayment(true);
      const res = await apiRequest("POST", "/api/customer/remote-requests/paypal-create", { requestId: request.id });
      const data = await res.json();
      const approveUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${data.orderID}`;
      window.location.href = approveUrl;
    } catch (error: any) {
      toast({ title: t("auth.error"), description: error.message || t("customerPages.paypalStartError"), variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const capturePayPalPayment = async (requestId: string, orderID: string) => {
    try {
      setIsProcessingPayment(true);
      const res = await apiRequest("POST", "/api/customer/remote-requests/paypal-capture", { requestId, orderID });
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setPaymentRequest(null);
      toast({ title: t("customerPages.paypalCompleted"), description: t("customerPages.proceedWithDeviceShipping") });
    } catch (error: any) {
      toast({ title: t("customerPages.erroreConfermaPayPal"), description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const [pendingPaypalCapture, setPendingPaypalCapture] = useState<{token: string, requestId?: string} | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paypalToken = urlParams.get('token');
    if (!paypalToken) return;
    if (pendingPaypalCapture?.token === paypalToken) return;
    setPendingPaypalCapture({ token: paypalToken });
  }, []);

  useEffect(() => {
    if (!pendingPaypalCapture || !requests || pendingPaypalCapture.requestId) return;
    
    const matchingRequest = (requests as EnrichedRequest[]).find(
      (r: EnrichedRequest) => r.paypalOrderId === pendingPaypalCapture.token && r.paymentStatus !== 'paid'
    );
    
    if (matchingRequest) {
      setPendingPaypalCapture(prev => prev ? { ...prev, requestId: matchingRequest.id } : null);
      (async () => {
        try {
          setIsProcessingPayment(true);
          const res = await apiRequest("POST", "/api/customer/remote-requests/paypal-capture", { 
            requestId: matchingRequest.id, 
            orderID: pendingPaypalCapture.token 
          });
          await res.json();
          queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
          window.history.replaceState({}, '', window.location.pathname);
          setPendingPaypalCapture(null);
          toast({ title: t("customerPages.paypalCompleted"), description: t("customerPages.proceedWithDeviceShipping") });
        } catch (error: any) {
          toast({ title: t("customerPages.erroreConfermaPayPal"), description: t("customerPages.retryBelow"), variant: "destructive" });
        } finally {
          setIsProcessingPayment(false);
        }
      })();
    }
  }, [requests, pendingPaypalCapture]);

  const confirmStripePayment = async (requestId: string) => {
    try {
      const res = await apiRequest("POST", "/api/customer/remote-requests/stripe-confirm", { requestId });
      await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/customer/remote-requests"] });
      setIsPaymentOpen(false);
      setStripeClientSecret(null);
      setStripePromise(null);
      setPaymentRequest(null);
      toast({ title: t("customerPages.pagamentoCompletato"), description: t("customerPages.proceedWithDeviceShipping") });
    } catch (error: any) {
      toast({ title: t("customerPages.erroreConferma"), description: error.message, variant: "destructive" });
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest) {
      shippingMutation.mutate({ id: selectedRequest.id, data: shippingInfo });
    }
  };

  const openShippingDialog = (request: EnrichedRequest) => {
    setSelectedRequest(request);
    setIsShippingOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const actionRequiredCount = requests?.filter(r =>
    r.status === 'quoted' || r.status === 'awaiting_shipment' || (r.status === 'quote_accepted' && r.paymentStatus !== 'paid')
  ).length || 0;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">{t("customerPages.requestRepairTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("customerPages.sendDevicesDesc")}
          </p>
        </div>
        <Link href="/customer/remote-requests/new">
          <Button data-testid="button-new-request">
            <Plus className="h-4 w-4 mr-2" />
            {t("customerPages.newRequest")}
          </Button>
        </Link>
      </div>

      {actionRequiredCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-md border border-primary/30 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm">
            {actionRequiredCount === 1 ? t("customerPages.attentionRequiredSingular", { count: actionRequiredCount }) : t("customerPages.attentionRequired", { count: actionRequiredCount })}
          </p>
        </div>
      )}

      {requests && requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Send className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium" data-testid="text-empty-title">{t("customerPages.nessunaRichiestaAncora")}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            {t("customerPages.emptyStateDesc")}
          </p>
          <Link href="/customer/remote-requests/new">
            <Button className="mt-4" data-testid="button-empty-new-request">
              <Plus className="h-4 w-4 mr-2" />
              {t("customerPages.createFirstRequest")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests?.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onShip={openShippingDialog}
              onAcceptQuote={(id, method) => acceptQuoteMutation.mutate({ id, paymentMethod: method })}
              onDeclineQuote={(id) => declineQuoteMutation.mutate(id)}
              onStripePayment={initiateStripePayment}
              onPayPalPayment={initiatePayPalPayment}
              onCapturePayPal={capturePayPalPayment}
              isProcessingPayment={isProcessingPayment}
              pendingPaypalCapture={pendingPaypalCapture}
              acceptQuotePending={acceptQuoteMutation.isPending}
              declineQuotePending={declineQuoteMutation.isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={isShippingOpen} onOpenChange={setIsShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customerPages.shippingDataTitle")}</DialogTitle>
            <DialogDescription>
              {t("customerPages.enterCourierAndTracking", { number: selectedRequest?.requestNumber })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleShippingSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("shipping.carrier")}</Label>
              <Select value={shippingInfo.courierName} onValueChange={(v) => setShippingInfo({ ...shippingInfo, courierName: v })}>
                <SelectTrigger data-testid="select-courier">
                  <SelectValue placeholder={t("customerPages.selezionaCorriere")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRT">BRT</SelectItem>
                  <SelectItem value="DHL">DHL</SelectItem>
                  <SelectItem value="GLS">GLS</SelectItem>
                  <SelectItem value="UPS">UPS</SelectItem>
                  <SelectItem value="TNT">TNT</SelectItem>
                  <SelectItem value="FedEx">FedEx</SelectItem>
                  <SelectItem value="Poste Italiane">Poste Italiane</SelectItem>
                  <SelectItem value="SDA">SDA</SelectItem>
                  <SelectItem value="Nexive">Nexive</SelectItem>
                  <SelectItem value="Altro">{t("common.more")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("customerPages.trackingNumberLabel")}</Label>
              <Input
                value={shippingInfo.trackingNumber}
                onChange={(e) => setShippingInfo({ ...shippingInfo, trackingNumber: e.target.value })}
                placeholder={t("customerPages.trackingNumberPlaceholder")}
                data-testid="input-tracking-number"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsShippingOpen(false)} data-testid="button-cancel-shipping">
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={shippingMutation.isPending} data-testid="button-confirm-shipping">
                {shippingMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />}
                {t("customerPages.confirmShipping")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("customerPages.pagamentoConCarta")}</DialogTitle>
            <DialogDescription>
              Importo: {paymentRequest?.quoteAmount ? `${(paymentRequest.quoteAmount / 100).toFixed(2)} EUR` : ""}
            </DialogDescription>
          </DialogHeader>
          {stripePromise && stripeClientSecret && paymentRequest && (
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
              <StripePaymentForm
                onSuccess={() => confirmStripePayment(paymentRequest.id)}
                onError={(msg) => toast({ title: t("customerPages.errorePagamento"), description: msg, variant: "destructive" })}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
