import { useState } from "react";
import { useParams, Link } from "wouter";
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
import { Users, Plus, Search, Edit, Trash2, Shield, UserCog, Eye, FilePlus, Pencil, ArrowLeft, Store } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StaffWizard } from "@/components/StaffWizard";
import type { User } from "@shared/schema";

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

export default function AdminResellerTeam() {
  const { resellerId } = useParams<{ resellerId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [localRepairCenterIds, setLocalRepairCenterIds] = useState<string[]>([]);
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

  const { data: reseller } = useQuery<Omit<User, 'password'>>({
    queryKey: ["/api/users", resellerId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${resellerId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Rivenditore non trovato");
      return res.json();
    },
    enabled: !!resellerId,
  });

  const { data: staffMembers = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/admin/resellers", resellerId, "team"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/resellers/${resellerId}/team`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento team");
      return res.json();
    },
    enabled: !!resellerId,
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/admin/resellers", resellerId, "repair-centers"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/resellers/${resellerId}/repair-centers`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento centri");
      return res.json();
    },
    enabled: !!resellerId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { user: StaffFormValues; permissions: any[]; repairCenterIds?: string[] }) => {
      return apiRequest("POST", `/api/admin/resellers/${resellerId}/team`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers", resellerId, "team"] });
      setDialogOpen(false);
      form.reset();
      setLocalPermissions({});
      setLocalRepairCenterIds([]);
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
    mutationFn: async ({ id, data }: { id: string; data: { user?: Partial<StaffFormValues>; permissions?: any[]; repairCenterIds?: string[] } }) => {
      return apiRequest("PATCH", `/api/admin/resellers/${resellerId}/team/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers", resellerId, "team"] });
      setDialogOpen(false);
      setPermissionsDialogOpen(false);
      setSelectedMember(null);
      setIsEditing(false);
      form.reset();
      setLocalPermissions({});
      setLocalRepairCenterIds([]);
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
      return apiRequest("DELETE", `/api/admin/resellers/${resellerId}/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resellers", resellerId, "team"] });
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

  const filteredMembers = staffMembers.filter((member) =>
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
      updateMutation.mutate({ id: selectedMember.id, data: { user: userData, repairCenterIds: localRepairCenterIds } });
    } else {
      createMutation.mutate({
        user: values,
        permissions: permissionsArray,
        repairCenterIds: localRepairCenterIds,
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

  const getPermissionCount = (member: StaffMember) => {
    let count = 0;
    member.permissions.forEach((p) => {
      if (p.canRead) count++;
      if (p.canCreate) count++;
      if (p.canUpdate) count++;
      if (p.canDelete) count++;
    });
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-8">
        <div className="absolute top-0 -right-20 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10">
          <Link href="/admin/resellers">
            <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna ai rivenditori
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Team di {reseller?.fullName || "Rivenditore"}</h1>
                <p className="text-blue-100/80 mt-1 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Gestisci i collaboratori e i loro permessi
                </p>
              </div>
            </div>
            <Button onClick={() => setWizardOpen(true)} className="bg-white text-blue-700 hover:bg-white/90 shadow-lg rounded-xl" data-testid="button-new-staff">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Collaboratore
            </Button>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <Search className="h-5 w-5 text-white" />
            </div>
            Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Cerca per nome, email o username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
              data-testid="input-search"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
              <Users className="h-5 w-5 text-white" />
            </div>
            Membri del Team ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg">
                {staffMembers.length === 0
                  ? "Nessun collaboratore nel team. Aggiungi il primo membro!"
                  : "Nessun collaboratore trovato"}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="text-slate-600 dark:text-slate-400">Nome Completo</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Username</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Stato</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Permessi</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Centri Assegnati</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Data Creazione</TableHead>
                    <TableHead className="text-slate-600 dark:text-slate-400">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30" data-testid={`row-staff-${member.id}`}>
                      <TableCell className="font-medium text-slate-900 dark:text-white" data-testid={`text-name-${member.id}`}>
                        {member.fullName}
                      </TableCell>
                      <TableCell className="text-slate-500">{member.email}</TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">{member.username}</TableCell>
                      <TableCell>
                        {member.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Attivo</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">Disattivato</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100" data-testid={`badge-permissions-${member.id}`}>
                          {getPermissionCount(member)} permessi
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.assignedRepairCenters && member.assignedRepairCenters.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.assignedRepairCenters.map((rc) => (
                              <Badge key={rc.id} className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100" data-testid={`badge-center-${member.id}-${rc.id}`}>
                                {rc.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500">{format(new Date(member.createdAt), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-blue-100 hover:text-blue-600"
                            onClick={() => openPermissionsDialog(member)}
                            title="Gestisci permessi"
                            data-testid={`button-permissions-${member.id}`}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-amber-100 hover:text-amber-600"
                            onClick={() => openEditDialog(member)}
                            title="Modifica utente"
                            data-testid={`button-edit-${member.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-100 hover:text-red-600"
                            onClick={() => {
                              setSelectedMember(member);
                              setDeleteDialogOpen(true);
                            }}
                            title="Elimina utente"
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <Users className="h-5 w-5 text-white" />
              </div>
              {isEditing ? "Modifica Collaboratore" : "Nuovo Collaboratore"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifica i dati del collaboratore"
                : "Inserisci i dati del nuovo membro del team"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 dark:text-slate-300">Nome Completo</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Mario Rossi" className="h-11 rounded-xl" data-testid="input-fullname" />
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="mario@esempio.it" className="h-11 rounded-xl" data-testid="input-email" />
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
                          <FormLabel className="text-slate-700 dark:text-slate-300">Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="mario.rossi" className="h-11 rounded-xl" data-testid="input-username" />
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
                          <FormLabel className="text-slate-700 dark:text-slate-300">Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••" className="h-11 rounded-xl" data-testid="input-password" />
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
                      <FormLabel className="text-slate-700 dark:text-slate-300">Telefono (opzionale)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+39 333 1234567" className="h-11 rounded-xl" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {repairCenters.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium text-slate-700 dark:text-slate-300">Centri di Riparazione Assegnati</Label>
                  <p className="text-sm text-slate-500">
                    Seleziona i centri a cui questo collaboratore avrà accesso
                  </p>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800/30">
                    <div className="space-y-2">
                      {repairCenters.map((center) => (
                        <div key={center.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`center-${center.id}`}
                            checked={localRepairCenterIds.includes(center.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setLocalRepairCenterIds([...localRepairCenterIds, center.id]);
                              } else {
                                setLocalRepairCenterIds(localRepairCenterIds.filter(id => id !== center.id));
                              }
                            }}
                            data-testid={`checkbox-center-${center.id}`}
                          />
                          <label
                            htmlFor={`center-${center.id}`}
                            className="text-sm font-medium leading-none cursor-pointer text-slate-700 dark:text-slate-300"
                          >
                            {center.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!isEditing && (
                <div className="space-y-3">
                  <Label className="text-base font-medium text-slate-700 dark:text-slate-300">Permessi Iniziali</Label>
                  <p className="text-sm text-slate-500">
                    Puoi configurare i permessi dettagliati dopo la creazione
                  </p>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-h-60 overflow-y-auto bg-slate-50 dark:bg-slate-800/30">
                    <div className="space-y-2">
                      {MODULES.map((module) => (
                        <div key={module.id} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-700 last:border-0">
                          <div>
                            <div className="font-medium text-sm text-slate-900 dark:text-white">{module.name}</div>
                            <div className="text-xs text-slate-500">{module.description}</div>
                          </div>
                          <Switch
                            checked={
                              localPermissions[module.id]?.canRead &&
                              localPermissions[module.id]?.canCreate &&
                              localPermissions[module.id]?.canUpdate &&
                              localPermissions[module.id]?.canDelete
                            }
                            onCheckedChange={(checked) => toggleAllForModule(module.id, checked)}
                            data-testid={`switch-module-${module.id}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              </div>

              <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  data-testid="button-save-staff"
                >
                  {isEditing ? "Salva Modifiche" : "Crea Collaboratore"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                <UserCog className="h-5 w-5 text-white" />
              </div>
              Permessi di {selectedMember?.fullName}
            </DialogTitle>
            <DialogDescription>
              Configura i permessi per ogni modulo. Seleziona le azioni consentite.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                    <TableHead className="w-[250px] text-slate-600 dark:text-slate-400">Modulo</TableHead>
                    {PERMISSION_ACTIONS.map((action) => (
                      <TableHead key={action.id} className="text-center w-[100px] text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col items-center gap-1">
                          <action.icon className="h-4 w-4" />
                          <span className="text-xs">{action.label}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center w-[100px] text-slate-600 dark:text-slate-400">Tutti</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map((module) => {
                    const modulePerms = localPermissions[module.id] || {};
                    const allChecked =
                      modulePerms.canRead &&
                      modulePerms.canCreate &&
                      modulePerms.canUpdate &&
                      modulePerms.canDelete;

                    return (
                      <TableRow key={module.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <TableCell>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">{module.name}</div>
                            <div className="text-xs text-slate-500">{module.description}</div>
                          </div>
                        </TableCell>
                        {PERMISSION_ACTIONS.map((action) => (
                          <TableCell key={action.id} className="text-center">
                            <Checkbox
                              checked={modulePerms[action.id] || false}
                              onCheckedChange={() => togglePermission(module.id, action.id)}
                              data-testid={`checkbox-${module.id}-${action.id}`}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center">
                          <Checkbox
                            checked={allChecked}
                            onCheckedChange={(checked) => toggleAllForModule(module.id, !!checked)}
                            data-testid={`checkbox-${module.id}-all`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)} className="rounded-xl">
              Annulla
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={updateMutation.isPending}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              data-testid="button-save-permissions"
            >
              Salva Permessi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              Conferma Eliminazione
            </DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare {selectedMember?.fullName} dal team? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMember && deleteMutation.mutate(selectedMember.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
              data-testid="button-confirm-delete"
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StaffWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        resellerId={resellerId || ""}
        resellerName={reseller?.fullName}
        repairCenters={repairCenters}
      />
    </div>
  );
}
