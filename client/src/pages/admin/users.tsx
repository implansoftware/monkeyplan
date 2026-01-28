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

export default function AdminUsers() {
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
        ['Nome Completo', 'Email', 'Username', 'Ruolo', 'Categoria/Rivenditore', 'Stato'].join(','),
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
          u.isActive ? 'Attivo' : 'Inattivo'
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
        title: "Export completato",
        description: "Il file CSV è stato scaricato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati",
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
      toast({ title: "Utente creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Utente aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Utente eliminato" });
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
      case "admin": return "Admin";
      case "reseller": return "Rivenditore";
      case "repair_center": return "Centro Riparazione";
      case "customer": return "Cliente";
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
              <h1 className="text-2xl font-bold tracking-tight">Gestione Utenti</h1>
              <p className="text-sm text-muted-foreground">
                Gestisci tutti gli utenti della piattaforma
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
            {isExporting ? "Esportazione..." : "Esporta CSV"}
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
                Nuovo Utente
              </Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Modifica Utente' : 'Crea Nuovo Utente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input id="fullName" name="fullName" defaultValue={editingUser?.fullName || ''} required data-testid="input-fullname" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" defaultValue={editingUser?.email || ''} required data-testid="input-email" />
              </div>
              {!editingUser && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" required data-testid="input-username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required data-testid="input-password" />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Ruolo</Label>
                <Select 
                  name="role" 
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                >
                  <SelectTrigger id="role" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reseller">Rivenditore</SelectItem>
                    <SelectItem value="repair_center">Centro Riparazione</SelectItem>
                    <SelectItem value="admin">Amministratore</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedRole === 'reseller' && (
                <div className="space-y-2">
                  <Label htmlFor="resellerCategory">Categoria Rivenditore</Label>
                  <Select name="resellerCategory" defaultValue={editingUser?.resellerCategory || "standard"}>
                    <SelectTrigger id="resellerCategory" data-testid="select-reseller-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="franchising">Franchising</SelectItem>
                      <SelectItem value="gdo">GDO (Grande Distribuzione)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedRole === 'repair_center' && (
                <div className="space-y-2">
                  <Label htmlFor="resellerId">Rivenditore di Appartenenza</Label>
                  <Select 
                    value={selectedResellerId} 
                    onValueChange={setSelectedResellerId}
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
                </div>
              )}
              {editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">Stato</Label>
                  <Select name="isActive" defaultValue={editingUser.isActive ? "true" : "false"}>
                    <SelectTrigger id="isActive" data-testid="select-active">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Attivo</SelectItem>
                      <SelectItem value="false">Inattivo</SelectItem>
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
                  ? (updateUserMutation.isPending ? "Aggiornamento..." : "Aggiorna Utente")
                  : (createUserMutation.isPending ? "Creazione..." : "Crea Utente")
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
                placeholder="Cerca per nome, email o username..."
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
                <SelectItem value="all">Tutti i ruoli</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="reseller">Rivenditori</SelectItem>
                <SelectItem value="repair_center">Centri Riparazione</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resellerCategoryFilter} onValueChange={setResellerCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-reseller-category">
                <SelectValue placeholder="Categoria Rivenditore" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
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
                    "Seleziona periodo"
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
              {isExporting ? "Esportazione..." : "Esporta CSV"}
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
              <p>Nessun utente trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Categoria/Rivenditore</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
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
                          {resellers.find(r => r.id === user.resellerId)?.fullName || 'Rivenditore non trovato'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Attivo" : "Inattivo"}
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
