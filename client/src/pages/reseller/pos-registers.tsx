import { useState, useEffect } from "react";
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
  Building2,
  PlayCircle,
  Settings,
  StopCircle,
  Loader2
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

interface PosSession {
  id: string;
  registerId: string | null;
  status: string;
  openedAt: string;
  operatorId: string;
}

interface RegisterWithSession extends PosRegister {
  openSession?: PosSession | null;
}

// Helper component for session cell to avoid hooks issues
function SessionCell({ 
  register, 
  session, 
  onOpenSession, 
  onCloseSession,
  isOpenPending,
  isClosePending
}: { 
  register: PosRegister; 
  session: PosSession | null;
  onOpenSession: () => void;
  onCloseSession: (session: PosSession) => void;
  isOpenPending: boolean;
  isClosePending: boolean;
}) {
  if (session) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Badge variant="default" className="bg-green-500">
          <PlayCircle className="h-3 w-3 mr-1" />
          Aperta
        </Badge>
        <div className="flex gap-1">
          <Link href={`/reseller/pos/terminal/${register.repairCenterId}/${register.id}`}>
            <Button
              variant="default"
              size="sm"
              className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              data-testid={`button-enter-session-${register.id}`}
            >
              <PlayCircle className="h-3 w-3 mr-1" />
              Entra
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCloseSession(session)}
            disabled={isClosePending}
            className="text-xs"
            data-testid={`button-close-session-${register.id}`}
          >
            <StopCircle className="h-3 w-3 mr-1" />
            Chiudi
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center gap-1">
      <Badge variant="secondary">
        <StopCircle className="h-3 w-3 mr-1" />
        Chiusa
      </Badge>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenSession}
        disabled={!register.isActive || isOpenPending}
        className="text-xs"
        data-testid={`button-open-session-${register.id}`}
      >
        <PlayCircle className="h-3 w-3 mr-1" />
        Apri
      </Button>
    </div>
  );
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
  
  // State for session dialogs
  const [openSessionDialog, setOpenSessionDialog] = useState<{ register: PosRegister; open: boolean }>({ register: null as any, open: false });
  const [closeSessionDialog, setCloseSessionDialog] = useState<{ session: PosSession; register: PosRegister; open: boolean }>({ session: null as any, register: null as any, open: false });
  const [openingCash, setOpeningCash] = useState<string>("");
  const [openingNotes, setOpeningNotes] = useState<string>("");
  const [closingCash, setClosingCash] = useState<string>("");
  const [closingNotes, setClosingNotes] = useState<string>("");
  
  // Map to track open sessions per register
  const [sessionsByRegister, setSessionsByRegister] = useState<Map<string, PosSession | null>>(new Map());

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

  // Open session mutation
  const openSessionMutation = useMutation({
    mutationFn: async ({ repairCenterId, registerId, openingCash, openingNotes }: { repairCenterId: string; registerId: string; openingCash?: number; openingNotes?: string }) => {
      return apiRequest("POST", "/api/reseller/pos/session/open", { repairCenterId, registerId, openingCash, openingNotes });
    },
    onSuccess: (session) => {
      invalidatePosQueries();
      toast({ title: "Cassa aperta", description: "La sessione cassa è stata aperta con successo" });
      setOpenSessionDialog({ register: null as any, open: false });
      setOpeningCash("");
      setOpeningNotes("");
      // Refresh session data
      if (openSessionDialog.register) {
        fetchSessionForRegister(openSessionDialog.register.id);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Close session mutation
  const closeSessionMutation = useMutation({
    mutationFn: async ({ sessionId, closingCash, closingNotes }: { sessionId: string; closingCash: number; closingNotes?: string }) => {
      return apiRequest("POST", `/api/reseller/pos/session/${sessionId}/close`, { closingCash, closingNotes });
    },
    onSuccess: () => {
      invalidatePosQueries();
      toast({ title: "Cassa chiusa", description: "La sessione cassa è stata chiusa con successo" });
      setCloseSessionDialog({ session: null as any, register: null as any, open: false });
      setClosingCash("");
      setClosingNotes("");
      // Refresh session data
      if (closeSessionDialog.register) {
        fetchSessionForRegister(closeSessionDialog.register.id);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Fetch session status for a register
  const fetchSessionForRegister = async (registerId: string) => {
    try {
      const res = await fetch(`/api/reseller/pos/register/${registerId}/session`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSessionsByRegister(prev => new Map(prev).set(registerId, data.session));
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  // Fetch sessions for all registers when data changes
  const fetchAllSessions = async () => {
    for (const register of registers) {
      await fetchSessionForRegister(register.id);
    }
  };

  // Effect to fetch sessions when registers change
  useEffect(() => {
    if (registers.length > 0) {
      fetchAllSessions();
    }
  }, [registers]);

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
      {/* Hero Header - Modern Glass Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/reseller/pos">
              <Button variant="ghost" size="icon" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Gestione Casse
              </h1>
              <p className="text-sm text-white/80">
                Configura i registri di cassa dei tuoi centri riparazione
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={centerFilter} onValueChange={setCenterFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-white/20 backdrop-blur-sm border-white/30 text-white" data-testid="select-center-filter">
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
              <Button onClick={openCreateDialog} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg" data-testid="button-add-register">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Cassa
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale Casse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registers.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Casse Attive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Casse Disattive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{registers.length - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
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
                  <TableHead className="text-center">Sessione</TableHead>
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
                        <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
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
                    <TableCell className="text-center">
                      <SessionCell
                        register={register}
                        session={sessionsByRegister.get(register.id) || null}
                        onOpenSession={() => {
                          setOpenSessionDialog({ register, open: true });
                          setOpeningCash("");
                          setOpeningNotes("");
                        }}
                        onCloseSession={(session) => {
                          setCloseSessionDialog({ session, register, open: true });
                          setClosingCash("");
                          setClosingNotes("");
                        }}
                        isOpenPending={openSessionMutation.isPending}
                        isClosePending={closeSessionMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(register.createdAt), "dd/MM/yyyy", { locale: it })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/reseller/pos/registers/${register.id}/settings`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-settings-${register.id}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </Link>
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
            <AlertDialogTitle className="flex flex-wrap items-center gap-2">
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

      {/* Dialog Apertura Cassa */}
      <Dialog open={openSessionDialog.open} onOpenChange={(open) => !open && setOpenSessionDialog({ register: null as any, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <PlayCircle className="h-5 w-5 text-green-500" />
              Apri Cassa
            </DialogTitle>
            <DialogDescription>
              Stai per aprire una sessione per la cassa "{openSessionDialog.register?.name}" 
              {openSessionDialog.register?.repairCenterName && ` del centro ${openSessionDialog.register.repairCenterName}`}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="openingCash">Fondo cassa iniziale (€)</Label>
              <Input
                id="openingCash"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                data-testid="input-opening-cash"
              />
              <p className="text-sm text-muted-foreground">
                Lascia vuoto per usare il saldo della sessione precedente
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingNotes">Note apertura</Label>
              <Textarea
                id="openingNotes"
                placeholder="Note opzionali..."
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                rows={2}
                data-testid="input-opening-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSessionDialog({ register: null as any, open: false })} data-testid="button-cancel-open">
              Annulla
            </Button>
            <Button 
              onClick={() => {
                if (openSessionDialog.register) {
                  openSessionMutation.mutate({
                    repairCenterId: openSessionDialog.register.repairCenterId,
                    registerId: openSessionDialog.register.id,
                    openingCash: openingCash ? Math.round(parseFloat(openingCash) * 100) : undefined,
                    openingNotes: openingNotes || undefined,
                  });
                }
              }}
              disabled={openSessionMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
              data-testid="button-confirm-open"
            >
              {openSessionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Apertura...
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Apri Cassa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Chiusura Cassa */}
      <Dialog open={closeSessionDialog.open} onOpenChange={(open) => !open && setCloseSessionDialog({ session: null as any, register: null as any, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <StopCircle className="h-5 w-5 text-red-500" />
              Chiudi Cassa
            </DialogTitle>
            <DialogDescription>
              Stai per chiudere la sessione della cassa "{closeSessionDialog.register?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="closingCash">Conteggio cassa finale (€) *</Label>
              <Input
                id="closingCash"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                data-testid="input-closing-cash"
              />
              <p className="text-sm text-muted-foreground">
                Inserisci l'importo effettivo in cassa
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingNotes">Note chiusura</Label>
              <Textarea
                id="closingNotes"
                placeholder="Note opzionali..."
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                rows={2}
                data-testid="input-closing-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseSessionDialog({ session: null as any, register: null as any, open: false })} data-testid="button-cancel-close">
              Annulla
            </Button>
            <Button 
              onClick={() => {
                if (closeSessionDialog.session && closingCash) {
                  closeSessionMutation.mutate({
                    sessionId: closeSessionDialog.session.id,
                    closingCash: Math.round(parseFloat(closingCash) * 100),
                    closingNotes: closingNotes || undefined,
                  });
                }
              }}
              disabled={closeSessionMutation.isPending || !closingCash}
              variant="destructive"
              data-testid="button-confirm-close"
            >
              {closeSessionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chiusura...
                </>
              ) : (
                <>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Chiudi Cassa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
