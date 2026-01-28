import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertCircle, Plus, Pencil, Trash2, Settings, AlertTriangle, Wrench } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DiagnosticFinding, DamagedComponentType, DeviceType } from "@shared/schema";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nome richiesto"),
  description: z.string().optional(),
  category: z.string().optional(),
  deviceTypeId: z.string().optional(),
  sortOrder: z.number().default(0),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export default function DiagnosisSettings() {
  const [activeTab, setActiveTab] = useState("findings");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      deviceTypeId: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  const { data: findings, isLoading: findingsLoading } = useQuery<DiagnosticFinding[]>({
    queryKey: ['/api/admin/diagnostic-findings'],
  });

  const { data: components, isLoading: componentsLoading } = useQuery<DamagedComponentType[]>({
    queryKey: ['/api/admin/damaged-component-types'],
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagnostic-findings'] });
      setDialogOpen(false);
      form.reset();
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagnostic-findings'] });
      setDialogOpen(false);
      form.reset();
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/diagnostic-findings'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/damaged-component-types'] });
      setDialogOpen(false);
      form.reset();
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/damaged-component-types'] });
      setDialogOpen(false);
      form.reset();
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/damaged-component-types'] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    form.reset({
      name: "",
      description: "",
      category: "",
      deviceTypeId: "__all__",
      sortOrder: 0,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: DiagnosticFinding | DamagedComponentType) => {
    form.reset({
      id: item.id,
      name: item.name,
      description: item.description || "",
      category: (item as DiagnosticFinding).category || "",
      deviceTypeId: item.deviceTypeId || "__all__",
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (item: DiagnosticFinding | DamagedComponentType, type: string) => {
    setItemToDelete({ id: item.id, name: item.name, type });
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: FormData) => {
    const payload = {
      name: data.name,
      description: data.description || undefined,
      category: data.category || undefined,
      deviceTypeId: data.deviceTypeId === "__all__" ? undefined : (data.deviceTypeId || undefined),
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    };

    if (activeTab === "findings") {
      if (data.id) {
        updateFindingMutation.mutate({ id: data.id, ...payload });
      } else {
        createFindingMutation.mutate(payload);
      }
    } else {
      if (data.id) {
        updateComponentMutation.mutate({ id: data.id, ...payload });
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
          <div className="flex flex-wrap items-center gap-4">
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
              {form.watch("id") ? "Modifica" : "Nuovo"} {activeTab === "findings" ? "Problema Diagnostico" : "Componente"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "findings" 
                ? "I problemi diagnostici vengono mostrati durante la diagnosi delle riparazioni"
                : "I componenti vengono mostrati per indicare parti danneggiate del dispositivo"
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={activeTab === "findings" ? "es. Display danneggiato" : "es. Scheda madre"}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Descrizione opzionale"
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {activeTab === "findings" && (
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-category">
                            <SelectValue placeholder="Seleziona categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Hardware">Hardware</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="Connettività">Connettività</SelectItem>
                          <SelectItem value="Batteria">Batteria</SelectItem>
                          <SelectItem value="Altro">Altro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="deviceTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Dispositivo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-device-type">
                          <SelectValue placeholder="Tutti i dispositivi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__all__">Tutti i dispositivi</SelectItem>
                        {deviceTypes?.map((dt) => (
                          <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordine di visualizzazione</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-sort-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("id") && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-wrap items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-active"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Attivo</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
                <Button type="submit" disabled={isSaving} data-testid="button-save">
                  {isSaving ? "Salvataggio..." : "Salva"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
