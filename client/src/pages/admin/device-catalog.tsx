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
  Plus, Pencil, Trash2, Loader2, Search, ChevronRight, ChevronDown, Building2, Package, X, FileUp, CheckCircle2, AlertCircle
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
  const [modelForm, setModelForm] = useState({ modelName: "", brandId: "", typeId: "", marketCodes: [] as string[] });
  const [newMarketCode, setNewMarketCode] = useState("");
  const [deleteModelDialogOpen, setDeleteModelDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<DeviceModel | null>(null);
  const [modelBrandFilter, setModelBrandFilter] = useState<string>("all");
  const [modelTypeFilter, setModelTypeFilter] = useState<string>("all");

  // Excel import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number; errors: string[] } | null>(null);

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
    mutationFn: async (data: { modelName: string; brandId?: string; typeId?: string; marketCodes?: string[] }) => {
      return apiRequest("POST", "/api/admin/device-models", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      setModelDialogOpen(false);
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCodes: [] });
      setNewMarketCode("");
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
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCodes: [] });
      setNewMarketCode("");
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
        marketCodes: model.marketCodes || []
      });
    } else {
      setEditingModel(null);
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCodes: [] });
    }
    setNewMarketCode("");
    setModelDialogOpen(true);
  };


  const handleImportExcel = async () => {
    if (!importFile) return;
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      
      const response = await fetch("/api/admin/device-models/import-excel", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Errore durante import");
      }
      
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
      
      if (result.imported > 0 || result.updated > 0) {
        toast({
          title: "Importazione completata",
          description: "Importati: " + result.imported + ", Aggiornati: " + result.updated + (result.skipped > 0 ? ", Saltati: " + result.skipped : "")
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.message
      });
    } finally {
      setImporting(false);
    }
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Catalogo Dispositivi</h1>
              <p className="text-sm text-muted-foreground">Gestisci tipi, marche e modelli di dispositivi</p>
            </div>
          </div>
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setImportDialogOpen(true)} data-testid="button-import-excel">
                    <FileUp className="h-4 w-4 mr-2" />
                    Importa Excel
                  </Button>
                  <Button onClick={() => openModelDialog()} data-testid="button-add-model">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Modello
                  </Button>
                </div>
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
                        <TableHead>Codice Mercato</TableHead>
                        <TableHead>Modello</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Tipo</TableHead>
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
                            <TableCell className="text-muted-foreground">
                              {model.marketCodes && model.marketCodes.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {model.marketCodes.slice(0, 3).map((code, idx) => (
                                    <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted">
                                      {code}
                                    </span>
                                  ))}
                                  {model.marketCodes.length > 3 && (
                                    <span className="text-xs text-muted-foreground">+{model.marketCodes.length - 3}</span>
                                  )}
                                </div>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{model.modelName}</span>
                            </TableCell>
                            <TableCell>
                              {brand?.name || model.brand || "-"}
                            </TableCell>
                            <TableCell>
                              {type?.name || model.deviceClass || "-"}
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
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
              <Label>Codici Mercato</Label>
              {modelForm.marketCodes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {modelForm.marketCodes.map((code, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm bg-muted"
                    >
                      {code}
                      <button
                        type="button"
                        onClick={() => setModelForm({
                          ...modelForm,
                          marketCodes: modelForm.marketCodes.filter((_, i) => i !== idx)
                        })}
                        className="hover:text-destructive"
                        data-testid={`button-remove-code-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="model-code"
                  value={newMarketCode}
                  onChange={(e) => setNewMarketCode(e.target.value.toUpperCase())}
                  placeholder="es. A2894, SM-S921B..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newMarketCode.trim()) {
                      e.preventDefault();
                      if (!modelForm.marketCodes.includes(newMarketCode.trim())) {
                        setModelForm({
                          ...modelForm,
                          marketCodes: [...modelForm.marketCodes, newMarketCode.trim()]
                        });
                      }
                      setNewMarketCode("");
                    }
                  }}
                  data-testid="input-model-code"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (newMarketCode.trim() && !modelForm.marketCodes.includes(newMarketCode.trim())) {
                      setModelForm({
                        ...modelForm,
                        marketCodes: [...modelForm.marketCodes, newMarketCode.trim()]
                      });
                      setNewMarketCode("");
                    }
                  }}
                  disabled={!newMarketCode.trim()}
                  data-testid="button-add-code"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Premi Invio o + per aggiungere un codice</p>
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
                if (modelForm.marketCodes.length > 0) payload.marketCodes = modelForm.marketCodes;
                
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

      {/* Import Excel Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        setImportDialogOpen(open);
        if (!open) {
          setImportFile(null);
          setImportResult(null);
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importa Dispositivi da Excel</DialogTitle>
            <DialogDescription>
              Carica un file Excel con colonne: BRAND, Tipo Dispositivo, Modello Commerciale, Modello Market
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>File Excel (.xlsx)</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  setImportFile(e.target.files?.[0] || null);
                  setImportResult(null);
                }}
                data-testid="input-import-file"
              />
            </div>
            
            {importResult && (
              <div className="space-y-2 p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Risultato Importazione</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="text-center p-2 bg-green-500/10 rounded">
                    <div className="font-bold text-green-600">{importResult.imported}</div>
                    <div className="text-muted-foreground">Nuovi</div>
                  </div>
                  <div className="text-center p-2 bg-blue-500/10 rounded">
                    <div className="font-bold text-blue-600">{importResult.updated}</div>
                    <div className="text-muted-foreground">Aggiornati</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-500/10 rounded">
                    <div className="font-bold text-yellow-600">{importResult.skipped}</div>
                    <div className="text-muted-foreground">Saltati</div>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1 text-sm text-destructive mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>Errori ({importResult.errors.length})</span>
                    </div>
                    <ScrollArea className="h-24 rounded border p-2">
                      {importResult.errors.map((err, i) => (
                        <div key={i} className="text-xs text-muted-foreground">{err}</div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Chiudi
            </Button>
            <Button
              onClick={handleImportExcel}
              disabled={!importFile || importing}
              data-testid="button-start-import"
            >
              {importing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importazione...</>
              ) : (
                <><FileUp className="h-4 w-4 mr-2" /> Importa</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
