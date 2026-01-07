import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { RepairCenter, InsertRepairCenter, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MapPin, Phone, Mail, Pencil, Trash2, Building, Store, Clock, ChevronLeft, ChevronRight, Check, FileText, Settings, Eye, KeyRound, AlertTriangle, UserPlus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AddressAutocomplete } from "@/components/address-autocomplete";

const WIZARD_STEPS = [
  { id: 1, title: "Info Base", icon: Building },
  { id: 2, title: "Indirizzo", icon: MapPin },
  { id: 3, title: "Dati Fiscali", icon: FileText },
  { id: 4, title: "Configurazione", icon: Settings },
];

export default function AdminRepairCenters() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<RepairCenter | null>(null);
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [selectedSubResellerId, setSelectedSubResellerId] = useState<string>("");
  const [addressData, setAddressData] = useState({ address: "", city: "", cap: "", provincia: "" });
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");
  const [wizardStep, setWizardStep] = useState(1);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [centerToResetPassword, setCenterToResetPassword] = useState<RepairCenter | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [backfillDialogOpen, setBackfillDialogOpen] = useState(false);
  const [backfillResult, setBackfillResult] = useState<{
    created: Array<{ centerId: string; centerName: string; username: string; email: string; tempPassword: string }>;
    errors: Array<{ centerId: string; centerName: string; error: string }>;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    ragioneSociale: "",
    partitaIva: "",
    codiceFiscale: "",
    codiceUnivoco: "",
    pec: "",
    iban: "",
  });
  const { toast } = useToast();

  const { data: centers = [], isLoading } = useQuery<RepairCenter[]>({
    queryKey: ["/api/admin/repair-centers"],
  });

  const { data: resellers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/resellers"],
  });

  // Query per sub-reseller del rivenditore selezionato
  const { data: subResellers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/resellers", selectedResellerId, "sub-resellers"],
    enabled: !!selectedResellerId,
  });

  // Query per centri orfani (senza account utente)
  const { data: orphansData } = useQuery<{ totalCenters: number; orphanCount: number; orphans: any[] }>({
    queryKey: ["/api/admin/repair-centers/orphans"],
  });

  const createCenterMutation = useMutation({
    mutationFn: async (data: InsertRepairCenter) => {
      const res = await apiRequest("POST", "/api/admin/repair-centers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      setSelectedResellerId("");
      setSelectedSubResellerId("");
      toast({ title: "Centro di riparazione creato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateCenterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RepairCenter> }) => {
      const res = await apiRequest("PATCH", `/api/admin/repair-centers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers"] });
      setDialogOpen(false);
      setEditingCenter(null);
      setSelectedResellerId("");
      setSelectedSubResellerId("");
      toast({ title: "Centro aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteCenterMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/repair-centers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers"] });
      toast({ title: "Centro eliminato" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/repair-centers/${id}/reset-password`, { newPassword });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Password aggiornata con successo" });
      setResetPasswordDialogOpen(false);
      setCenterToResetPassword(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const backfillAccountsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/repair-centers/backfill-accounts", {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers/orphans"] });
      setBackfillResult(data);
      toast({ 
        title: "Account creati", 
        description: `Creati ${data.created.length} account` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleResetPasswordClick = (center: RepairCenter) => {
    setCenterToResetPassword(center);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (centerToResetPassword && newPassword.length >= 4) {
      resetPasswordMutation.mutate({ id: centerToResetPassword.id, newPassword });
    }
  };

  const resetWizard = () => {
    setWizardStep(1);
    setFormData({
      name: "",
      phone: "",
      email: "",
      password: "",
      ragioneSociale: "",
      partitaIva: "",
      codiceFiscale: "",
      codiceUnivoco: "",
      pec: "",
      iban: "",
    });
    setAddressData({ address: "", city: "", cap: "", provincia: "" });
    setSelectedResellerId("");
    setSelectedSubResellerId("");
    setHourlyRateEuros("");
  };

  const progressPercent = (wizardStep / WIZARD_STEPS.length) * 100;

  const canProceedToNextStep = () => {
    switch (wizardStep) {
      case 1: return formData.name && formData.email && formData.phone && (!editingCenter ? formData.password.length >= 6 : true);
      case 2: return addressData.address && addressData.city;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (wizardStep < WIZARD_STEPS.length) {
      setWizardStep(wizardStep + 1);
    }
  };

  const prevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const isLastStep = () => wizardStep === WIZARD_STEPS.length;
  const isFirstStep = () => wizardStep === 1;

  const handleFinalSubmit = () => {
    if (!addressData.address.trim() || !addressData.city.trim()) {
      toast({ title: "Errore", description: "Indirizzo e Città sono campi obbligatori", variant: "destructive" });
      return;
    }
    
    const fiscalData = {
      ragioneSociale: formData.ragioneSociale?.trim() || null,
      partitaIva: formData.partitaIva?.trim() || null,
      codiceFiscale: formData.codiceFiscale?.trim() || null,
      iban: formData.iban?.trim() || null,
      codiceUnivoco: formData.codiceUnivoco?.trim() || null,
      pec: formData.pec?.trim() || null,
    };
    
    const hourlyRateCentsValue = hourlyRateEuros 
      ? Math.round(parseFloat(hourlyRateEuros) * 100)
      : (editingCenter ? editingCenter.hourlyRateCents : null);
    
    if (editingCenter) {
      const updates: Partial<RepairCenter> = {
        name: formData.name,
        address: addressData.address,
        city: addressData.city,
        cap: addressData.cap?.trim() || null,
        provincia: addressData.provincia?.trim() || null,
        phone: formData.phone,
        email: formData.email,
        resellerId: selectedResellerId || null,
        subResellerId: selectedSubResellerId || null,
        hourlyRateCents: hourlyRateCentsValue,
        ...fiscalData,
      };
      updateCenterMutation.mutate({ id: editingCenter.id, data: updates });
    } else {
      const data = {
        name: formData.name,
        address: addressData.address,
        city: addressData.city,
        cap: addressData.cap?.trim() || null,
        provincia: addressData.provincia?.trim() || null,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        resellerId: selectedResellerId || null,
        subResellerId: selectedSubResellerId || null,
        isActive: true,
        hourlyRateCents: hourlyRateCentsValue,
        ...fiscalData,
      };
      createCenterMutation.mutate(data as any);
    }
  };

  const filteredCenters = centers.filter((center) =>
    center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    center.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Centri di Riparazione</h1>
              <p className="text-sm text-muted-foreground">Gestisci tutti i centri di riparazione della rete</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {orphansData && orphansData.orphanCount > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setBackfillDialogOpen(true)}
                data-testid="button-backfill-accounts"
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                {orphansData.orphanCount} centri senza account
              </Button>
            )}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingCenter(null);
            resetWizard();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetWizard()} data-testid="button-new-center">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Centro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-center-form">
            <DialogHeader>
              <DialogTitle>{editingCenter ? "Modifica Centro" : "Nuovo Centro di Riparazione"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                {WIZARD_STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === wizardStep;
                  const isPast = wizardStep > step.id;
                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isActive ? 'bg-primary border-primary text-primary-foreground' : 
                          isPast ? 'bg-primary/20 border-primary text-primary' : 
                          'bg-muted border-muted-foreground/30 text-muted-foreground'
                        }`}
                      >
                        {isPast ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs mt-1 text-center ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Progress value={progressPercent} className="h-1" />

              <div className="min-h-[280px]">
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Informazioni di base del centro di riparazione.</p>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Centro *</Label>
                      <Input 
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        data-testid="input-name" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        data-testid="input-email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono *</Label>
                      <Input 
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        data-testid="input-phone" 
                      />
                    </div>
                    {!editingCenter && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Password Account * (min 6 caratteri)</Label>
                        <Input 
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Password per accesso al centro"
                          data-testid="input-password" 
                        />
                        <p className="text-xs text-muted-foreground">
                          Questa password verrà usata dal centro per accedere al sistema
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Indirizzo e ubicazione del centro.</p>
                    <div className="space-y-2">
                      <Label>Indirizzo *</Label>
                      <AddressAutocomplete
                        value={addressData.address}
                        onChange={(val) => setAddressData(prev => ({ ...prev, address: val }))}
                        onAddressSelect={(result) => {
                          setAddressData({
                            address: result.address || result.fullAddress,
                            city: result.city,
                            cap: result.postalCode,
                            provincia: result.province,
                          });
                        }}
                        placeholder="Inizia a digitare..."
                        data-testid="input-address"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">Città *</Label>
                        <Input 
                          id="city"
                          value={addressData.city}
                          onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                          data-testid="input-city" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="cap">CAP</Label>
                          <Input 
                            id="cap"
                            value={addressData.cap}
                            onChange={(e) => setAddressData(prev => ({ ...prev, cap: e.target.value }))}
                            data-testid="input-cap" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provincia">Prov.</Label>
                          <Input 
                            id="provincia"
                            maxLength={2}
                            value={addressData.provincia}
                            onChange={(e) => setAddressData(prev => ({ ...prev, provincia: e.target.value }))}
                            placeholder="XX"
                            data-testid="input-provincia" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Dati fiscali e fatturazione (opzionali).</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="ragioneSociale">Ragione Sociale</Label>
                        <Input 
                          id="ragioneSociale"
                          value={formData.ragioneSociale}
                          onChange={(e) => setFormData(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                          data-testid="input-ragioneSociale" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partitaIva">Partita IVA</Label>
                        <Input 
                          id="partitaIva"
                          value={formData.partitaIva}
                          onChange={(e) => setFormData(prev => ({ ...prev, partitaIva: e.target.value }))}
                          data-testid="input-partitaIva" 
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                        <Input 
                          id="codiceFiscale"
                          value={formData.codiceFiscale}
                          onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                          data-testid="input-codiceFiscale" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codiceUnivoco">Codice SDI</Label>
                        <Input 
                          id="codiceUnivoco"
                          maxLength={7}
                          value={formData.codiceUnivoco}
                          onChange={(e) => setFormData(prev => ({ ...prev, codiceUnivoco: e.target.value }))}
                          placeholder="7 caratteri"
                          data-testid="input-codiceUnivoco" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pec">PEC</Label>
                        <Input 
                          id="pec"
                          type="email"
                          value={formData.pec}
                          onChange={(e) => setFormData(prev => ({ ...prev, pec: e.target.value }))}
                          placeholder="email@pec.it"
                          data-testid="input-pec" 
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input 
                          id="iban"
                          value={formData.iban}
                          onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                          placeholder="IT..."
                          data-testid="input-iban" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Configurazione affiliazione e tariffe.</p>
                    <div className="space-y-2">
                      <Label htmlFor="resellerId">Rivenditore di Appartenenza</Label>
                      <Select 
                        value={selectedResellerId} 
                        onValueChange={(value) => {
                          setSelectedResellerId(value);
                          setSelectedSubResellerId("");
                        }}
                      >
                        <SelectTrigger id="resellerId" data-testid="select-reseller-id">
                          <SelectValue placeholder="Seleziona un rivenditore" />
                        </SelectTrigger>
                        <SelectContent>
                          {resellers.map((reseller) => (
                            <SelectItem key={reseller.id} value={reseller.id}>
                              {reseller.fullName} ({reseller.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Il rivenditore a cui il centro è affiliato potrà gestire questo centro e visualizzare le sue attività.
                      </p>
                    </div>
                    
                    {selectedResellerId && subResellers.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="subResellerId">Sub-Reseller di Riferimento</Label>
                        <Select 
                          value={selectedSubResellerId || "none"} 
                          onValueChange={(value) => setSelectedSubResellerId(value === "none" ? "" : value)}
                        >
                          <SelectTrigger id="subResellerId" data-testid="select-sub-reseller-id">
                            <SelectValue placeholder="Seleziona un sub-reseller (opzionale)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessun sub-reseller</SelectItem>
                            {subResellers.map((subReseller) => (
                              <SelectItem key={subReseller.id} value={subReseller.id}>
                                {subReseller.fullName} ({subReseller.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Assegna questo centro a un sub-reseller specifico del rivenditore selezionato.
                        </p>
                      </div>
                    )}
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Tariffa Manodopera
                      </h4>
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Tariffa Oraria (EUR)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                          <Input
                            id="hourlyRate"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="35.00"
                            value={hourlyRateEuros}
                            onChange={(e) => setHourlyRateEuros(e.target.value)}
                            className="pl-7"
                            data-testid="input-hourly-rate"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tariffa oraria per il calcolo del costo manodopera. 
                          Se non specificata, verrà usata la tariffa di sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  disabled={isFirstStep()}
                  data-testid="button-wizard-prev"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Indietro
                </Button>
                {isLastStep() ? (
                  <Button 
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={createCenterMutation.isPending || updateCenterMutation.isPending}
                    data-testid="button-submit-center"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {editingCenter ? "Aggiorna" : "Crea"} Centro
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    data-testid="button-wizard-next"
                  >
                    Avanti
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Dialog per backfill account mancanti */}
      <AlertDialog open={backfillDialogOpen} onOpenChange={setBackfillDialogOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Centri senza Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              {backfillResult ? (
                <div className="space-y-4 text-left">
                  <p className="font-medium text-foreground">
                    {backfillResult.created.length > 0 
                      ? `Creati ${backfillResult.created.length} account. Salva le credenziali!`
                      : "Nessun account creato."}
                  </p>
                  {backfillResult.created.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Centro</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Password</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {backfillResult.created.map((acc) => (
                            <TableRow key={acc.centerId}>
                              <TableCell className="font-medium">{acc.centerName}</TableCell>
                              <TableCell className="font-mono text-sm">{acc.username}</TableCell>
                              <TableCell className="font-mono text-sm bg-yellow-100 dark:bg-yellow-900">
                                {acc.tempPassword}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {backfillResult.errors.length > 0 && (
                    <div className="border border-destructive rounded-md p-3">
                      <p className="font-medium text-destructive mb-2">Errori:</p>
                      {backfillResult.errors.map((err, i) => (
                        <p key={i} className="text-sm">{err.centerName}: {err.error}</p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  <p>Sono stati trovati <strong>{orphansData?.orphanCount || 0} centri</strong> senza account utente.</p>
                  <p>Questi centri sono stati creati prima del fix e non possono accedere al sistema.</p>
                  <p>Cliccando "Crea Account" verranno generati automaticamente username e password temporanee per ogni centro.</p>
                  <p className="text-orange-600 font-medium">Importante: Dovrai salvare e comunicare le password ai centri!</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackfillResult(null)}>
              {backfillResult ? "Chiudi" : "Annulla"}
            </AlertDialogCancel>
            {!backfillResult && (
              <AlertDialogAction 
                onClick={() => backfillAccountsMutation.mutate()}
                disabled={backfillAccountsMutation.isPending}
              >
                {backfillAccountsMutation.isPending ? "Creazione..." : "Crea Account"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome o città..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-centers"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredCenters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun centro di riparazione trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Località</TableHead>
                  <TableHead>Rivenditore</TableHead>
                  <TableHead>Contatti</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map((center) => (
                  <TableRow key={center.id} data-testid={`row-center-${center.id}`}>
                    <TableCell className="font-medium">{center.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div>{center.city}</div>
                          <div className="text-xs text-muted-foreground">{center.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {center.resellerId ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{resellers.find(r => r.id === center.resellerId)?.fullName || 'Rivenditore non trovato'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {center.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {center.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={center.isActive ? "default" : "secondary"}>
                        {center.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/repair-centers/${center.id}`}>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            data-testid={`button-view-${center.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingCenter(center);
                            setWizardStep(1);
                            setFormData({
                              name: center.name || "",
                              phone: center.phone || "",
                              email: center.email || "",
                              ragioneSociale: center.ragioneSociale || "",
                              partitaIva: center.partitaIva || "",
                              codiceFiscale: center.codiceFiscale || "",
                              codiceUnivoco: center.codiceUnivoco || "",
                              pec: center.pec || "",
                              iban: center.iban || "",
                            });
                            setAddressData({
                              address: center.address || "",
                              city: center.city || "",
                              cap: center.cap || "",
                              provincia: center.provincia || "",
                            });
                            setSelectedResellerId(center.resellerId || "");
                            setSelectedSubResellerId(center.subResellerId || "");
                            setHourlyRateEuros(center.hourlyRateCents ? (center.hourlyRateCents / 100).toFixed(2) : "");
                            setDialogOpen(true);
                          }}
                          data-testid={`button-edit-${center.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPasswordClick(center)}
                          title="Reset password"
                          data-testid={`button-reset-password-${center.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCenterMutation.mutate(center.id)}
                          disabled={deleteCenterMutation.isPending}
                          data-testid={`button-delete-${center.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stai per resettare la password del centro <strong>{centerToResetPassword?.name}</strong>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nuova Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci nuova password (min. 4 caratteri)"
                data-testid="input-new-password"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setResetPasswordDialogOpen(false)}
                data-testid="button-cancel-reset-password"
              >
                Annulla
              </Button>
              <Button
                onClick={confirmResetPassword}
                disabled={newPassword.length < 4 || resetPasswordMutation.isPending}
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? "Aggiornamento..." : "Conferma Reset"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
