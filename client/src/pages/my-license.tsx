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

interface MyLicenseResponse {
  license: License | null;
  plan: LicensePlan | null;
  daysLeft?: number;
  isExpired: boolean;
}

interface EnrichedHistory {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  createdAt: string;
  planName: string;
  planDuration: number;
}

interface PaymentMethods {
  stripe: boolean;
  paypal: boolean;
}

const DURATION_LABELS: Record<number, string> = {
  1: "1 Mese",
  3: "3 Mesi",
  6: "6 Mesi",
  12: "12 Mesi",
};

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Attiva", variant: "default" },
  expired: { label: "Scaduta", variant: "destructive" },
  cancelled: { label: "Cancellata", variant: "secondary" },
  pending: { label: "In attesa di pagamento", variant: "outline" },
};

export default function MyLicense() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<LicensePlan | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        toast({ title: "Pagamento confermato", description: "La tua licenza è ora attiva." });
      } else {
        toast({ title: "Pagamento in elaborazione", description: "Il pagamento non è ancora stato confermato. Riprova tra qualche secondo.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
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
        toast({ title: "Pagamento PayPal confermato", description: "La tua licenza è ora attiva." });
      } else {
        toast({ title: "Pagamento in elaborazione", description: "Il pagamento PayPal non è ancora stato confermato.", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
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
      toast({ title: "Pagamento annullato", description: "Puoi riprovare quando vuoi.", variant: "destructive" });
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
        toast({ title: "Licenza attivata", description: "Piano gratuito attivato con successo." });
        setIsPaymentDialogOpen(false);
        setSelectedPlan(null);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
        return;
      }

      toast({ title: "Errore", description: "Nessun URL di pagamento ricevuto", variant: "destructive" });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Errore durante l'attivazione", variant: "destructive" });
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
        <h1 className="text-2xl font-bold" data-testid="text-page-title">La Mia Licenza</h1>
        <p className="text-sm text-muted-foreground">Gestisci il tuo abbonamento a MonkeyPlan</p>
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
                <Badge variant="default">Attiva</Badge>
              </div>
            </div>
            {currentLicense.daysLeft !== undefined && (
              <div className="text-right">
                <p className={`text-2xl font-bold ${currentLicense.daysLeft <= 7 ? 'text-amber-600' : 'text-emerald-600 dark:text-emerald-400'}`} data-testid="text-days-left">
                  {currentLicense.daysLeft}
                </p>
                <p className="text-xs text-muted-foreground">giorni rimasti</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Inizio</p>
                <p className="text-sm font-medium">{format(new Date(currentLicense.license.startDate), "dd MMM yyyy", { locale: it })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scadenza</p>
                <p className="text-sm font-medium">{format(new Date(currentLicense.license.endDate), "dd MMM yyyy", { locale: it })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Durata</p>
                <p className="text-sm font-medium">{DURATION_LABELS[currentLicense.plan.durationMonths] || `${currentLicense.plan.durationMonths} Mesi`}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pagamento</p>
                <p className="text-sm font-medium capitalize">{currentLicense.license.paymentMethod}</p>
              </div>
            </div>
            {currentLicense.plan.features && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Funzionalità incluse:</p>
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
              {currentLicense?.isExpired ? "Licenza scaduta" : "Nessuna licenza attiva"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentLicense?.isExpired
                ? "La tua licenza è scaduta. Rinnova per continuare a usare MonkeyPlan."
                : "Scegli un piano qui sotto per attivare la tua licenza MonkeyPlan."}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4" data-testid="text-plans-title">
          {hasActiveLicense ? "Cambia Piano" : "Scegli un Piano"}
        </h2>
        {(!plans || plans.length === 0) ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Nessun piano disponibile al momento</p>
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
                        <span className="text-3xl font-bold">Gratuito</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold">{(plan.priceCents / 100).toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground ml-1">EUR</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      {DURATION_LABELS[plan.durationMonths] || `${plan.durationMonths} Mesi`}
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
                      <Badge variant="default" className="w-full justify-center">Piano attuale</Badge>
                    ) : !isFree && !hasAnyPaymentMethod ? (
                      <p className="text-xs text-muted-foreground">Pagamenti non configurati</p>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleActivatePlan(plan)}
                        disabled={isProcessing}
                        data-testid={`button-activate-plan-${plan.id}`}
                      >
                        {isProcessing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Elaborazione...</>
                        ) : isFree ? "Attiva Gratis" : "Acquista Piano"}
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
            <DialogTitle>Scegli il metodo di pagamento</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-5">
              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{selectedPlan.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {DURATION_LABELS[selectedPlan.durationMonths] || `${selectedPlan.durationMonths} Mesi`}
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
                      <p className="font-medium">Paga con Stripe</p>
                      <p className="text-xs text-muted-foreground">Carta di credito/debito</p>
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
                      <p className="font-medium">Paga con PayPal</p>
                      <p className="text-xs text-muted-foreground">Account PayPal o carta</p>
                    </div>
                  </Button>
                )}

                {!hasStripe && !hasPaypal && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessun metodo di pagamento configurato dall'amministratore.
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
            Storico Licenze
          </h2>
          <Card>
            <CardContent className="py-4">
              <div className="space-y-3">
                {history.map(h => {
                  const statusInfo = STATUS_MAP[h.status] || { label: h.status, variant: "outline" as const };
                  return (
                    <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-2 border-b last:border-0" data-testid={`row-history-${h.id}`}>
                      <div className="min-w-0">
                        <p className="font-medium">{h.planName}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(h.startDate), "dd MMM yyyy", { locale: it })} - {format(new Date(h.endDate), "dd MMM yyyy", { locale: it })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground capitalize">{h.paymentMethod}</span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
