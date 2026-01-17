import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AlertTriangle, Plus, Pencil, Trash2, GripVertical, Filter } from "lucide-react";
import type { UnrepairableReason, DeviceType } from "@shared/schema";

export default function AdminUnrepairableReasons() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<UnrepairableReason | null>(null);
  const [filterDeviceTypeId, setFilterDeviceTypeId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deviceTypeId: "",
    isActive: true,
    sortOrder: 0,
  });

  const queryUrl = `/api/unrepairable-reasons?activeOnly=false${filterDeviceTypeId ? `&deviceTypeId=${filterDeviceTypeId}` : ''}`;

  const { data: reasons = [], isLoading } = useQuery<UnrepairableReason[]>({
    queryKey: [queryUrl],
  });

  const { data: deviceTypes = [] } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const invalidateReasonQueries = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && key.startsWith("/api/unrepairable-reasons");
      },
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/unrepairable-reasons", {
        ...data,
        deviceTypeId: data.deviceTypeId || null,
      });
    },
    onSuccess: () => {
      invalidateReasonQueries();
      toast({ title: "Motivo creato", description: "Il motivo è stato aggiunto con successo" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/unrepairable-reasons/${id}`, {
        ...data,
        deviceTypeId: data.deviceTypeId === "" ? null : data.deviceTypeId,
      });
    },
    onSuccess: () => {
      invalidateReasonQueries();
      toast({ title: "Motivo aggiornato", description: "Le modifiche sono state salvate" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/unrepairable-reasons/${id}`, { isActive });
    },
    onSuccess: () => {
      invalidateReasonQueries();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/unrepairable-reasons/${id}`);
    },
    onSuccess: () => {
      invalidateReasonQueries();
      toast({ title: "Motivo eliminato", description: "Il motivo è stato rimosso" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    },
  });

  const openCreateDialog = () => {
    setEditingReason(null);
    setFormData({
      name: "",
      description: "",
      deviceTypeId: "",
      isActive: true,
      sortOrder: reasons.length + 1,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (reason: UnrepairableReason) => {
    setEditingReason(reason);
    setFormData({
      name: reason.name,
      description: reason.description || "",
      deviceTypeId: reason.deviceTypeId || "",
      isActive: reason.isActive,
      sortOrder: reason.sortOrder,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingReason(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Errore", description: "Il nome è obbligatorio" });
      return;
    }
    if (editingReason) {
      updateMutation.mutate({ id: editingReason.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (reason: UnrepairableReason) => {
    toggleActiveMutation.mutate({ id: reason.id, isActive: !reason.isActive });
  };

  const getDeviceTypeName = (deviceTypeId: string | null) => {
    if (!deviceTypeId) return null;
    const dt = deviceTypes.find((d) => d.id === deviceTypeId);
    return dt?.name || deviceTypeId;
  };

  const sortedReasons = [...reasons].sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <h1 className="text-2xl font-bold">Motivi Irriparabilità</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">Motivi Irriparabilità</h1>
            <p className="text-muted-foreground">
              Gestisci i motivi per cui un dispositivo può essere dichiarato irriparabile
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-reason">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Motivo
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Elenco Motivi ({reasons.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterDeviceTypeId}
              onValueChange={setFilterDeviceTypeId}
            >
              <SelectTrigger className="w-[200px]" data-testid="filter-device-type">
                <SelectValue placeholder="Tutti i tipi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutti i tipi</SelectItem>
                {deviceTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Tipo Dispositivo</TableHead>
                <TableHead>Attivo</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReasons.map((reason) => (
                <TableRow key={reason.id} data-testid={`row-reason-${reason.id}`}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{reason.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {reason.description || "-"}
                  </TableCell>
                  <TableCell>
                    {reason.deviceTypeId ? (
                      <Badge variant="outline">{getDeviceTypeName(reason.deviceTypeId)}</Badge>
                    ) : (
                      <Badge variant="secondary">Universale</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={reason.isActive}
                      onCheckedChange={() => handleToggleActive(reason)}
                      disabled={toggleActiveMutation.isPending}
                      data-testid={`switch-active-${reason.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(reason)}
                        data-testid={`button-edit-reason-${reason.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questo motivo?")) {
                            deleteMutation.mutate(reason.id);
                          }
                        }}
                        data-testid={`button-delete-reason-${reason.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {reasons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nessun motivo configurato. Clicca "Nuovo Motivo" per aggiungerne uno.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReason ? "Modifica Motivo" : "Nuovo Motivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="es. Ossidazione Diffusa"
                data-testid="input-reason-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione opzionale del motivo..."
                rows={2}
                data-testid="textarea-reason-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceType">Tipo Dispositivo</Label>
              <Select
                value={formData.deviceTypeId}
                onValueChange={(v) => setFormData({ ...formData, deviceTypeId: v })}
              >
                <SelectTrigger data-testid="select-device-type">
                  <SelectValue placeholder="Universale (tutti i dispositivi)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Universale (tutti i dispositivi)</SelectItem>
                  {deviceTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Se selezioni un tipo specifico, questo motivo sarà visibile solo per quel tipo di dispositivo.
                Lascia "Universale" per renderlo disponibile per tutti.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Ordine di visualizzazione</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                data-testid="input-sort-order"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">Attivo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-reason"
            >
              {editingReason ? "Salva Modifiche" : "Crea Motivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
