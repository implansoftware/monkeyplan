import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Pencil, Store, Users, UsersRound, Trash2, Building2, Eye, ChevronLeft, ChevronRight, Check, User as UserIcon, KeyRound, FileText, Settings, Upload, Loader2, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AddressAutocomplete } from "@/components/address-autocomplete";

const WIZARD_STEPS = [
  { id: 1, title: "Credenziali", icon: KeyRound },
  { id: 2, title: "Info Base", icon: UserIcon },
  { id: 3, title: "Dati Fiscali", icon: FileText },
  { id: 4, title: "Configurazione", icon: Settings },
];

export default function AdminResellers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Omit<User, 'password'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("standard");
  const [selectedParentResellerId, setSelectedParentResellerId] = useState<string>("");
  const [addressData, setAddressData] = useState({ indirizzo: "", citta: "", cap: "", provincia: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resellerToDelete, setResellerToDelete] = useState<Omit<User, 'password'> | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resellerToResetPassword, setResellerToResetPassword] = useState<Omit<User, 'password'> | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [wizardStep, setWizardStep] = useState(1);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    ragioneSociale: "",
    partitaIva: "",
    codiceFiscale: "",
    codiceUnivoco: "",
    pec: "",
    iban: "",
  });
  const { toast } = useToast();

  type ResellerWithCount = Omit<User, 'password'> & { customerCount: number; staffCount: number; repairCenterCount: number };
  
  const { data: resellers = [], isLoading } = useQuery<ResellerWithCount[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const createResellerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      setDialogOpen(false);
      toast({ title: "Rivenditore creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateResellerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      setDialogOpen(false);
      setEditingReseller(null);
      toast({ title: "Rivenditore aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { isActive });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      toast({ 
        title: variables.isActive ? "Rivenditore attivato" : "Rivenditore disattivato",
        description: variables.isActive ? "L'account è ora attivo" : "L'account è stato disattivato"
      });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteResellerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/resellers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Rivenditore eliminato con successo" });
      setDeleteDialogOpen(false);
      setResellerToDelete(null);
    },
    onError: async (error: any) => {
      const errorMsg = error.message || "";
      const jsonMatch = errorMsg.match(/^\d+:\s*(.+)$/);
      if (jsonMatch) {
        try {
          const errorData = JSON.parse(jsonMatch[1]);
          if (["ACTIVE_REPAIRS", "UNPAID_INVOICES", "OPEN_TICKETS", "HAS_CUSTOMERS", "HAS_REPAIR_CENTERS"].includes(errorData.error)) {
            toast({ 
              title: "Impossibile eliminare il rivenditore", 
              description: errorData.message,
              variant: "destructive" 
            });
            return;
          }
        } catch {
          // Not JSON
        }
      }
      toast({ title: "Errore", description: errorMsg, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, { newPassword });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Password aggiornata con successo" });
      setResetPasswordDialogOpen(false);
      setResellerToResetPassword(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleDeleteClick = (reseller: Omit<User, 'password'>) => {
    setResellerToDelete(reseller);
    setDeleteDialogOpen(true);
  };

  const handleResetPasswordClick = (reseller: Omit<User, 'password'>) => {
    setResellerToResetPassword(reseller);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = () => {
    if (resellerToResetPassword && newPassword.length >= 4) {
      resetPasswordMutation.mutate({ id: resellerToResetPassword.id, newPassword });
    }
  };

  const confirmDelete = () => {
    if (resellerToDelete) {
      deleteResellerMutation.mutate(resellerToDelete.id);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!editingReseller) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Errore", description: "Formato non valido. Usa JPEG, PNG o WebP", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Errore", description: "File troppo grande. Max 2MB", variant: "destructive" });
      return;
    }

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const res = await fetch(`/api/resellers/${editingReseller.id}/logo`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      toast({ title: "Logo caricato", description: "Il logo è stato aggiornato" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Impossibile caricare il logo", variant: "destructive" });
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    if (!editingReseller) return;
    
    setLogoDeleting(true);
    try {
      const res = await fetch(`/api/resellers/${editingReseller.id}/logo`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      toast({ title: "Logo rimosso", description: "Il logo è stato eliminato" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Impossibile eliminare il logo", variant: "destructive" });
    } finally {
      setLogoDeleting(false);
    }
  };

  // Rivenditori padre (franchising/gdo) per il dropdown
  const parentResellers = resellers.filter(r => 
    r.resellerCategory === 'franchising' || r.resellerCategory === 'gdo'
  );

  const resetWizard = () => {
    setWizardStep(1);
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      ragioneSociale: "",
      partitaIva: "",
      codiceFiscale: "",
      codiceUnivoco: "",
      pec: "",
      iban: "",
    });
    setAddressData({ indirizzo: "", citta: "", cap: "", provincia: "" });
    setSelectedCategory("standard");
    setSelectedParentResellerId("");
  };

  const getStepsForMode = () => {
    if (editingReseller) {
      return WIZARD_STEPS.filter(s => s.id !== 1);
    }
    return WIZARD_STEPS;
  };

  const currentSteps = getStepsForMode();
  const maxStep = currentSteps.length;
  const currentStepIndex = currentSteps.findIndex(s => s.id === wizardStep);
  const progressPercent = ((currentStepIndex + 1) / maxStep) * 100;

  const canProceedToNextStep = () => {
    if (editingReseller) {
      switch (wizardStep) {
        case 2: return formData.fullName && formData.email;
        case 3: return true;
        case 4: return true;
        default: return true;
      }
    }
    switch (wizardStep) {
      case 1: return formData.username && formData.password;
      case 2: return formData.fullName && formData.email;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    const currentIdx = currentSteps.findIndex(s => s.id === wizardStep);
    if (currentIdx < currentSteps.length - 1) {
      setWizardStep(currentSteps[currentIdx + 1].id);
    }
  };

  const prevStep = () => {
    const currentIdx = currentSteps.findIndex(s => s.id === wizardStep);
    if (currentIdx > 0) {
      setWizardStep(currentSteps[currentIdx - 1].id);
    }
  };

  const isLastStep = () => {
    const currentIdx = currentSteps.findIndex(s => s.id === wizardStep);
    return currentIdx === currentSteps.length - 1;
  };

  const isFirstStep = () => {
    const currentIdx = currentSteps.findIndex(s => s.id === wizardStep);
    return currentIdx === 0;
  };

  const handleFinalSubmit = () => {
    const parentId = selectedCategory === 'standard' && selectedParentResellerId 
      ? selectedParentResellerId 
      : null;
    
    const fiscalData = {
      ragioneSociale: formData.ragioneSociale || null,
      partitaIva: formData.partitaIva || null,
      codiceFiscale: formData.codiceFiscale || null,
      indirizzo: addressData.indirizzo || null,
      citta: addressData.citta || null,
      cap: addressData.cap || null,
      provincia: addressData.provincia || null,
      iban: formData.iban || null,
      codiceUnivoco: formData.codiceUnivoco || null,
      pec: formData.pec || null,
    };
    
    if (editingReseller) {
      const updates: Partial<User> = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        resellerCategory: selectedCategory as any,
        parentResellerId: parentId,
        ...fiscalData,
      };
      updateResellerMutation.mutate({ id: editingReseller.id, data: updates });
    } else {
      const userData: InsertUser = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone || null,
        role: "reseller",
        isActive: true,
        resellerCategory: selectedCategory as any,
        parentResellerId: parentId,
        ...fiscalData,
      };
      createResellerMutation.mutate(userData);
    }
  };

  const filteredResellers = resellers.filter((reseller) =>
    reseller.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.username.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="space-y-6" data-testid="page-admin-resellers">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Rivenditori</h1>
          <p className="text-muted-foreground">Gestisci i rivenditori e visualizza i loro clienti</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingReseller(null);
            resetWizard();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReseller(null); resetWizard(); }} data-testid="button-add-reseller">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Rivenditore
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-reseller-form">
            <DialogHeader>
              <DialogTitle>{editingReseller ? "Modifica Rivenditore" : "Nuovo Rivenditore"}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                {currentSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === wizardStep;
                  const isPast = currentSteps.findIndex(s => s.id === wizardStep) > idx;
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
                {wizardStep === 1 && !editingReseller && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Inserisci le credenziali di accesso per il nuovo rivenditore.</p>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input 
                        id="username" 
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        data-testid="input-username" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        data-testid="input-password" 
                      />
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Informazioni di base del rivenditore.</p>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo *</Label>
                      <Input 
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        data-testid="input-fullName" 
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
                      <Label htmlFor="phone">Telefono</Label>
                      <Input 
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        data-testid="input-phone" 
                      />
                    </div>
                    
                    {editingReseller && (
                      <div className="space-y-2 pt-2 border-t">
                        <Label>Logo Aziendale</Label>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border">
                            {resellers.find(r => r.id === editingReseller.id)?.logoUrl ? (
                              <AvatarImage 
                                src={resellers.find(r => r.id === editingReseller.id)?.logoUrl || ''} 
                                alt={editingReseller.fullName} 
                                className="object-contain" 
                              />
                            ) : null}
                            <AvatarFallback className="text-lg">
                              {editingReseller.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-2">
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoUpload(file);
                              }}
                              data-testid="input-logo-file"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => logoInputRef.current?.click()}
                              disabled={logoUploading}
                              data-testid="button-upload-logo"
                            >
                              {logoUploading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {resellers.find(r => r.id === editingReseller.id)?.logoUrl ? 'Cambia Logo' : 'Carica Logo'}
                            </Button>
                            {resellers.find(r => r.id === editingReseller.id)?.logoUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleLogoDelete}
                                disabled={logoDeleting}
                                className="text-destructive hover:text-destructive"
                                data-testid="button-delete-logo"
                              >
                                {logoDeleting ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4 mr-2" />
                                )}
                                Rimuovi Logo
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Max 2MB. Formati: JPEG, PNG, WebP</p>
                      </div>
                    )}
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
                      <div className="space-y-2 col-span-2">
                        <Label>Indirizzo</Label>
                        <AddressAutocomplete
                          value={addressData.indirizzo}
                          onChange={(val) => setAddressData(prev => ({ ...prev, indirizzo: val }))}
                          onAddressSelect={(result) => {
                            setAddressData({
                              indirizzo: result.address || result.fullAddress,
                              citta: result.city,
                              cap: result.postalCode,
                              provincia: result.province,
                            });
                          }}
                          placeholder="Inizia a digitare..."
                          data-testid="input-indirizzo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citta">Città</Label>
                        <Input 
                          id="citta"
                          value={addressData.citta}
                          onChange={(e) => setAddressData(prev => ({ ...prev, citta: e.target.value }))}
                          data-testid="input-citta" 
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
                    <p className="text-sm text-muted-foreground">Configurazione categoria e affiliazione.</p>
                    <div className="space-y-2">
                      <Label htmlFor="resellerCategory">Categoria</Label>
                      <Select value={selectedCategory} onValueChange={(val) => {
                        setSelectedCategory(val);
                        if (val !== 'standard') setSelectedParentResellerId("");
                      }}>
                        <SelectTrigger id="resellerCategory" data-testid="select-reseller-category">
                          <SelectValue placeholder="Seleziona categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="franchising">Franchising</SelectItem>
                          <SelectItem value="gdo">GDO (Grande Distribuzione)</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="mt-3 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-1.5">
                        <p><strong className="text-foreground">Standard:</strong> Rivenditore singolo, può avere un rivenditore padre (Franchising/GDO) a cui essere affiliato.</p>
                        <p><strong className="text-foreground">Franchising:</strong> Rete di rivenditori affiliati. Può avere sotto-rivenditori Standard e visualizzare le loro attività.</p>
                        <p><strong className="text-foreground">GDO:</strong> Grande Distribuzione Organizzata. Come Franchising, gestisce una rete di punti vendita affiliati.</p>
                      </div>
                    </div>
                    {selectedCategory === 'standard' && parentResellers.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="parentResellerId">Rivenditore Padre (opzionale)</Label>
                        <Select value={selectedParentResellerId || "none"} onValueChange={(val) => setSelectedParentResellerId(val === "none" ? "" : val)}>
                          <SelectTrigger id="parentResellerId" data-testid="select-parent-reseller">
                            <SelectValue placeholder="Nessun rivenditore padre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessuno</SelectItem>
                            {parentResellers.map((parent) => (
                              <SelectItem key={parent.id} value={parent.id}>
                                {parent.fullName} ({parent.resellerCategory === 'franchising' ? 'Franchising' : 'GDO'})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
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
                    disabled={createResellerMutation.isPending || updateResellerMutation.isPending}
                    data-testid="button-submit"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {editingReseller ? "Aggiorna" : "Crea"} Rivenditore
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Elenco Rivenditori
          </CardTitle>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca rivenditori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredResellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun rivenditore trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Rivenditore Padre</TableHead>
                  <TableHead>Clienti</TableHead>
                  <TableHead>Centri Rip.</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResellers.map((reseller) => (
                  <TableRow key={reseller.id} data-testid={`row-reseller-${reseller.id}`}>
                    <TableCell className="font-medium" data-testid={`text-fullName-${reseller.id}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {reseller.logoUrl ? (
                            <AvatarImage src={reseller.logoUrl} alt={reseller.fullName} className="object-contain" />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {reseller.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{reseller.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-email-${reseller.id}`}>{reseller.email}</TableCell>
                    <TableCell data-testid={`text-phone-${reseller.id}`}>{reseller.phone || "-"}</TableCell>
                    <TableCell data-testid={`text-category-${reseller.id}`}>
                      <Badge variant="outline">
                        {reseller.resellerCategory === 'franchising' ? 'Franchising' : 
                         reseller.resellerCategory === 'gdo' ? 'GDO' : 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-parent-${reseller.id}`}>
                      {reseller.parentResellerId ? (
                        <span className="text-sm">
                          {resellers.find(r => r.id === reseller.parentResellerId)?.fullName || '-'}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell data-testid={`text-customers-${reseller.id}`}>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {reseller.customerCount}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-repair-centers-${reseller.id}`}>
                      <Badge variant="secondary">
                        <Building2 className="h-3 w-3 mr-1" />
                        {reseller.repairCenterCount}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`badge-status-${reseller.id}`}>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reseller.isActive}
                          onCheckedChange={(checked) => 
                            toggleStatusMutation.mutate({ id: reseller.id, isActive: checked })
                          }
                          disabled={toggleStatusMutation.isPending}
                          data-testid={`switch-status-${reseller.id}`}
                        />
                        <span className={`text-sm ${reseller.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {reseller.isActive ? "Attivo" : "Inattivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/resellers/${reseller.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Visualizza dettagli"
                            data-testid={`button-detail-${reseller.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingReseller(reseller);
                            setFormData({
                              username: reseller.username,
                              password: "",
                              fullName: reseller.fullName,
                              email: reseller.email,
                              phone: reseller.phone || "",
                              ragioneSociale: reseller.ragioneSociale || "",
                              partitaIva: reseller.partitaIva || "",
                              codiceFiscale: reseller.codiceFiscale || "",
                              codiceUnivoco: reseller.codiceUnivoco || "",
                              pec: reseller.pec || "",
                              iban: reseller.iban || "",
                            });
                            setAddressData({
                              indirizzo: reseller.indirizzo || "",
                              citta: reseller.citta || "",
                              cap: reseller.cap || "",
                              provincia: reseller.provincia || "",
                            });
                            setSelectedCategory(reseller.resellerCategory || "standard");
                            setSelectedParentResellerId(reseller.parentResellerId || "");
                            setWizardStep(2);
                            setDialogOpen(true);
                          }}
                          title="Modifica rivenditore"
                          data-testid={`button-edit-${reseller.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResetPasswordClick(reseller)}
                          title="Reset password"
                          data-testid={`button-reset-password-${reseller.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteClick(reseller)}
                          title="Elimina rivenditore"
                          data-testid={`button-delete-${reseller.id}`}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-reseller">
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare il rivenditore?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare definitivamente il rivenditore <strong>{resellerToDelete?.fullName}</strong>.
              <br /><br />
              Per poter eliminare un rivenditore, assicurati che:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Non ci siano riparazioni attive</li>
                <li>Non ci siano fatture non pagate</li>
                <li>Non ci siano ticket aperti</li>
                <li>Non ci siano clienti associati</li>
                <li>Non ci siano centri riparazione</li>
              </ul>
              <br />
              Verranno eliminati automaticamente: collaboratori e credenziali API.
              <br />
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteResellerMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteResellerMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              Stai per resettare la password di <strong>{resellerToResetPassword?.fullName}</strong>.
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
