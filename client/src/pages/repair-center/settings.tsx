import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Building2, Phone, Mail, Globe, Clock, Camera, Save, Loader2, MapPin, FileText, CreditCard, Instagram, Linkedin, Twitter, Facebook, Settings, Trash2, Upload, Landmark, CircleDollarSign, Wallet, CheckCircle, AlertCircle, ExternalLink, Truck, Euro, Target, Info, Bot } from "lucide-react";
import { ShippingMethodsTab } from "@/components/shipping-methods-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import type { RepairCenter, PaymentConfiguration } from "@shared/schema";
import { SiStripe, SiPaypal } from "react-icons/si";
import { EntityFiscalConfig } from "@/components/entity-fiscal-config";
import { AiConfigSection } from "@/components/ai-config-section";

const settingsFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  address: z.string().min(1),
  city: z.string().min(1),
  cap: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  phone: z.string().min(1),
  email: z.string().email(),
  publicPhone: z.string().optional().nullable(),
  publicEmail: z.string().email().optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
  logoUrl: z.string().optional().nullable(),
  acceptsWalkIns: z.boolean().optional(),
  openingHours: z.record(z.object({
    isOpen: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
    breakStart: z.string().optional().nullable(),
    breakEnd: z.string().optional().nullable(),
  })).optional().nullable(),
  socialLinks: z.object({
    facebook: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    linkedin: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
  }).optional().nullable(),
  notes: z.string().optional().nullable(),
  ragioneSociale: z.string().optional().nullable(),
  partitaIva: z.string().optional().nullable(),
  codiceFiscale: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  codiceUnivoco: z.string().optional().nullable(),
  pec: z.string().email("PEC non valida").optional().nullable().or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

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

interface RepairCenterPaymentConfig {
  ownConfig: (PaymentConfiguration & { hasPaypalSecret?: boolean; hasStripeSecret?: boolean }) | null;
  parentConfig: (PaymentConfiguration & { hasPaypalSecret?: boolean; hasStripeSecret?: boolean }) | null;
  effectiveConfig: (PaymentConfiguration & { hasPaypalSecret?: boolean; hasStripeSecret?: boolean }) | null;
  useParentConfig: boolean;
}

const DAYS_OF_WEEK_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const defaultOpeningHours = DAYS_OF_WEEK_KEYS.reduce((acc, key) => {
  acc[key] = {
    isOpen: key !== 'sunday',
    start: '09:00',
    end: '18:00',
    breakStart: null,
    breakEnd: null,
  };
  return acc;
}, {} as Record<string, { isOpen: boolean; start: string; end: string; breakStart: string | null; breakEnd: string | null }>);

export default function RepairCenterSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [localHourlyRate, setLocalHourlyRate] = useState<string>('35.00');
  const [localSlaThresholds, setLocalSlaThresholds] = useState<Record<string, { warning: number; critical: number }>>({});

  const { data: settings, isLoading } = useQuery<RepairCenter>({
    queryKey: ['/api/repair-center/settings'],
  });

  const { data: paymentConfigData, isLoading: isLoadingPayment } = useQuery<RepairCenterPaymentConfig>({
    queryKey: ['/api/repair-center/payment-config'],
  });

  const { data: stripeStatus, isLoading: isLoadingStripe } = useQuery<{
    connected: boolean;
    accountId?: string;
    status?: string;
    detailsSubmitted?: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
  }>({
    queryKey: ['/api/stripe/connect/status'],
  });

  const { data: hourlyRateData, isLoading: isLoadingHourlyRate } = useQuery<{
    hourlyRateCents: number;
    useParent: boolean;
    source: 'own' | 'reseller' | 'default';
  }>({
    queryKey: ['/api/repair-center/settings/hourly-rate'],
  });

  const { data: slaData, isLoading: isLoadingSla } = useQuery<{
    thresholds: {
      phase1: { warning: number; critical: number };
      phase2: { warning: number; critical: number };
      phase3: { warning: number; critical: number };
      phase4: { warning: number; critical: number };
    };
    useParent: boolean;
    source: 'own' | 'reseller' | 'default';
  }>({
    queryKey: ['/api/repair-center/settings/sla-thresholds'],
  });

  useEffect(() => {
    if (hourlyRateData) {
      setLocalHourlyRate(((hourlyRateData.hourlyRateCents ?? 3500) / 100).toFixed(2));
    }
  }, [hourlyRateData]);

  useEffect(() => {
    if (slaData?.thresholds) {
      setLocalSlaThresholds(slaData.thresholds);
    }
  }, [slaData?.thresholds]);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: '',
      description: '',
      address: '',
      city: '',
      cap: '',
      provincia: '',
      phone: '',
      email: '',
      publicPhone: '',
      publicEmail: '',
      websiteUrl: '',
      logoUrl: '',
      acceptsWalkIns: false,
      openingHours: defaultOpeningHours,
      socialLinks: { facebook: '', instagram: '', linkedin: '', twitter: '' },
      notes: '',
      ragioneSociale: '',
      partitaIva: '',
      codiceFiscale: '',
      iban: '',
      codiceUnivoco: '',
      pec: '',
    },
    values: settings ? {
      name: settings.name || '',
      description: settings.description || '',
      address: settings.address || '',
      city: settings.city || '',
      cap: settings.cap || '',
      provincia: settings.provincia || '',
      phone: settings.phone || '',
      email: settings.email || '',
      publicPhone: settings.publicPhone || '',
      publicEmail: settings.publicEmail || '',
      websiteUrl: settings.websiteUrl || '',
      logoUrl: settings.logoUrl || '',
      acceptsWalkIns: settings.acceptsWalkIns || false,
      openingHours: (settings.openingHours as any) || defaultOpeningHours,
      socialLinks: (settings.socialLinks as any) || { facebook: '', instagram: '', linkedin: '', twitter: '' },
      notes: settings.notes || '',
      ragioneSociale: settings.ragioneSociale || '',
      partitaIva: settings.partitaIva || '',
      codiceFiscale: settings.codiceFiscale || '',
      iban: settings.iban || '',
      codiceUnivoco: settings.codiceUnivoco || '',
      pec: settings.pec || '',
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      return apiRequest('PATCH', '/api/repair-center/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings'] });
      toast({
        title: t("settings.saved"),
        description: t("settings.changesSavedSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message || t("settings.cannotSaveSettings"),
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!settings?.id) throw new Error(t("settings.centroNonTrovato"));
      const formData = new FormData();
      formData.append("logo", file);
      const response = await fetch(`/api/repair-centers/${settings.id}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || t("settings.erroreUploadLogo"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings'] });
      setLogoFile(null);
      setLogoPreview(null);
      toast({
        title: t("profile.logoUploaded"),
        description: t("settings.ilLogoStatoAggiornatoConSuccesso"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message || t("settings.cannotUploadLogo"),
        variant: "destructive",
      });
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error(t("settings.centroNonTrovato"));
      return apiRequest('DELETE', `/api/repair-centers/${settings.id}/logo`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings'] });
      toast({
        title: t("profile.logoRemoved"),
        description: t("settings.ilLogoStatoRimossoConSuccesso"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message || t("settings.cannotRemoveLogo"),
        variant: "destructive",
      });
    },
  });

  const paymentForm = useForm<PaymentFormData>({
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
    values: paymentConfigData?.ownConfig ? {
      bankTransferEnabled: paymentConfigData.ownConfig.bankTransferEnabled,
      iban: paymentConfigData.ownConfig.iban || '',
      bankName: paymentConfigData.ownConfig.bankName || '',
      accountHolder: paymentConfigData.ownConfig.accountHolder || '',
      bic: paymentConfigData.ownConfig.bic || '',
      stripeEnabled: paymentConfigData.ownConfig.stripeEnabled,
      stripePublishableKey: paymentConfigData.ownConfig.stripePublishableKey || '',
      stripeSecretKey: '',
      paypalEnabled: paymentConfigData.ownConfig.paypalEnabled,
      paypalEmail: paymentConfigData.ownConfig.paypalEmail || '',
      paypalClientId: paymentConfigData.ownConfig.paypalClientId || '',
      paypalClientSecret: '',
    } : undefined,
  });

  const toggleUseParentConfigMutation = useMutation({
    mutationFn: async (useParentConfig: boolean) => {
      const res = await apiRequest('PUT', '/api/repair-center/payment-config', { useParentConfig });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/payment-config'] });
      toast({
        title: t("pos.configUpdated"),
        description: t("settings.laPreferenzaDiConfigurazionePagamentiStata"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const res = await apiRequest('PUT', '/api/repair-center/payment-config', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/payment-config'] });
      toast({
        title: t("pos.configSaved"),
        description: t("settings.metodiPagamentoAggiornati"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
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
        title: t("settings.erroreConnessioneStripe"),
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
        title: t("auth.error"),
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
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHourlyRateMutation = useMutation({
    mutationFn: async (data: { hourlyRateCents: number; useParent: boolean }) => {
      const res = await apiRequest('PATCH', '/api/repair-center/settings/hourly-rate', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings/hourly-rate'] });
      toast({
        title: t("settings.tariffaOrariaSalvata"),
        description: t("settings.laConfigurazioneDellaTariffaOrariaStataAgg"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSlaMutation = useMutation({
    mutationFn: async (data: { thresholds: any; useParent: boolean }) => {
      const res = await apiRequest('PUT', '/api/repair-center/settings/sla-thresholds', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings/sla-thresholds'] });
      toast({
        title: t("settings.soglieSLASalvate"),
        description: t("settings.laConfigurazioneDelleSoglieSLAStataAggiorn"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConnectStripe = () => {
    setIsConnectingStripe(true);
    connectStripeMutation.mutate();
  };

  const onPaymentSubmit = (data: PaymentFormData) => {
    // Validate: Secret Key is required when enabling Stripe for the first time
    // Skip validation if using parent config (inheriting from reseller)
    const hasOwnStripeSecret = paymentConfigData?.ownConfig?.hasStripeSecret;
    const needsStripeSecret = data.stripeEnabled && !hasOwnStripeSecret && (!data.stripeSecretKey || !data.stripeSecretKey.trim());
    
    if (needsStripeSecret && !paymentConfigData?.useParentConfig) {
      paymentForm.setError("stripeSecretKey", {
        type: "manual",
        message: t("settings.stripeSecretRequired")
      });
      return;
    }
    
    // Validate: Client Secret is required when enabling PayPal for the first time
    // Skip validation if using parent config (inheriting from reseller)
    const hasOwnSecret = paymentConfigData?.ownConfig?.hasPaypalSecret;
    const hasParentSecret = paymentConfigData?.parentConfig?.hasPaypalSecret;
    const needsSecret = data.paypalEnabled && !hasOwnSecret && (!data.paypalClientSecret || !data.paypalClientSecret.trim());
    
    // Only require secret if not using parent config OR parent doesn't have a secret
    if (needsSecret && !paymentConfigData?.useParentConfig) {
      paymentForm.setError("paypalClientSecret", {
        type: "manual",
        message: t("settings.paypalSecretRequired")
      });
      return;
    }
    updatePaymentMutation.mutate(data);
  };

  const getStripeStatusBadge = () => {
    if (!stripeStatus?.connected) {
      return <Badge variant="secondary">{t("settings.nonConnesso")}</Badge>;
    }
    
    switch (stripeStatus.status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">{t("common.active")}</Badge>;
      case 'onboarding':
        return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">{t("settings.onboardingInCorso")}</Badge>;
      case 'restricted':
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400">{t("settings.richiedeAzioni")}</Badge>;
      case 'disabled':
        return <Badge variant="destructive">{t("common.disabled")}</Badge>;
      default:
        return <Badge variant="secondary">{t("b2b.status.pending")}</Badge>;
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: t("common.invalidFormat"),
        description: t("common.fileMustBeFormat"),
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("profile.fileTooLarge"),
        description: t("settings.ilFileNonPuSuperareI2MB"),
        variant: "destructive",
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
  };

  const handleDeleteLogo = () => {
    deleteLogoMutation.mutate();
  };

  const onSubmit = (data: SettingsFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Settings className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{t("sidebar.items.settings")}</h1>
              <p className="text-emerald-100">{t("settings.gestisciLeInformazioniELePreferenzeDelTuoC")}</p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4 w-full max-w-full overflow-x-auto flex-nowrap justify-start">
              <TabsTrigger value="general" data-testid="tab-general">
                <Building2 className="h-4 w-4 mr-2" />
                {t("settings.generale")}
              </TabsTrigger>
              <TabsTrigger value="contact" data-testid="tab-contact">
                <Phone className="h-4 w-4 mr-2" />
                {t("settings.contatti")}
              </TabsTrigger>
              <TabsTrigger value="hours" data-testid="tab-hours">
                <Clock className="h-4 w-4 mr-2" />
                {t("settings.orari")}
              </TabsTrigger>
              <TabsTrigger value="fiscal" data-testid="tab-fiscal">
                <FileText className="h-4 w-4 mr-2" />
                {t("settings.datiFiscali")}
              </TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments">
                <CreditCard className="h-4 w-4 mr-2" />
                {t("settings.pagamenti")}
              </TabsTrigger>
              <TabsTrigger value="shipping" data-testid="tab-shipping">
                <Truck className="h-4 w-4 mr-2" />
                {t("settings.consegna")}
              </TabsTrigger>
              <TabsTrigger value="rates" data-testid="tab-rates">
                <Euro className="h-4 w-4 mr-2" />
                {t("settings.tariffe")}
              </TabsTrigger>
              <TabsTrigger value="sla" data-testid="tab-sla">
                <Target className="h-4 w-4 mr-2" />
                SLA
              </TabsTrigger>
              <TabsTrigger value="ai" data-testid="tab-ai">
                <Bot className="h-4 w-4 mr-2" />
                {t("ai.title", "Assistente AI")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("admin.resellerDetail.basicInfo")}</CardTitle>
                  <CardDescription>
                    {t("settings.informazioniPrincipali")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("admin.repairCenters.centerName")}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t("settings.nomeCentro")} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.website")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} placeholder="https://www.esempio.it" className="pl-10" data-testid="input-website" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.description")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} placeholder={t("settings.placeholderDescription")} className="min-h-[100px]" data-testid="input-description" />
                        </FormControl>
                        <FormDescription>
                          {t("settings.descriptionVisibleToCustomers")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.indirizzo")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} placeholder={t("settings.placeholderAddress")} className="pl-10" data-testid="input-address" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.citta")}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t("settings.placeholderCity")} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cap"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CAP</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="20100" data-testid="input-cap" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="provincia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.provincia")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder={t("settings.placeholderProvincia")} data-testid="input-provincia" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  {/* Logo Aziendale Section */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">{t("profile.companyLogo")}</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Carica il logo del tuo centro di riparazione (JPEG, PNG o WebP, max 2MB)
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-start gap-6">
                      <Avatar className="h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/25">
                        {(logoPreview || settings?.logoUrl) ? (
                          <AvatarImage 
                            src={logoPreview || settings?.logoUrl || ''} 
                            alt={t("settings.logoCentro")} 
                            className="object-contain"
                          />
                        ) : null}
                        <AvatarFallback className="rounded-xl bg-muted">
                          <Building2 className="h-10 w-10 text-muted-foreground" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleLogoFileChange}
                          className="hidden"
                          data-testid="input-logo-file"
                        />
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            data-testid="button-select-logo"
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Seleziona Immagine
                          </Button>
                          
                          {logoFile && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleUploadLogo}
                              disabled={uploadLogoMutation.isPending}
                              data-testid="button-upload-logo"
                            >
                              {uploadLogoMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              Carica Logo
                            </Button>
                          )}
                          
                          {settings?.logoUrl && !logoFile && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={handleDeleteLogo}
                              disabled={deleteLogoMutation.isPending}
                              data-testid="button-delete-logo"
                            >
                              {deleteLogoMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                              )}
                              Rimuovi Logo
                            </Button>
                          )}
                        </div>
                        
                        {logoFile && (
                          <p className="text-sm text-muted-foreground">
                            File selezionato: {logoFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <FormField
                    control={form.control}
                    name="acceptsWalkIns"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Accetta clienti senza appuntamento</FormLabel>
                          <FormDescription>
                            Indica se il centro accetta clienti che si presentano senza prenotazione
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-walk-ins"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("common.internalNotes")}</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} placeholder={t("settings.placeholderInternalNotes")} className="min-h-[80px]" data-testid="input-notes" />
                        </FormControl>
                        <FormDescription>
                          {t("settings.internalNotesOnly")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.informazioniContatto")}</CardTitle>
                  <CardDescription>
                    {t("settings.emailTelefonoDescrizione")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.telefonoGestionale")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} placeholder="+39 02 1234567" className="pl-10" data-testid="input-phone" />
                            </div>
                          </FormControl>
                          <FormDescription>{t("settings.perUsoInterno")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="publicPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.telefonoPubblico")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} placeholder="+39 02 7654321" className="pl-10" data-testid="input-public-phone" />
                            </div>
                          </FormControl>
                          <FormDescription>{t("settings.visibileAiClienti")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.emailGestionale")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="email" placeholder={t("settings.placeholderManagementEmail")} className="pl-10" data-testid="input-email" />
                            </div>
                          </FormControl>
                          <FormDescription>{t("settings.perUsoInterno")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="publicEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.emailPubblica")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} type="email" placeholder={t("settings.placeholderPublicEmail")} className="pl-10" data-testid="input-public-email" />
                            </div>
                          </FormControl>
                          <FormDescription>{t("settings.visibileAiClienti")}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Social Media</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="socialLinks.facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("settings.facebook")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} value={field.value || ''} placeholder="https://facebook.com/..." className="pl-10" data-testid="input-facebook" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="socialLinks.instagram"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("settings.instagram")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} value={field.value || ''} placeholder="https://instagram.com/..." className="pl-10" data-testid="input-instagram" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="socialLinks.linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("settings.linkedin")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} value={field.value || ''} placeholder="https://linkedin.com/..." className="pl-10" data-testid="input-linkedin" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="socialLinks.twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("settings.twitterX")}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input {...field} value={field.value || ''} placeholder="https://x.com/..." className="pl-10" data-testid="input-twitter" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hours" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("settings.orariApertura")}</CardTitle>
                  <CardDescription>
                    {t("settings.configuraOrariDescrizione")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS_OF_WEEK_KEYS.map((dayKey) => {
                    const isOpen = form.watch(`openingHours.${dayKey}.isOpen`);
                    const hasBreak = form.watch(`openingHours.${dayKey}.breakStart`) || form.watch(`openingHours.${dayKey}.breakEnd`);
                    return (
                      <div key={dayKey} className="p-4 rounded-lg border space-y-3">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="w-28 font-medium">{t(`settings.${dayKey}`)}</div>
                          <FormField
                            control={form.control}
                            name={`openingHours.${dayKey}.isOpen`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid={`switch-day-${dayKey}`}
                                  />
                                </FormControl>
                                <Label className="text-sm text-muted-foreground">
                                  {field.value ? t("settings.aperto") : t("settings.chiuso")}
                                </Label>
                              </FormItem>
                            )}
                          />
                        </div>
                        {isOpen && (
                          <div className="ml-0 md:ml-32 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex flex-wrap items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                                <span className="text-xs text-muted-foreground font-medium w-16">Mattina</span>
                                <FormField
                                  control={form.control}
                                  name={`openingHours.${dayKey}.start`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} type="time" className="w-28 h-8" data-testid={`input-start-${dayKey}`} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="text-muted-foreground">-</span>
                                <FormField
                                  control={form.control}
                                  name={`openingHours.${dayKey}.breakStart`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          value={field.value || ''} 
                                          type="time" 
                                          className="w-28 h-8" 
                                          placeholder="--:--"
                                          data-testid={`input-break-start-${dayKey}`} 
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
                                <span className="text-xs text-muted-foreground font-medium w-16">Pomeriggio</span>
                                <FormField
                                  control={form.control}
                                  name={`openingHours.${dayKey}.breakEnd`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          value={field.value || ''} 
                                          type="time" 
                                          className="w-28 h-8" 
                                          placeholder="--:--"
                                          data-testid={`input-break-end-${dayKey}`} 
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="text-muted-foreground">-</span>
                                <FormField
                                  control={form.control}
                                  name={`openingHours.${dayKey}.end`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} type="time" className="w-28 h-8" data-testid={`input-end-${dayKey}`} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Lascia vuoti gli orari pausa per orario continuato
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fiscal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("profile.fiscalInfo")}</CardTitle>
                  <CardDescription>
                    Informazioni fiscali e bancarie del centro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ragioneSociale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.companyName")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder={t("settings.placeholderCompanyName")} data-testid="input-ragione-sociale" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="partitaIva"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.vatNumber")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="IT12345678901" data-testid="input-partita-iva" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="codiceFiscale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.codiceFiscale")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="12345678901" data-testid="input-codice-fiscale" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="codiceUnivoco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.codiceUnivocoSDI")}</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="ABC1234" maxLength={7} data-testid="input-codice-univoco" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="iban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.iban")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} placeholder={t("settings.placeholderIban")} className="pl-10" data-testid="input-iban" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pec"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("common.pec")}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} type="email" placeholder={t("settings.placeholderPec")} className="pl-10" data-testid="input-pec" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              <EntityFiscalConfig entityType="repair_center" basePath="/api/repair-center/fiscal" />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{t("settings.configurazionePagamenti")}</CardTitle>
                        <CardDescription>
                          {t("settings.gestisciMetodiPagamento")}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingPayment ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <>
                      {paymentConfigData?.parentConfig && (
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <Label className="text-base">Usa configurazione del rivenditore</Label>
                            <p className="text-sm text-muted-foreground">
                              Utilizza i metodi di pagamento configurati dal tuo rivenditore
                            </p>
                          </div>
                          <Switch
                            checked={paymentConfigData?.useParentConfig ?? false}
                            onCheckedChange={(checked) => toggleUseParentConfigMutation.mutate(checked)}
                            disabled={toggleUseParentConfigMutation.isPending}
                            data-testid="switch-use-parent-config"
                          />
                        </div>
                      )}

                      {paymentConfigData?.useParentConfig && paymentConfigData?.parentConfig ? (
                        <Card className="border-dashed">
                          <CardHeader>
                            <CardTitle className="text-lg">Configurazione del Rivenditore</CardTitle>
                            <CardDescription>
                              I metodi di pagamento attivi sono gestiti dal tuo rivenditore
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <Landmark className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{t("settings.bankTransfer")}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {paymentConfigData.parentConfig.bankTransferEnabled ? (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" /> {t("common.active")}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">{t("admin.resellerDetail.notActive")}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <SiStripe className="h-5 w-5 text-[#635bff]" />
                                <div>
                                  <p className="font-medium">Stripe</p>
                                  <p className="text-sm text-muted-foreground">
                                    {paymentConfigData.parentConfig.stripeEnabled ? (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" /> {t("common.active")}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">{t("admin.resellerDetail.notActive")}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <SiPaypal className="h-5 w-5 text-[#003087]" />
                                <div>
                                  <p className="font-medium">PayPal</p>
                                  <p className="text-sm text-muted-foreground">
                                    {paymentConfigData.parentConfig.paypalEnabled ? (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" /> {t("common.active")}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">{t("admin.resellerDetail.notActive")}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-[#635bff]/10 rounded-lg">
                                    <SiStripe className="h-6 w-6 text-[#635bff]" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-lg">Stripe Connect</CardTitle>
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
                                  <span>{t("settings.verificaStatoConnessione")}</span>
                                </div>
                              ) : stripeStatus?.connected ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-xs text-muted-foreground">Account ID</p>
                                      <p className="font-mono text-sm">{stripeStatus.accountId}</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-xs text-muted-foreground">{t("settings.dettagliCompletati")}</p>
                                      <p className="font-medium flex items-center gap-1">
                                        {stripeStatus.detailsSubmitted ? (
                                          <><CheckCircle className="h-4 w-4 text-green-500" /> {t("license.yes")}</>
                                        ) : (
                                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> {t("common.no")}</>
                                        )}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-xs text-muted-foreground">Pagamenti abilitati</p>
                                      <p className="font-medium flex items-center gap-1">
                                        {stripeStatus.chargesEnabled ? (
                                          <><CheckCircle className="h-4 w-4 text-green-500" /> {t("license.yes")}</>
                                        ) : (
                                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> {t("common.no")}</>
                                        )}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                      <p className="text-xs text-muted-foreground">Bonifici abilitati</p>
                                      <p className="font-medium flex items-center gap-1">
                                        {stripeStatus.payoutsEnabled ? (
                                          <><CheckCircle className="h-4 w-4 text-green-500" /> {t("license.yes")}</>
                                        ) : (
                                          <><AlertCircle className="h-4 w-4 text-yellow-500" /> {t("common.no")}</>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap gap-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => getStripeDashboardMutation.mutate()}
                                      disabled={getStripeDashboardMutation.isPending}
                                      data-testid="button-stripe-dashboard"
                                    >
                                      {getStripeDashboardMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                      )}
                                      Apri Dashboard Stripe
                                    </Button>

                                    {!stripeStatus.detailsSubmitted && (
                                      <Button
                                        type="button"
                                        onClick={() => refreshStripeLinkMutation.mutate()}
                                        disabled={refreshStripeLinkMutation.isPending}
                                        data-testid="button-stripe-complete"
                                      >
                                        {refreshStripeLinkMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : null}
                                        Completa Configurazione
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground">
                                    Connetti il tuo account Stripe per iniziare a ricevere pagamenti con carta di credito. 
                                    La configurazione richiede solo pochi minuti.
                                  </p>
                                  <Button
                                    type="button"
                                    onClick={handleConnectStripe}
                                    disabled={isConnectingStripe || connectStripeMutation.isPending}
                                    data-testid="button-connect-stripe"
                                  >
                                    {(isConnectingStripe || connectStripeMutation.isPending) ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <SiStripe className="h-4 w-4 mr-2" />
                                    )}
                                    Connetti con Stripe
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <Form {...paymentForm}>
                            <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                              <Card>
                                <CardHeader>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                      <Landmark className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg">{t("settings.bankTransfer")}</CardTitle>
                                      <CardDescription>
                                        Configura i dati bancari per ricevere pagamenti tramite bonifico
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <FormField
                                    control={paymentForm.control}
                                    name="bankTransferEnabled"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                          <FormLabel className="text-base">Abilita Bonifico Bancario</FormLabel>
                                          <FormDescription>
                                            Permetti ai clienti di pagare tramite bonifico bancario
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

                                  {paymentForm.watch("bankTransferEnabled") && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                      <FormField
                                        control={paymentForm.control}
                                        name="accountHolder"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{t("settings.intestatarioConto")}</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ''} placeholder={t("settings.placeholderAccountHolder")} data-testid="input-account-holder" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={paymentForm.control}
                                        name="bankName"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{t("settings.nomeBanca")}</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ''} placeholder={t("settings.placeholderBankName")} data-testid="input-bank-name" />
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
                                            <FormLabel>{t("profile.iban")}</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ''} placeholder={t("settings.placeholderIban")} data-testid="input-payment-iban" />
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
                                            <FormLabel>{t("settings.bicSwift")}</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ''} placeholder="UNCRITMMXXX" data-testid="input-bic" />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#635bff]/10 rounded-lg">
                                      <SiStripe className="h-6 w-6 text-[#635bff]" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg">Stripe API Keys</CardTitle>
                                      <CardDescription>
                                        {t("settings.configureStripeKeys")}
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <FormField
                                    control={paymentForm.control}
                                    name="stripeEnabled"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                          <FormLabel className="text-base">{t("settings.enableStripe")}</FormLabel>
                                          <FormDescription>
                                            {t("settings.enableStripeDesc")}
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

                                  {paymentForm.watch("stripeEnabled") && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <FormField
                                        control={paymentForm.control}
                                        name="stripePublishableKey"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{t("settings.publishableKey")}</FormLabel>
                                            <FormControl>
                                              <Input 
                                                placeholder="pk_live_... o pk_test_..." 
                                                {...field}
                                                value={field.value || ''}
                                                data-testid="input-stripe-publishable-key"
                                              />
                                            </FormControl>
                                            <FormDescription>
                                              Disponibile su dashboard.stripe.com
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={paymentForm.control}
                                        name="stripeSecretKey"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{t("settings.secretKey")}</FormLabel>
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
                                              {(paymentConfigData?.ownConfig as any)?.hasStripeSecret 
                                                ? t("settings.leaveEmptyToKeepExistingValue")
                                                : t("settings.requiredToEnableStripe")
                                              }
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#003087]/10 rounded-lg">
                                      <SiPaypal className="h-6 w-6 text-[#003087]" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg">PayPal</CardTitle>
                                      <CardDescription>
                                        Ricevi pagamenti tramite PayPal
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <FormField
                                    control={paymentForm.control}
                                    name="paypalEnabled"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                          <FormLabel className="text-base">Abilita PayPal</FormLabel>
                                          <FormDescription>
                                            Permetti ai clienti di pagare tramite PayPal
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

                                  {paymentForm.watch("paypalEnabled") && (
                                    <>
                                    <FormField
                                      control={paymentForm.control}
                                      name="paypalEmail"
                                      render={({ field }) => (
                                        <FormItem className="pt-4">
                                          <FormLabel>{t("settings.paypalEmail")}</FormLabel>
                                          <FormControl>
                                            <div className="relative">
                                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                              <Input {...field} value={field.value || ''} type="email" placeholder={t("settings.placeholderPaypalEmail")} className="pl-10" data-testid="input-paypal-email" />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                      <FormField
                                        control={paymentForm.control}
                                        name="paypalClientId"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{t("settings.clientId")}</FormLabel>
                                            <FormControl>
                                              <Input 
                                                placeholder="AVz..." 
                                                {...field}
                                                value={field.value || ''}
                                                data-testid="input-paypal-client-id"
                                              />
                                            </FormControl>
                                            <FormDescription>
                                              {t("settings.paypalClientIdDesc")}
                                            </FormDescription>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      <FormField
                                        control={paymentForm.control}
                                        name="paypalClientSecret"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>{t("settings.clientSecret")}</FormLabel>
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
                                              {paymentConfigData?.ownConfig?.hasPaypalSecret 
                                                ? t("settings.leaveEmptyToKeep")
                                                : t("settings.requiredForPaypal")
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
                                        <li>{t("settings.paypalStep1")} <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">developer.paypal.com</a></li>
                                        <li>{t("settings.paypalStep2")}</li>
                                        <li>{t("settings.paypalStep3")}</li>
                                        <li>{t("settings.paypalStep4")}</li>
                                        <li>{t("settings.paypalStep5")}</li>
                                      </ol>
                                    </div>
                                    </>
                                  )}
                                </CardContent>
                              </Card>


                              <div className="flex justify-end">
                                <Button type="submit" disabled={updatePaymentMutation.isPending} data-testid="button-save-payments">
                                  {updatePaymentMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      {t("common.saving")}
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      {t("settings.savePaymentConfig")}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="shipping" className="space-y-6">
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
                    role="repair_center"
                    apiBase="/api/repair-center/shipping-methods"
                    showInheritedMethods={true}
                    inheritedMethodsFilter={(m) => !m.repairCenterId}
                    ownMethodsFilter={(m) => !!m.repairCenterId}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    {t("settings.hourlyLaborRate")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.hourlyLaborRateDesc")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingHourlyRate ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={hourlyRateData?.useParent ?? true}
                            onCheckedChange={(checked) => {
                              updateHourlyRateMutation.mutate({
                                hourlyRateCents: hourlyRateData?.hourlyRateCents ?? 3500,
                                useParent: checked
                              });
                            }}
                            disabled={updateHourlyRateMutation.isPending}
                            data-testid="switch-hourly-rate-use-parent"
                          />
                          <div>
                            <Label className="text-base font-medium">{t("settings.useResellerRate")}</Label>
                            <p className="text-sm text-muted-foreground">
                              {t("settings.useResellerRateDesc")}
                            </p>
                          </div>
                        </div>
                        {hourlyRateData?.source && (
                          <Badge 
                            variant={hourlyRateData.source === 'own' ? 'default' : 'secondary'}
                            data-testid="badge-hourly-rate-source"
                          >
                            {hourlyRateData.source === 'own' ? t("settings.customized") : 
                             hourlyRateData.source === 'reseller' ? t("settings.fromReseller") : t("common.default")}
                          </Badge>
                        )}
                      </div>

                      {!hourlyRateData?.useParent && (
                        <div className="space-y-4 p-4 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {t("settings.usingCustomRate")}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="hourly-rate">{t("settings.hourlyRateLabel")}</Label>
                              <div className="relative">
                                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="hourly-rate"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="pl-10"
                                  value={localHourlyRate}
                                  onChange={(e) => setLocalHourlyRate(e.target.value)}
                                  onBlur={() => {
                                    const cents = Math.round(parseFloat(localHourlyRate || '0') * 100);
                                    updateHourlyRateMutation.mutate({
                                      hourlyRateCents: cents,
                                      useParent: false
                                    });
                                  }}
                                  disabled={updateHourlyRateMutation.isPending}
                                  data-testid="input-hourly-rate"
                                />
                              </div>
                            </div>
                            <div className="flex items-end">
                              <div className="p-3 rounded-lg bg-muted">
                                <p className="text-sm font-medium text-muted-foreground">{t("settings.currentRate")}</p>
                                <p className="text-2xl font-bold" data-testid="text-hourly-rate-value">
                                  {((hourlyRateData?.hourlyRateCents ?? 3500) / 100).toFixed(2)} EUR/ora
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {hourlyRateData?.useParent && (
                        <div className="p-4 rounded-lg border bg-muted/30">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Tariffa ereditata dal Reseller</p>
                              <p className="text-2xl font-bold" data-testid="text-hourly-rate-inherited">
                                {((hourlyRateData?.hourlyRateCents ?? 3500) / 100).toFixed(2)} EUR/ora
                              </p>
                            </div>
                            <Badge variant="secondary" data-testid="badge-hourly-rate-inherited">Ereditata</Badge>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sla" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Soglie SLA
                  </CardTitle>
                  <CardDescription>
                    Configura le soglie temporali per gli avvisi SLA delle riparazioni
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingSla ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={slaData?.useParent ?? true}
                            onCheckedChange={(checked) => {
                              updateSlaMutation.mutate({
                                thresholds: localSlaThresholds,
                                useParent: checked
                              });
                            }}
                            disabled={updateSlaMutation.isPending}
                            data-testid="switch-sla-use-parent"
                          />
                          <div>
                            <Label className="text-base font-medium">Usa soglie Reseller</Label>
                            <p className="text-sm text-muted-foreground">
                              Eredita automaticamente le soglie SLA dal tuo Reseller
                            </p>
                          </div>
                        </div>
                        {slaData?.source && (
                          <Badge 
                            variant={slaData.source === 'own' ? 'default' : 'secondary'}
                            data-testid="badge-sla-source"
                          >
                            {slaData.source === 'own' ? t("settings.customized") : 
                             slaData.source === 'reseller' ? t("settings.fromReseller") : t("common.default")}
                          </Badge>
                        )}
                      </div>

                      <div className={`space-y-4 p-4 rounded-lg border ${slaData?.useParent ? 'bg-muted/30' : ''}`}>
                        {!slaData?.useParent && (
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Stai usando soglie personalizzate per questo centro
                            </span>
                          </div>
                        )}

                        {slaData?.useParent && (
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="secondary" data-testid="badge-sla-inherited">Soglie ereditate</Badge>
                            <span className="text-sm text-muted-foreground">
                              Le soglie mostrate sono quelle del tuo Reseller
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { key: 'phase1', label: 'Fase 1 - Accettazione', icon: CheckCircle },
                            { key: 'phase2', label: 'Fase 2 - Diagnostica', icon: AlertCircle },
                            { key: 'phase3', label: 'Fase 3 - Riparazione', icon: Settings },
                            { key: 'phase4', label: 'Fase 4 - Consegna', icon: Truck },
                          ].map(({ key, label, icon: Icon }) => (
                            <div key={key} className="p-4 rounded-lg border bg-card" data-testid={`card-sla-${key}`}>
                              <div className="flex items-center gap-2 mb-3">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium" data-testid={`text-sla-${key}-label`}>{label}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t("settings.warningHours")}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={localSlaThresholds[key]?.warning ?? slaData?.thresholds?.[key as keyof typeof slaData.thresholds]?.warning ?? 24}
                                    onChange={(e) => {
                                      if (slaData?.useParent) return;
                                      setLocalSlaThresholds(prev => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          warning: parseInt(e.target.value) || 24,
                                          critical: prev[key]?.critical ?? slaData?.thresholds?.[key as keyof typeof slaData.thresholds]?.critical ?? 48
                                        }
                                      }));
                                    }}
                                    onBlur={() => {
                                      if (slaData?.useParent) return;
                                      updateSlaMutation.mutate({ thresholds: localSlaThresholds, useParent: false });
                                    }}
                                    disabled={slaData?.useParent || updateSlaMutation.isPending}
                                    className="h-8 text-sm"
                                    data-testid={`input-sla-${key}-warning`}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">{t("settings.criticalHours")}</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={localSlaThresholds[key]?.critical ?? slaData?.thresholds?.[key as keyof typeof slaData.thresholds]?.critical ?? 48}
                                    onChange={(e) => {
                                      if (slaData?.useParent) return;
                                      setLocalSlaThresholds(prev => ({
                                        ...prev,
                                        [key]: {
                                          warning: prev[key]?.warning ?? slaData?.thresholds?.[key as keyof typeof slaData.thresholds]?.warning ?? 24,
                                          ...prev[key],
                                          critical: parseInt(e.target.value) || 48
                                        }
                                      }));
                                    }}
                                    onBlur={() => {
                                      if (slaData?.useParent) return;
                                      updateSlaMutation.mutate({ thresholds: localSlaThresholds, useParent: false });
                                    }}
                                    disabled={slaData?.useParent || updateSlaMutation.isPending}
                                    className="h-8 text-sm"
                                    data-testid={`input-sla-${key}-critical`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <AiConfigSection role="repair_center" apiBase="/api/repair-center/ai-config" />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t("settings.saveSettings")}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
