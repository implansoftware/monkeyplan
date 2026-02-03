import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Save, Clock, Euro, Timer, CreditCard, Landmark, Loader2, Download, Search, FileText, Package, Wrench, CheckCircle, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SiPaypal, SiStripe } from "react-icons/si";
import type { PaymentConfiguration } from "@shared/schema";
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
  bankTransferEnabled: z.boolean().default(true),
  accountHolder: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  bankName: z.string().optional(),
  stripeEnabled: z.boolean().default(false),
  paypalEnabled: z.boolean().default(false),
  paypalEmail: z.string().optional(),
  satispayEnabled: z.boolean().default(false),
}).refine((data) => {
  if (data.bankTransferEnabled) {
    return data.iban && data.iban.trim().length > 0 && data.accountHolder && data.accountHolder.trim().length > 0;
  }
  return true;
}, {
  message: "IBAN e intestatario sono obbligatori quando il bonifico è abilitato",
  path: ["iban"],
}).refine((data) => {
  if (data.paypalEnabled) {
    return data.paypalEmail && data.paypalEmail.trim().length > 0;
  }
  return true;
}, {
  message: "Email PayPal è obbligatoria quando PayPal è abilitato",
  path: ["iban"],
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export default function AdminSettings() {
  const { toast } = useToast();
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");
  const [slaThresholds, setSlaThresholds] = useState<SLAThresholdsResponse>(defaultSLAThresholds);

  const { data: hourlyRateData, isLoading } = useQuery<HourlyRateResponse>({
    queryKey: ["/api/admin/settings/hourly-rate"],
  });

  const { data: slaData, isLoading: slaLoading } = useQuery<SLAThresholdsResponse>({
    queryKey: ["/api/admin/settings/sla-thresholds"],
  });

  const { data: paymentConfig, isLoading: isLoadingPayment } = useQuery<PaymentConfiguration | null>({
    queryKey: ['/api/admin/payment-config'],
  });

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      bankTransferEnabled: true,
      accountHolder: '',
      iban: '',
      bic: '',
      bankName: '',
      stripeEnabled: false,
      paypalEnabled: false,
      paypalEmail: '',
      satispayEnabled: false,
    },
  });

  useEffect(() => {
    if (paymentConfig) {
      paymentForm.reset({
        bankTransferEnabled: paymentConfig.bankTransferEnabled ?? true,
        accountHolder: paymentConfig.accountHolder || '',
        iban: paymentConfig.iban || '',
        bic: paymentConfig.bic || '',
        bankName: paymentConfig.bankName || '',
        stripeEnabled: paymentConfig.stripeEnabled ?? false,
        paypalEnabled: paymentConfig.paypalEnabled ?? false,
        paypalEmail: paymentConfig.paypalEmail || '',
        satispayEnabled: paymentConfig.satispayEnabled ?? false,
      });
    }
  }, [paymentConfig, paymentForm]);

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const res = await apiRequest('PUT', '/api/admin/payment-config', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurazione Salvata",
        description: "I metodi di pagamento sono stati aggiornati",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-config'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onPaymentSubmit = (data: PaymentFormValues) => {
    updatePaymentMutation.mutate(data);
  };

  useEffect(() => {
    if (slaData) {
      setSlaThresholds(slaData);
    }
  }, [slaData]);

  const updateSLAMutation = useMutation({
    mutationFn: async (thresholds: SLAThresholdsResponse) => {
      return await apiRequest("PUT", "/api/admin/settings/sla-thresholds", thresholds);
    },
    onSuccess: () => {
      toast({
        title: "Soglie SLA Salvate",
        description: "Le soglie temporali sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/sla-thresholds"] });
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
      return await apiRequest("PATCH", "/api/admin/settings/hourly-rate", {
        hourlyRateCents,
      });
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni Salvate",
        description: "La tariffa oraria è stata aggiornata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/hourly-rate"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/hourly-rate"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  return (
    <div className="flex-1 space-y-6 p-6 overflow-y-auto">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Impostazioni</h1>
              <p className="text-sm text-muted-foreground">
                Configura i parametri globali del sistema
              </p>
            </div>
          </div>
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
          <TabsTrigger value="pagamenti" className="gap-2" data-testid="tab-pagamenti">
            <CreditCard className="h-4 w-4" />
            Pagamenti
          </TabsTrigger>
          <TabsTrigger value="spedizione" className="gap-2" data-testid="tab-spedizione">
            <Truck className="h-4 w-4" />
            Spedizione
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
                {isLoading ? (
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

              {slaLoading ? (
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

        <TabsContent value="pagamenti" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodi di Pagamento B2B
              </CardTitle>
              <CardDescription>
                Configura i metodi di pagamento che i rivenditori vedranno quando effettuano ordini B2B
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayment ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Landmark className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">Bonifico Bancario</h4>
                          <p className="text-sm text-muted-foreground">Ricevi pagamenti tramite bonifico</p>
                        </div>
                      </div>

                      <FormField
                        control={paymentForm.control}
                        name="bankTransferEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Abilita bonifico bancario</FormLabel>
                              <FormDescription>
                                Permetti ai rivenditori di pagare tramite bonifico
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-admin-bank-transfer"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {paymentForm.watch("bankTransferEnabled") && (
                        <div className="grid gap-4 md:grid-cols-2 pl-4 border-l-2 border-muted">
                          <FormField
                            control={paymentForm.control}
                            name="accountHolder"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Intestatario conto *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Mario Rossi S.r.l." 
                                    {...field} 
                                    data-testid="input-admin-account-holder"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="iban"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IBAN *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="IT60X0542811101000000123456" 
                                    {...field}
                                    data-testid="input-admin-iban"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="bic"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>BIC/SWIFT</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="BCITITMM" 
                                    {...field}
                                    data-testid="input-admin-bic"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={paymentForm.control}
                            name="bankName"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Nome banca</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Intesa Sanpaolo" 
                                    {...field}
                                    data-testid="input-admin-bank-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-6 space-y-4">
                      <h4 className="font-medium">Altri metodi di pagamento</h4>
                      
                      <FormField
                        control={paymentForm.control}
                        name="stripeEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#635bff]/10 rounded-lg">
                                <SiStripe className="h-5 w-5 text-[#635bff]" />
                              </div>
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Stripe</FormLabel>
                                <FormDescription>
                                  Pagamenti con carta di credito
                                </FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-admin-stripe"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={paymentForm.control}
                        name="paypalEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#003087]/10 rounded-lg">
                                <SiPaypal className="h-5 w-5 text-[#003087]" />
                              </div>
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">PayPal</FormLabel>
                                <FormDescription>
                                  Pagamenti con PayPal
                                </FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-admin-paypal"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {paymentForm.watch("paypalEnabled") && (
                        <FormField
                          control={paymentForm.control}
                          name="paypalEmail"
                          render={({ field }) => (
                            <FormItem className="ml-12">
                              <FormLabel>Email PayPal</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="email@paypal.com" 
                                  {...field}
                                  data-testid="input-admin-paypal-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={paymentForm.control}
                        name="satispayEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#f64a4a]/10 rounded-lg">
                                <CreditCard className="h-5 w-5 text-[#f64a4a]" />
                              </div>
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Satispay</FormLabel>
                                <FormDescription>
                                  Pagamenti con Satispay
                                </FormDescription>
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-admin-satispay"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={updatePaymentMutation.isPending}
                      data-testid="button-save-payment-config"
                    >
                      {updatePaymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      <Save className="h-4 w-4 mr-2" />
                      Salva Configurazione
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spedizione" className="space-y-6">
          <ShippingMethodsTab role="admin" apiBase="/api/admin/shipping-methods" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
