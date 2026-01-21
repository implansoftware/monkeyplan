import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Plus, Pencil, Trash2, Settings, AlertTriangle, Wrench } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DiagnosticFinding, DamagedComponentType, DeviceType } from "@shared/schema";

interface FormData {
  id?: string;
  name: string;
  description: string;
  category: string;
  deviceTypeId: string;
  sortOrder: number;
  isActive: boolean;
}

const defaultFormData: FormData = {
  name: "",
  description: "",
  category: "",
  deviceTypeId: "",
  sortOrder: 0,
  isActive: true,
};

export default function DiagnosisSettings() {
  const [activeTab, setActiveTab] = useState("findings");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
  const { toast } = useToast();

  const { data: findings, isLoading: findingsLoading } = useQuery<DiagnosticFinding[]>({
    queryKey: ['/api/diagnostic-findings', { activeOnly: false }],
    queryFn: async () => {
      const res = await fetch('/api/diagnostic-findings?activeOnly=false', { credentials: 'include' });
      return res.json();
    },
  });

  const { data: components, isLoading: componentsLoading } = useQuery<DamagedComponentType[]>({
    queryKey: ['/api/damaged-component-types', { activeOnly: false }],
    queryFn: async () => {
      const res = await fetch('/api/damaged-component-types?activeOnly=false', { credentials: 'include' });
      return res.json();
    },
  });

  const { data: deviceTypes } = useQuery<DeviceType[]>({
    queryKey: ['/api/device-types'],
  });

  const createFindingMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const res = await apiRequest('POST', '/api/admin/diagnostic-findings', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Problema diagnostico creato" });
      queryClient.invalidateQueries({ queryKey: ['/api/diagnostic-findings'] });
      setDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateFindingMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<FormData>) => {
      const res = await apiRequest('PATCH', `/api/admin/diagnostic-findings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Problema diagnostico aggiornato" });
      queryClient.invalidateQueries({ queryKey: ['/api/diagnostic-findings'] });
      setDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteFindingMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/diagnostic-findings/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Problema diagnostico eliminato" });
      queryClient.invalidateQueries({ queryKey: ['/api/diagnostic-findings'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createComponentMutation = useMutation({
    mutationFn: async (data: Partial<FormData>) => {
      const res = await apiRequest('POST', '/api/admin/damaged-component-types', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Componente creato" });
      queryClient.invalidateQueries({ queryKey: ['/api/damaged-component-types'] });
      setDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateComponentMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<FormData>) => {
      const res = await apiRequest('PATCH', `/api/admin/damaged-component-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Componente aggiornato" });
      queryClient.invalidateQueries({ queryKey: ['/api/damaged-component-types'] });
      setDialogOpen(false);
      setFormData(defaultFormData);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteComponentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/damaged-component-types/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Successo", description: "Componente eliminato" });
      queryClient.invalidateQueries({ queryKey: ['/api/damaged-component-types'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: DiagnosticFinding | DamagedComponentType) => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description || "",
      category: (item as DiagnosticFinding).category || "",
      deviceTypeId: item.deviceTypeId || "",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (item: DiagnosticFinding | DamagedComponentType, type: string) => {
    setItemToDelete({ id: item.id, name: item.name, type });
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name: formData.name,
      description: formData.description || null,
      category: formData.category || null,
      deviceTypeId: formData.deviceTypeId || null,
      sortOrder: formData.sortOrder,
      isActive: formData.isActive,
    };

    if (activeTab === "findings") {
      if (formData.id) {
        updateFindingMutation.mutate({ id: formData.id, ...payload });
      } else {
        createFindingMutation.mutate(payload);
      }
    } else {
      if (formData.id) {
        updateComponentMutation.mutate({ id: formData.id, ...payload });
      } else {
        createComponentMutation.mutate(payload);
      }
    }
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "findings") {
      deleteFindingMutation.mutate(itemToDelete.id);
    } else {
      deleteComponentMutation.mutate(itemToDelete.id);
    }
  };

  const getDeviceTypeName = (id: string | null) => {
    if (!id) return "Tutti";
    return deviceTypes?.find(dt => dt.id === id)?.name || id;
  };

  const isSaving = createFindingMutation.isPending || updateFindingMutation.isPending || 
                   createComponentMutation.isPending || updateComponentMutation.isPending;
  const isDeleting = deleteFindingMutation.isPending || deleteComponentMutation.isPending;

  if (findingsLoading || componentsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Impostazioni Diagnosi</h1>
              <p className="text-muted-foreground text-sm">Gestisci problemi riscontrati e componenti danneggiati</p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} data-testid="button-create">
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="findings" className="gap-2" data-testid="tab-findings">
            <AlertTriangle className="h-4 w-4" />
            Problemi Riscontrati ({findings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-2" data-testid="tab-components">
            <Wrench className="h-4 w-4" />
            Componenti Danneggiati ({components?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="findings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Problemi Diagnostici</CardTitle>
              <CardDescription>Risultati predefiniti delle diagnosi, raggruppati per categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {!findings?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nessun problema diagnostico configurato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo Dispositivo</TableHead>
                      <TableHead>Ordine</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {findings.map((finding) => (
                      <TableRow key={finding.id} data-testid={`row-finding-${finding.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{finding.name}</p>
                            {finding.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">{finding.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {finding.category ? (
                            <Badge variant="outline">{finding.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getDeviceTypeName(finding.deviceTypeId)}</TableCell>
                        <TableCell>{finding.sortOrder}</TableCell>
                        <TableCell>
                          <Badge variant={finding.isActive ? "default" : "secondary"}>
                            {finding.isActive ? "Attivo" : "Disattivato"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(finding)} data-testid={`button-edit-${finding.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleOpenDelete(finding, "findings")} data-testid={`button-delete-${finding.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Componenti Danneggiabili</CardTitle>
              <CardDescription>Lista dei componenti che possono risultare danneggiati durante la diagnosi</CardDescription>
            </CardHeader>
            <CardContent>
              {!components?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2" />
                  <p>Nessun componente configurato</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo Dispositivo</TableHead>
                      <TableHead>Ordine</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.map((component) => (
                      <TableRow key={component.id} data-testid={`row-component-${component.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{component.name}</p>
                            {component.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">{component.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getDeviceTypeName(component.deviceTypeId)}</TableCell>
                        <TableCell>{component.sortOrder}</TableCell>
                        <TableCell>
                          <Badge variant={component.isActive ? "default" : "secondary"}>
                            {component.isActive ? "Attivo" : "Disattivato"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(component)} data-testid={`button-edit-${component.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleOpenDelete(component, "components")} data-testid={`button-delete-${component.id}`}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Modifica" : "Nuovo"} {activeTab === "findings" ? "Problema Diagnostico" : "Componente"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "findings" 
                ? "I problemi diagnostici vengono mostrati durante la diagnosi delle riparazioni"
                : "I componenti vengono mostrati per indicare parti danneggiate del dispositivo"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={activeTab === "findings" ? "es. Display danneggiato" : "es. Scheda madre"}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione opzionale"
                data-testid="input-description"
              />
            </div>
            {activeTab === "findings" && (
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Connettività">Connettività</SelectItem>
                    <SelectItem value="Batteria">Batteria</SelectItem>
                    <SelectItem value="Altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="deviceType">Tipo Dispositivo</Label>
              <Select value={formData.deviceTypeId} onValueChange={(v) => setFormData({ ...formData, deviceTypeId: v })}>
                <SelectTrigger data-testid="select-device-type">
                  <SelectValue placeholder="Tutti i dispositivi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tutti i dispositivi</SelectItem>
                  {deviceTypes?.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            {formData.id && (
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  data-testid="switch-active"
                />
                <Label htmlFor="isActive">Attivo</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={!formData.name || isSaving} data-testid="button-save">
              {isSaving ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{itemToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annulla</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} data-testid="button-confirm-delete">
              {isDeleting ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
