import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  RefreshCw,
  Building2,
  Link2,
  Unlink2
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface WorkProfile {
  id: string;
  name: string;
  weeklyHours: number;
  dailyHours: number;
  workDays: number[];
  startTime?: string;
  endTime?: string;
  breakMinutes: number;
  isDefault: boolean;
  sourceType?: string;
  sourceEntityId?: string;
  isSynced?: boolean;
  autoSyncDisabled?: boolean;
  lastSyncedAt?: string;
  originType?: 'own' | 'sub_reseller' | 'repair_center';
  originEntityName?: string;
}

interface RepairCenter {
  id: string;
  name: string;
  openingHours?: Record<string, { isOpen: boolean; start?: string; end?: string }>;
}

const dayLabels = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

export default function HrWorkProfiles() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<WorkProfile | null>(null);
  const [selectedRepairCenterId, setSelectedRepairCenterId] = useState<string>("");
  const [originFilter, setOriginFilter] = useState<'all' | 'own' | 'sub_reseller' | 'repair_center'>('all');
  const [formData, setFormData] = useState({
    name: "",
    weeklyHours: 40,
    dailyHours: 8,
    workDays: [1, 2, 3, 4, 5],
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    isDefault: false
  });
  const { toast } = useToast();

  const { data: profiles = [], isLoading } = useQuery<WorkProfile[]>({
    queryKey: ["/api/reseller/hr/work-profiles"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  // Filter profiles by origin type
  const filteredProfiles = profiles.filter(profile => {
    if (originFilter === 'all') return true;
    return profile.originType === originFilter;
  });

  const syncMutation = useMutation({
    mutationFn: async (data: { entityType: string; entityId: string }) => {
      return apiRequest("POST", "/api/reseller/hr/work-profiles/sync-from-entity", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/work-profiles"] });
      setSyncDialogOpen(false);
      setSelectedRepairCenterId("");
      toast({ title: t("hr.syncCompleted"), description: t("hr.syncProfileCreatedDesc") });
    },
    onError: (error: any) => {
      toast({ title: t("hr.syncError"), description: error.message, variant: "destructive" });
    }
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/reseller/hr/work-profiles/sync-all", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/work-profiles"] });
      toast({ 
        title: t("hr.syncCompleted"), 
        description: `Sincronizzati ${data.synced} profili su ${data.total} centri. ${data.skipped} saltati.` 
      });
    },
    onError: (error: any) => {
      toast({ title: t("hr.syncError"), description: error.message, variant: "destructive" });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/reseller/hr/work-profiles", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/work-profiles"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: t("hr.profileCreated"), description: "Il profilo orario è stato creato con successo." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/reseller/hr/work-profiles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/work-profiles"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: t("profile.profileUpdatedTitle"), description: "Il profilo orario è stato aggiornato." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const toggleAutoSyncMutation = useMutation({
    mutationFn: async ({ id, disabled }: { id: string; disabled: boolean }) => {
      return apiRequest("PATCH", `/api/reseller/hr/work-profiles/${id}`, { autoSyncDisabled: disabled });
    },
    onSuccess: (_, { disabled }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/work-profiles"] });
      toast({ 
        title: disabled ? t("hr.autoSyncDisabled") : t("hr.autoSyncEnabled"), 
        description: disabled 
          ? t("hr.profileNoAutoUpdate") 
          : t("hr.profileWillSync") 
      });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/hr/work-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/work-profiles"] });
      setDeleteDialogOpen(false);
      setSelectedProfile(null);
      toast({ title: t("hr.profileDeleted"), description: "Il profilo orario è stato eliminato." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      weeklyHours: 40,
      dailyHours: 8,
      workDays: [1, 2, 3, 4, 5],
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: 60,
      isDefault: false
    });
    setSelectedProfile(null);
  };

  const openEditDialog = (profile: WorkProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      weeklyHours: profile.weeklyHours,
      dailyHours: profile.dailyHours,
      workDays: profile.workDays,
      startTime: profile.startTime || "09:00",
      endTime: profile.endTime || "18:00",
      breakMinutes: profile.breakMinutes,
      isDefault: profile.isDefault
    });
    setDialogOpen(true);
  };

  const toggleWorkDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day].sort()
    }));
  };

  const handleSubmit = () => {
    if (selectedProfile) {
      updateMutation.mutate({ id: selectedProfile.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6" data-testid="page-hr-work-profiles">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-profiles-title">{t("sidebar.items.workProfiles")}</h1>
                <p className="text-white/80">Configurazione orari di lavoro del personale</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/reseller/hr">
              <Button variant="secondary" data-testid="button-back-to-hr">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna a HR
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setSyncDialogOpen(true)} data-testid="button-sync-from-center">
              <Building2 className="h-4 w-4 mr-2" />
              {t("hr.syncCenter")}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => syncAllMutation.mutate()} 
              disabled={syncAllMutation.isPending}
              data-testid="button-sync-all"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
              {syncAllMutation.isPending ? 'Sincronizzazione...' : 'Sincronizza Tutti'}
            </Button>
            <Button variant="secondary" onClick={() => { resetForm(); setDialogOpen(true); }} data-testid="button-new-profile">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Profilo
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl" data-testid="card-work-profiles-list">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Profili Configurati
              </CardTitle>
              <CardDescription>Gestisci i profili orario per i dipendenti</CardDescription>
            </div>
            <Select value={originFilter} onValueChange={(v) => setOriginFilter(v as typeof originFilter)}>
              <SelectTrigger className="w-48" data-testid="select-origin-filter">
                <SelectValue placeholder={t("hr.filterByOrigin")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i Profili</SelectItem>
                <SelectItem value="own">Solo Propri</SelectItem>
                <SelectItem value="sub_reseller">Da Sub-Reseller</SelectItem>
                <SelectItem value="repair_center">Da Centri Riparazione</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessun profilo orario configurato</p>
              <p className="text-sm">Crea il primo profilo per iniziare</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Profilo</TableHead>
                  <TableHead>{t("shipping.origin")}</TableHead>
                  <TableHead>{t("hr.weeklyHours")}</TableHead>
                  <TableHead>{t("hr.dailyHours")}</TableHead>
                  <TableHead>{t("hr.workDays")}</TableHead>
                  <TableHead>{t("hr.time")}</TableHead>
                  <TableHead>Pausa</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id} data-testid={`row-profile-${profile.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex flex-wrap items-center gap-2 flex-wrap">
                        {profile.name}
                        {profile.isDefault && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                        {profile.sourceType === 'repair_center' && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${profile.autoSyncDisabled ? 'border-yellow-500 text-yellow-600' : 'border-green-500 text-green-600'}`}
                          >
                            <RefreshCw className={`h-3 w-3 mr-1 ${!profile.autoSyncDisabled ? 'animate-pulse' : ''}`} />
                            {profile.autoSyncDisabled ? 'Sync Disattivato' : 'Auto-Sync'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={profile.originType === 'own' ? 'default' : profile.originType === 'sub_reseller' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {profile.originType === 'repair_center' && <Building2 className="h-3 w-3 mr-1" />}
                        {profile.originEntityName || 'Proprio'}
                      </Badge>
                    </TableCell>
                    <TableCell>{profile.weeklyHours}h</TableCell>
                    <TableCell>{profile.dailyHours}h</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {profile.workDays.map(day => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {dayLabels[day]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile.startTime || '-'} - {profile.endTime || '-'}
                    </TableCell>
                    <TableCell>{profile.breakMinutes} min</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {profile.sourceType === 'repair_center' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-8 w-8 p-0 ${profile.autoSyncDisabled ? 'text-yellow-600' : 'text-green-600'}`}
                            onClick={() => toggleAutoSyncMutation.mutate({ 
                              id: profile.id, 
                              disabled: !profile.autoSyncDisabled 
                            })}
                            disabled={toggleAutoSyncMutation.isPending}
                            title={profile.autoSyncDisabled ? t("hr.reEnableAutoSync") : t("hr.disableAutoSync")}
                            data-testid={`button-toggle-sync-${profile.id}`}
                          >
                            {profile.autoSyncDisabled ? <Unlink2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditDialog(profile)}
                          data-testid={`button-edit-${profile.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => { setSelectedProfile(profile); setDeleteDialogOpen(true); }}
                          data-testid={`button-delete-${profile.id}`}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProfile ? t("hr.editProfileTitle") : t("hr.newWorkProfile")}</DialogTitle>
            <DialogDescription>Configura le impostazioni del profilo orario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Profilo</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es. Full-time Standard"
                data-testid="input-profile-name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ore Settimanali</Label>
                <Input
                  type="number"
                  value={formData.weeklyHours}
                  onChange={(e) => setFormData({ ...formData, weeklyHours: parseInt(e.target.value) || 0 })}
                  data-testid="input-weekly-hours"
                />
              </div>
              <div className="space-y-2">
                <Label>Ore Giornaliere</Label>
                <Input
                  type="number"
                  value={formData.dailyHours}
                  onChange={(e) => setFormData({ ...formData, dailyHours: parseInt(e.target.value) || 0 })}
                  data-testid="input-daily-hours"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Giorni Lavorativi</Label>
              <div className="flex gap-2 flex-wrap">
                {dayLabels.map((label, index) => (
                  <Button
                    key={index}
                    type="button"
                    size="sm"
                    variant={formData.workDays.includes(index) ? "default" : "outline"}
                    onClick={() => toggleWorkDay(index)}
                    data-testid={`button-day-${index}`}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("hr.startTime")}</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("hr.endTime")}</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  data-testid="input-end-time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("hr.breakMinutes")}</Label>
              <Input
                type="number"
                value={formData.breakMinutes}
                onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 0 })}
                data-testid="input-break-minutes"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: !!checked })}
                data-testid="checkbox-is-default"
              />
              <Label htmlFor="isDefault" className="text-sm">Imposta come profilo predefinito</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-profile"
            >
              {createMutation.isPending || updateMutation.isPending ? t("profile.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.teams.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il profilo "{selectedProfile?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              variant="destructive"
              onClick={() => selectedProfile && deleteMutation.mutate(selectedProfile.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? t("pages.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Building2 className="h-5 w-5" />
              Sincronizzazione Orari Centro
            </DialogTitle>
            <DialogDescription>
              Crea un profilo orario basato sugli orari di apertura di un centro riparazione. Il profilo verrà aggiornato automaticamente quando il centro modifica i propri orari.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-1">
                <RefreshCw className="h-4 w-4" />
                <span className="font-medium">{t("hr.autoSync")}</span>
              </div>
              <p className="text-muted-foreground">
                {t("hr.autoSyncDesc")}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t("roles.repairCenter")}</Label>
              <Select value={selectedRepairCenterId} onValueChange={setSelectedRepairCenterId}>
                <SelectTrigger data-testid="select-repair-center">
                  <SelectValue placeholder={t("hr.selectRepairCenter")} />
                </SelectTrigger>
                <SelectContent>
                  {repairCenters.filter(rc => rc.openingHours).map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {repairCenters.filter(rc => rc.openingHours).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("hr.noCenterWithHours")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSyncDialogOpen(false); setSelectedRepairCenterId(""); }}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => syncMutation.mutate({ entityType: 'repair_center', entityId: selectedRepairCenterId })}
              disabled={!selectedRepairCenterId || syncMutation.isPending}
              data-testid="button-confirm-sync"
            >
              {syncMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />{t("pages.creating")}</>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Crea Profilo Sincronizzato
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
