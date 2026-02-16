import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Users, Plus, Search, Edit, Trash2, Key, UserCheck, AlertTriangle } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";

interface StaffMember {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  role?: string;
}

const staffFormSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

type FilterType = "all" | "active" | "inactive";

export default function RepairCenterTeam() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
    queryKey: ["/api/repair-center/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      return await apiRequest("POST", "/api/repair-center/team", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/team"] });
      toast({ title: "Membro creato", description: t("team.ilMembroDelTeamStatoCreatoConSuccesso") });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message || "Errore nella creazione", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffFormValues> }) => {
      return await apiRequest("PUT", `/api/repair-center/team/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/team"] });
      toast({ title: "Membro aggiornato", description: "Le modifiche sono state salvate" });
      setDialogOpen(false);
      form.reset();
      setSelectedMember(null);
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message || "Errore nell'aggiornamento", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/repair-center/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/team"] });
      toast({ title: "Membro eliminato", description: t("team.ilMembroStatoRimossoDalTeam") });
      setDeleteDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message || "Errore nell'eliminazione", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword: string }) => {
      return await apiRequest("POST", `/api/repair-center/team/${id}/reset-password`, { newPassword });
    },
    onSuccess: () => {
      toast({ title: "Password reimpostata", description: t("team.laNuovaPasswordStataImpostata") });
      setResetPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message || "Errore nel reset password", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/repair-center/team/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/team"] });
    },
  });

  const filteredMembers = staffMembers.filter((member) => {
    const matchesSearch =
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "active") return matchesSearch && member.isActive;
    if (activeFilter === "inactive") return matchesSearch && !member.isActive;
    return matchesSearch;
  });

  const handleOpenCreate = () => {
    form.reset({ username: "", email: "", fullName: "", phone: "", password: "" });
    setSelectedMember(null);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    form.reset({
      username: member.username,
      email: member.email,
      fullName: member.fullName,
      phone: member.phone || "",
      password: "",
    });
    setSelectedMember(member);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleSubmit = (data: StaffFormValues) => {
    if (isEditing && selectedMember) {
      const { password, ...updateData } = data;
      updateMutation.mutate({ id: selectedMember.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const stats = {
    total: staffMembers.length,
    active: staffMembers.filter((m) => m.isActive).length,
    inactive: staffMembers.filter((m) => !m.isActive).length,
  };

  return (
    <div className="p-6 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Users className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">{t("sidebar.sections.team")}</h1>
              <p className="text-emerald-100">{t("team.gestisciIMembriDelTuoTeam")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleOpenCreate} className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" variant="outline" data-testid="button-create-member">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Membro
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate cursor-pointer" onClick={() => setActiveFilter("all")} data-testid="card-stat-total">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t("team.totaleMembri")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer" onClick={() => setActiveFilter("active")} data-testid="card-stat-active">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <UserCheck className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Attivi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover-elevate cursor-pointer" onClick={() => setActiveFilter("inactive")} data-testid="card-stat-inactive">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Inattivi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>{t("admin.teams.teamMembers")}</CardTitle>
              <CardDescription>
                {activeFilter === "all" ? t("team.allMembers") : activeFilter === "active" ? t("team.activeOnly") : t("team.inactiveOnly")}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("team.cercaMembri")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("team.nessunMembroTrovato")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("admin.common.usernameLabel")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("auth.email")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("auth.phone")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.creationDate")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => {
                  const isOwner = member.role === 'repair_center';
                  return (
                    <TableRow key={member.id} data-testid={`row-member-${member.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          {member.fullName}
                          {isOwner && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                              Proprietario
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{member.username}</TableCell>
                      <TableCell className="hidden md:table-cell">{member.email}</TableCell>
                      <TableCell className="hidden lg:table-cell">{member.phone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Switch
                            checked={member.isActive}
                            onCheckedChange={(checked) =>
                              toggleActiveMutation.mutate({ id: member.id, isActive: checked })
                            }
                            disabled={isOwner}
                            data-testid={`switch-active-${member.id}`}
                          />
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? t("common.active") : t("common.inactive")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{format(new Date(member.createdAt), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isOwner && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEdit(member)}
                                data-testid={`button-edit-${member.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setResetPasswordDialogOpen(true);
                                }}
                                data-testid={`button-reset-password-${member.id}`}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-${member.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("team.editMember") : "Nuovo Membro del Team"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? t("team.editMemberData")
                : t("team.enterNewMemberData")}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.fullName")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Mario Rossi" data-testid="input-fullname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.common.usernameLabel")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="mario.rossi" data-testid="input-username" />
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
                    <FormLabel>{t("auth.email")}</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="mario@esempio.it" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("auth.phone")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+39 123 456 7890" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isEditing && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.password")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="••••••••" data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? t("settings.saving")
                    : isEditing
                    ? t("team.saveChanges")
                    : t("team.createMember")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.teams.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("team.confirmDeleteMember", { name: selectedMember?.fullName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedMember && deleteMutation.mutate(selectedMember.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminazione..." : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reimposta Password</DialogTitle>
            <DialogDescription>
              Inserisci la nuova password per {selectedMember?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("profile.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caratteri"
                data-testid="input-new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)} data-testid="button-cancel-reset">
              Annulla
            </Button>
            <Button
              onClick={() =>
                selectedMember && resetPasswordMutation.mutate({ id: selectedMember.id, newPassword })
              }
              disabled={resetPasswordMutation.isPending || newPassword.length < 6}
              data-testid="button-confirm-reset"
            >
              {resetPasswordMutation.isPending ? t("settings.saving") : "Reimposta Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
