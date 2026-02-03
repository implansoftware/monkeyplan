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
import { CreditCard, Loader2, CheckCircle, AlertCircle, ExternalLink, Landmark, Wallet, Truck, Clock, Euro, Timer, Save, Download, Search, FileText, Package, Wrench, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import type { PaymentConfiguration } from "@shared/schema";
import { SiStripe, SiPaypal } from "react-icons/si";
import { ShippingMethodsTab } from "@/components/shipping-methods-tab";

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

const phaseLabels: Record<string, string> = {
  ingressato: "1. Ingresso",
  in_diagnosi: "2. Diagnosi",
  preventivo_emesso: "3. Preventivo",
  attesa_ricambi: "4. Attesa Ricambi",
  in_riparazione: "5. In Riparazione",
  in_test: "6. Test Finale",
  pronto_ritiro: "7. Pronto Ritiro",
};

const phaseDescriptions: Record<string, string> = {
  ingressato: "Tempo dalla presa in carico all'inizio diagnosi",
  in_diagnosi: "Tempo per completare la diagnosi del dispositivo",
  preventivo_emesso: "Tempo di attesa per risposta cliente al preventivo",
  attesa_ricambi: "Tempo dall'ordine ricambi alla ricezione",
  in_riparazione: "Tempo per completare la riparazione",
  in_test: "Tempo per eseguire i test finali",
  pronto_ritiro: "Tempo dal dispositivo pronto al ritiro effettivo",
};

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
  paypalEnabled: z.boolean().default(false),
  paypalEmail: z.string().email("Email PayPal non valida").optional().nullable().or(z.literal('')),
  paypalClientId: z.string().optional().nullable().or(z.literal('')),
  paypalClientSecret: z.string().optional().nullable().or(z.literal('')),
  satispayEnabled: z.boolean().default(false),
  satispayShopId: z.string().max(50).optional().nullable(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function ResellerSettings() {
  const { toast } = useToast();
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");
  const [slaThresholds, setSlaThresholds] = useState<SLAThresholdsResponse>(defaultSLAThresholds);

  const { data: paymentConfig, isLoading: isLoadingPayment } = useQuery<(PaymentConfiguration & { hasPaypalSecret?: boolean }) | null>({
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
      paypalEnabled: false,
      paypalEmail: '',
      paypalClientId: '',
      paypalClientSecret: '',
      satispayEnabled: false,
      satispayShopId: '',
    },
    values: paymentConfig ? {
      bankTransferEnabled: paymentConfig.bankTransferEnabled,
      iban: paymentConfig.iban || '',
      bankName: paymentConfig.bankName || '',
      accountHolder: paymentConfig.accountHolder || '',
      bic: paymentConfig.bic || '',
      paypalEnabled: paymentConfig.paypalEnabled,
      paypalEmail: paymentConfig.paypalEmail || '',
      paypalClientId: paymentConfig.paypalClientId || '',
      paypalClientSecret: '',
      satispayEnabled: paymentConfig.satispayEnabled,
      satispayShopId: paymentConfig.satispayShopId || '',
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
        title: "Configurazione salvata",
        description: "I metodi di pagamento sono stati aggiornati.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
        title: "Impostazioni Salvate",
        description: "La tariffa oraria è stata aggiornata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/settings/hourly-rate"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
        title: "Soglie SLA Salvate",
        description: "Le soglie temporali sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/settings/sla-thresholds"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
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
        title: "Errore connessione Stripe",
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
        title: "Errore",
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
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    // Validate: Client Secret is required when enabling PayPal for the first time
    if (data.paypalEnabled && !paymentConfig?.hasPaypalSecret && (!data.paypalClientSecret || !data.paypalClientSecret.trim())) {
      form.setError("paypalClientSecret", {
        type: "manual",
        message: "Client Secret è obbligatorio per abilitare PayPal"
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
        title: "Errore",
        description: "Inserisci un valore valido per la tariffa oraria",
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
      return <Badge variant="secondary">Non connesso</Badge>;
    }
    
    switch (stripeStatus.status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">Attivo</Badge>;
      case 'onboarding':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Onboarding in corso</Badge>;
      case 'restricted':
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">Richiede azioni</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Disabilitato</Badge>;
      default:
        return <Badge variant="secondary">In attesa</Badge>;
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
          <h1 className="text-2xl font-bold">Impostazioni</h1>
          <p className="text-muted-foreground">Configura tariffe, SLA, pagamenti e spedizioni</p>
        </div>
      </div>

      <Tabs defaultValue="tariffe" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tariffe" className="gap-2" data-testid="tab-tariffe">
            <Clock className="h-4 w-4" />
            Tariffe
          </TabsTrigger>
          <TabsTrigger value="sla" className="gap-2" data-testid="tab-sla">
            <Timer className="h-4 w-4" />
            SLA
          </TabsTrigger>
          <TabsTrigger value="stripe" className="gap-2" data-testid="tab-stripe">
            <SiStripe className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2" data-testid="tab-bank">
            <Landmark className="h-4 w-4" />
            Bonifico
          </TabsTrigger>
          <TabsTrigger value="other" className="gap-2" data-testid="tab-other">
            <Wallet className="h-4 w-4" />
            Altri
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2" data-testid="tab-shipping">
            <Truck className="h-4 w-4" />
            Consegna
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tariffe" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tariffa Manodopera
                </CardTitle>
                <CardDescription>
                  Imposta la tariffa oraria per il calcolo automatico del costo manodopera nei preventivi
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
                      <Label htmlFor="hourly-rate">Tariffa Oraria (EUR)</Label>
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
                        <span className="text-sm text-muted-foreground">/ ora</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Valore attuale: <span className="font-semibold">{currentRateEuros} EUR/ora</span>
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted p-4">
                      <h4 className="font-medium mb-2">Come funziona</h4>
                      <p className="text-sm text-muted-foreground">
                        Quando crei un preventivo, il costo della manodopera viene calcolato automaticamente 
                        moltiplicando questa tariffa per il tempo stimato di riparazione indicato nella diagnosi.
                      </p>
                      <div className="mt-3 p-2 bg-background rounded border">
                        <p className="text-sm font-mono">
                          Costo Manodopera = Tariffa Oraria × Ore Stimate
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={handleSaveHourlyRate}
                      disabled={updateHourlyRateMutation.isPending || !hourlyRateEuros}
                      data-testid="button-save-hourly-rate"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateHourlyRateMutation.isPending ? "Salvataggio..." : "Salva Tariffa"}
                    </Button>

                    {hourlyRateData?.updatedAt && (
                      <p className="text-xs text-muted-foreground">
                        Ultimo aggiornamento: {new Date(hourlyRateData.updatedAt).toLocaleString("it-IT")}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Esempio di Calcolo</CardTitle>
                <CardDescription>
                  Simulazione del calcolo manodopera per un preventivo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Tariffa Oraria</p>
                      <p className="font-semibold">{displayRate} EUR</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tempo Stimato</p>
                      <p className="font-semibold">2 ore</p>
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Costo Manodopera</p>
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
                <Timer className="h-5 w-5" />
                Soglie SLA (Service Level Agreement)
              </CardTitle>
              <CardDescription>
                Configura le soglie temporali per il monitoraggio delle riparazioni. 
                Il sistema cambierà automaticamente il colore di priorità quando vengono superate le soglie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <span className="text-sm font-medium">In Tempo</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">In Ritardo</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">Urgente</span>
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
                              Ritardo: {threshold.warning}h
                            </Badge>
                            <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600">
                              Urgente: {threshold.critical}h
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex flex-wrap items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500" />
                              Soglia Ritardo (ore)
                            </Label>
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
                            <p className="text-xs text-muted-foreground">
                              Oltre questa soglia il badge diventa giallo
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex flex-wrap items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              Soglia Urgente (ore)
                            </Label>
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
                            <p className="text-xs text-muted-foreground">
                              Oltre questa soglia il badge diventa rosso
                            </p>
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
                    >
                      Ripristina Predefiniti
                    </Button>
                    <Button
                      onClick={() => updateSLAMutation.mutate(slaThresholds)}
                      disabled={updateSLAMutation.isPending}
                      data-testid="button-save-sla"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSLAMutation.isPending ? "Salvataggio..." : "Salva Soglie SLA"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stripe" className="space-y-4">
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
                          <><CheckCircle className="h-4 w-4 text-green-500" /> Si</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> No</>
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Pagamenti abilitati</p>
                      <p className="font-medium flex items-center gap-1">
                        {stripeStatus.chargesEnabled ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" /> Si</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> No</>
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Bonifici abilitati</p>
                      <p className="font-medium flex items-center gap-1">
                        {stripeStatus.payoutsEnabled ? (
                          <><CheckCircle className="h-4 w-4 text-green-500" /> Si</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> No</>
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
                    >
                      Aggiorna stato
                    </Button>
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
        </TabsContent>

        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Landmark className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Bonifico Bancario</CardTitle>
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
                          <FormLabel className="text-base">Abilita bonifico bancario</FormLabel>
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
                            <FormLabel>Intestatario conto</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Mario Rossi S.r.l." 
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
                            <FormLabel>IBAN</FormLabel>
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
                            <FormLabel>Nome banca</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Intesa Sanpaolo" 
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
                    Salva configurazione
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#003087]/10 rounded-lg">
                  <SiPaypal className="h-6 w-6 text-[#003087]" />
                </div>
                <div>
                  <CardTitle>PayPal</CardTitle>
                  <CardDescription>
                    Ricevi pagamenti tramite PayPal
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
                          <FormLabel className="text-base">Abilita PayPal</FormLabel>
                          <FormDescription>
                            Permetti ai clienti di pagare con PayPal
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
                          <FormLabel>Email PayPal</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="pagamenti@azienda.it" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-paypal-email"
                            />
                          </FormControl>
                          <FormDescription>
                            L'email associata al tuo account PayPal Business
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
                              Il Client ID del tuo account PayPal Developer
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
                                ? "Lascia vuoto per mantenere il valore esistente"
                                : "Richiesto per abilitare PayPal SDK"
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center gap-3 pt-2">
                    <div className="p-2 bg-[#f64a4a]/10 rounded-lg">
                      <CreditCard className="h-6 w-6 text-[#f64a4a]" />
                    </div>
                    <div>
                      <h3 className="font-medium">Satispay</h3>
                      <p className="text-sm text-muted-foreground">
                        Ricevi pagamenti tramite Satispay
                      </p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="satispayEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Abilita Satispay</FormLabel>
                          <FormDescription>
                            Permetti ai clienti di pagare con Satispay
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-satispay"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch('satispayEnabled') && (
                    <FormField
                      control={form.control}
                      name="satispayShopId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop ID Satispay</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Il tuo Shop ID Satispay" 
                              {...field}
                              value={field.value || ''}
                              data-testid="input-satispay-id"
                            />
                          </FormControl>
                          <FormDescription>
                            Trovi lo Shop ID nel tuo account Satispay Business
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button 
                    type="submit" 
                    disabled={updatePaymentMutation.isPending}
                    data-testid="button-save-other"
                  >
                    {updatePaymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salva configurazione
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
                Metodi di Consegna
              </CardTitle>
              <CardDescription>
                Configura le opzioni di spedizione e ritiro per i tuoi clienti
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
      </Tabs>
    </div>
  );
}
