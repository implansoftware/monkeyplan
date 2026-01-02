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
import { Switch } from "@/components/ui/switch";
import { Users, Plus, Search, Edit, Trash2, Shield, UserCog, Eye, FilePlus, Pencil, Key, TrendingUp, UserCheck, ChevronRight } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const MODULES = [
  { id: "repairs", name: "Lavorazioni", description: "Gestione riparazioni e ordini" },
  { id: "customers", name: "Clienti", description: "Anagrafica clienti" },
  { id: "products", name: "Prodotti", description: "Catalogo prodotti e ricambi" },
  { id: "inventory", name: "Magazzino", description: "Gestione inventario" },
  { id: "repair_centers", name: "Centri Riparazione", description: "Gestione centri" },
  { id: "services", name: "Servizi", description: "Catalogo servizi" },
  { id: "suppliers", name: "Fornitori", description: "Gestione fornitori" },
  { id: "supplier_orders", name: "Ordini Fornitori", description: "Ordini ai fornitori" },
  { id: "appointments", name: "Appuntamenti", description: "Gestione appuntamenti" },
  { id: "invoices", name: "Fatture", description: "Fatturazione" },
  { id: "tickets", name: "Ticket Supporto", description: "Assistenza clienti" },
];

const PERMISSION_ACTIONS = [
  { id: "canRead", label: "Lettura", icon: Eye },
  { id: "canCreate", label: "Creazione", icon: FilePlus },
  { id: "canUpdate", label: "Modifica", icon: Pencil },
  { id: "canDelete", label: "Eliminazione", icon: Trash2 },
];

interface RepairCenter {
  id: string;
  name: string;
}

interface SubReseller {
  id: string;
  fullName: string;
  ragioneSociale: string | null;
  email: string;
}

interface StaffMember {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  permissions: StaffPermission[];
  assignedRepairCenters?: RepairCenter[];
  assignedSubResellerIds?: string[];
}

interface StaffPermission {
  id: string;
  userId: string;
  resellerId: string;
  module: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

const staffFormSchema = z.object({
  username: z.string().min(3, "Username deve essere almeno 3 caratteri"),
  email: z.string().email("Email non valida"),
  fullName: z.string().min(2, "Nome completo richiesto"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri").optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

type FilterType = "all" | "active" | "inactive";

export default function ResellerTeam() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [localRepairCenterIds, setLocalRepairCenterIds] = useState<string[]>([]);
  const [localSubResellerIds, setLocalSubResellerIds] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      phone: "",
      password: "",
    },
  });

  const { data: staffMembers = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/reseller/team"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: subResellers = [] } = useQuery<SubReseller[]>({
    queryKey: ["/api/reseller/sub-resellers"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { user: StaffFormValues; permissions: any[]; repairCenterIds?: string[]; subResellerIds?: string[] }) => {
      return apiRequest("POST", "/api/reseller/team", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/team"] });
      setDialogOpen(false);
      form.reset();
      setLocalPermissions({});
      setLocalRepairCenterIds([]);
      setLocalSubResellerIds([]);
      toast({
        title: "Membro staff creato",
        description: "Il nuovo membro del team è stato aggiunto con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile creare il membro staff",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { user?: Partial<StaffFormValues>; permissions?: any[]; repairCenterIds?: string[]; subResellerIds?: string[] } }) => {
      return apiRequest("PATCH", `/api/reseller/team/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/team"] });
      setDialogOpen(false);
      setPermissionsDialogOpen(false);
      setSelectedMember(null);
      setIsEditing(false);
      form.reset();
      setLocalPermissions({});
      setLocalRepairCenterIds([]);
      setLocalSubResellerIds([]);
      toast({
        title: "Aggiornato",
        description: "Le modifiche sono state salvate con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/team"] });
      setDeleteDialogOpen(false);
      setSelectedMember(null);
      toast({
        title: "Eliminato",
        description: "Il membro staff è stato rimosso dal team.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      return apiRequest("POST", `/api/reseller/team/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      setResetPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedMember(null);
      toast({
        title: "Password aggiornata",
        description: "La password del collaboratore è stata reimpostata con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile reimpostare la password",
        variant: "destructive",
      });
    },
  });

  const activeMembers = staffMembers.filter(m => m.isActive).length;
  const inactiveMembers = staffMembers.filter(m => !m.isActive).length;
  const totalPermissions = staffMembers.reduce((acc, m) => acc + getPermissionCount(m), 0);

  const filteredMembers = staffMembers
    .filter((member) => {
      if (activeFilter === "active") return member.isActive;
      if (activeFilter === "inactive") return !member.isActive;
      return true;
    })
    .filter((member) =>
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const openCreateDialog = () => {
    setIsEditing(false);
    setSelectedMember(null);
    form.reset({
      username: "",
      email: "",
      fullName: "",
      phone: "",
      password: "",
    });
    setLocalPermissions({});
    setLocalRepairCenterIds([]);
    setLocalSubResellerIds([]);
    setDialogOpen(true);
  };

  const openEditDialog = (member: StaffMember) => {
    setIsEditing(true);
    setSelectedMember(member);
    form.reset({
      username: member.username || "placeholder",
      email: member.email,
      fullName: member.fullName,
      phone: member.phone || "",
      password: "placeholder",
    });
    setLocalRepairCenterIds(member.assignedRepairCenters?.map(rc => rc.id) || []);
    setLocalSubResellerIds(member.assignedSubResellerIds || []);
    setDialogOpen(true);
  };

  const openPermissionsDialog = (member: StaffMember) => {
    setSelectedMember(member);
    const permsMap: Record<string, Record<string, boolean>> = {};
    member.permissions.forEach((p) => {
      permsMap[p.module] = {
        canRead: p.canRead,
        canCreate: p.canCreate,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
      };
    });
    setLocalPermissions(permsMap);
    setPermissionsDialogOpen(true);
  };

  const handleSubmit = (values: StaffFormValues) => {
    const permissionsArray = Object.entries(localPermissions).map(([module, perms]) => ({
      module,
      canRead: perms.canRead || false,
      canCreate: perms.canCreate || false,
      canUpdate: perms.canUpdate || false,
      canDelete: perms.canDelete || false,
    }));

    if (isEditing && selectedMember) {
      const userData: Partial<StaffFormValues> = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
      };
      updateMutation.mutate({ id: selectedMember.id, data: { user: userData, repairCenterIds: localRepairCenterIds, subResellerIds: localSubResellerIds } });
    } else {
      createMutation.mutate({
        user: values,
        permissions: permissionsArray,
        repairCenterIds: localRepairCenterIds,
        subResellerIds: localSubResellerIds,
      });
    }
  };

  const handleSavePermissions = () => {
    if (!selectedMember) return;

    const permissionsArray = Object.entries(localPermissions).map(([module, perms]) => ({
      module,
      canRead: perms.canRead || false,
      canCreate: perms.canCreate || false,
      canUpdate: perms.canUpdate || false,
      canDelete: perms.canDelete || false,
    }));

    updateMutation.mutate({
      id: selectedMember.id,
      data: { permissions: permissionsArray },
    });
  };

  const togglePermission = (module: string, action: string) => {
    setLocalPermissions((prev) => {
      const modulePerms = prev[module] || {};
      return {
        ...prev,
        [module]: {
          ...modulePerms,
          [action]: !modulePerms[action],
        },
      };
    });
  };

  const toggleAllForModule = (module: string, checked: boolean) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [module]: {
        canRead: checked,
        canCreate: checked,
        canUpdate: checked,
        canDelete: checked,
      },
    }));
  };

  function getPermissionCount(member: StaffMember) {
    let count = 0;
    member.permissions.forEach((p) => {
      if (p.canRead) count++;
      if (p.canCreate) count++;
      if (p.canUpdate) count++;
      if (p.canDelete) count++;
    });
    return count;
  }

  return (
    <div className="space-y-6" data-testid="page-reseller-team">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Gestione Team</h1>
                <p className="text-sm text-muted-foreground">
                  Collaboratori e permessi
                </p>
              </div>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="shadow-lg shadow-primary/25" data-testid="button-new-staff">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Collaboratore
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Totale Membri</p>
                <p className="text-3xl font-bold tabular-nums">{staffMembers.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Team attivo</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Membri Attivi</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{activeMembers}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {staffMembers.length > 0 ? Math.round((activeMembers / staffMembers.length) * 100) : 0}% del totale
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="relative pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Permessi Totali</p>
                <p className="text-3xl font-bold tabular-nums text-blue-600 dark:text-blue-400">{totalPermissions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Media {staffMembers.length > 0 ? (totalPermissions / staffMembers.length).toFixed(1) : 0} per membro
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">Membri del Team</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {filteredMembers.length} risultati
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              {/* Filter Pills */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <Button
                  variant={activeFilter === "all" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("all")}
                >
                  Tutti
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{staffMembers.length}</Badge>
                </Button>
                <Button
                  variant={activeFilter === "active" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("active")}
                >
                  Attivi
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{activeMembers}</Badge>
                </Button>
                <Button
                  variant={activeFilter === "inactive" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setActiveFilter("inactive")}
                >
                  Inattivi
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{inactiveMembers}</Badge>
                </Button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca collaboratore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-background"
                  data-testid="input-search"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Nessun collaboratore trovato</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery ? "Prova a modificare i criteri di ricerca" : "Inizia aggiungendo il tuo primo collaboratore"}
              </p>
              {!searchQuery && (
                <Button className="mt-4" onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Collaboratore
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <TableHead className="pl-6 w-[200px]">Collaboratore</TableHead>
                    <TableHead>Contatti</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-center">Permessi</TableHead>
                    <TableHead>Centri Assegnati</TableHead>
                    <TableHead className="pr-6 text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member, index) => (
                    <TableRow 
                      key={member.id} 
                      data-testid={`row-staff-${member.id}`}
                      className={`group ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                    >
                      <TableCell className="pl-6 relative">
                        <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${member.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div>
                          <p className="font-medium" data-testid={`text-name-${member.id}`}>
                            {member.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            @{member.username}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm truncate max-w-[200px]">{member.email}</p>
                          {member.phone && (
                            <p className="text-xs text-muted-foreground">{member.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {member.isActive ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-0 font-normal">
                            Attivo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">Inattivo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-normal tabular-nums" data-testid={`badge-permissions-${member.id}`}>
                          {getPermissionCount(member)} permessi
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.assignedRepairCenters && member.assignedRepairCenters.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.assignedRepairCenters.slice(0, 2).map((rc) => (
                              <Badge key={rc.id} variant="outline" className="text-xs font-normal" data-testid={`badge-center-${member.id}-${rc.id}`}>
                                {rc.name}
                              </Badge>
                            ))}
                            {member.assignedRepairCenters.length > 2 && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                +{member.assignedRepairCenters.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openPermissionsDialog(member)}
                            title="Gestisci permessi"
                            data-testid={`button-permissions-${member.id}`}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(member)}
                            title="Modifica"
                            data-testid={`button-edit-${member.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedMember(member);
                              setNewPassword("");
                              setResetPasswordDialogOpen(true);
                            }}
                            title="Reset password"
                            data-testid={`button-reset-password-${member.id}`}
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setSelectedMember(member);
                              setDeleteDialogOpen(true);
                            }}
                            title="Elimina"
                            data-testid={`button-delete-${member.id}`}
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {/* Dialog Hero Header */}
          <div className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border-b">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="relative flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                {isEditing ? <Edit className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {isEditing ? "Modifica Collaboratore" : "Nuovo Collaboratore"}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {isEditing
                    ? "Modifica i dati del collaboratore"
                    : "Inserisci i dati del nuovo membro del team"}
                </DialogDescription>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mario Rossi" data-testid="input-fullname" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="mario@esempio.it" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEditing && (
                  <>
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="mario.rossi" data-testid="input-username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••" data-testid="input-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className={isEditing ? "col-span-2" : ""}>
                      <FormLabel>Telefono (opzionale)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+39 333 1234567" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {repairCenters.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Centri Riparazione Assegnati</Label>
                  <div className="flex flex-wrap gap-2">
                    {repairCenters.map((rc) => {
                      const isSelected = localRepairCenterIds.includes(rc.id);
                      return (
                        <Badge
                          key={rc.id}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setLocalRepairCenterIds(prev => prev.filter(id => id !== rc.id));
                            } else {
                              setLocalRepairCenterIds(prev => [...prev, rc.id]);
                            }
                          }}
                          data-testid={`badge-select-center-${rc.id}`}
                        >
                          {rc.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {subResellers.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Sotto-Rivenditori Assegnati</Label>
                  <div className="flex flex-wrap gap-2">
                    {subResellers.map((sr) => {
                      const isSelected = localSubResellerIds.includes(sr.id);
                      return (
                        <Badge
                          key={sr.id}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (isSelected) {
                              setLocalSubResellerIds(prev => prev.filter(id => id !== sr.id));
                            } else {
                              setLocalSubResellerIds(prev => [...prev, sr.id]);
                            }
                          }}
                          data-testid={`badge-select-subreseller-${sr.id}`}
                        >
                          {sr.ragioneSociale || sr.fullName}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="space-y-3 pt-4 border-t">
                  <Label>Permessi Iniziali</Label>
                  <p className="text-sm text-muted-foreground">
                    Seleziona i moduli a cui il collaboratore avrà accesso
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {MODULES.map((mod) => {
                      const hasAny = localPermissions[mod.id]?.canRead || 
                        localPermissions[mod.id]?.canCreate || 
                        localPermissions[mod.id]?.canUpdate || 
                        localPermissions[mod.id]?.canDelete;
                      return (
                        <div
                          key={mod.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${hasAny ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                          onClick={() => toggleAllForModule(mod.id, !hasAny)}
                        >
                          <Checkbox checked={hasAny} className="pointer-events-none" />
                          <span className="text-sm">{mod.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : isEditing ? "Salva Modifiche" : "Crea Collaboratore"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] p-0 overflow-hidden">
          {/* Dialog Hero Header */}
          <div className="relative bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-slate-100 dark:from-blue-500/10 dark:via-blue-500/5 dark:to-slate-900 p-6 border-b">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
            <div className="relative flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Permessi di {selectedMember?.fullName}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  Configura i permessi per ogni modulo dell'applicazione
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[50vh]">
            {MODULES.map((mod) => {
              const perms = localPermissions[mod.id] || {};
              const allChecked = perms.canRead && perms.canCreate && perms.canUpdate && perms.canDelete;
              
              return (
                <Card key={mod.id} className="overflow-hidden">
                  <CardHeader className="py-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={allChecked}
                          onCheckedChange={(checked) => toggleAllForModule(mod.id, checked as boolean)}
                        />
                        <div>
                          <CardTitle className="text-sm font-medium">{mod.name}</CardTitle>
                          <CardDescription className="text-xs">{mod.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3">
                    <div className="grid grid-cols-4 gap-3">
                      {PERMISSION_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        const isChecked = perms[action.id as keyof typeof perms] || false;
                        return (
                          <div
                            key={action.id}
                            className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${isChecked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                            onClick={() => togglePermission(mod.id, action.id)}
                          >
                            <Checkbox checked={isChecked} className="pointer-events-none" />
                            <Icon className="h-3 w-3" />
                            <span className="text-xs">{action.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="p-6 pt-0 border-t bg-muted/30">
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
                Annulla
              </Button>
              <Button onClick={handleSavePermissions} disabled={updateMutation.isPending} className="shadow-lg shadow-primary/25">
                {updateMutation.isPending ? "Salvataggio..." : "Salva Permessi"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina Collaboratore</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare <strong>{selectedMember?.fullName}</strong>?
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMember && deleteMutation.mutate(selectedMember.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Imposta una nuova password per <strong>{selectedMember?.fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Inserisci la nuova password"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => selectedMember && resetPasswordMutation.mutate({ id: selectedMember.id, newPassword })}
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
            >
              {resetPasswordMutation.isPending ? "Salvataggio..." : "Reimposta Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
