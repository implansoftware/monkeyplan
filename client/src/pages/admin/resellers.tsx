import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { User, InsertUser, RepairCenter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, Pencil, Store, Users, UsersRound, Trash2, Building2, Eye, EyeOff, ChevronLeft, ChevronRight, Check, User as UserIcon, KeyRound, FileText, Settings, Upload, Loader2, X, Wrench, RefreshCw, Copy } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { ScrollArea } from "@/components/ui/scroll-area";

const WIZARD_STEPS = [
  { id: 1, titleKey: "admin.resellers.wizardCredentials", icon: KeyRound },
  { id: 2, titleKey: "admin.resellers.wizardBasicInfo", icon: UserIcon },
  { id: 3, titleKey: "admin.resellers.wizardFiscalData", icon: FileText },
  { id: 4, titleKey: "admin.resellers.wizardConfig", icon: Settings },
  { id: 5, titleKey: "admin.resellers.wizardRepairCenters", icon: Wrench },
];

type ResellerWithCount = Omit<User, 'password'> & { customerCount: number; staffCount: number; repairCenterCount: number; subResellerCount: number };

function generateRandomPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#!?";
  const all = upper + lower + digits + symbols;
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  for (let i = 4; i < 12; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)]);
  }
  return pwd.sort(() => Math.random() - 0.5).join("");
}

export default function AdminResellers() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Omit<User, 'password'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("standard");
  const [selectedParentResellerId, setSelectedParentResellerId] = useState<string>("");
  const [addressData, setAddressData] = useState({ indirizzo: "", citta: "", cap: "", provincia: "" });
  const [autoGeneratePassword, setAutoGeneratePassword] = useState(true);
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resellerToDelete, setResellerToDelete] = useState<Omit<User, 'password'> | null>(null);
  const [forceDelete, setForceDelete] = useState(false);
  const [unpaidInvoiceCount, setUnpaidInvoiceCount] = useState(0);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resellerToResetPassword, setResellerToResetPassword] = useState<Omit<User, 'password'> | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [subResellersDialogOpen, setSubResellersDialogOpen] = useState(false);
  const [selectedResellerForSubResellers, setSelectedResellerForSubResellers] = useState<ResellerWithCount | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const newLogoInputRef = useRef<HTMLInputElement>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreview, setPendingLogoPreview] = useState<string | null>(null);
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
  const [selectedRepairCenterIds, setSelectedRepairCenterIds] = useState<string[]>([]);
  const { toast } = useToast();
  
  const { data: resellers = [], isLoading } = useQuery<ResellerWithCount[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const { data: allRepairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/admin/repair-centers"],
  });

  const availableRepairCenters = allRepairCenters.filter(rc => 
    !rc.resellerId || rc.resellerId === editingReseller?.id
  );

  useEffect(() => {
    if (editingReseller && allRepairCenters.length > 0) {
      const assignedCenterIds = allRepairCenters
        .filter(rc => rc.resellerId === editingReseller.id)
        .map(rc => rc.id);
      setSelectedRepairCenterIds(assignedCenterIds);
    }
  }, [editingReseller, allRepairCenters]);

  const createResellerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      return await res.json();
    },
    onSuccess: async (newReseller) => {
      if (pendingLogoFile && newReseller?.id) {
        try {
          const fd = new FormData();
          fd.append("logo", pendingLogoFile);
          await fetch(`/api/resellers/${newReseller.id}/logo`, { method: "POST", body: fd });
        } catch {
          toast({ title: t("admin.resellers.logoUploadError", "Logo non caricato"), description: t("admin.resellers.logoUploadErrorDesc", "Il rivenditore è stato creato ma il logo non è stato salvato. Puoi caricarlo in seguito."), variant: "destructive" });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      setDialogOpen(false);
      toast({ title: t("admin.resellers.resellerCreated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("admin.resellers.resellerUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const assignRepairCentersMutation = useMutation({
    mutationFn: async ({ resellerId, repairCenterIds }: { resellerId: string; repairCenterIds: string[] }) => {
      const res = await apiRequest("PATCH", `/api/admin/resellers/${resellerId}/repair-centers`, { repairCenterIds });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/repair-centers"] });
    },
    onError: (error: Error) => {
      toast({ title: t("admin.resellers.assignCentersError"), description: error.message, variant: "destructive" });
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
        title: variables.isActive ? t("admin.resellers.resellerActivated") : t("admin.resellers.resellerDeactivated"),
        description: variables.isActive ? t("admin.resellers.accountActive") : t("admin.resellers.accountDeactivated")
      });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteResellerMutation = useMutation({
    mutationFn: async ({ id, force }: { id: string; force?: boolean }) => {
      await apiRequest("DELETE", `/api/admin/resellers/${id}${force ? "?force=true" : ""}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("admin.resellers.resellerDeleted") });
      setDeleteDialogOpen(false);
      setResellerToDelete(null);
      setForceDelete(false);
      setUnpaidInvoiceCount(0);
    },
    onError: async (error: any) => {
      const errorMsg = error.message || "";
      const jsonMatch = errorMsg.match(/^\d+:\s*(.+)$/);
      if (jsonMatch) {
        try {
          const errorData = JSON.parse(jsonMatch[1]);
          if (errorData.error === "UNPAID_INVOICES") {
            setUnpaidInvoiceCount(errorData.count || 0);
            return;
          }
          if (["ACTIVE_REPAIRS", "OPEN_TICKETS", "HAS_CUSTOMERS", "HAS_REPAIR_CENTERS"].includes(errorData.error)) {
            toast({ 
              title: t("admin.resellers.cannotDelete"), 
              description: errorData.message,
              variant: "destructive" 
            });
            return;
          }
        } catch {
          // Not JSON
        }
      }
      toast({ title: t("common.error"), description: errorMsg, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${id}/reset-password`, { newPassword });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: t("admin.resellers.passwordResetSuccess") });
      setResetPasswordDialogOpen(false);
      setResellerToResetPassword(null);
      setNewPassword("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleDeleteClick = (reseller: Omit<User, 'password'>) => {
    setResellerToDelete(reseller);
    setForceDelete(false);
    setUnpaidInvoiceCount(0);
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
      deleteResellerMutation.mutate({ id: resellerToDelete.id, force: forceDelete });
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!editingReseller) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: t("common.error"), description: t("admin.invalidFormat"), variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: t("common.error"), description: t("admin.fileTooLarge"), variant: "destructive" });
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
      toast({ title: t("admin.resellers.logoUploaded"), description: t("admin.resellers.logoUpdatedDesc") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message || t("admin.cannotUploadLogo"), variant: "destructive" });
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
      toast({ title: t("admin.resellers.logoRemoved"), description: t("admin.resellers.logoRemovedDesc") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message || t("admin.cannotDeleteLogo"), variant: "destructive" });
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
    setAutoGeneratePassword(true);
    setShowGeneratedPassword(false);
    setFormData({
      username: "",
      password: generateRandomPassword(),
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
    setSelectedRepairCenterIds([]);
    setPendingLogoFile(null);
    setPendingLogoPreview(null);
    if (newLogoInputRef.current) newLogoInputRef.current.value = "";
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
        case 5: return true;
        default: return true;
      }
    }
    switch (wizardStep) {
      case 1: return formData.username && (autoGeneratePassword ? !!formData.password : formData.password.length >= 6);
      case 2: return formData.fullName && formData.email;
      case 3: return true;
      case 4: return true;
      case 5: return true;
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

  const handleFinalSubmit = async () => {
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
      updateResellerMutation.mutate({ id: editingReseller.id, data: updates }, {
        onSuccess: () => {
          assignRepairCentersMutation.mutate({ 
            resellerId: editingReseller.id, 
            repairCenterIds: selectedRepairCenterIds 
          });
        }
      });
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
      createResellerMutation.mutate(userData, {
        onSuccess: (newReseller) => {
          if (selectedRepairCenterIds.length > 0) {
            assignRepairCentersMutation.mutate({ 
              resellerId: newReseller.id, 
              repairCenterIds: selectedRepairCenterIds 
            });
          }
        }
      });
    }
  };

  const filteredResellers = resellers.filter((reseller) =>
    reseller.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.username.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="space-y-6" data-testid="page-admin-resellers">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Store className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">{t("sidebar.items.resellers")}</h1>
              <p className="text-blue-100/80 mt-1">{t("admin.resellers.manageResellersDesc")}</p>
            </div>
          </div>
          <Button onClick={() => { setEditingReseller(null); resetWizard(); setDialogOpen(true); }} className="bg-white text-blue-700 hover:bg-white/90 shadow-lg" data-testid="button-add-reseller">
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.newResellerTitle")}
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingReseller(null);
          resetWizard();
        }
      }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="dialog-reseller-form">
            <DialogHeader>
              <DialogTitle>{editingReseller ? t("admin.editResellerTitle") : t("admin.newResellerTitle")}</DialogTitle>
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
                          isActive ? 'bg-gradient-to-br from-blue-500 to-cyan-600 border-blue-500 text-white' : 
                          isPast ? 'bg-emerald-500 border-emerald-500 text-white' : 
                          'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                        }`}
                      >
                        {isPast ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs mt-1 text-center ${isActive ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                        {t(step.titleKey)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Progress value={progressPercent} className="h-1.5 bg-slate-200 dark:bg-slate-700" />

              <div className="min-h-[280px]">
                {wizardStep === 1 && !editingReseller && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t("admin.resellers.enterCredentials")}</p>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">{t("auth.username")}</Label>
                      <Input 
                        id="username" 
                        className="h-11 rounded-xl"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        data-testid="input-username" 
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-700 dark:text-slate-300">{t("auth.password")}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Autogenera</span>
                          <Switch
                            checked={autoGeneratePassword}
                            onCheckedChange={(val) => {
                              setAutoGeneratePassword(val);
                              setShowGeneratedPassword(false);
                              if (val) {
                                setFormData(prev => ({ ...prev, password: generateRandomPassword() }));
                              } else {
                                setFormData(prev => ({ ...prev, password: "" }));
                              }
                            }}
                            data-testid="switch-auto-password"
                          />
                        </div>
                      </div>
                      {autoGeneratePassword ? (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              readOnly
                              type={showGeneratedPassword ? "text" : "password"}
                              className="h-11 rounded-xl pr-10 font-mono bg-muted/40"
                              value={formData.password}
                              data-testid="input-password-generated"
                            />
                            <button
                              type="button"
                              onClick={() => setShowGeneratedPassword(v => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                              data-testid="button-toggle-password-visibility"
                            >
                              {showGeneratedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => setFormData(prev => ({ ...prev, password: generateRandomPassword() }))}
                            title="Rigenera password"
                            data-testid="button-regenerate-password"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => { navigator.clipboard.writeText(formData.password); toast({ title: "Password copiata" }); }}
                            title="Copia password"
                            data-testid="button-copy-password"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Input
                          id="password"
                          type="password"
                          className="h-11 rounded-xl"
                          placeholder="Minimo 6 caratteri"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          data-testid="input-password"
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        {autoGeneratePassword
                          ? "La password verrà inviata al rivenditore via email insieme alle credenziali."
                          : "Imposta manualmente la password. Il rivenditore la riceverà via email."}
                      </p>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t("admin.resellers.basicInfoDesc")}</p>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">{t("common.fullName")} *</Label>
                      <Input 
                        id="fullName"
                        className="h-11 rounded-xl"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        data-testid="input-fullName" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email *</Label>
                      <Input 
                        id="email"
                        type="email"
                        className="h-11 rounded-xl"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        data-testid="input-email" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">{t("common.phone")}</Label>
                      <Input 
                        id="phone"
                        className="h-11 rounded-xl"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        data-testid="input-phone" 
                      />
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t">
                      <Label>{t("admin.resellers.companyLogo")}</Label>
                      {editingReseller ? (
                        <div className="flex flex-wrap items-center gap-4">
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
                              {resellers.find(r => r.id === editingReseller.id)?.logoUrl ? t("admin.resellers.changeLogo") : t("admin.resellers.uploadLogo")}
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
                                {t("admin.resellers.removeLogo")}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-4">
                          <Avatar className="h-16 w-16 border">
                            {pendingLogoPreview ? (
                              <AvatarImage src={pendingLogoPreview} alt="logo" className="object-contain" />
                            ) : null}
                            <AvatarFallback className="text-lg">
                              {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-2">
                            <input
                              ref={newLogoInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setPendingLogoFile(file);
                                  setPendingLogoPreview(URL.createObjectURL(file));
                                }
                              }}
                              data-testid="input-new-logo-file"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => newLogoInputRef.current?.click()}
                              data-testid="button-upload-new-logo"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {pendingLogoFile ? t("admin.resellers.changeLogo") : t("admin.resellers.uploadLogo")}
                            </Button>
                            {pendingLogoFile && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPendingLogoFile(null);
                                  setPendingLogoPreview(null);
                                  if (newLogoInputRef.current) newLogoInputRef.current.value = "";
                                }}
                                className="text-destructive hover:text-destructive"
                                data-testid="button-remove-new-logo"
                              >
                                <X className="h-4 w-4 mr-2" />
                                {t("admin.resellers.removeLogo")}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{t("admin.resellers.logoFormats")}</p>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{t("admin.fiscalDataOptional")}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="ragioneSociale" className="text-slate-700 dark:text-slate-300">{t("admin.ragioneSociale")}</Label>
                        <Input 
                          id="ragioneSociale"
                          className="h-11 rounded-xl"
                          value={formData.ragioneSociale}
                          onChange={(e) => setFormData(prev => ({ ...prev, ragioneSociale: e.target.value }))}
                          data-testid="input-ragioneSociale" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="partitaIva" className="text-slate-700 dark:text-slate-300">{t("admin.partitaIva")}</Label>
                        <Input 
                          id="partitaIva"
                          className="h-11 rounded-xl"
                          value={formData.partitaIva}
                          onChange={(e) => setFormData(prev => ({ ...prev, partitaIva: e.target.value }))}
                          data-testid="input-partitaIva" 
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="codiceFiscale" className="text-slate-700 dark:text-slate-300">{t("admin.codiceFiscale")}</Label>
                        <Input 
                          id="codiceFiscale"
                          className="h-11 rounded-xl"
                          value={formData.codiceFiscale}
                          onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value }))}
                          data-testid="input-codiceFiscale" 
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>{t("common.address")}</Label>
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
                          placeholder={t("common.startTyping")}
                          data-testid="input-indirizzo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citta" className="text-slate-700 dark:text-slate-300">{t("common.city")}</Label>
                        <Input 
                          id="citta"
                          className="h-11 rounded-xl"
                          value={addressData.citta}
                          onChange={(e) => setAddressData(prev => ({ ...prev, citta: e.target.value }))}
                          data-testid="input-citta" 
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="cap" className="text-slate-700 dark:text-slate-300">CAP</Label>
                          <Input 
                            id="cap"
                            className="h-11 rounded-xl"
                            value={addressData.cap}
                            onChange={(e) => setAddressData(prev => ({ ...prev, cap: e.target.value }))}
                            data-testid="input-cap" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provincia" className="text-slate-700 dark:text-slate-300">{t("admin.province")}</Label>
                          <Input 
                            id="provincia"
                            maxLength={2}
                            className="h-11 rounded-xl"
                            value={addressData.provincia}
                            onChange={(e) => setAddressData(prev => ({ ...prev, provincia: e.target.value }))}
                            placeholder="XX"
                            data-testid="input-provincia" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="codiceUnivoco" className="text-slate-700 dark:text-slate-300">{t("admin.codiceSDI")}</Label>
                        <Input 
                          id="codiceUnivoco"
                          maxLength={7}
                          className="h-11 rounded-xl"
                          value={formData.codiceUnivoco}
                          onChange={(e) => setFormData(prev => ({ ...prev, codiceUnivoco: e.target.value }))}
                          placeholder={t("admin.sdiPlaceholder")}
                          data-testid="input-codiceUnivoco" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pec" className="text-slate-700 dark:text-slate-300">PEC</Label>
                        <Input 
                          id="pec"
                          type="email"
                          className="h-11 rounded-xl"
                          value={formData.pec}
                          onChange={(e) => setFormData(prev => ({ ...prev, pec: e.target.value }))}
                          placeholder="email@pec.it"
                          data-testid="input-pec" 
                        />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="iban" className="text-slate-700 dark:text-slate-300">IBAN</Label>
                        <Input 
                          id="iban"
                          className="h-11 rounded-xl"
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
                    <p className="text-sm text-muted-foreground">{t("admin.resellers.categoryConfigDesc")}</p>
                    <div className="space-y-2">
                      <Label htmlFor="resellerCategory" className="text-slate-700 dark:text-slate-300">{t("common.category")}</Label>
                      <Select value={selectedCategory} onValueChange={(val) => {
                        setSelectedCategory(val);
                        if (val !== 'standard') setSelectedParentResellerId("");
                      }}>
                        <SelectTrigger id="resellerCategory" className="h-11 rounded-xl" data-testid="select-reseller-category">
                          <SelectValue placeholder={t("utility.selectCategory")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">{t("admin.resellers.catStandard")}</SelectItem>
                          <SelectItem value="franchising">{t("admin.resellers.catFranchising")}</SelectItem>
                          <SelectItem value="gdo">{t("admin.resellers.catGDO")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="mt-3 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground space-y-1.5">
                        <p><strong className="text-foreground">{t("admin.resellers.catStandard")}:</strong> {t("admin.resellers.catStandardDesc")}</p>
                        <p><strong className="text-foreground">{t("admin.resellers.catFranchising")}:</strong> {t("admin.resellers.catFranchisingDesc")}</p>
                        <p><strong className="text-foreground">{t("admin.resellers.catGDO")}:</strong> {t("admin.resellers.catGDODesc")}</p>
                      </div>
                    </div>
                    {selectedCategory === 'standard' && parentResellers.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="parentResellerId" className="text-slate-700 dark:text-slate-300">{t("admin.resellers.parentResellerOptional")}</Label>
                        <Select value={selectedParentResellerId || "none"} onValueChange={(val) => setSelectedParentResellerId(val === "none" ? "" : val)}>
                          <SelectTrigger id="parentResellerId" className="h-11 rounded-xl" data-testid="select-parent-reseller">
                            <SelectValue placeholder={t("admin.resellers.noParentReseller")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("common.none")}</SelectItem>
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

                {wizardStep === 5 && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {t("admin.resellers.selectRepairCentersDesc")}
                    </p>
                    {availableRepairCenters.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground border rounded-md">
                        <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{t("admin.resellers.noRepairCenters")}</p>
                        <p className="text-xs mt-1">{t("admin.resellers.allCentersAssigned")}</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[240px] border rounded-md p-3">
                        <div className="space-y-2">
                          {availableRepairCenters.map((center) => (
                            <div 
                              key={center.id} 
                              className="flex flex-wrap items-center gap-3 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                              onClick={() => {
                                setSelectedRepairCenterIds(prev => 
                                  prev.includes(center.id) 
                                    ? prev.filter(id => id !== center.id)
                                    : [...prev, center.id]
                                );
                              }}
                            >
                              <Checkbox 
                                checked={selectedRepairCenterIds.includes(center.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedRepairCenterIds(prev => 
                                    checked 
                                      ? [...prev, center.id]
                                      : prev.filter(id => id !== center.id)
                                  );
                                }}
                                data-testid={`checkbox-rc-${center.id}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{center.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {center.city}{center.provincia ? ` (${center.provincia})` : ''}
                                </p>
                              </div>
                              {center.resellerId === editingReseller?.id && (
                                <Badge variant="secondary" className="text-xs">{t("common.assigned")}</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("admin.resellers.centersSelected", { count: selectedRepairCenterIds.length })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-xl"
                  onClick={prevStep}
                  disabled={isFirstStep()}
                  data-testid="button-wizard-prev"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t("common.back")}
                </Button>
                {isLastStep() ? (
                  <Button 
                    type="button"
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-violet-700 hover:to-purple-700"
                    onClick={handleFinalSubmit}
                    disabled={createResellerMutation.isPending || updateResellerMutation.isPending}
                    data-testid="button-submit"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    {editingReseller ? t("common.update") : t("common.create")} {t("admin.resellers.reseller")}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-violet-700 hover:to-purple-700"
                    onClick={nextStep}
                    disabled={!canProceedToNextStep()}
                    data-testid="button-wizard-next"
                  >
                    {t("common.next")}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-slate-900 dark:text-white">
            <Store className="h-5 w-5" />
            {t("admin.resellers.resellerList")}
          </CardTitle>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
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
            <div className="text-center py-8 text-slate-500">
              {t("admin.resellers.noResellersFound")}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("common.name")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("common.email")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("common.phone")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("common.category")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("admin.resellers.parentReseller")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("sidebar.items.customers")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("admin.resellers.repairCentersShort")}</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">Sub-Reseller</TableHead>
                  <TableHead className="text-slate-600 dark:text-slate-400">{t("common.status")}</TableHead>
                  <TableHead className="text-right text-slate-600 dark:text-slate-400">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResellers.map((reseller) => (
                  <TableRow key={reseller.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-reseller-${reseller.id}`}>
                    <TableCell className="font-medium text-slate-900 dark:text-white" data-testid={`text-fullName-${reseller.id}`}>
                      <div className="flex flex-wrap items-center gap-3">
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
                    <TableCell className="text-slate-500" data-testid={`text-email-${reseller.id}`}>{reseller.email}</TableCell>
                    <TableCell className="text-slate-500" data-testid={`text-phone-${reseller.id}`}>{reseller.phone || "-"}</TableCell>
                    <TableCell data-testid={`text-category-${reseller.id}`}>
                      <Badge variant="outline">
                        {reseller.resellerCategory === 'franchising' ? 'Franchising' : 
                         reseller.resellerCategory === 'gdo' ? 'GDO' : 'Standard'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500" data-testid={`text-parent-${reseller.id}`}>
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
                    <TableCell data-testid={`text-sub-resellers-${reseller.id}`}>
                      {reseller.subResellerCount > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto py-1 px-2"
                          onClick={() => {
                            setSelectedResellerForSubResellers(reseller);
                            setSubResellersDialogOpen(true);
                          }}
                          data-testid={`button-view-sub-resellers-${reseller.id}`}
                        >
                          <Badge variant="secondary" className="cursor-pointer">
                            <UsersRound className="h-3 w-3 mr-1" />
                            {reseller.subResellerCount}
                          </Badge>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">0</Badge>
                      )}
                    </TableCell>
                    <TableCell data-testid={`badge-status-${reseller.id}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Switch
                          checked={reseller.isActive}
                          onCheckedChange={(checked) => 
                            toggleStatusMutation.mutate({ id: reseller.id, isActive: checked })
                          }
                          disabled={toggleStatusMutation.isPending}
                          data-testid={`switch-status-${reseller.id}`}
                        />
                        <span className={`text-sm ${reseller.isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {reseller.isActive ? t("common.active") : t("common.inactive")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/resellers/${reseller.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-blue-100 hover:text-blue-600"
                            title={t("products.viewDetails")}
                            data-testid={`button-detail-${reseller.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-amber-100 hover:text-amber-600"
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
                            const assignedCenterIds = allRepairCenters
                              .filter(rc => rc.resellerId === reseller.id)
                              .map(rc => rc.id);
                            setSelectedRepairCenterIds(assignedCenterIds);
                            setWizardStep(2);
                            setDialogOpen(true);
                          }}
                          title={t("admin.editResellerTooltip")}
                          data-testid={`button-edit-${reseller.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-blue-100 hover:text-blue-600"
                          onClick={() => handleResetPasswordClick(reseller)}
                          title={t("admin.resetPasswordTooltip")}
                          data-testid={`button-reset-password-${reseller.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-red-100 hover:text-red-600"
                          onClick={() => handleDeleteClick(reseller)}
                          title={t("admin.deleteResellerTooltip")}
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
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) { setForceDelete(false); setUnpaidInvoiceCount(0); }
      }}>
        <AlertDialogContent data-testid="dialog-delete-reseller">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.resellers.deleteReseller")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <span>Stai per eliminare definitivamente il rivenditore <strong>{resellerToDelete?.fullName}</strong>.</span>

                {unpaidInvoiceCount > 0 ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                      Questo rivenditore ha <strong>{unpaidInvoiceCount} fattura/e non pagata/e</strong>. L'eliminazione le lascerà orfane nel sistema.
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="force-delete"
                        checked={forceDelete}
                        onCheckedChange={(v) => setForceDelete(v === true)}
                        data-testid="checkbox-force-delete"
                      />
                      <label htmlFor="force-delete" className="text-sm cursor-pointer">
                        Confermo: voglio eliminare il rivenditore ignorando le fatture non pagate
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className="block">Per poter eliminare un rivenditore, assicurati che:</span>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>{t("admin.resellers.noActiveRepairs")}</li>
                      <li>{t("admin.resellers.noUnpaidInvoices")}</li>
                      <li>{t("admin.resellers.noOpenTickets")}</li>
                      <li>{t("admin.resellers.noAssociatedCustomers")}</li>
                      <li>{t("admin.resellers.noRepairCentersAssociated")}</li>
                    </ul>
                    <span className="block mt-3">Verranno eliminati automaticamente: collaboratori e credenziali API.</span>
                    <span className="block mt-1">Questa azione non può essere annullata.</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteResellerMutation.isPending || (unpaidInvoiceCount > 0 && !forceDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteResellerMutation.isPending ? t("admin.resellers.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent data-testid="dialog-reset-password">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Reset Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Stai per resettare la password di <strong>{resellerToResetPassword?.fullName}</strong>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300">{t("admin.common.newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                className="h-11 rounded-xl"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("admin.repairCenters.newPasswordPlaceholder")}
                data-testid="input-new-password"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setResetPasswordDialogOpen(false)}
                data-testid="button-cancel-reset-password"
              >
                Annulla
              </Button>
              <Button
                className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-violet-700 hover:to-purple-700"
                onClick={confirmResetPassword}
                disabled={newPassword.length < 4 || resetPasswordMutation.isPending}
                data-testid="button-confirm-reset-password"
              >
                {resetPasswordMutation.isPending ? t("admin.common.updating") : t("admin.confirmReset")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SubResellersDialog
        open={subResellersDialogOpen}
        onOpenChange={setSubResellersDialogOpen}
        reseller={selectedResellerForSubResellers}
      />
    </div>
  );
}

interface SubResellersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reseller: ResellerWithCount | null;
}

const SubResellersDialog = ({ open, onOpenChange, reseller }: SubResellersDialogProps) => {
  const { data: subResellers = [], isLoading } = useQuery<Omit<User, 'password'>[]>({
    queryKey: ['/api/admin/resellers', reseller?.id, 'sub-resellers'],
    queryFn: async () => {
      if (!reseller?.id) return [];
      const res = await fetch(`/api/admin/resellers/${reseller.id}/sub-resellers`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch sub-resellers');
      return res.json();
    },
    enabled: open && !!reseller?.id,
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-sub-resellers">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <UsersRound className="h-5 w-5" />
            Sub-Reseller di {reseller?.fullName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : subResellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("admin.resellers.noSubResellers")}</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.name")}</TableHead>
                    <TableHead>{t("common.email")}</TableHead>
                    <TableHead>{t("common.phone")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subResellers.map((sub) => (
                    <TableRow key={sub.id} data-testid={`row-sub-reseller-${sub.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          <Avatar className="h-7 w-7">
                            {sub.logoUrl ? (
                              <AvatarImage src={sub.logoUrl} alt={sub.fullName} className="object-contain" />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {sub.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{sub.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{sub.email}</TableCell>
                      <TableCell>{sub.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={sub.isActive ? "default" : "secondary"}>
                          {sub.isActive ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-sub-resellers">
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
