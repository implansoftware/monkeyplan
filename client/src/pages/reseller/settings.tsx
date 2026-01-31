import { useState } from "react";
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
import { CreditCard, Building2, Loader2, CheckCircle, AlertCircle, ExternalLink, Landmark, CircleDollarSign, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import type { PaymentConfiguration } from "@shared/schema";
import { SiStripe, SiPaypal } from "react-icons/si";

const paymentFormSchema = z.object({
  bankTransferEnabled: z.boolean().default(false),
  iban: z.string().max(34).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  accountHolder: z.string().max(200).optional().nullable(),
  bic: z.string().max(11).optional().nullable(),
  paypalEnabled: z.boolean().default(false),
  paypalEmail: z.string().email("Email PayPal non valida").optional().nullable().or(z.literal('')),
  satispayEnabled: z.boolean().default(false),
  satispayShopId: z.string().max(50).optional().nullable(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

export default function ResellerSettings() {
  const { toast } = useToast();
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  const { data: paymentConfig, isLoading: isLoadingPayment } = useQuery<PaymentConfiguration | null>({
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
    updatePaymentMutation.mutate(data);
  };

  const handleConnectStripe = () => {
    setIsConnectingStripe(true);
    connectStripeMutation.mutate();
  };

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
        <CreditCard className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Configurazione Pagamenti</h1>
          <p className="text-muted-foreground">Gestisci i metodi di pagamento per ricevere i pagamenti dai tuoi clienti</p>
        </div>
      </div>

      <Tabs defaultValue="stripe" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stripe" className="gap-2">
            <SiStripe className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Landmark className="h-4 w-4" />
            Bonifico
          </TabsTrigger>
          <TabsTrigger value="other" className="gap-2">
            <Wallet className="h-4 w-4" />
            Altri
          </TabsTrigger>
        </TabsList>

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
                  )}

                  <Separator />

                  <div className="flex items-center gap-3 pt-2">
                    <div className="p-2 bg-[#f64a4a]/10 rounded-lg">
                      <CircleDollarSign className="h-6 w-6 text-[#f64a4a]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Satispay</h3>
                      <p className="text-sm text-muted-foreground">
                        Ricevi pagamenti tramite Satispay Business
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
      </Tabs>
    </div>
  );
}
