import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, Download, Users, CalendarIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

export default function AdminUsers() {
  const { t } = useTranslation();
  usePageTitle(t("sidebar.items.users"));
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [resellerCategoryFilter, setResellerCategoryFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("reseller");
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: resellers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const getResellerCategoryLabel = (category: string | null | undefined) => {
    switch (category) {
      case "franchising": return "Franchising";
      case "gdo": return "GDO";
      case "standard": return "Standard";
      default: return "Standard";
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const csv = [
        [t("common.fullName"), t("common.email"), 'Username', t("common.role"), t("users.categoryReseller"), t("common.status")].join(','),
        ...filteredUsers.map(u => [
          u.fullName,
          u.email,
          u.username,
          getRoleLabel(u.role),
          u.role === 'reseller' 
            ? getResellerCategoryLabel(u.resellerCategory) 
            : u.role === 'repair_center' && u.resellerId 
              ? (resellers.find(r => r.id === u.resellerId)?.fullName || '-')
              : '-',
          u.isActive ? t("common.active") : t("common.inactive")
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t("repairs.exportCompleted"),
        description: t("customers.csvExportSuccess"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("repairs.exportError"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const createUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      toast({ title: t("users.userCreated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDialogOpen(false);
      setEditingUser(null);
      toast({ title: t("users.userUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t("users.userDeleted") });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingUser) {
      const updates: Partial<User> = {
        email: formData.get("email") as string,
        fullName: formData.get("fullName") as string,
        role: selectedRole as any,
        isActive: formData.get("isActive") === "true",
      };
      if (selectedRole === 'reseller') {
        updates.resellerCategory = formData.get("resellerCategory") as any || 'standard';
      }
      if (selectedRole === 'repair_center') {
        updates.resellerId = selectedResellerId || null;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: updates });
    } else {
      const data: InsertUser = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        email: formData.get("email") as string,
        fullName: formData.get("fullName") as string,
        role: selectedRole as any,
        isActive: true,
      };
      if (selectedRole === 'reseller') {
        data.resellerCategory = formData.get("resellerCategory") as any || 'standard';
      }
      if (selectedRole === 'repair_center' && selectedResellerId) {
        data.resellerId = selectedResellerId;
      }
      createUserMutation.mutate(data);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (user.role === 'customer') return false;
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesResellerCategory = resellerCategoryFilter === "all" || 
      (user.role === 'reseller' && (user.resellerCategory || 'standard') === resellerCategoryFilter);
    return matchesSearch && matchesRole && (resellerCategoryFilter === "all" || matchesResellerCategory);
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "default";
      case "reseller": return "secondary";
      case "repair_center": return "outline";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return t("roles.admin");
      case "reseller": return t("roles.reseller");
      case "repair_center": return t("roles.repairCenter");
      case "customer": return t("roles.customer");
      default: return role;
    }
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
              <h1 className="text-2xl font-bold tracking-tight">{t("users.management")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("users.manageAllUsers")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleExport}
            disabled={isExporting || users.length === 0}
            variant="outline"
            data-testid="button-export-users"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? t("repairs.exporting") : t("reports.exportCSV")}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { 
            setDialogOpen(open); 
            if (!open) {
              setEditingUser(null);
              setSelectedRole("reseller");
              setSelectedResellerId("");
            } else if (editingUser) {
              setSelectedRole(editingUser.role);
              setSelectedResellerId(editingUser.resellerId || "");
            } else {
              setSelectedRole("reseller");
              setSelectedResellerId("");
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-user">
                <Plus className="h-4 w-4 mr-2" />
                {t("users.newUser")}
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? t("users.editUser") : t("users.createNewUser")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("common.fullName")}</Label>
                <Input id="fullName" name="fullName" defaultValue={editingUser?.fullName || ''} required data-testid="input-fullname" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("common.email")}</Label>
                <Input id="email" name="email" type="email" defaultValue={editingUser?.email || ''} required data-testid="input-email" />
              </div>
              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">{t("auth.username")}</Label>
                    <Input id="username" name="username" required data-testid="input-username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input id="password" name="password" type="password" required data-testid="input-password" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">{t("common.role")}</Label>
                <Select 
                  name="role" 
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                >
                  <SelectTrigger id="role" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reseller">{t("roles.reseller")}</SelectItem>
                    <SelectItem value="repair_center">{t("roles.repairCenter")}</SelectItem>
                    <SelectItem value="admin">{t("roles.administrator")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedRole === 'reseller' && (
                <div className="space-y-2">
                  <Label htmlFor="resellerCategory">{t("users.resellerCategory")}</Label>
                  <Select name="resellerCategory" defaultValue={editingUser?.resellerCategory || "standard"}>
                    <SelectTrigger id="resellerCategory" data-testid="select-reseller-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="franchising">Franchising</SelectItem>
                      <SelectItem value="gdo">{t("users.gdoLabel")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedRole === 'repair_center' && (
                <div className="space-y-2">
                  <Label htmlFor="resellerId">{t("users.belongingReseller")}</Label>
                  <Select 
                    value={selectedResellerId} 
                    onValueChange={setSelectedResellerId}
                  >
                    <SelectTrigger id="resellerId" data-testid="select-reseller-id">
                      <SelectValue placeholder={t("customers.selectReseller")} />
                    </SelectTrigger>
                    <SelectContent>
                      {resellers.map((reseller) => (
                        <SelectItem key={reseller.id} value={reseller.id}>
                          {reseller.fullName} ({reseller.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">{t("common.status")}</Label>
                  <Select name="isActive" defaultValue={editingUser.isActive ? "true" : "false"}>
                    <SelectTrigger id="isActive" data-testid="select-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">{t("common.active")}</SelectItem>
                      <SelectItem value="false">{t("common.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createUserMutation.isPending || updateUserMutation.isPending} 
                data-testid="button-submit-user"
              >
                {editingUser 
                  ? (updateUserMutation.isPending ? t("common.updating") : t("users.updateUser"))
                  : (createUserMutation.isPending ? t("common.creating") : t("users.createUser"))
                }
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("customers.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("users.allRoles")}</SelectItem>
                <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                <SelectItem value="reseller">{t("sidebar.items.resellers")}</SelectItem>
                <SelectItem value="repair_center">{t("sidebar.items.repairCenters")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resellerCategoryFilter} onValueChange={setResellerCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-reseller-category">
                <SelectValue placeholder={t("users.resellerCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("users.allCategories")}</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="franchising">Franchising</SelectItem>
                <SelectItem value="gdo">GDO</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-64" data-testid="button-date-range">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd MMM yyyy", { locale: it })} - ${format(dateRange.to, "dd MMM yyyy", { locale: it })}`
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: it })
                    )
                  ) : (
                    t("repairs.selectPeriod")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={it}
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleExport}
              disabled={isExporting || users.length === 0}
              variant="outline"
              data-testid="button-export-users"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? t("repairs.exporting") : t("reports.exportCSV")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("users.noUsersFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.name")}</TableHead>
                  <TableHead>{t("common.email")}</TableHead>
                  <TableHead>{t("auth.username")}</TableHead>
                  <TableHead>{t("common.role")}</TableHead>
                  <TableHead>{t("users.categoryReseller")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'reseller' ? (
                        <Badge variant="outline">
                          {getResellerCategoryLabel(user.resellerCategory)}
                        </Badge>
                      ) : user.role === 'repair_center' && user.resellerId ? (
                        <span className="text-sm">
                          {resellers.find(r => r.id === user.resellerId)?.fullName || t("users.resellerNotFound")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { 
                            setEditingUser(user); 
                            setSelectedRole(user.role); 
                            setSelectedResellerId(user.resellerId || "");
                            setDialogOpen(true); 
                          }}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteUserMutation.mutate(user.id)}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-${user.id}`}
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

    </div>
  );
}
