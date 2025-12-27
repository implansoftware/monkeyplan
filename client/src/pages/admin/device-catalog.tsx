import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Smartphone, Tablet, Laptop, Monitor, Tv, Watch, Gamepad2, Headphones, Printer,
  Plus, Pencil, Trash2, Loader2, Search, ChevronRight, ChevronDown, Building2, Package, Warehouse, CheckCircle2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";

const DEVICE_TYPE_ICONS: Record<string, any> = {
  smartphone: Smartphone,
  tablet: Tablet,
  laptop: Laptop,
  desktop: Monitor,
  pc: Monitor,
  tv: Tv,
  console: Gamepad2,
  smartwatch: Watch,
  cuffie: Headphones,
  stampante: Printer,
};

export default function AdminDeviceCatalog() {
  const [activeTab, setActiveTab] = useState("types");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DeviceType | null>(null);
  const [typeForm, setTypeForm] = useState({ name: "", description: "" });
  const [deleteTypeDialogOpen, setDeleteTypeDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<DeviceType | null>(null);

  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<DeviceBrand | null>(null);
  const [brandForm, setBrandForm] = useState({ name: "", logoUrl: "" });
  const [deleteBrandDialogOpen, setDeleteBrandDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<DeviceBrand | null>(null);

  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null);
  const [modelForm, setModelForm] = useState({ modelName: "", brandId: "", typeId: "", marketCode: "" });
  const [deleteModelDialogOpen, setDeleteModelDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<DeviceModel | null>(null);
  const [modelBrandFilter, setModelBrandFilter] = useState<string>("all");
  const [modelTypeFilter, setModelTypeFilter] = useState<string>("all");

  const { data: deviceTypes = [], isLoading: loadingTypes } = useQuery<DeviceType[]>({
    queryKey: ["/api/admin/device-types"],
  });

  const { data: deviceBrands = [], isLoading: loadingBrands } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/admin/device-brands"],
  });

  const { data: deviceModels = [], isLoading: loadingModels } = useQuery<DeviceModel[]>({
    queryKey: ["/api/admin/device-models"],
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      return apiRequest("POST", "/api/admin/device-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-types"] });
      setTypeDialogOpen(false);
      setTypeForm({ name: "", description: "" });
      toast({ title: "Tipo creato", description: "Il tipo dispositivo è stato creato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeviceType> }) => {
      return apiRequest("PATCH", `/api/admin/device-types/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-types"] });
      setTypeDialogOpen(false);
      setEditingType(null);
      setTypeForm({ name: "", description: "" });
      toast({ title: "Tipo aggiornato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/device-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-types"] });
      setDeleteTypeDialogOpen(false);
      setTypeToDelete(null);
      toast({ title: "Tipo eliminato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleTypeActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/device-types/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-types"] });
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async (data: { name: string; logoUrl?: string }) => {
      return apiRequest("POST", "/api/admin/device-brands", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
      setBrandDialogOpen(false);
      setBrandForm({ name: "", logoUrl: "" });
      toast({ title: "Marca creata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeviceBrand> }) => {
      return apiRequest("PATCH", `/api/admin/device-brands/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
      setBrandDialogOpen(false);
      setEditingBrand(null);
      setBrandForm({ name: "", logoUrl: "" });
      toast({ title: "Marca aggiornata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/device-brands/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
      setDeleteBrandDialogOpen(false);
      setBrandToDelete(null);
      toast({ title: "Marca eliminata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleBrandActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/device-brands/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (data: { modelName: string; brandId?: string; typeId?: string; marketCode?: string }) => {
      return apiRequest("POST", "/api/admin/device-models", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      setModelDialogOpen(false);
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCode: "" });
      toast({ title: "Modello creato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeviceModel> }) => {
      return apiRequest("PATCH", `/api/admin/device-models/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      setModelDialogOpen(false);
      setEditingModel(null);
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCode: "" });
      toast({ title: "Modello aggiornato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/device-models/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      setDeleteModelDialogOpen(false);
      setModelToDelete(null);
      toast({ title: "Modello eliminato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleModelActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/device-models/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
    },
  });

  // Query for products to check which models are already provisioned
  const { data: products = [] } = useQuery<Array<{ id: string; deviceModelId?: string | null }>>({
    queryKey: ["/api/products"],
  });

  // Set of device model IDs that have been provisioned
  const provisionedModelIds = new Set(products.filter(p => p.deviceModelId).map(p => p.deviceModelId));

  // Mutation for provisioning a device model as warehouse product
  const provisionModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await apiRequest("POST", `/api/admin/device-models/${modelId}/provision`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ 
        title: "Modello attivato a magazzino", 
        description: data.message || `Prodotto creato con ${data.warehousesSeeded} magazzini inizializzati`
      });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const openTypeDialog = (type?: DeviceType) => {
    if (type) {
      setEditingType(type);
      setTypeForm({ name: type.name, description: type.description || "" });
    } else {
      setEditingType(null);
      setTypeForm({ name: "", description: "" });
    }
    setTypeDialogOpen(true);
  };

  const openBrandDialog = (brand?: DeviceBrand) => {
    if (brand) {
      setEditingBrand(brand);
      setBrandForm({ name: brand.name, logoUrl: brand.logoUrl || "" });
    } else {
      setEditingBrand(null);
      setBrandForm({ name: "", logoUrl: "" });
    }
    setBrandDialogOpen(true);
  };

  const openModelDialog = (model?: DeviceModel) => {
    if (model) {
      setEditingModel(model);
      setModelForm({ 
        modelName: model.modelName, 
        brandId: model.brandId || "", 
        typeId: model.typeId || "",
        marketCode: model.marketCode || ""
      });
    } else {
      setEditingModel(null);
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCode: "" });
    }
    setModelDialogOpen(true);
  };

  const filteredTypes = deviceTypes.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBrands = deviceBrands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredModels = deviceModels.filter(m => {
    const matchesSearch = m.modelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = modelBrandFilter === "all" || m.brandId === modelBrandFilter;
    const matchesType = modelTypeFilter === "all" || m.typeId === modelTypeFilter;
    return matchesSearch && matchesBrand && matchesType;
  });

  const getTypeIcon = (typeName: string) => {
    const key = typeName.toLowerCase();
    const Icon = DEVICE_TYPE_ICONS[key] || Smartphone;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catalogo Dispositivi</h1>
          <p className="text-muted-foreground">Gestisci tipi, marche e modelli di dispositivi</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-catalog"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="types" data-testid="tab-types">
                <Package className="h-4 w-4 mr-2" />
                Tipi ({deviceTypes.length})
              </TabsTrigger>
              <TabsTrigger value="brands" data-testid="tab-brands">
                <Building2 className="h-4 w-4 mr-2" />
                Marche ({deviceBrands.length})
              </TabsTrigger>
              <TabsTrigger value="models" data-testid="tab-models">
                <Smartphone className="h-4 w-4 mr-2" />
                Modelli ({deviceModels.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="types">
              <div className="flex justify-end mb-4">
                <Button onClick={() => openTypeDialog()} data-testid="button-add-type">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Tipo
                </Button>
              </div>
              {loadingTypes ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTypes.map(type => (
                      <TableRow key={type.id} data-testid={`row-type-${type.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(type.name)}
                            <span className="font-medium">{type.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {type.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={type.isActive}
                            onCheckedChange={(checked) => 
                              toggleTypeActiveMutation.mutate({ id: type.id, isActive: checked })
                            }
                            data-testid={`switch-type-active-${type.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => openTypeDialog(type)}
                              data-testid={`button-edit-type-${type.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                setTypeToDelete(type);
                                setDeleteTypeDialogOpen(true);
                              }}
                              data-testid={`button-delete-type-${type.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredTypes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nessun tipo trovato
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="brands">
              <div className="flex justify-end mb-4">
                <Button onClick={() => openBrandDialog()} data-testid="button-add-brand">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuova Marca
                </Button>
              </div>
              {loadingBrands ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Logo URL</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map(brand => (
                      <TableRow key={brand.id} data-testid={`row-brand-${brand.id}`}>
                        <TableCell>
                          <span className="font-medium">{brand.name}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {brand.logoUrl || "-"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={brand.isActive}
                            onCheckedChange={(checked) => 
                              toggleBrandActiveMutation.mutate({ id: brand.id, isActive: checked })
                            }
                            data-testid={`switch-brand-active-${brand.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => openBrandDialog(brand)}
                              data-testid={`button-edit-brand-${brand.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={() => {
                                setBrandToDelete(brand);
                                setDeleteBrandDialogOpen(true);
                              }}
                              data-testid={`button-delete-brand-${brand.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredBrands.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nessuna marca trovata
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="models">
              <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Select value={modelTypeFilter} onValueChange={setModelTypeFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-model-type-filter">
                      <SelectValue placeholder="Filtra per tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tipi</SelectItem>
                      {deviceTypes.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={modelBrandFilter} onValueChange={setModelBrandFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-model-brand-filter">
                      <SelectValue placeholder="Filtra per marca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le marche</SelectItem>
                      {deviceBrands.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => openModelDialog()} data-testid="button-add-model">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Modello
                </Button>
              </div>
              {loadingModels ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modello</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Codice</TableHead>
                        <TableHead>Magazzino</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModels.map(model => {
                        const brand = deviceBrands.find(b => b.id === model.brandId);
                        const type = deviceTypes.find(t => t.id === model.typeId);
                        return (
                          <TableRow key={model.id} data-testid={`row-model-${model.id}`}>
                            <TableCell>
                              <span className="font-medium">{model.modelName}</span>
                            </TableCell>
                            <TableCell>
                              {brand?.name || model.brand || "-"}
                            </TableCell>
                            <TableCell>
                              {type?.name || model.deviceClass || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {model.marketCode || "-"}
                            </TableCell>
                            <TableCell>
                              {provisionedModelIds.has(model.id) ? (
                                <Badge variant="secondary" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Attivo
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => provisionModelMutation.mutate(model.id)}
                                  disabled={provisionModelMutation.isPending}
                                  data-testid={`button-provision-model-${model.id}`}
                                >
                                  {provisionModelMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Warehouse className="h-4 w-4 mr-1" />
                                      Attiva
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={model.isActive}
                                onCheckedChange={(checked) => 
                                  toggleModelActiveMutation.mutate({ id: model.id, isActive: checked })
                                }
                                data-testid={`switch-model-active-${model.id}`}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => openModelDialog(model)}
                                  data-testid={`button-edit-model-${model.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost"
                                  onClick={() => {
                                    setModelToDelete(model);
                                    setDeleteModelDialogOpen(true);
                                  }}
                                  data-testid={`button-delete-model-${model.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredModels.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Nessun modello trovato
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? "Modifica Tipo" : "Nuovo Tipo Dispositivo"}</DialogTitle>
            <DialogDescription>
              {editingType ? "Modifica i dettagli del tipo dispositivo" : "Crea un nuovo tipo di dispositivo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type-name">Nome *</Label>
              <Input
                id="type-name"
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="es. Smartphone, Tablet, Laptop..."
                data-testid="input-type-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type-description">Descrizione</Label>
              <Input
                id="type-description"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                placeholder="Descrizione opzionale"
                data-testid="input-type-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (editingType) {
                  updateTypeMutation.mutate({ id: editingType.id, data: typeForm });
                } else {
                  createTypeMutation.mutate(typeForm);
                }
              }}
              disabled={!typeForm.name || createTypeMutation.isPending || updateTypeMutation.isPending}
              data-testid="button-save-type"
            >
              {(createTypeMutation.isPending || updateTypeMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingType ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTypeDialogOpen} onOpenChange={setDeleteTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina Tipo</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il tipo "{typeToDelete?.name}"? 
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTypeDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => typeToDelete && deleteTypeMutation.mutate(typeToDelete.id)}
              disabled={deleteTypeMutation.isPending}
              data-testid="button-confirm-delete-type"
            >
              {deleteTypeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Modifica Marca" : "Nuova Marca"}</DialogTitle>
            <DialogDescription>
              {editingBrand ? "Modifica i dettagli della marca" : "Crea una nuova marca di dispositivi"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Nome *</Label>
              <Input
                id="brand-name"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                placeholder="es. Apple, Samsung, Huawei..."
                data-testid="input-brand-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo URL</Label>
              <Input
                id="brand-logo"
                value={brandForm.logoUrl}
                onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-brand-logo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (editingBrand) {
                  updateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
                } else {
                  createBrandMutation.mutate(brandForm);
                }
              }}
              disabled={!brandForm.name || createBrandMutation.isPending || updateBrandMutation.isPending}
              data-testid="button-save-brand"
            >
              {(createBrandMutation.isPending || updateBrandMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingBrand ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteBrandDialogOpen} onOpenChange={setDeleteBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina Marca</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare la marca "{brandToDelete?.name}"? 
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBrandDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => brandToDelete && deleteBrandMutation.mutate(brandToDelete.id)}
              disabled={deleteBrandMutation.isPending}
              data-testid="button-confirm-delete-brand"
            >
              {deleteBrandMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? "Modifica Modello" : "Nuovo Modello"}</DialogTitle>
            <DialogDescription>
              {editingModel ? "Modifica i dettagli del modello" : "Crea un nuovo modello di dispositivo"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">Nome Modello *</Label>
              <Input
                id="model-name"
                value={modelForm.modelName}
                onChange={(e) => setModelForm({ ...modelForm, modelName: e.target.value })}
                placeholder="es. iPhone 15 Pro, Galaxy S24..."
                data-testid="input-model-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-brand">Marca</Label>
              <Select 
                value={modelForm.brandId} 
                onValueChange={(v) => setModelForm({ ...modelForm, brandId: v })}
              >
                <SelectTrigger data-testid="select-model-brand">
                  <SelectValue placeholder="Seleziona marca" />
                </SelectTrigger>
                <SelectContent>
                  {deviceBrands.filter(b => b.isActive).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-type">Tipo Dispositivo</Label>
              <Select 
                value={modelForm.typeId} 
                onValueChange={(v) => setModelForm({ ...modelForm, typeId: v })}
              >
                <SelectTrigger data-testid="select-model-type">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.filter(t => t.isActive).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-code">Codice Mercato</Label>
              <Input
                id="model-code"
                value={modelForm.marketCode}
                onChange={(e) => setModelForm({ ...modelForm, marketCode: e.target.value })}
                placeholder="es. A2894, SM-S921B..."
                data-testid="input-model-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModelDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                const payload: any = { modelName: modelForm.modelName };
                if (modelForm.brandId) payload.brandId = modelForm.brandId;
                if (modelForm.typeId) payload.typeId = modelForm.typeId;
                if (modelForm.marketCode) payload.marketCode = modelForm.marketCode;
                
                if (editingModel) {
                  updateModelMutation.mutate({ id: editingModel.id, data: payload });
                } else {
                  createModelMutation.mutate(payload);
                }
              }}
              disabled={!modelForm.modelName || createModelMutation.isPending || updateModelMutation.isPending}
              data-testid="button-save-model"
            >
              {(createModelMutation.isPending || updateModelMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingModel ? "Salva" : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModelDialogOpen} onOpenChange={setDeleteModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina Modello</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare il modello "{modelToDelete?.modelName}"? 
              Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModelDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => modelToDelete && deleteModelMutation.mutate(modelToDelete.id)}
              disabled={deleteModelMutation.isPending}
              data-testid="button-confirm-delete-model"
            >
              {deleteModelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
