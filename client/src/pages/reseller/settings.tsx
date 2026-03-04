import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, Loader2, CheckCircle, AlertCircle, ExternalLink, Landmark, Wallet, Truck, Clock, Euro, Timer, Save, Download, Search, FileText, Package, Wrench, Settings, Shield, Bot, Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import type { PaymentConfiguration } from "@shared/schema";
import { SiStripe, SiPaypal } from "react-icons/si";
import { EntityFiscalConfig } from "@/components/entity-fiscal-config";
import { ShippingMethodsTab } from "@/components/shipping-methods-tab";
import { AiConfigSection } from "@/components/ai-config-section";
import { useTranslation } from "react-i18next";

interface HourlyRateResponse {
  hourlyRateCents: number;
  description?: string;
  updatedAt?: string;
}

interface SLAThresholdConfig {
  warning: number;
  critical: number;
}

interface SLAThresholdsResponse {
  ingressato: SLAThresholdConfig;
  in_diagnosi: SLAThresholdConfig;
  preventivo_emesso: SLAThresholdConfig;
  attesa_ricambi: SLAThresholdConfig;
  in_riparazione: SLAThresholdConfig;
  in_test: SLAThresholdConfig;
  pronto_ritiro: SLAThresholdConfig;
}

const defaultSLAThresholds: SLAThresholdsResponse = {
  ingressato: { warning: 24, critical: 48 },
  in_diagnosi: { warning: 24, critical: 48 },
  preventivo_emesso: { warning: 48, critical: 72 },
  attesa_ricambi: { warning: 72, critical: 120 },
  in_riparazione: { warning: 24, critical: 48 },
  in_test: { warning: 8, critical: 24 },
  pronto_ritiro: { warning: 24, critical: 72 },
};

function getPhaseLabels(t: (key: string) => string): Record<string, string> {
  return {
    ingressato: `1. ${t("settings.phases.ingresso")}`,
    in_diagnosi: `2. ${t("settings.phases.diagnosi")}`,
    preventivo_emesso: `3. ${t("settings.phases.preventivo")}`,
    attesa_ricambi: `4. ${t("settings.phases.attesaRicambi")}`,
    in_riparazione: `5. ${t("settings.phases.inRiparazione")}`,
    in_test: `6. ${t("settings.phases.testFinale")}`,
    pronto_ritiro: `7. ${t("settings.phases.prontoRitiro")}`,
  };
}

function getPhaseDescriptions(t: (key: string) => string): Record<string, string> {
  return {
    ingressato: t("settings.phase.ingressato"),
    in_diagnosi: t("settings.phase.inDiagnosi"),
    preventivo_emesso: t("settings.phase.preventivo"),
    attesa_ricambi: t("settings.phase.attesaRicambi"),
    in_riparazione: t("settings.phase.inRiparazione"),
    in_test: t("settings.phase.inTest"),
    pronto_ritiro: t("settings.phase.prontoRitiro"),
  };
}

const PhaseIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ingressato: Download,
  in_diagnosi: Search,
  preventivo_emesso: FileText,
  attesa_ricambi: Package,
  in_riparazione: Wrench,
  in_test: CheckCircle,
  pronto_ritiro: Truck,
};

const paymentFormSchema = z.object({
  bankTransferEnabled: z.boolean().default(false),
  iban: z.string().max(34).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  accountHolder: z.string().max(200).optional().nullable(),
  bic: z.string().max(11).optional().nullable(),
  stripeEnabled: z.boolean().default(false),
  stripePublishableKey: z.string().optional().nullable().or(z.literal('')),
  stripeSecretKey: z.string().optional().nullable().or(z.literal('')),
  paypalEnabled: z.boolean().default(false),
  paypalEmail: z.string().email("Email PayPal non valida").optional().nullable().or(z.literal('')),
  paypalClientId: z.string().optional().nullable().or(z.literal('')),
  paypalClientSecret: z.string().optional().nullable().or(z.literal('')),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function ResellerSettings() {
  const { t } = useTranslation();
  const phaseLabels = getPhaseLabels(t);
  const phaseDescriptions = getPhaseDescriptions(t);
  const { toast } = useToast();
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");
  const [slaThresholds, setSlaThresholds] = useState<SLAThresholdsResponse>(defaultSLAThresholds);

  const validTabs = ["tariffe", "sla", "pagamenti", "shipping", "fiscal", "ai"];
  const initialTab = (() => {
    const param = new URLSearchParams(window.location.search).get("tab");
    return param && validTabs.includes(param) ? param : "tariffe";
  })();
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: paymentConfig, isLoading: isLoadingPayment } = useQuery<(PaymentConfiguration & { hasPaypalSecret?: boolean; hasStripeSecret?: boolean }) | null>({
    queryKey: ['/api/reseller/payment-config'],
  });

  const { data: stripeStatus, isLoading: isLoadingStripe, refetch: refetchStripeStatus } = useQuery<{
    connected: boolean;
    accountId?: string;
    status?: string;
    detailsSubmitted?: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
  }>({
    queryKey: ['/api/stripe/connect/status'],
  });

  const { data: hourlyRateData, isLoading: isLoadingHourlyRate } = useQuery<HourlyRateResponse>({
    queryKey: ["/api/reseller/settings/hourly-rate"],
  });

  const { data: slaData, isLoading: isLoadingSla } = useQuery<SLAThresholdsResponse>({
    queryKey: ["/api/reseller/settings/sla-thresholds"],
  });

  useEffect(() => {
    if (slaData) {
      setSlaThresholds(slaData);
    }
  }, [slaData]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      bankTransferEnabled: false,
      iban: '',
      bankName: '',
      accountHolder: '',
      bic: '',
      stripeEnabled: false,
      stripePublishableKey: '',
      stripeSecretKey: '',
      paypalEnabled: false,
      paypalEmail: '',
      paypalClientId: '',
      paypalClientSecret: '',
    },
    values: paymentConfig ? {
      bankTransferEnabled: paymentConfig.bankTransferEnabled,
      iban: paymentConfig.iban || '',
      bankName: paymentConfig.bankName || '',
      accountHolder: paymentConfig.accountHolder || '',
      bic: paymentConfig.bic || '',
      stripeEnabled: paymentConfig.stripeEnabled,
      stripePublishableKey: paymentConfig.stripePublishableKey || '',
      stripeSecretKey: '',
      paypalEnabled: paymentConfig.paypalEnabled,
      paypalEmail: paymentConfig.paypalEmail || '',
      paypalClientId: paymentConfig.paypalClientId || '',
      paypalClientSecret: '',
    } : undefined,
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const res = await apiRequest('PUT', '/api/reseller/payment-config', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/payment-config'] });
      toast({
        title: t("settings.configSaved"),
        description: t("settings.paymentMethodsUpdated"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHourlyRateMutation = useMutation({
    mutationFn: async (hourlyRateCents: number) => {
      return await apiRequest("PATCH", "/api/reseller/settings/hourly-rate", {
        hourlyRateCents,
      });
    },
    onSuccess: () => {
      toast({
        title: t("settings.configSaved"),
        description: t("settings.hourlyRateUpdated"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/settings/hourly-rate"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSLAMutation = useMutation({
    mutationFn: async (thresholds: SLAThresholdsResponse) => {
      return await apiRequest("PUT", "/api/reseller/settings/sla-thresholds", thresholds);
    },
    onSuccess: () => {
      toast({
        title: t("settings.slaSaved"),
        description: t("settings.slaSavedDesc"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/settings/sla-thresholds"] });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const connectStripeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/stripe/connect/create-account');
      return res.json() as Promise<{ accountId: string; onboardingUrl: string }>;
    },
    onSuccess: (data) => {
      window.location.href = data.onboardingUrl;
    },
    onError: (error: Error) => {
      setIsConnectingStripe(false);
      toast({
        title: t("settings.stripeConnectionError"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStripeDashboardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/stripe/connect/dashboard');
      return res.json() as Promise<{ dashboardUrl: string }>;
    },
    onSuccess: (data) => {
      window.open(data.dashboardUrl, '_blank');
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshStripeLinkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/stripe/connect/refresh-link');
      return res.json() as Promise<{ onboardingUrl: string }>;
    },
    onSuccess: (data) => {
      window.location.href = data.onboardingUrl;
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    // Validate: Secret Key is required when enabling Stripe for the first time
    if (data.stripeEnabled && !paymentConfig?.hasStripeSecret && (!data.stripeSecretKey || !data.stripeSecretKey.trim())) {
      form.setError("stripeSecretKey", {
        type: "manual",
        message: t("settings.stripeSecretRequired")
      });
      return;
    }
    // Validate: Client Secret is required when enabling PayPal for the first time
    if (data.paypalEnabled && !paymentConfig?.hasPaypalSecret && (!data.paypalClientSecret || !data.paypalClientSecret.trim())) {
      form.setError("paypalClientSecret", {
        type: "manual",
        message: t("settings.paypalSecretRequired")
      });
      return;
    }
    updatePaymentMutation.mutate(data);
  };

  const handleConnectStripe = () => {
    setIsConnectingStripe(true);
    connectStripeMutation.mutate();
  };

  const handleSaveHourlyRate = () => {
    const euros = parseFloat(hourlyRateEuros);
    if (isNaN(euros) || euros < 0) {
      toast({
        title: t("common.error"),
        description: t("settings.invalidRate"),
        variant: "destructive",
      });
      return;
    }
    const cents = Math.round(euros * 100);
    updateHourlyRateMutation.mutate(cents);
  };

  const currentRateEuros = hourlyRateData 
    ? (hourlyRateData.hourlyRateCents / 100).toFixed(2) 
    : "35.00";

  const displayRate = hourlyRateEuros || currentRateEuros;

  const getStripeStatusBadge = () => {
    if (!stripeStatus?.connected) {
      return <Badge variant="secondary">{t("settings.notConnected")}</Badge>;
    }
    
    switch (stripeStatus.status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">{t("common.active")}</Badge>;
      case 'onboarding':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">{t("settings.onboardingInProgress")}</Badge>;
      case 'restricted':
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">{t("settings.requiresAction")}</Badge>;
      case 'disabled':
        return <Badge variant="destructive">{t("common.disabled")}</Badge>;
      default:
        return <Badge variant="secondary">{t("hr.pending")}</Badge>;
    }
  };

  if (isLoadingPayment) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-muted-foreground">{t("settings.subtitle")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="tariffe" className="gap-2" data-testid="tab-tariffe">
            <Clock className="h-4 w-4" />{t("settings.tabs.rates")}</TabsTrigger>
          <TabsTrigger value="sla" className="gap-2" data-testid="tab-sla">
            <Timer className="h-4 w-4" />{t("settings.tabs.sla")}</TabsTrigger>
          <TabsTrigger value="pagamenti" className="gap-2" data-testid="tab-pagamenti">
            <CreditCard className="h-4 w-4" />{t("sidebar.items.payments")}</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2" data-testid="tab-shipping">
            <Truck className="h-4 w-4" />{t("suppliers.delivery")}</TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2" data-testid="tab-fiscal">
            <Shield className="h-4 w-4" />
            {t("settings.tabs.fiscal")}
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2" data-testid="tab-ai">
            <Bot className="h-4 w-4" />{t("ai.title", "Assistente AI")}</TabsTrigger>
        </TabsList>

        <TabsContent value="tariffe" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Clock className="h-5 w-5" />{t("admin.repairCenters.hourlyRateSection")}</CardTitle>
                <CardDescription>
                  {t("settings.hourlyRateDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingHourlyRate ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hourly-rate">{t("settings.hourlyRateLabel")}</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="hourly-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={currentRateEuros}
                          value={hourlyRateEuros}
                          onChange={(e) => setHourlyRateEuros(e.target.value)}
                          className="max-w-[200px]"
                          data-testid="input-hourly-rate"
                        />
                        <span className="text-sm text-muted-foreground">/ {t("settings.perHour")}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.currentValue")}: <span className="font-semibold">{currentRateEuros} EUR/{t("settings.perHour")}</span>
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted p-4">
                      <h4 className="font-medium mb-2">{t("settings.howItWorks")}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t("settings.howItWorksDesc")}
                      </p>
                      <div className="mt-3 p-2 bg-background rounded border">
                        <p className="text-sm font-mono">
                          {t("settings.laborFormula")}
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveHourlyRate}
                      disabled={updateHourlyRateMutation.isPending || !hourlyRateEuros}
                      data-testid="button-save-hourly-rate"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateHourlyRateMutation.isPending ? t("profile.saving") : t("settings.saveRate")}
                    </Button>

                    {hourlyRateData?.updatedAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("settings.lastUpdate")}: {new Date(hourlyRateData.updatedAt).toLocaleString("it-IT")}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.calculationExample")}</CardTitle>
                <CardDescription>
                  {t("settings.simulationDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("admin.repairCenterDetail.hourlyRate")}</p>
                      <p className="font-semibold">{displayRate} EUR</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("repairs.estimatedTime")}</p>
                      <p className="font-semibold">{t("settings.twoHours")}</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">{t("settings.laborCost")}</p>
                      <p className="text-xl font-bold text-primary">
                        {(parseFloat(displayRate || "0") * 2).toFixed(2)} EUR
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Timer className="h-5 w-5" />{t("settings.slaTitle")}</CardTitle>
              <CardDescription>
                {t("settings.slaDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">{t("settings.onTime")}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">{t("settings.delayed")}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">{t("settings.urgent")}</span>
                </div>
              </div>

              {isLoadingSla ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {(Object.keys(defaultSLAThresholds) as Array<keyof SLAThresholdsResponse>).map((phase) => {
                    const threshold = slaThresholds[phase] || defaultSLAThresholds[phase];
                    
                    return (
                      <div key={phase} className="border rounded-lg p-4 space-y-4 bg-card">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            {(() => {
                              const IconComponent = PhaseIcons[phase];
                              return IconComponent ? <IconComponent className="h-6 w-6 text-primary" /> : null;
                            })()}
                            <div>
                              <h4 className="font-semibold text-lg">{phaseLabels[phase]}</h4>
                              <p className="text-sm text-muted-foreground">{phaseDescriptions[phase]}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600">
                              {t("settings.delayLabel")}: {threshold.warning}h
                            </Badge>
                            <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600">
                              {t("settings.urgentLabel")}: {threshold.critical}h
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex flex-wrap items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500" />{t("settings.delayThreshold")}</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={threshold.warning}
                              onChange={(e) => {
                                const hours = parseInt(e.target.value) || 1;
                                setSlaThresholds(prev => ({
                                  ...prev,
                                  [phase]: {
                                    ...prev[phase],
                                    warning: hours
                                  }
                                }));
                              }}
                              data-testid={`input-sla-warning-${phase}`}
                            />
                            <p className="text-xs text-muted-foreground">{t("settings.delayBadgeDesc")}</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex flex-wrap items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />{t("settings.urgentThreshold")}</Label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={threshold.critical}
                              onChange={(e) => {
                                const hours = parseInt(e.target.value) || 1;
                                setSlaThresholds(prev => ({
                                  ...prev,
                                  [phase]: {
                                    ...prev[phase],
                                    critical: hours
                                  }
                                }));
                              }}
                              data-testid={`input-sla-critical-${phase}`}
                            />
                            <p className="text-xs text-muted-foreground">{t("settings.urgentBadgeDesc")}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSlaThresholds(defaultSLAThresholds)}
                      data-testid="button-reset-sla"
                    >{t("settings.resetDefaults")}</Button>
                    <Button
                      onClick={() => updateSLAMutation.mutate(slaThresholds)}
                      disabled={updateSLAMutation.isPending}
                      data-testid="button-save-sla"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSLAMutation.isPending ? t("profile.saving") : t("settings.saveSLA")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagamenti" className="space-y-4">
          {/* Stripe Connect temporarily hidden
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#635bff]/10 rounded-lg">
                    <SiStripe className="h-6 w-6 text-[#635bff]" />
                  </div>
                  <div>
                    <CardTitle>Stripe Connect</CardTitle>
                    <CardDescription>
                      Ricevi pagamenti con carta di credito direttamente sul tuo conto Stripe
                    </CardDescription>
                  </div>
                </div>
                {getStripeStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingStripe ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifica stato connessione...</span>
                </div>
              ) : stripeStatus?.connected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Account ID</p>
                      <p className="font-mono text-sm">{stripeStatus.accountId}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Dettagli completati</p>
                      <p className="font-medium flex items-center gap-1">
                        {stripeStatus.detailsSubmitted ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" />{t("license.yes")}</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" />{t("common.no")}</>
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Pagamenti abilitati</p>
                      <p className="font-medium flex items-center gap-1">
                        {stripeStatus.chargesEnabled ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" />{t("license.yes")}</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" />{t("common.no")}</>
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Bonifici abilitati</p>
                      <p className="font-medium flex items-center gap-1">
                        {stripeStatus.payoutsEnabled ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" />{t("license.yes")}</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" />{t("common.no")}</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => getStripeDashboardMutation.mutate()}
                      disabled={getStripeDashboardMutation.isPending}
                      data-testid="button-stripe-dashboard"
                    >
                      {getStripeDashboardMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Apri Dashboard Stripe
                    </Button>
                    
                    {!stripeStatus.detailsSubmitted && (
                      <Button
                        onClick={() => refreshStripeLinkMutation.mutate()}
                        disabled={refreshStripeLinkMutation.isPending}
                        data-testid="button-stripe-complete"
                      >
                        {refreshStripeLinkMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Completa configurazione
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchStripeStatus()}
                      data-testid="button-stripe-refresh"
                    >{t("common.updateStatus")}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Collega il tuo account Stripe per iniziare a ricevere pagamenti con carta di credito. 
                    Stripe gestisce in modo sicuro tutte le transazioni e trasferisce i fondi direttamente sul tuo conto.
                  </p>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Pagamenti con carta di credito e debito
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Apple Pay e Google Pay
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Bonifici automatici sul tuo conto
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Dashboard per gestire pagamenti e rimborsi
                    </li>
                  </ul>
                  <Button
                    onClick={handleConnectStripe}
                    disabled={isConnectingStripe || connectStripeMutation.isPending}
                    className="bg-[#635bff] hover:bg-[#5851ea]"
                    data-testid="button-connect-stripe"
                  >
                    {(isConnectingStripe || connectStripeMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <SiStripe className="h-4 w-4 mr-2" />
                    )}
                    Collega Stripe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          */}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Landmark className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>{t("settings.bankTransfer")}</CardTitle>
                  <CardDescription>
                    Ricevi pagamenti tramite bonifico bancario
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bankTransferEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("settings.enableBankTransfer")}</FormLabel>
                          <FormDescription>
                            Permetti ai clienti di pagare tramite bonifico
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-bank-transfer"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('bankTransferEnabled') && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="accountHolder"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("settings.accountHolder")}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t("settings.companyNameExample")} 
                                {...field} 
                                value={field.value || ''}
                                data-testid="input-account-holder"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="iban"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("profile.iban")}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="IT60X0542811101000000123456" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-iban"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>BIC/SWIFT</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="BCITITMM" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-bic"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t("settings.bankName")}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t("settings.bankNameExample")} 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-bank-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={updatePaymentMutation.isPending}
                    data-testid="button-save-bank"
                  >
                    {updatePaymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("settings.saveConfig")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#635bff]/10 rounded-lg">
                  <SiStripe className="h-6 w-6 text-[#635bff]" />
                </div>
                <div>
                  <CardTitle>Stripe API Keys</CardTitle>
                  <CardDescription>
                    Configura le tue chiavi API Stripe per pagamenti con carta
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="stripeEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Abilita Stripe</FormLabel>
                          <FormDescription>
                            Permetti ai clienti di pagare con carta di credito
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-stripe"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('stripeEnabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stripePublishableKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Publishable Key</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="pk_live_... o pk_test_..." 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-stripe-publishable-key"
                              />
                            </FormControl>
                            <FormDescription>{t("settings.availableOnDashboard")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stripeSecretKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secret Key</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="sk_live_... o sk_test_..." 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-stripe-secret-key"
                              />
                            </FormControl>
                            <FormDescription>
                              {(paymentConfig as any)?.hasStripeSecret 
                                ? t("settings.leaveEmptyKeep")
                                : t("settings.requiredForStripe")
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <Button type="submit" disabled={updatePaymentMutation.isPending} data-testid="button-save-stripe">
                    {updatePaymentMutation.isPending ? t("profile.saving") : t("settings.saveStripeConfig")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#003087]/10 rounded-lg">
                  <SiPaypal className="h-6 w-6 text-[#003087]" />
                </div>
                <div>
                  <CardTitle>PayPal</CardTitle>
                  <CardDescription>
                    {t("settings.receivePaypal")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paypalEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t("settings.enablePaypal")}</FormLabel>
                          <FormDescription>
                            {t("settings.allowPaypal")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-paypal"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('paypalEnabled') && (
                    <>
                    <FormField
                      control={form.control}
                      name="paypalEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.paypalEmail")}</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder={t("settings.paypalEmailPlaceholder")} 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-paypal-email"
                            />
                          </FormControl>
                          <FormDescription>
                            {t("settings.paypalBusinessEmail")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="paypalClientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="AVz..." 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-paypal-client-id"
                              />
                            </FormControl>
                            <FormDescription>
                              {t("settings.paypalDevClientId")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="paypalClientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client Secret</FormLabel>
                            <FormControl>
                              <Input 
                                type="password"
                                placeholder="••••••••••••" 
                                {...field}
                                value={field.value || ''}
                                data-testid="input-paypal-client-secret"
                              />
                            </FormControl>
                            <FormDescription>
                              {paymentConfig?.hasPaypalSecret 
                                ? t("settings.leaveEmptyKeep")
                                : t("settings.paypalRequired")
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
                      <p className="font-medium text-foreground">{t("settings.paypalInstructions")}</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>{t("settings.paypalStep1")}<a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">developer.paypal.com</a></li>
                        <li>{t("settings.paypalStep2")}</li>
                        <li>{t("settings.paypalStep3")}</li>
                        <li>{t("settings.paypalStep4")}</li>
                        <li>{t("settings.paypalStep5")}</li>
                      </ol>
                    </div>
                    </>
                  )}


                  <Button 
                    type="submit" 
                    disabled={updatePaymentMutation.isPending}
                    data-testid="button-save-other"
                  >
                    {updatePaymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {t("settings.saveConfig")}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {t("settings.deliveryMethods")}
              </CardTitle>
              <CardDescription>
                {t("settings.deliveryMethodsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShippingMethodsTab
                role="reseller"
                apiBase="/api/reseller/shipping-methods"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal" className="space-y-4">
          <EntityFiscalConfig entityType="reseller" basePath="/api/reseller/fiscal" />
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <AiConfigSection role="reseller" apiBase="/api/reseller/ai-config" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
