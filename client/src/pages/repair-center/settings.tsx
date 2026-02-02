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
import { Building2, Phone, Mail, Globe, Clock, Camera, Save, Loader2, MapPin, FileText, CreditCard, Instagram, Linkedin, Twitter, Facebook, Settings, Trash2, Upload, Landmark, CircleDollarSign, Wallet, CheckCircle, AlertCircle, ExternalLink, Truck, Euro, Target, Info } from "lucide-react";
import { ShippingMethodsTab } from "@/components/shipping-methods-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import type { RepairCenter, PaymentConfiguration } from "@shared/schema";
import { SiStripe, SiPaypal } from "react-icons/si";

const settingsFormSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  description: z.string().optional().nullable(),
  address: z.string().min(1, "L'indirizzo è obbligatorio"),
  city: z.string().min(1, "La città è obbligatoria"),
  cap: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  phone: z.string().min(1, "Il telefono è obbligatorio"),
  email: z.string().email("Email non valida"),
  publicPhone: z.string().optional().nullable(),
  publicEmail: z.string().email("Email non valida").optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url("URL non valido").optional().nullable().or(z.literal('')),
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
  paypalEnabled: z.boolean().default(false),
  paypalEmail: z.string().email("Email PayPal non valida").optional().nullable().or(z.literal('')),
  satispayEnabled: z.boolean().default(false),
  satispayShopId: z.string().max(50).optional().nullable(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface RepairCenterPaymentConfig {
  ownConfig: PaymentConfiguration | null;
  parentConfig: PaymentConfiguration | null;
  effectiveConfig: PaymentConfiguration | null;
  useParentConfig: boolean;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
];

const defaultOpeningHours = DAYS_OF_WEEK.reduce((acc, day) => {
  acc[day.key] = {
    isOpen: day.key !== 'sunday',
    start: '09:00',
    end: '18:00',
    breakStart: null,
    breakEnd: null,
  };
  return acc;
}, {} as Record<string, { isOpen: boolean; start: string; end: string; breakStart: string | null; breakEnd: string | null }>);

export default function RepairCenterSettings() {
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
        title: "Impostazioni salvate",
        description: "Le modifiche sono state salvate con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile salvare le impostazioni.",
        variant: "destructive",
      });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!settings?.id) throw new Error("Centro non trovato");
      const formData = new FormData();
      formData.append("logo", file);
      const response = await fetch(`/api/repair-centers/${settings.id}/logo`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Errore durante l'upload del logo");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings'] });
      setLogoFile(null);
      setLogoPreview(null);
      toast({
        title: "Logo caricato",
        description: "Il logo è stato aggiornato con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile caricare il logo.",
        variant: "destructive",
      });
    },
  });

  const deleteLogoMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.id) throw new Error("Centro non trovato");
      return apiRequest('DELETE', `/api/repair-centers/${settings.id}/logo`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings'] });
      toast({
        title: "Logo rimosso",
        description: "Il logo è stato rimosso con successo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile rimuovere il logo.",
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
      paypalEnabled: false,
      paypalEmail: '',
      satispayEnabled: false,
      satispayShopId: '',
    },
    values: paymentConfigData?.ownConfig ? {
      bankTransferEnabled: paymentConfigData.ownConfig.bankTransferEnabled,
      iban: paymentConfigData.ownConfig.iban || '',
      bankName: paymentConfigData.ownConfig.bankName || '',
      accountHolder: paymentConfigData.ownConfig.accountHolder || '',
      bic: paymentConfigData.ownConfig.bic || '',
      paypalEnabled: paymentConfigData.ownConfig.paypalEnabled,
      paypalEmail: paymentConfigData.ownConfig.paypalEmail || '',
      satispayEnabled: paymentConfigData.ownConfig.satispayEnabled,
      satispayShopId: paymentConfigData.ownConfig.satispayShopId || '',
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
        title: "Configurazione aggiornata",
        description: "La preferenza di configurazione pagamenti è stata salvata.",
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

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const res = await apiRequest('PUT', '/api/repair-center/payment-config', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/payment-config'] });
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

  const updateHourlyRateMutation = useMutation({
    mutationFn: async (data: { hourlyRateCents: number; useParent: boolean }) => {
      const res = await apiRequest('PATCH', '/api/repair-center/settings/hourly-rate', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings/hourly-rate'] });
      toast({
        title: "Tariffa oraria salvata",
        description: "La configurazione della tariffa oraria è stata aggiornata.",
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

  const updateSlaMutation = useMutation({
    mutationFn: async (data: { thresholds: any; useParent: boolean }) => {
      const res = await apiRequest('PUT', '/api/repair-center/settings/sla-thresholds', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repair-center/settings/sla-thresholds'] });
      toast({
        title: "Soglie SLA salvate",
        description: "La configurazione delle soglie SLA è stata aggiornata.",
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

  const handleConnectStripe = () => {
    setIsConnectingStripe(true);
    connectStripeMutation.mutate();
  };

  const onPaymentSubmit = (data: PaymentFormData) => {
    updatePaymentMutation.mutate(data);
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

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Formato non valido",
        description: "Il file deve essere in formato JPEG, PNG o WebP.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File troppo grande",
        description: "Il file non può superare i 2MB.",
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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Impostazioni</h1>
              <p className="text-emerald-100">Gestisci le informazioni e le preferenze del tuo centro di riparazione</p>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="general" data-testid="tab-general">
                <Building2 className="h-4 w-4 mr-2" />
                Generale
              </TabsTrigger>
              <TabsTrigger value="contact" data-testid="tab-contact">
                <Phone className="h-4 w-4 mr-2" />
                Contatti
              </TabsTrigger>
              <TabsTrigger value="hours" data-testid="tab-hours">
                <Clock className="h-4 w-4 mr-2" />
                Orari
              </TabsTrigger>
              <TabsTrigger value="fiscal" data-testid="tab-fiscal">
                <FileText className="h-4 w-4 mr-2" />
                Dati Fiscali
              </TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagamenti
              </TabsTrigger>
              <TabsTrigger value="shipping" data-testid="tab-shipping">
                <Truck className="h-4 w-4 mr-2" />
                Consegna
              </TabsTrigger>
              <TabsTrigger value="rates" data-testid="tab-rates">
                <Euro className="h-4 w-4 mr-2" />
                Tariffe
              </TabsTrigger>
              <TabsTrigger value="sla" data-testid="tab-sla">
                <Target className="h-4 w-4 mr-2" />
                SLA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Base</CardTitle>
                  <CardDescription>
                    Le informazioni principali del tuo centro di riparazione
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Centro</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome del centro" data-testid="input-name" />
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
                          <FormLabel>Sito Web</FormLabel>
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
                        <FormLabel>Descrizione</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} placeholder="Descrivi il tuo centro di riparazione..." className="min-h-[100px]" data-testid="input-description" />
                        </FormControl>
                        <FormDescription>
                          Questa descrizione sarà visibile ai clienti
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
                          <FormLabel>Indirizzo</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} placeholder="Via Roma, 1" className="pl-10" data-testid="input-address" />
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
                          <FormLabel>Città</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Milano" data-testid="input-city" />
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
                          <FormLabel>Provincia</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="MI" data-testid="input-provincia" />
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
                      <Label className="text-base font-medium">Logo Aziendale</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Carica il logo del tuo centro di riparazione (JPEG, PNG o WebP, max 2MB)
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-start gap-6">
                      <Avatar className="h-24 w-24 rounded-xl border-2 border-dashed border-muted-foreground/25">
                        {(logoPreview || settings?.logoUrl) ? (
                          <AvatarImage 
                            src={logoPreview || settings?.logoUrl || ''} 
                            alt="Logo centro" 
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
                        <FormLabel>Note Interne</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ''} placeholder="Note visibili solo agli operatori..." className="min-h-[80px]" data-testid="input-notes" />
                        </FormControl>
                        <FormDescription>
                          Queste note sono visibili solo al personale interno
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
                  <CardTitle>Informazioni di Contatto</CardTitle>
                  <CardDescription>
                    Email e telefono per i clienti e per uso interno
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono Gestionale</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} placeholder="+39 02 1234567" className="pl-10" data-testid="input-phone" />
                            </div>
                          </FormControl>
                          <FormDescription>Per uso interno</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="publicPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono Pubblico</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} placeholder="+39 02 7654321" className="pl-10" data-testid="input-public-phone" />
                            </div>
                          </FormControl>
                          <FormDescription>Visibile ai clienti</FormDescription>
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
                          <FormLabel>Email Gestionale</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="email" placeholder="gestione@centro.it" className="pl-10" data-testid="input-email" />
                            </div>
                          </FormControl>
                          <FormDescription>Per uso interno</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="publicEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Pubblica</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} type="email" placeholder="info@centro.it" className="pl-10" data-testid="input-public-email" />
                            </div>
                          </FormControl>
                          <FormDescription>Visibile ai clienti</FormDescription>
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
                            <FormLabel>Facebook</FormLabel>
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
                            <FormLabel>Instagram</FormLabel>
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
                            <FormLabel>LinkedIn</FormLabel>
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
                            <FormLabel>Twitter / X</FormLabel>
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
                  <CardTitle>Orari di Apertura</CardTitle>
                  <CardDescription>
                    Configura gli orari di apertura del centro per ogni giorno della settimana
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const isOpen = form.watch(`openingHours.${day.key}.isOpen`);
                    const hasBreak = form.watch(`openingHours.${day.key}.breakStart`) || form.watch(`openingHours.${day.key}.breakEnd`);
                    return (
                      <div key={day.key} className="p-4 rounded-lg border space-y-3">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="w-28 font-medium">{day.label}</div>
                          <FormField
                            control={form.control}
                            name={`openingHours.${day.key}.isOpen`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid={`switch-day-${day.key}`}
                                  />
                                </FormControl>
                                <Label className="text-sm text-muted-foreground">
                                  {field.value ? 'Aperto' : 'Chiuso'}
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
                                  name={`openingHours.${day.key}.start`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} type="time" className="w-28 h-8" data-testid={`input-start-${day.key}`} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="text-muted-foreground">-</span>
                                <FormField
                                  control={form.control}
                                  name={`openingHours.${day.key}.breakStart`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          value={field.value || ''} 
                                          type="time" 
                                          className="w-28 h-8" 
                                          placeholder="--:--"
                                          data-testid={`input-break-start-${day.key}`} 
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
                                  name={`openingHours.${day.key}.breakEnd`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          value={field.value || ''} 
                                          type="time" 
                                          className="w-28 h-8" 
                                          placeholder="--:--"
                                          data-testid={`input-break-end-${day.key}`} 
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <span className="text-muted-foreground">-</span>
                                <FormField
                                  control={form.control}
                                  name={`openingHours.${day.key}.end`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input {...field} type="time" className="w-28 h-8" data-testid={`input-end-${day.key}`} />
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
                  <CardTitle>Dati Fiscali</CardTitle>
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
                          <FormLabel>Ragione Sociale</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Centro Riparazioni S.r.l." data-testid="input-ragione-sociale" />
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
                          <FormLabel>Partita IVA</FormLabel>
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
                          <FormLabel>Codice Fiscale</FormLabel>
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
                          <FormLabel>Codice Univoco SDI</FormLabel>
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
                          <FormLabel>IBAN</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} placeholder="IT60X0542811101000000123456" className="pl-10" data-testid="input-iban" />
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
                          <FormLabel>PEC</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input {...field} value={field.value || ''} type="email" placeholder="centro@pec.it" className="pl-10" data-testid="input-pec" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
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
                        <CardTitle>Configurazione Pagamenti</CardTitle>
                        <CardDescription>
                          Gestisci i metodi di pagamento per ricevere i pagamenti dai tuoi clienti
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
                                  <p className="font-medium">Bonifico Bancario</p>
                                  <p className="text-sm text-muted-foreground">
                                    {paymentConfigData.parentConfig.bankTransferEnabled ? (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" /> Attivo
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">Non attivo</span>
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
                                        <CheckCircle className="h-3 w-3" /> Attivo
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">Non attivo</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                <CircleDollarSign className="h-5 w-5 text-[#f24e4e]" />
                                <div>
                                  <p className="font-medium">Satispay</p>
                                  <p className="text-sm text-muted-foreground">
                                    {paymentConfigData.parentConfig.satispayEnabled ? (
                                      <span className="flex items-center gap-1 text-green-600">
                                        <CheckCircle className="h-3 w-3" /> Attivo
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">Non attivo</span>
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
                                      <CardTitle className="text-lg">Bonifico Bancario</CardTitle>
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
                                            <FormLabel>Intestatario Conto</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ''} placeholder="Nome Cognome o Ragione Sociale" data-testid="input-account-holder" />
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
                                            <FormLabel>Nome Banca</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ''} placeholder="Es. UniCredit" data-testid="input-bank-name" />
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
                                            <FormLabel>IBAN</FormLabel>
                                            <FormControl>
                                              <Input {...field} value={field.value || ''} placeholder="IT60X0542811101000000123456" data-testid="input-payment-iban" />
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
                                    <FormField
                                      control={paymentForm.control}
                                      name="paypalEmail"
                                      render={({ field }) => (
                                        <FormItem className="pt-4">
                                          <FormLabel>Email PayPal</FormLabel>
                                          <FormControl>
                                            <div className="relative">
                                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                              <Input {...field} value={field.value || ''} type="email" placeholder="pagamenti@tuaemail.it" className="pl-10" data-testid="input-paypal-email" />
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#f24e4e]/10 rounded-lg">
                                      <CircleDollarSign className="h-6 w-6 text-[#f24e4e]" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg">Satispay</CardTitle>
                                      <CardDescription>
                                        Ricevi pagamenti tramite Satispay Business
                                      </CardDescription>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <FormField
                                    control={paymentForm.control}
                                    name="satispayEnabled"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                          <FormLabel className="text-base">Abilita Satispay</FormLabel>
                                          <FormDescription>
                                            Permetti ai clienti di pagare tramite Satispay
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

                                  {paymentForm.watch("satispayEnabled") && (
                                    <FormField
                                      control={paymentForm.control}
                                      name="satispayShopId"
                                      render={({ field }) => (
                                        <FormItem className="pt-4">
                                          <FormLabel>Satispay Shop ID</FormLabel>
                                          <FormControl>
                                            <Input {...field} value={field.value || ''} placeholder="Il tuo Shop ID Satispay" data-testid="input-satispay-shop-id" />
                                          </FormControl>
                                          <FormDescription>
                                            Trova il tuo Shop ID nella dashboard Satispay Business
                                          </FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                </CardContent>
                              </Card>

                              <div className="flex justify-end">
                                <Button type="submit" disabled={updatePaymentMutation.isPending} data-testid="button-save-payments">
                                  {updatePaymentMutation.isPending ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Salvataggio...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Salva Configurazione Pagamenti
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
                    Metodi di Consegna
                  </CardTitle>
                  <CardDescription>
                    Configura le opzioni di spedizione e ritiro. I metodi del tuo reseller sono ereditati automaticamente
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
                    Tariffa Oraria Manodopera
                  </CardTitle>
                  <CardDescription>
                    Configura la tariffa oraria per il calcolo dei costi di manodopera
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
                            <Label className="text-base font-medium">Usa tariffa Reseller</Label>
                            <p className="text-sm text-muted-foreground">
                              Eredita automaticamente la tariffa oraria dal tuo Reseller
                            </p>
                          </div>
                        </div>
                        {hourlyRateData?.source && (
                          <Badge 
                            variant={hourlyRateData.source === 'own' ? 'default' : 'secondary'}
                            data-testid="badge-hourly-rate-source"
                          >
                            {hourlyRateData.source === 'own' ? 'Personalizzata' : 
                             hourlyRateData.source === 'reseller' ? 'Dal Reseller' : 'Default'}
                          </Badge>
                        )}
                      </div>

                      {!hourlyRateData?.useParent && (
                        <div className="space-y-4 p-4 rounded-lg border">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Stai usando una tariffa personalizzata per questo centro
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="hourly-rate">Tariffa Oraria (EUR)</Label>
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
                                <p className="text-sm font-medium text-muted-foreground">Tariffa corrente</p>
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
                            {slaData.source === 'own' ? 'Personalizzate' : 
                             slaData.source === 'reseller' ? 'Dal Reseller' : 'Default'}
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
                                  <Label className="text-xs text-muted-foreground">Warning (ore)</Label>
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
                                  <Label className="text-xs text-muted-foreground">Critical (ore)</Label>
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
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save">
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salva Impostazioni
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
