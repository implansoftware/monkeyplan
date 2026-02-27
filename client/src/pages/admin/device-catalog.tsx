import { useState, useRef, useCallback } from "react";
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
  Plus, Pencil, Trash2, Loader2, Search, ChevronRight, ChevronDown, Building2, Package, X, FileUp, CheckCircle2, AlertCircle, Wand2, ImageIcon, Images, Upload, Camera
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<DeviceModel | null>(null);
  const [modelForm, setModelForm] = useState({ modelName: "", brandId: "", typeId: "", marketCodes: [] as string[], photoUrl: "" });
  const [newMarketCode, setNewMarketCode] = useState("");
  const [deleteModelDialogOpen, setDeleteModelDialogOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<DeviceModel | null>(null);
  const [modelBrandFilter, setModelBrandFilter] = useState<string>("all");
  const [modelTypeFilter, setModelTypeFilter] = useState<string>("all");
  const [fetchingImageId, setFetchingImageId] = useState<string | null>(null);
  const [batchFetching, setBatchFetching] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, found: 0, total: 0 });

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
      toast({ title: t("products.typeCreated"), description: t("products.typeCreatedDesc") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.typeUpdated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/device-types/${id}?cascade=true`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-types"] });
      setDeleteTypeDialogOpen(false);
      setTypeToDelete(null);
      toast({ title: t("products.typeDeleted") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      const res = await apiRequest("POST", "/api/admin/device-brands", data);
      return res.json() as Promise<DeviceBrand>;
    },
    onSuccess: async (brand) => {
      if (logoFile && brand?.id) {
        try {
          setIsUploadingLogo(true);
          const formData = new FormData();
          formData.append("logo", logoFile);
          await fetch(`/api/admin/device-brands/${brand.id}/logo`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
        } catch (e) {
          console.error("Logo upload failed:", e);
        } finally {
          setIsUploadingLogo(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
      setBrandDialogOpen(false);
      setBrandForm({ name: "", logoUrl: "" });
      setLogoFile(null);
      setLogoPreview("");
      toast({ title: t("products.brandCreatedDevice") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      setLogoFile(null);
      setLogoPreview("");
      toast({ title: t("products.brandUpdated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.brandDeleted") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCodes: [], photoUrl: "" });
      setNewMarketCode("");
      toast({ title: t("products.modelCreated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCodes: [], photoUrl: "" });
      setNewMarketCode("");
      toast({ title: t("products.modelUpdated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.modelDeleted") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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

  const fetchImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/device-models/${id}/fetch-image`);
      return res.json();
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      setFetchingImageId(null);
      toast({ title: "Immagine trovata", description: data.imageUrl });
    },
    onError: (error: any) => {
      setFetchingImageId(null);
      toast({ variant: "destructive", title: "Immagine non trovata", description: error.message || "Nessuna immagine disponibile per questo modello" });
    },
  });

  const runBatchFetchImages = async () => {
    setBatchFetching(true);
    setBatchProgress({ done: 0, found: 0, total: 0 });
    let totalFound = 0;
    let offset = 0;

    try {
      while (true) {
        const res = await apiRequest("POST", "/api/admin/device-models/fetch-images-batch", { offset });
        const data = await res.json();

        offset += data.processed;
        totalFound += data.succeeded;
        setBatchProgress({ done: offset, found: totalFound, total: data.totalModels ?? offset });

        if (data.succeeded > 0) {
          queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
        }

        if (!data.processed || offset >= (data.totalModels ?? offset)) break;
      }
      toast({ title: "Ricerca completata", description: `${totalFound} immagini trovate su ${offset} modelli elaborati` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Errore ricerca immagini", description: error.message });
    } finally {
      setBatchFetching(false);
    }
  };

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
    setLogoFile(null);
    if (brand) {
      setEditingBrand(brand);
      setBrandForm({ name: brand.name, logoUrl: brand.logoUrl || "" });
      setLogoPreview(brand.logoUrl || "");
    } else {
      setEditingBrand(null);
      setBrandForm({ name: "", logoUrl: "" });
      setLogoPreview("");
    }
    setBrandDialogOpen(true);
  };

  const handleLogoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setBrandForm(prev => ({ ...prev, logoUrl: "" }));
  }, []);

  const handleSaveBrand = async () => {
    if (!brandForm.name) return;
    if (editingBrand) {
      if (logoFile) {
        try {
          setIsUploadingLogo(true);
          const formData = new FormData();
          formData.append("logo", logoFile);
          const res = await fetch(`/api/admin/device-brands/${editingBrand.id}/logo`, {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            updateBrandMutation.mutate({ id: editingBrand.id, data: { name: brandForm.name, logoUrl: data.logoUrl } });
          } else {
            updateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
          }
        } catch (e) {
          updateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
        } finally {
          setIsUploadingLogo(false);
        }
      } else {
        updateBrandMutation.mutate({ id: editingBrand.id, data: brandForm });
      }
    } else {
      createBrandMutation.mutate(brandForm);
    }
  };

  const openModelDialog = (model?: DeviceModel) => {
    if (model) {
      setEditingModel(model);
      setModelForm({ 
        modelName: model.modelName, 
        brandId: model.brandId || "", 
        typeId: model.typeId || "",
        marketCodes: model.marketCodes || [],
        photoUrl: model.photoUrl || ""
      });
    } else {
      setEditingModel(null);
      setModelForm({ modelName: "", brandId: "", typeId: "", marketCodes: [], photoUrl: "" });
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
        throw new Error(result.error || t("deviceCatalog.importError"));
      }
      
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-models"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/device-brands"] });
      
      if (result.imported > 0 || result.updated > 0) {
        toast({
          title: t("products.importCompleted"),
          description: t("products.importResult", { imported: result.imported, updated: result.updated, skipped: result.skipped })
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("common.error"),
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
          <div className="flex flex-wrap items-center gap-3 mb-1">
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
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
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>{t("common.description")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTypes.map(type => (
                      <TableRow key={type.id} data-testid={`row-type-${type.id}`}>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
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
                      <TableHead>{t("common.name")}</TableHead>
                      <TableHead>Logo</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map(brand => (
                      <TableRow key={brand.id} data-testid={`row-brand-${brand.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {brand.logoUrl && (
                              <img
                                src={brand.logoUrl}
                                alt={brand.name}
                                className="h-6 w-6 object-contain shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            <span className="font-medium">{brand.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="h-8 w-auto max-w-[80px] object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
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
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={modelTypeFilter} onValueChange={setModelTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-model-type-filter">
                      <SelectValue placeholder={t("common.filterByType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.allTypes")}</SelectItem>
                      {deviceTypes.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={modelBrandFilter} onValueChange={setModelBrandFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-model-brand-filter">
                      <SelectValue placeholder={t("common.filterByBrand")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("products.allBrands")}</SelectItem>
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
                  <Button
                    variant="outline"
                    onClick={runBatchFetchImages}
                    disabled={batchFetching}
                    data-testid="button-batch-fetch-images"
                  >
                    {batchFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {batchProgress.total > 0
                          ? `${batchProgress.done}/${batchProgress.total}`
                          : "Ricerca..."}
                      </>
                    ) : (
                      <>
                        <Images className="h-4 w-4 mr-2" />
                        Cerca immagini
                      </>
                    )}
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
                        <TableHead className="w-16">Img</TableHead>
                        <TableHead>{t("products.marketCode")}</TableHead>
                        <TableHead>{t("products.model")}</TableHead>
                        <TableHead>{t("products.brand")}</TableHead>
                        <TableHead>{t("common.type")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModels.map(model => {
                        const brand = deviceBrands.find(b => b.id === model.brandId);
                        const type = deviceTypes.find(t => t.id === model.typeId);
                        return (
                          <TableRow key={model.id} data-testid={`row-model-${model.id}`}>
                            <TableCell className="w-16">
                              {model.photoUrl ? (
                                <img
                                  src={model.photoUrl}
                                  alt={model.modelName}
                                  className="h-10 w-10 object-contain rounded-md bg-muted"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  data-testid={`img-model-${model.id}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
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
                                  title="Cerca immagine automaticamente"
                                  onClick={() => {
                                    setFetchingImageId(model.id);
                                    fetchImageMutation.mutate(model.id);
                                  }}
                                  disabled={fetchingImageId === model.id}
                                  data-testid={`button-fetch-image-${model.id}`}
                                >
                                  {fetchingImageId === model.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Wand2 className="h-4 w-4" />
                                  )}
                                </Button>
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
            <DialogTitle>{editingType ? t("deviceCatalog.editType") : t("deviceCatalog.newType")}</DialogTitle>
            <DialogDescription>
              {editingType ? t("deviceCatalog.editTypeDesc") : t("deviceCatalog.newTypeDesc")}
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
              <Label htmlFor="type-description">{t("common.description")}</Label>
              <Input
                id="type-description"
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                placeholder={t("utility.optionalDescription")}
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
              {editingType ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTypeDialogOpen} onOpenChange={setDeleteTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.deleteType")}</DialogTitle>
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
            <DialogTitle>{editingBrand ? t("deviceCatalog.editBrand") : t("deviceCatalog.newBrand")}</DialogTitle>
            <DialogDescription>
              {editingBrand ? t("deviceCatalog.editBrandDesc") : t("deviceCatalog.newBrandDesc")}
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
              <Label>Logo</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={handleLogoFileChange}
                data-testid="input-brand-logo-file"
              />
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden hover-elevate shrink-0 bg-muted/30"
                  data-testid="button-upload-brand-logo"
                >
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Camera className="h-6 w-6" />
                      <span className="text-xs">Upload</span>
                    </div>
                  )}
                </button>
                <div className="flex-1 space-y-2">
                  {logoFile && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="truncate max-w-[160px]">{logoFile.name}</span>
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(editingBrand?.logoUrl || ""); setBrandForm(prev => ({ ...prev, logoUrl: editingBrand?.logoUrl || "" })); if (logoInputRef.current) logoInputRef.current.value = ""; }}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="brand-logo" className="text-xs text-muted-foreground">o inserisci URL manuale</Label>
                    <Input
                      id="brand-logo"
                      value={logoFile ? "" : brandForm.logoUrl}
                      onChange={(e) => { setBrandForm({ ...brandForm, logoUrl: e.target.value }); if (e.target.value) { setLogoFile(null); setLogoPreview(e.target.value); if (logoInputRef.current) logoInputRef.current.value = ""; } }}
                      placeholder="https://..."
                      disabled={!!logoFile}
                      data-testid="input-brand-logo"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                handleSaveBrand();
              }}
              disabled={!brandForm.name || createBrandMutation.isPending || updateBrandMutation.isPending || isUploadingLogo}
              data-testid="button-save-brand"
            >
              {(createBrandMutation.isPending || updateBrandMutation.isPending || isUploadingLogo) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingBrand ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteBrandDialogOpen} onOpenChange={setDeleteBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.deleteBrand")}</DialogTitle>
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
            <DialogTitle>{editingModel ? t("deviceCatalog.editModel") : t("deviceCatalog.newModel")}</DialogTitle>
            <DialogDescription>
              {editingModel ? t("deviceCatalog.editModelDesc") : t("deviceCatalog.newModelDesc")}
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
              <Label htmlFor="model-brand">{t("products.brand")}</Label>
              <Select 
                value={modelForm.brandId} 
                onValueChange={(v) => setModelForm({ ...modelForm, brandId: v })}
              >
                <SelectTrigger data-testid="select-model-brand">
                  <SelectValue placeholder={t("products.selectBrand")} />
                </SelectTrigger>
                <SelectContent>
                  {deviceBrands.filter(b => b.isActive).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model-type">{t("products.deviceType")}</Label>
              <Select 
                value={modelForm.typeId} 
                onValueChange={(v) => setModelForm({ ...modelForm, typeId: v })}
              >
                <SelectTrigger data-testid="select-model-type">
                  <SelectValue placeholder={t("utility.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.filter(t => t.isActive).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("products.marketCodes")}</Label>
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
            <div className="space-y-2">
              <Label htmlFor="model-photo">URL Immagine</Label>
              <div className="flex gap-2">
                <Input
                  id="model-photo"
                  value={modelForm.photoUrl || ""}
                  onChange={(e) => setModelForm({ ...modelForm, photoUrl: e.target.value })}
                  placeholder="https://..."
                  data-testid="input-model-photo"
                />
                {modelForm.photoUrl && (
                  <img
                    src={modelForm.photoUrl}
                    alt="preview"
                    className="h-9 w-9 object-contain rounded-md bg-muted flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">Lascia vuoto per ricerca automatica</p>
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
                if (modelForm.photoUrl) payload.photoUrl = modelForm.photoUrl;
                
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
              {editingModel ? t("common.save") : t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModelDialogOpen} onOpenChange={setDeleteModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.deleteModel")}</DialogTitle>
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
            <DialogTitle>{t("products.importFromExcel")}</DialogTitle>
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
                <div className="flex flex-wrap items-center gap-2">
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
                    <div className="flex flex-wrap items-center gap-1 text-sm text-destructive mb-1">
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
