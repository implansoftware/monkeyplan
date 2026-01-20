import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Star, 
  ArrowLeft,
  Store,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PosRegister {
  id: string;
  repairCenterId: string;
  repairCenterName?: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RepairCenter {
  id: string;
  name: string;
}

interface RegisterFormData {
  repairCenterId: string;
  name: string;
  description: string;
  isDefault: boolean;
}

export default function ResellerPosRegistersPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<PosRegister | null>(null);
  const [deleteRegister, setDeleteRegister] = useState<PosRegister | null>(null);
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [formData, setFormData] = useState<RegisterFormData>({
    repairCenterId: "",
    name: "",
    description: "",
    isDefault: false,
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: registers = [], isLoading } = useQuery<PosRegister[]>({
    queryKey: ["/api/reseller/pos/registers", centerFilter === "all" ? undefined : centerFilter],
    queryFn: async () => {
      const url = centerFilter === "all" 
        ? "/api/reseller/pos/registers"
        : `/api/reseller/pos/registers?repairCenterId=${centerFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento casse");
      return res.json();
    },
  });

  const invalidatePosQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/registers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/sessions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/transactions"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      return apiRequest("POST", "/api/reseller/pos/registers", data);
    },
    onSuccess: () => {
      invalidatePosQueries();
      toast({ title: "Cassa creata", description: "La nuova cassa è stata creata con successo" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RegisterFormData> & { isActive?: boolean } }) => {
      return apiRequest("PATCH", `/api/reseller/pos/registers/${id}`, data);
    },
    onSuccess: () => {
      invalidatePosQueries();
      toast({ title: "Cassa aggiornata", description: "Le modifiche sono state salvate" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/pos/registers/${id}`);
    },
    onSuccess: () => {
      invalidatePosQueries();
      toast({ title: "Cassa eliminata", description: "La cassa è stata eliminata" });
      setDeleteRegister(null);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
      setDeleteRegister(null);
    },
  });

  const openCreateDialog = () => {
    setEditingRegister(null);
    setFormData({ 
      repairCenterId: centerFilter !== "all" ? centerFilter : (repairCenters[0]?.id || ""),
      name: "", 
      description: "", 
      isDefault: false 
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (register: PosRegister) => {
    setEditingRegister(register);
    setFormData({
      repairCenterId: register.repairCenterId,
      name: register.name,
      description: register.description || "",
      isDefault: register.isDefault,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRegister(null);
    setFormData({ repairCenterId: "", name: "", description: "", isDefault: false });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Errore", description: "Il nome della cassa è obbligatorio", variant: "destructive" });
      return;
    }
    if (!formData.repairCenterId) {
      toast({ title: "Errore", description: "Seleziona un centro riparazione", variant: "destructive" });
      return;
    }

    if (editingRegister) {
      updateMutation.mutate({ id: editingRegister.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (register: PosRegister) => {
    updateMutation.mutate({ 
      id: register.id, 
      data: { isActive: !register.isActive } 
    });
  };

  const handleSetDefault = (register: PosRegister) => {
    if (register.isDefault) return;
    updateMutation.mutate({ 
      id: register.id, 
      data: { isDefault: true } 
    });
  };

  const handleDelete = (register: PosRegister) => {
    if (register.isDefault) {
      toast({ 
        title: "Impossibile eliminare", 
        description: "Non puoi eliminare la cassa predefinita. Imposta prima un'altra cassa come predefinita.", 
        variant: "destructive" 
      });
      return;
    }
    setDeleteRegister(register);
  };

  const confirmDelete = () => {
    if (deleteRegister) {
      deleteMutation.mutate(deleteRegister.id);
    }
  };

  const activeCount = registers.filter(r => r.isActive).length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/reseller/pos">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6" />
              Gestione Casse
            </h1>
            <p className="text-muted-foreground">
              Configura i registri di cassa dei tuoi centri riparazione
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={centerFilter} onValueChange={setCenterFilter}>
            <SelectTrigger className="w-[200px]" data-testid="select-center-filter">
              <SelectValue placeholder="Filtra per centro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i centri</SelectItem>
              {repairCenters.map(center => (
                <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {centerFilter !== "all" && (
            <Button onClick={openCreateDialog} data-testid="button-add-register">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Cassa
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Casse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Casse Attive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Casse Disattive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{registers.length - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elenco Casse</CardTitle>
          <CardDescription>
            Gestisci i registri di cassa dei centri riparazione nella tua rete
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {centerFilter === "all" ? (
                <p>Seleziona un centro riparazione per visualizzare e gestire le casse</p>
              ) : (
                <>
                  <p>Nessuna cassa configurata per questo centro</p>
                  <Button onClick={openCreateDialog} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Crea la prima cassa
                  </Button>
                </>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {centerFilter === "all" && <TableHead>Centro</TableHead>}
                  <TableHead>Descrizione</TableHead>
                  <TableHead className="text-center">Stato</TableHead>
                  <TableHead className="text-center">Predefinita</TableHead>
                  <TableHead>Creata il</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registers.map((register) => (
                  <TableRow key={register.id} data-testid={`row-register-${register.id}`}>
                    <TableCell className="font-medium">{register.name}</TableCell>
                    {centerFilter === "all" && (
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {register.repairCenterName || "-"}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {register.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {register.isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Attiva
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Disattiva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {register.isDefault ? (
                        <Badge variant="default" className="bg-amber-500">
                          <Star className="h-3 w-3 mr-1" />
                          Predefinita
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(register)}
                          disabled={updateMutation.isPending}
                          data-testid={`button-set-default-${register.id}`}
                        >
                          <Star className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(register.createdAt), "dd/MM/yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(register)}
                          data-testid={`button-edit-${register.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={register.isActive}
                          onCheckedChange={() => handleToggleActive(register)}
                          disabled={updateMutation.isPending}
                          data-testid={`switch-active-${register.id}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(register)}
                          disabled={register.isDefault || deleteMutation.isPending}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-${register.id}`}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRegister ? "Modifica Cassa" : "Nuova Cassa"}
            </DialogTitle>
            <DialogDescription>
              {editingRegister 
                ? "Modifica i dettagli della cassa selezionata"
                : "Inserisci i dati per creare una nuova cassa"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingRegister && (
              <div className="space-y-2">
                <Label htmlFor="repairCenter">Centro Riparazione *</Label>
                <Select 
                  value={formData.repairCenterId} 
                  onValueChange={(value) => setFormData({ ...formData, repairCenterId: value })}
                >
                  <SelectTrigger data-testid="select-repair-center">
                    <SelectValue placeholder="Seleziona centro" />
                  </SelectTrigger>
                  <SelectContent>
                    {repairCenters.map(center => (
                      <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome cassa *</Label>
              <Input
                id="name"
                placeholder="Es. Cassa 1, Cassa Principale..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-register-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                placeholder="Descrizione opzionale..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="input-register-description"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isDefault">Cassa predefinita</Label>
                <p className="text-sm text-muted-foreground">
                  Questa cassa verrà selezionata automaticamente
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                data-testid="switch-register-default"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
              Annulla
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-register"
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRegister} onOpenChange={() => setDeleteRegister(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Eliminare questa cassa?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare la cassa "{deleteRegister?.name}". 
              Le sessioni e transazioni associate a questa cassa rimarranno nel sistema ma non saranno più collegate ad una cassa specifica.
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Eliminazione..." : "Elimina"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
