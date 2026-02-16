import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Clock, Calendar, CheckCircle2, AlertTriangle, CreditCard, History, Loader2 } from "lucide-react";
import { SiStripe, SiPaypal } from "react-icons/si";
import type { LicensePlan, License } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface MyLicenseResponse {
  license: License | null;
  plan: LicensePlan | null;
  daysRemaining?: number;
  isExpiringSoon?: boolean;
  isExpired: boolean;
}

interface EnrichedHistory {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  paymentId?: string | null;
  autoRenew?: boolean;
  notes?: string | null;
  createdAt: string;
  planName: string;
  planDuration: number;
  planPrice: number;
  planDescription?: string | null;
  planFeatures?: string | null;
  planMaxStaffUsers?: number | null;
}

interface PaymentMethods {
  stripe: boolean;
  paypal: boolean;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  expired: "destructive",
  cancelled: "secondary",
  pending: "outline",
};

export default function MyLicense() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const DURATION_LABELS: Record<number, string> = {
    1: t("license.month1"),
    3: t("license.month3"),
    6: t("license.month6"),
    12: t("license.month12"),
  };

  const STATUS_LABELS: Record<string, string> = {
    active: t("license.statusActive"),
    expired: t("license.statusExpired"),
    cancelled: t("license.statusCancelled"),
    pending: t("license.statusPending"),
  };
  const [selectedPlan, setSelectedPlan] = useState<LicensePlan | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<EnrichedHistory | null>(null);

  const { data: currentLicense, isLoading: loadingCurrent } = useQuery<MyLicenseResponse>({
    queryKey: ["/api/licenses/my"],
  });

  const { data: plans, isLoading: loadingPlans } = useQuery<LicensePlan[]>({
    queryKey: ["/api/licenses/plans"],
  });

  const { data: history } = useQuery<EnrichedHistory[]>({
    queryKey: ["/api/licenses/history"],
  });

  const { data: paymentMethods } = useQuery<PaymentMethods>({
    queryKey: ["/api/licenses/payment-methods"],
  });

  const confirmStripeMutation = useMutation({
    mutationFn: async (data: { licenseId: string; sessionId: string }) => {
      const res = await apiRequest("POST", "/api/licenses/confirm-stripe", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.confirmed || data.alreadyActive) {
        queryClient.invalidateQueries({ queryKey: ["/api/licenses/my"] });
        queryClient.invalidateQueries({ queryKey: ["/api/licenses/history"] });
        toast({ title: t("license.paymentConfirmed"), description: t("license.licenseNowActive") });
      } else {
        toast({ title: t("license.paymentProcessing"), description: t("license.paymentNotConfirmedYet"), variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: t("license.error"), description: err.message, variant: "destructive" });
    },
  });

  const confirmPaypalMutation = useMutation({
    mutationFn: async (data: { licenseId: string; orderID: string }) => {
      const res = await apiRequest("POST", "/api/licenses/confirm-paypal", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.confirmed || data.alreadyActive) {
        queryClient.invalidateQueries({ queryKey: ["/api/licenses/my"] });
        queryClient.invalidateQueries({ queryKey: ["/api/licenses/history"] });
        toast({ title: t("license.paypalPaymentConfirmed"), description: t("license.licenseNowActive") });
      } else {
        toast({ title: t("license.paymentProcessing"), description: t("license.paypalPaymentNotConfirmed"), variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: t("license.error"), description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentSuccess = params.get("payment_success");
    const licenseId = params.get("license_id");
    const stripeSessionId = params.get("stripe_session_id");
    const paypalOrderId = params.get("paypal_order_id");
    const paymentCancelled = params.get("payment_cancelled");

    if (paymentCancelled) {
      toast({ title: t("license.paymentCancelled"), description: t("license.paymentCancelledDesc"), variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (paymentSuccess && licenseId && stripeSessionId) {
      confirmStripeMutation.mutate({ licenseId, sessionId: stripeSessionId });
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (paymentSuccess && licenseId && paypalOrderId) {
      confirmPaypalMutation.mutate({ licenseId, orderID: paypalOrderId });
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    const paymentMethod = params.get("payment_method");
    if (paymentSuccess && licenseId && paymentMethod === "paypal") {
      const storedOrderId = localStorage.getItem("monkeyplan_paypal_order_id");
      if (storedOrderId) {
        localStorage.removeItem("monkeyplan_paypal_order_id");
        localStorage.removeItem("monkeyplan_paypal_license_id");
        confirmPaypalMutation.mutate({ licenseId, orderID: storedOrderId });
      }
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
  }, []);

  const handleActivatePlan = (plan: LicensePlan) => {
    if (plan.priceCents === 0) {
      handlePayment(plan, "free");
      return;
    }
    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  };

  const handlePayment = async (plan: LicensePlan, method: string) => {
    setIsProcessing(true);
    try {
      const res = await apiRequest("POST", "/api/licenses/activate", {
        licensePlanId: plan.id,
        paymentMethod: method,
      });
      const data = await res.json();

      if (data.free) {
        queryClient.invalidateQueries({ queryKey: ["/api/licenses/my"] });
        queryClient.invalidateQueries({ queryKey: ["/api/licenses/history"] });
        toast({ title: t("license.licenseActivated"), description: t("license.freePlanActivated") });
        setIsPaymentDialogOpen(false);
        setSelectedPlan(null);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.approveUrl) {
        localStorage.setItem("monkeyplan_paypal_order_id", data.orderID);
        localStorage.setItem("monkeyplan_paypal_license_id", data.license?.id || "");
        window.location.href = data.approveUrl;
        return;
      }

      toast({ title: t("license.error"), description: t("license.noPaymentUrl"), variant: "destructive" });
    } catch (err: any) {
      toast({ title: t("license.error"), description: err.message || t("license.activationError"), variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingCurrent || loadingPlans) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    );
  }

  const hasActiveLicense = currentLicense?.license && !currentLicense.isExpired;
  const hasStripe = paymentMethods?.stripe ?? false;
  const hasPaypal = paymentMethods?.paypal ?? false;
  const hasAnyPaymentMethod = hasStripe || hasPaypal;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("license.myLicense")}</h1>
        <p className="text-sm text-muted-foreground">{t("license.manageSubscription")}</p>
      </div>

      {hasActiveLicense && currentLicense.license && currentLicense.plan ? (
        <Card className="border-emerald-200 dark:border-emerald-800" data-testid="card-current-license">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-lg">{currentLicense.plan.name}</CardTitle>
                <Badge variant="default">{t("license.active")}</Badge>
              </div>
            </div>
            {currentLicense.daysRemaining !== undefined && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${currentLicense.daysRemaining <= 7 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`} data-testid="text-days-left">
                  {currentLicense.daysRemaining}
                </p>
                <p className="text-xs text-muted-foreground">{t("license.daysLeft")}</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("license.startDate")}</p>
                <p className="text-sm font-medium">{format(new Date(currentLicense.license.startDate), "dd MMM yyyy", { locale: it })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("license.endDate")}</p>
                <p className="text-sm font-medium">{format(new Date(currentLicense.license.endDate), "dd MMM yyyy", { locale: it })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("license.duration")}</p>
                <p className="text-sm font-medium">{DURATION_LABELS[currentLicense.plan.durationMonths] || `${currentLicense.plan.durationMonths} ${t("license.months")}`}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("license.payment")}</p>
                <p className="text-sm font-medium capitalize">{currentLicense.license.paymentMethod}</p>
              </div>
            </div>
            {currentLicense.plan.features && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">{t("license.includedFeatures")}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                  {currentLicense.plan.features.split("\n").filter(Boolean).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 dark:border-amber-800" data-testid="card-no-license">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-semibold mb-1">
              {currentLicense?.isExpired ? t("license.licenseExpired") : t("license.noActiveLicense")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentLicense?.isExpired
                ? t("license.expiredDesc")
                : t("license.choosePlanDesc")}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4" data-testid="text-plans-title">
          {hasActiveLicense ? t("license.changePlan") : t("license.choosePlan")}
        </h2>
        {(!plans || plans.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>{t("license.noPlansAvailable")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map(plan => {
              const isCurrentPlan = currentLicense?.license?.licensePlanId === plan.id && !currentLicense.isExpired;
              const isFree = plan.priceCents === 0;
              return (
                <Card key={plan.id} className={isCurrentPlan ? "ring-2 ring-emerald-500" : ""} data-testid={`card-available-plan-${plan.id}`}>
                  <CardHeader className="pb-3 text-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.description && (
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div>
                      {isFree ? (
                        <span className="text-3xl font-bold">{t("license.free")}</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">{(plan.priceCents / 100).toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground ml-1">EUR</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {DURATION_LABELS[plan.durationMonths] || `${plan.durationMonths} ${t("license.months")}`}
                    </div>
                    {plan.features && (
                      <div className="text-left space-y-1 text-sm">
                        {plan.features.split("\n").filter(Boolean).map((f, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{f.trim()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isCurrentPlan ? (
                      <Badge variant="default" className="w-full justify-center">{t("license.currentPlan")}</Badge>
                    ) : !isFree && !hasAnyPaymentMethod ? (
                      <p className="text-xs text-muted-foreground">{t("license.paymentsNotConfigured")}</p>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleActivatePlan(plan)}
                        disabled={isProcessing}
                        data-testid={`button-activate-plan-${plan.id}`}
                      >
                        {isProcessing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("license.processing")}</>
                        ) : isFree ? t("license.activateFree") : t("license.buyPlan")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={(open) => { if (!isProcessing) { setIsPaymentDialogOpen(open); if (!open) setSelectedPlan(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("license.choosePaymentMethod")}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-5">
              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{selectedPlan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {DURATION_LABELS[selectedPlan.durationMonths] || `${selectedPlan.durationMonths} ${t("license.months")}`}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">{(selectedPlan.priceCents / 100).toFixed(2)} EUR</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {hasStripe && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-4"
                    onClick={() => handlePayment(selectedPlan, "stripe")}
                    disabled={isProcessing}
                    data-testid="button-pay-stripe"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <SiStripe className="w-5 h-5 text-[#635BFF]" />
                    )}
                    <div className="text-left">
                      <p className="font-medium">{t("license.payWithStripe")}</p>
                      <p className="text-xs text-muted-foreground">{t("license.creditDebitCard")}</p>
                    </div>
                  </Button>
                )}

                {hasPaypal && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-4"
                    onClick={() => handlePayment(selectedPlan, "paypal")}
                    disabled={isProcessing}
                    data-testid="button-pay-paypal"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <SiPaypal className="w-5 h-5 text-[#003087]" />
                    )}
                    <div className="text-left">
                      <p className="font-medium">{t("license.payWithPaypal")}</p>
                      <p className="text-xs text-muted-foreground">{t("license.paypalOrCard")}</p>
                    </div>
                  </Button>
                )}

                {!hasStripe && !hasPaypal && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {t("license.noPaymentMethodConfigured")}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {history && history.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" data-testid="text-history-title">
            <History className="w-5 h-5" />
            {t("license.licenseHistory")}
          </h2>
          <Card>
            <CardContent className="py-4">
              <div className="space-y-3">
                {history.map(h => {
                  const statusVariant = STATUS_VARIANTS[h.status] || "outline";
                  const statusLabel = STATUS_LABELS[h.status] || h.status;
                  return (
                    <div
                      key={h.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-2 border-b last:border-0 cursor-pointer hover-elevate rounded-md px-2 -mx-2"
                      data-testid={`row-history-${h.id}`}
                      onClick={() => setSelectedHistoryItem(h)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{h.planName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(h.startDate), "dd MMM yyyy", { locale: it })} - {format(new Date(h.endDate), "dd MMM yyyy", { locale: it })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground capitalize">{h.paymentMethod}</span>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!selectedHistoryItem} onOpenChange={(open) => { if (!open) setSelectedHistoryItem(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-history-detail-title">{t("license.licenseDetails")}</DialogTitle>
          </DialogHeader>
          {selectedHistoryItem && (() => {
            const h = selectedHistoryItem;
            const statusVariant2 = STATUS_VARIANTS[h.status] || "outline";
            const statusLabel2 = STATUS_LABELS[h.status] || h.status;
            const priceFormatted = h.planPrice > 0 ? `${(h.planPrice / 100).toFixed(2)} €` : t("license.free");
            const features = h.planFeatures ? h.planFeatures.split("\n").map(f => f.trim()).filter(Boolean) : [];
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{h.planName}</h3>
                  <Badge variant={statusVariant2}>{statusLabel2}</Badge>
                </div>

                {h.planDescription && (
                  <p className="text-sm text-muted-foreground">{h.planDescription}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.price")}</p>
                    <p className="font-medium" data-testid="text-history-price">{priceFormatted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.duration")}</p>
                    <p className="font-medium" data-testid="text-history-duration">{DURATION_LABELS[h.planDuration] || `${h.planDuration} ${t("license.months")}`}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.startDate")}</p>
                    <p className="font-medium" data-testid="text-history-start">{format(new Date(h.startDate), "dd MMM yyyy", { locale: it })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.endDate")}</p>
                    <p className="font-medium" data-testid="text-history-end">{format(new Date(h.endDate), "dd MMM yyyy", { locale: it })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.paymentMethod")}</p>
                    <p className="font-medium capitalize" data-testid="text-history-payment">{h.paymentMethod}</p>
                  </div>
                  {h.planMaxStaffUsers != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t("license.maxStaffUsers")}</p>
                      <p className="font-medium" data-testid="text-history-staff">{h.planMaxStaffUsers}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.autoRenew")}</p>
                    <p className="font-medium" data-testid="text-history-autorenew">{h.autoRenew ? t("license.yes") : t("license.no")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.purchaseDate")}</p>
                    <p className="font-medium" data-testid="text-history-created">{format(new Date(h.createdAt), "dd MMM yyyy", { locale: it })}</p>
                  </div>
                </div>

                {h.paymentId && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.paymentId")}</p>
                    <p className="text-sm font-mono break-all" data-testid="text-history-paymentid">{h.paymentId}</p>
                  </div>
                )}

                {features.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{t("license.includedFeaturesLabel")}</p>
                    <div className="flex flex-wrap gap-1">
                      {features.map((f, i) => (
                        <Badge key={i} variant="secondary">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {h.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t("license.notes")}</p>
                    <p className="text-sm" data-testid="text-history-notes">{h.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
