import { useState, useRef } from "react";
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
import { Building2, Phone, Mail, Globe, Clock, Camera, Save, Loader2, MapPin, FileText, CreditCard, Instagram, Linkedin, Twitter, Facebook, Settings, Trash2, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { z } from "zod";
import type { RepairCenter } from "@shared/schema";

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

  const { data: settings, isLoading } = useQuery<RepairCenter>({
    queryKey: ['/api/repair-center/settings'],
  });

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
