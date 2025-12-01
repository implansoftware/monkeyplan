import { useState } from "react";
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
import { Plus, Search, Pencil, Store, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminResellers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Omit<User, 'password'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("standard");
  const [selectedParentResellerId, setSelectedParentResellerId] = useState<string>("");
  const { toast } = useToast();

  type ResellerWithCount = Omit<User, 'password'> & { customerCount: number };
  
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

  // Rivenditori padre (franchising/gdo) per il dropdown
  const parentResellers = resellers.filter(r => 
    r.resellerCategory === 'franchising' || r.resellerCategory === 'gdo'
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Il parentResellerId si applica solo ai rivenditori standard
    const parentId = selectedCategory === 'standard' && selectedParentResellerId 
      ? selectedParentResellerId 
      : null;
    
    if (editingReseller) {
      const updates: Partial<User> = {
        fullName: formData.get("fullName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string || null,
        isActive: formData.get("isActive") === "true",
        resellerCategory: selectedCategory as any,
        parentResellerId: parentId,
      };
      updateResellerMutation.mutate({ id: editingReseller.id, data: updates });
    } else {
      const userData: InsertUser = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        email: formData.get("email") as string,
        fullName: formData.get("fullName") as string,
        phone: formData.get("phone") as string || null,
        role: "reseller",
        isActive: true,
        resellerCategory: selectedCategory as any,
        parentResellerId: parentId,
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
            setSelectedCategory("standard");
            setSelectedParentResellerId("");
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReseller(null); setSelectedCategory("standard"); setSelectedParentResellerId(""); }} data-testid="button-add-reseller">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Rivenditore
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="dialog-reseller-form">
            <DialogHeader>
              <DialogTitle>{editingReseller ? "Modifica Rivenditore" : "Nuovo Rivenditore"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingReseller && (
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
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  defaultValue={editingReseller?.fullName} 
                  required 
                  data-testid="input-fullName" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={editingReseller?.email} 
                  required 
                  data-testid="input-email" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  defaultValue={editingReseller?.phone || ""} 
                  data-testid="input-phone" 
                />
              </div>
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
              </div>
              {selectedCategory === 'standard' && parentResellers.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="parentResellerId">Rivenditore Padre (opzionale)</Label>
                  <Select value={selectedParentResellerId} onValueChange={setSelectedParentResellerId}>
                    <SelectTrigger id="parentResellerId" data-testid="select-parent-reseller">
                      <SelectValue placeholder="Nessun rivenditore padre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nessuno</SelectItem>
                      {parentResellers.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.fullName} ({parent.resellerCategory === 'franchising' ? 'Franchising' : 'GDO'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {editingReseller && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">Stato</Label>
                  <select 
                    id="isActive" 
                    name="isActive" 
                    defaultValue={editingReseller.isActive ? "true" : "false"}
                    className="w-full border rounded-md p-2"
                    data-testid="select-isActive"
                  >
                    <option value="true">Attivo</option>
                    <option value="false">Inattivo</option>
                  </select>
                </div>
              )}
              <Button type="submit" className="w-full" data-testid="button-submit">
                {editingReseller ? "Aggiorna" : "Crea"} Rivenditore
              </Button>
            </form>
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
                  <TableHead>Username</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Rivenditore Padre</TableHead>
                  <TableHead>Clienti</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResellers.map((reseller) => (
                  <TableRow key={reseller.id} data-testid={`row-reseller-${reseller.id}`}>
                    <TableCell className="font-medium" data-testid={`text-fullName-${reseller.id}`}>
                      {reseller.fullName}
                    </TableCell>
                    <TableCell data-testid={`text-email-${reseller.id}`}>{reseller.email}</TableCell>
                    <TableCell data-testid={`text-phone-${reseller.id}`}>{reseller.phone || "-"}</TableCell>
                    <TableCell data-testid={`text-username-${reseller.id}`}>{reseller.username}</TableCell>
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
                    <TableCell data-testid={`badge-status-${reseller.id}`}>
                      <Badge variant={reseller.isActive ? "default" : "secondary"}>
                        {reseller.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingReseller(reseller);
                          setSelectedCategory(reseller.resellerCategory || "standard");
                          setSelectedParentResellerId(reseller.parentResellerId || "");
                          setDialogOpen(true);
                        }}
                        data-testid={`button-edit-${reseller.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
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
