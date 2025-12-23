import { useState } from "react";
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
import { Plus, Search, Pencil, Store, Users, UsersRound, Trash2, Building2, Eye } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressAutocomplete } from "@/components/address-autocomplete";

export default function AdminResellers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReseller, setEditingReseller] = useState<Omit<User, 'password'> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("standard");
  const [selectedParentResellerId, setSelectedParentResellerId] = useState<string>("");
  const [addressData, setAddressData] = useState({ indirizzo: "", citta: "", cap: "", provincia: "" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resellerToDelete, setResellerToDelete] = useState<Omit<User, 'password'> | null>(null);
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

  const handleDeleteClick = (reseller: Omit<User, 'password'>) => {
    setResellerToDelete(reseller);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (resellerToDelete) {
      deleteResellerMutation.mutate(resellerToDelete.id);
    }
  };

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
    
    // Dati fiscali comuni
    const fiscalData = {
      ragioneSociale: formData.get("ragioneSociale") as string || null,
      partitaIva: formData.get("partitaIva") as string || null,
      codiceFiscale: formData.get("codiceFiscale") as string || null,
      indirizzo: addressData.indirizzo || null,
      citta: addressData.citta || null,
      cap: addressData.cap || null,
      provincia: addressData.provincia || null,
      iban: formData.get("iban") as string || null,
      codiceUnivoco: formData.get("codiceUnivoco") as string || null,
      pec: formData.get("pec") as string || null,
    };
    
    if (editingReseller) {
      const updates: Partial<User> = {
        fullName: formData.get("fullName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string || null,
        isActive: formData.get("isActive") === "true",
        resellerCategory: selectedCategory as any,
        parentResellerId: parentId,
        ...fiscalData,
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
            setSelectedCategory("standard");
            setSelectedParentResellerId("");
            setAddressData({ indirizzo: "", citta: "", cap: "", provincia: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingReseller(null); setSelectedCategory("standard"); setSelectedParentResellerId(""); }} data-testid="button-add-reseller">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo Rivenditore
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="dialog-reseller-form">
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
              
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Dati Fiscali</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ragioneSociale">Ragione Sociale</Label>
                    <Input 
                      id="ragioneSociale" 
                      name="ragioneSociale" 
                      defaultValue={editingReseller?.ragioneSociale || ""} 
                      data-testid="input-ragioneSociale" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partitaIva">Partita IVA</Label>
                    <Input 
                      id="partitaIva" 
                      name="partitaIva" 
                      defaultValue={editingReseller?.partitaIva || ""} 
                      data-testid="input-partitaIva" 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                    <Input 
                      id="codiceFiscale" 
                      name="codiceFiscale" 
                      defaultValue={editingReseller?.codiceFiscale || ""} 
                      data-testid="input-codiceFiscale" 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Indirizzo</Label>
                    <AddressAutocomplete
                      value={addressData.indirizzo || editingReseller?.indirizzo || ""}
                      onChange={(val) => setAddressData(prev => ({ ...prev, indirizzo: val }))}
                      onAddressSelect={(result) => {
                        setAddressData({
                          indirizzo: result.address || result.fullAddress,
                          citta: result.city,
                          cap: result.postalCode,
                          provincia: result.province,
                        });
                      }}
                      placeholder="Inizia a digitare per vedere i suggerimenti..."
                      data-testid="input-indirizzo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citta">Città</Label>
                    <Input 
                      id="citta" 
                      name="citta" 
                      value={addressData.citta || editingReseller?.citta || ""}
                      onChange={(e) => setAddressData(prev => ({ ...prev, citta: e.target.value }))}
                      data-testid="input-citta" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="cap">CAP</Label>
                      <Input 
                        id="cap" 
                        name="cap" 
                        value={addressData.cap || editingReseller?.cap || ""}
                        onChange={(e) => setAddressData(prev => ({ ...prev, cap: e.target.value }))}
                        data-testid="input-cap" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provincia">Prov.</Label>
                      <Input 
                        id="provincia" 
                        name="provincia" 
                        maxLength={2}
                        value={addressData.provincia || editingReseller?.provincia || ""}
                        onChange={(e) => setAddressData(prev => ({ ...prev, provincia: e.target.value }))}
                        placeholder="XX"
                        data-testid="input-provincia" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codiceUnivoco">Codice Univoco (SDI)</Label>
                    <Input 
                      id="codiceUnivoco" 
                      name="codiceUnivoco" 
                      maxLength={7}
                      defaultValue={editingReseller?.codiceUnivoco || ""} 
                      placeholder="7 caratteri"
                      data-testid="input-codiceUnivoco" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pec">PEC</Label>
                    <Input 
                      id="pec" 
                      name="pec" 
                      type="email"
                      defaultValue={editingReseller?.pec || ""} 
                      placeholder="email@pec.it"
                      data-testid="input-pec" 
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="iban">IBAN</Label>
                    <Input 
                      id="iban" 
                      name="iban" 
                      defaultValue={editingReseller?.iban || ""} 
                      placeholder="IT..."
                      data-testid="input-iban" 
                    />
                  </div>
                </div>
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
                  <TableHead>Centri Rip.</TableHead>
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
                        <Link href={`/admin/resellers/${reseller.id}/team`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Gestisci team"
                            data-testid={`button-team-${reseller.id}`}
                          >
                            <UsersRound className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingReseller(reseller);
                            setSelectedCategory(reseller.resellerCategory || "standard");
                            setSelectedParentResellerId(reseller.parentResellerId || "");
                            setDialogOpen(true);
                          }}
                          title="Modifica rivenditore"
                          data-testid={`button-edit-${reseller.id}`}
                        >
                          <Pencil className="h-4 w-4" />
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
    </div>
  );
}
