import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Users, Plus, Search, Edit, Trash2, Shield, UserCog, Eye, FilePlus, Pencil } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTranslation } from "react-i18next";

function getAdminModules(t: (key: string) => string) {
  return [
    { id: "users", name: t("admin.permissions.repairs"), description: t("admin.permissions.repairsDesc") },
    { id: "resellers", name: t("sidebar.items.resellers"), description: t("admin.permissions.repairsDesc") },
    { id: "repair_centers", name: t("admin.permissions.repairCenters"), description: t("admin.permissions.repairCentersDesc") },
    { id: "repairs", name: t("admin.permissions.repairs"), description: t("admin.permissions.repairsDesc") },
    { id: "products", name: t("admin.permissions.products"), description: t("admin.permissions.productsDesc") },
    { id: "inventory", name: t("admin.permissions.inventory"), description: t("admin.permissions.inventoryDesc") },
    { id: "suppliers", name: t("admin.permissions.suppliers"), description: t("admin.permissions.suppliersDesc") },
    { id: "supplier_orders", name: t("admin.permissions.supplierOrders"), description: t("admin.permissions.supplierOrdersDesc") },
    { id: "invoices", name: t("admin.permissions.invoices"), description: t("admin.permissions.invoicesDesc") },
    { id: "tickets", name: t("admin.permissions.tickets"), description: t("admin.permissions.ticketsDesc") },
    { id: "utility", name: t("sidebar.items.utility"), description: t("admin.permissions.servicesDesc") },
    { id: "reports", name: t("sidebar.items.reports"), description: t("admin.permissions.repairsDesc") },
    { id: "settings", name: t("sidebar.items.settings"), description: t("admin.permissions.servicesDesc") },
    { id: "service_catalog", name: t("sidebar.items.priceList"), description: t("admin.permissions.servicesDesc") },
  ];
}

function getPermissionActions(t: (key: string) => string) {
  return [
    { id: "canRead", label: t("admin.permissions.canRead"), icon: Eye },
    { id: "canCreate", label: t("admin.permissions.canCreate"), icon: FilePlus },
    { id: "canUpdate", label: t("admin.permissions.canUpdate"), icon: Pencil },
    { id: "canDelete", label: t("admin.permissions.canDelete"), icon: Trash2 },
  ];
}

interface AdminStaffMember {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  permissions: AdminStaffPermission[];
}

interface AdminStaffPermission {
  id: string;
  userId: string;
  adminId: string;
  module: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

function getStaffFormSchema(t: (key: string) => string) {
  return z.object({
    username: z.string().min(3, t("form.minLength", { min: 3 })),
    email: z.string().email(t("form.invalidEmail")),
    fullName: z.string().min(2, t("form.required")),
    phone: z.string().optional(),
    password: z.string().min(6, t("form.minLength", { min: 6 })).optional(),
  });
}

export default function AdminTeam() {
  const { t } = useTranslation();
  const ADMIN_MODULES = getAdminModules(t);
  const PERMISSION_ACTIONS = getPermissionActions(t);
  const staffFormSchema = getStaffFormSchema(t);
  type StaffFormValues = z.infer<typeof staffFormSchema>;
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<AdminStaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localPermissions, setLocalPermissions] = useState<Record<string, Record<string, boolean>>>({});
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

  const { data: staffMembers = [], isLoading } = useQuery<AdminStaffMember[]>({
    queryKey: ["/api/admin/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { user: StaffFormValues; permissions: any[] }) => {
      return apiRequest("POST", "/api/admin/team", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      setDialogOpen(false);
      form.reset();
      setLocalPermissions({});
      toast({
        title: t("admin.teams.memberCreated"),
        description: t("admin.teams.memberCreated"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("common.operationFailed"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { user?: Partial<StaffFormValues>; permissions?: any[] } }) => {
      return apiRequest("PATCH", `/api/admin/team/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      setDialogOpen(false);
      setPermissionsDialogOpen(false);
      setSelectedMember(null);
      setIsEditing(false);
      form.reset();
      setLocalPermissions({});
      toast({
        title: t("common.updatedSuccessfully"),
        description: t("common.savedSuccessfully"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("common.operationFailed"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      setDeleteDialogOpen(false);
      setSelectedMember(null);
      toast({
        title: t("common.deletedSuccessfully"),
        description: t("admin.teams.memberDeleted"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || t("common.operationFailed"),
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
    setDialogOpen(true);
  };

  const openEditDialog = (member: AdminStaffMember) => {
    setIsEditing(true);
    setSelectedMember(member);
    form.reset({
      username: member.username || "placeholder",
      email: member.email,
      fullName: member.fullName,
      phone: member.phone || "",
      password: "placeholder",
    });
    setDialogOpen(true);
  };

  const openPermissionsDialog = (member: AdminStaffMember) => {
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
      updateMutation.mutate({ id: selectedMember.id, data: { user: userData } });
    } else {
      createMutation.mutate({
        user: values,
        permissions: permissionsArray,
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

  const getPermissionCount = (member: AdminStaffMember) => {
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gestione Team Admin</h1>
              <p className="text-sm text-muted-foreground">Aggiungi collaboratori admin con permessi granulari per modulo</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} data-testid="button-new-admin-staff" className="shadow-lg shadow-primary/25">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Collaboratore
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("common.search")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("common.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              data-testid="input-search-admin-staff"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboratori Admin ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {staffMembers.length === 0
                ? t("admin.teams.addFirstMember")
                : t("admin.teams.noMembersFound")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("auth.fullName")}</TableHead>
                  <TableHead>{t("common.email")}</TableHead>
                  <TableHead>{t("auth.username")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.permissions")}</TableHead>
                  <TableHead>{t("common.creationDate")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id} data-testid={`row-admin-staff-${member.id}`}>
                    <TableCell className="font-medium" data-testid={`text-name-${member.id}`}>
                      {member.fullName}
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell className="font-mono text-sm">{member.username}</TableCell>
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="outline">{t("common.active")}</Badge>
                      ) : (
                        <Badge variant="destructive">{t("common.disabled")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`badge-permissions-${member.id}`}>
                        {getPermissionCount(member)} permessi
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(member.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPermissionsDialog(member)}
                          title={t("admin.teams.savePermissions")}
                          data-testid={`button-permissions-${member.id}`}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(member)}
                          title={t("admin.teams.editMember")}
                          data-testid={`button-edit-${member.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedMember(member);
                            setDeleteDialogOpen(true);
                          }}
                          title={t("common.delete")}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? t("admin.teams.editMember") : t("admin.teams.addMember")}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? t("admin.teams.editMember")
                : t("admin.teams.wizardAddMember")}
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
                      <FormLabel>{t("auth.fullName")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("auth.fullName")} data-testid="input-fullname" />
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
                      <FormLabel>{t("common.email")}</FormLabel>
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
                          <FormLabel>{t("auth.username")}</FormLabel>
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
                          <FormLabel>{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="******" data-testid="input-password" />
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

              {!isEditing && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Permessi Iniziali</Label>
                  <p className="text-sm text-muted-foreground">
                    Puoi configurare i permessi dettagliati dopo la creazione
                  </p>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {ADMIN_MODULES.map((module) => (
                        <div key={module.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <div className="font-medium text-sm">{module.name}</div>
                            <div className="text-xs text-muted-foreground">{module.description}</div>
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

              <DialogFooter className="pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-admin-staff"
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
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <UserCog className="h-5 w-5" />
              Permessi di {selectedMember?.fullName}
            </DialogTitle>
            <DialogDescription>
              Configura i permessi per ogni modulo. Seleziona le azioni consentite.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Modulo</TableHead>
                  {PERMISSION_ACTIONS.map((action) => (
                    <TableHead key={action.id} className="text-center w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <action.icon className="h-4 w-4" />
                        <span className="text-xs">{action.label}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center w-[100px]">{t("common.allMasc")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ADMIN_MODULES.map((module) => {
                  const modulePerms = localPermissions[module.id] || {};
                  const allChecked =
                    modulePerms.canRead &&
                    modulePerms.canCreate &&
                    modulePerms.canUpdate &&
                    modulePerms.canDelete;

                  return (
                    <TableRow key={module.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{module.name}</div>
                          <div className="text-xs text-muted-foreground">{module.description}</div>
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

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setPermissionsDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={updateMutation.isPending}
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
            <DialogTitle>{t("common.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare {selectedMember?.fullName}? Questa azione non può essere annullata.
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
              data-testid="button-confirm-delete"
            >
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
