import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Search, Plus, Pencil, Trash2, Loader2, Tag, Store, X, Image, ChevronDown, ImagePlus, UserPlus, Eye, EyeOff, Warehouse } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AccessorySpecs, Product, DeviceModel, DeviceBrand, User, Warehouse as WarehouseType } from "@shared/schema";
import { ProductDetailDialog } from "@/components/product-detail-dialog";

type DeviceCompatibilityEntry = {
  deviceBrandId: string;
  deviceModelId: string | null;
  brandName?: string;
  modelName?: string | null;
};

interface InitialStockEntry {
  warehouseId: string;
  quantity: number;
}

interface WarehouseForStock {
  id: string;
  name: string;
  ownerType: 'admin' | 'reseller' | 'sub_reseller' | 'repair_center';
  ownerId: string;
  owner?: {
    id: string;
    username: string;
    fullName: string | null;
    role: string;
  } | null;
}

type AccessoryWithSpecs = Product & {
  specs: AccessorySpecs | null;
  reseller?: { id: string; username: string; fullName: string | null } | null;
  deviceCompatibilities?: Array<{
    id: string;
    deviceBrandId: string;
    deviceModelId: string | null;
    deviceModel?: { id: string; modelName: string } | null;
    deviceBrand?: { id: string; name: string } | null;
  }>;
};

const ACCESSORY_TYPES = [
  { value: "cover", label: "Cover / Custodia" },
  { value: "pellicola", label: "Pellicola protettiva" },
  { value: "caricatore", label: "Caricatore" },
  { value: "cavo", label: "Cavo" },
  { value: "auricolare", label: "Auricolari" },
  { value: "powerbank", label: "Power Bank" },
  { value: "supporto", label: "Supporto / Stand" },
  { value: "adattatore", label: "Adattatore" },
  { value: "altro", label: "Altro" },
];

const CONDITION_OPTIONS = [
  { value: "nuovo", label: "Nuovo" },
  { value: "ricondizionato", label: "Ricondizionato" },
  { value: "usato", label: "Usato" },
];

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "Anker", "Belkin", "Spigen", "OtterBox", "Universale", "Altro"];

const COLOR_OPTIONS = [
  "Nero", "Bianco", "Argento", "Grigio", "Oro", "Oro Rosa", "Blu", "Blu Notte", 
  "Verde", "Rosso", "Giallo", "Arancione", "Rosa", "Viola", "Marrone", 
  "Trasparente", "Multicolore", "Altro"
];

const MATERIAL_OPTIONS = [
  "Silicone", "TPU", "Plastica", "Policarbonato", "Pelle", "Pelle sintetica",
  "Vetro temperato", "Metallo", "Alluminio", "Tessuto", "Legno", "Carbonio", "Altro"
];

export default function AdminAccessoryCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryWithSpecs | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessoryToDelete, setAccessoryToDelete] = useState<AccessoryWithSpecs | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [accessoryToAssign, setAccessoryToAssign] = useState<AccessoryWithSpecs | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [initialStock, setInitialStock] = useState<InitialStockEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Device compatibility state (like spare parts)
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [deviceCompatibilities, setDeviceCompatibilities] = useState<DeviceCompatibilityEntry[]>([]);
  const [newBrandDialogOpen, setNewBrandDialogOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newModelDialogOpen, setNewModelDialogOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelBrandId, setNewModelBrandId] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    brand: "",
    color: "",
    description: "",
    unitPrice: "",
    costPrice: "",
    condition: "nuovo",
    warrantyMonths: "12",
    accessoryType: "cover",
    isUniversal: false,
    compatibleBrands: [] as string[],
    compatibleModels: "",
    material: "",
    notes: "",
  });

  const { data: accessories = [], isLoading } = useQuery<AccessoryWithSpecs[]>({
    queryKey: ["/api/accessories"],
  });

  const { data: warehouses = [] } = useQuery<WarehouseForStock[]>({
    queryKey: ["/api/admin/all-warehouses"],
  });

  // Fetch device brands and models for compatibility selection
  const { data: deviceBrands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [] } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models"],
  });

  // Fetch resellers for assignment
  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });
  const resellers = allUsers.filter(u => u.role === 'reseller');

  // Assign accessory to reseller mutation
  const assignMutation = useMutation({
    mutationFn: async ({ productId, resellerId }: { productId: string; resellerId: string | null }) => {
      await apiRequest("PATCH", `/api/admin/accessories/${productId}/assign`, { resellerId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setAssignDialogOpen(false);
      setAccessoryToAssign(null);
      setSelectedResellerId("");
      toast({ title: "Accessorio assegnato", description: "L'accessorio è stato assegnato al rivenditore." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/device-brands", { name });
      return await res.json();
    },
    onSuccess: (newBrand: DeviceBrand) => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-brands"] });
      setNewBrandDialogOpen(false);
      setNewBrandName("");
      toast({ title: "Brand creato", description: `"${newBrand.name}" aggiunto con successo` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async ({ brandId, modelName }: { brandId: string; modelName: string }) => {
      const res = await apiRequest("POST", "/api/device-models", { brandId, modelName });
      return await res.json();
    },
    onSuccess: (newModel: DeviceModel) => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-models"] });
      setNewModelDialogOpen(false);
      setNewModelName("");
      setNewModelBrandId("");
      if (newModel.brandId) {
        setExpandedBrands(prev => {
          const newSet = new Set(prev);
          newSet.add(newModel.brandId!);
          return newSet;
        });
      }
      toast({ title: "Modello creato", description: `"${newModel.modelName}" aggiunto con successo` });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBrandName.trim()) {
      createBrandMutation.mutate(newBrandName.trim());
    }
  };

  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (newModelName.trim() && newModelBrandId) {
      createModelMutation.mutate({ brandId: newModelBrandId, modelName: newModelName.trim() });
    }
  };

  const openNewModelDialog = (brandId: string) => {
    setNewModelBrandId(brandId);
    setNewModelDialogOpen(true);
  };

  const toggleBrandExpansion = (brandId: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
  };

  const toggleBrandCompatibility = (brandId: string) => {
    const hasAnyFromBrand = deviceCompatibilities.some(c => c.deviceBrandId === brandId);
    if (hasAnyFromBrand) {
      setDeviceCompatibilities(deviceCompatibilities.filter(c => c.deviceBrandId !== brandId));
    } else {
      const brand = deviceBrands.find(b => b.id === brandId);
      setDeviceCompatibilities([...deviceCompatibilities, {
        deviceBrandId: brandId,
        deviceModelId: null,
        brandName: brand?.name,
        modelName: null
      }]);
    }
  };

  const toggleModelCompatibility = (brandId: string, modelId: string) => {
    const exists = deviceCompatibilities.some(c => c.deviceBrandId === brandId && c.deviceModelId === modelId);
    if (exists) {
      setDeviceCompatibilities(deviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && c.deviceModelId === modelId)));
    } else {
      const brandOnly = deviceCompatibilities.find(c => c.deviceBrandId === brandId && !c.deviceModelId);
      if (brandOnly) {
        setDeviceCompatibilities(deviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && !c.deviceModelId)));
      }
      const brand = deviceBrands.find(b => b.id === brandId);
      const model = deviceModels.find(m => m.id === modelId);
      setDeviceCompatibilities([...deviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && !c.deviceModelId)), {
        deviceBrandId: brandId,
        deviceModelId: modelId,
        brandName: brand?.name,
        modelName: model?.modelName
      }]);
    }
  };

  const getModelsForBrand = (brandId: string) => {
    return deviceModels.filter(m => m.brandId === brandId);
  };

  const addInitialStock = (warehouseId: string) => {
    if (!initialStock.find(s => s.warehouseId === warehouseId)) {
      setInitialStock([...initialStock, { warehouseId, quantity: 0 }]);
    }
  };

  const updateInitialStock = (warehouseId: string, quantity: number) => {
    setInitialStock(initialStock.map(s => 
      s.warehouseId === warehouseId ? { ...s, quantity } : s
    ));
  };

  const removeInitialStock = (warehouseId: string) => {
    setInitialStock(initialStock.filter(s => s.warehouseId !== warehouseId));
  };

  const groupedWarehouses = {
    admin: warehouses.filter(w => w.ownerType === 'admin'),
    reseller: warehouses.filter(w => w.ownerType === 'reseller'),
    sub_reseller: warehouses.filter(w => w.ownerType === 'sub_reseller'),
    repair_center: warehouses.filter(w => w.ownerType === 'repair_center'),
  };

  const createMutation = useMutation({
    mutationFn: async (data: { product: any; specs: any; imageFile?: File | null; compatibleDeviceModelIds?: string[]; initialStock?: InitialStockEntry[] }) => {
      if (data.imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("product", JSON.stringify(data.product));
        formDataUpload.append("specs", JSON.stringify(data.specs));
        formDataUpload.append("compatibleDeviceModelIds", JSON.stringify(data.compatibleDeviceModelIds || []));
        formDataUpload.append("image", data.imageFile);
        if (data.initialStock && data.initialStock.length > 0) {
          formDataUpload.append("initialStock", JSON.stringify(data.initialStock));
        }
        const response = await fetch("/api/accessories", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      } else {
        return apiRequest("POST", "/api/accessories", { 
          product: data.product, 
          specs: data.specs,
          compatibleDeviceModelIds: data.compatibleDeviceModelIds || [],
          initialStock: data.initialStock
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Accessorio aggiunto", description: "L'accessorio è stato aggiunto al catalogo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data, initialStock: stockEntries }: { productId: string; data: any; initialStock?: InitialStockEntry[] }) => {
      await apiRequest("PATCH", `/api/accessories/${productId}`, { 
        product: data.product, 
        specs: data.specs,
        compatibleDeviceModelIds: data.compatibleDeviceModelIds || []
      });
      if (stockEntries && stockEntries.length > 0) {
        for (const entry of stockEntries) {
          if (entry.quantity > 0) {
            await apiRequest("POST", `/api/warehouses/${entry.warehouseId}/movements`, {
              productId: productId,
              movementType: "carico",
              quantity: entry.quantity,
              notes: "Aggiunta stock da modifica prodotto"
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
      setDialogOpen(false);
      setEditingAccessory(null);
      resetForm();
      toast({ title: "Accessorio aggiornato", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      return apiRequest("DELETE", `/api/accessories/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setDeleteDialogOpen(false);
      setAccessoryToDelete(null);
      toast({ title: "Eliminato", description: "L'accessorio è stato rimosso dal catalogo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisibleInShop }: { id: string; isVisibleInShop: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}/visibility`, { isVisibleInShop });
      return res.json();
    },
    onMutate: async ({ id, isVisibleInShop }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/accessories"] });
      const previousData = queryClient.getQueryData<AccessoryWithSpecs[]>(["/api/accessories"]);
      queryClient.setQueryData<AccessoryWithSpecs[]>(["/api/accessories"], (old) =>
        old?.map((a) => (a.id === id ? { ...a, isVisibleInShop } : a))
      );
      return { previousData };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/accessories"], context.previousData);
      }
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
    onSuccess: (_, { isVisibleInShop }) => {
      toast({
        title: isVisibleInShop ? "Visibile nello shop" : "Nascosto dallo shop",
        description: isVisibleInShop ? "L'accessorio è ora visibile negli shop." : "L'accessorio è stato nascosto dagli shop.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        toast({ title: "Errore", description: "Formato non supportato. Usa JPEG, PNG, WebP o GIF.", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Errore", description: "Immagine troppo grande. Max 10MB.", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (productId: string) => {
    if (!imageFile) return;
    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", imageFile);
      const response = await fetch(`/api/admin/products/${productId}/image`, {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({ title: "Immagine caricata", description: "L'immagine è stata salvata." });
    } catch (error: any) {
      toast({ title: "Errore upload", description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const deleteImage = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/image`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({ title: "Immagine rimossa" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setDeviceCompatibilities([]);
    setExpandedBrands(new Set());
    setInitialStock([]);
    setFormData({
      name: "",
      sku: "",
      brand: "",
      color: "",
      description: "",
      unitPrice: "",
      costPrice: "",
      condition: "nuovo",
      warrantyMonths: "12",
      accessoryType: "cover",
      isUniversal: false,
      compatibleBrands: [],
      compatibleModels: "",
      material: "",
      notes: "",
    });
  };

  const openEditDialog = (accessory: AccessoryWithSpecs) => {
    setEditingAccessory(accessory);
    setExpandedBrands(new Set());
    // Extract device compatibilities from existing data
    const existingCompatibilities: DeviceCompatibilityEntry[] = (accessory.deviceCompatibilities || []).map(dc => ({
      deviceBrandId: dc.deviceBrandId,
      deviceModelId: dc.deviceModelId,
      brandName: dc.deviceBrand?.name,
      modelName: dc.deviceModel?.modelName
    }));
    setDeviceCompatibilities(existingCompatibilities);
    setFormData({
      name: accessory.name,
      sku: accessory.sku,
      brand: accessory.brand || "",
      color: accessory.color || accessory.specs?.color || "",
      description: accessory.description || "",
      unitPrice: accessory.unitPrice ? (accessory.unitPrice / 100).toString() : "",
      costPrice: accessory.costPrice ? (accessory.costPrice / 100).toString() : "",
      condition: accessory.condition,
      warrantyMonths: accessory.warrantyMonths?.toString() || "12",
      accessoryType: accessory.specs?.accessoryType || "cover",
      isUniversal: accessory.specs?.isUniversal || false,
      compatibleBrands: accessory.specs?.compatibleBrands || [],
      compatibleModels: accessory.specs?.compatibleModels?.join(", ") || "",
      material: accessory.specs?.material || "",
      notes: accessory.specs?.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const product = {
      name: formData.name,
      sku: formData.sku,
      category: "accessorio",
      brand: formData.brand,
      color: formData.color,
      description: formData.description,
      unitPrice: Math.round(parseFloat(formData.unitPrice || "0") * 100),
      costPrice: formData.costPrice ? Math.round(parseFloat(formData.costPrice) * 100) : null,
      condition: formData.condition,
      warrantyMonths: parseInt(formData.warrantyMonths) || 12,
    };

    const specs = {
      accessoryType: formData.accessoryType,
      isUniversal: formData.isUniversal,
      compatibleBrands: formData.compatibleBrands.length > 0 ? formData.compatibleBrands : null,
      compatibleModels: formData.compatibleModels ? formData.compatibleModels.split(",").map(m => m.trim()).filter(Boolean) : null,
      material: formData.material || null,
      color: formData.color || null,
      notes: formData.notes || null,
    };

    // Convert device compatibilities to model IDs for backend
    const compatibleDeviceModelIds = formData.isUniversal ? [] : deviceCompatibilities
      .filter(c => c.deviceModelId !== null)
      .map(c => c.deviceModelId as string);

    if (editingAccessory) {
      const stockEntries = initialStock.filter(s => s.quantity > 0);
      updateMutation.mutate({ productId: editingAccessory.id, data: { product, specs, compatibleDeviceModelIds }, initialStock: stockEntries });
    } else {
      const stockEntries = initialStock.filter(s => s.quantity > 0);
      createMutation.mutate({ product, specs, imageFile, compatibleDeviceModelIds, initialStock: stockEntries });
    }
  };

  const filteredAccessories = accessories.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || a.specs?.accessoryType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeLabel = (type: string | null | undefined) => {
    return ACCESSORY_TYPES.find(t => t.value === type)?.label || type || "-";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Catalogo Accessori (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizza e gestisci tutti gli accessori di tutti i rivenditori
          </p>
        </div>
        <Button onClick={() => { resetForm(); setEditingAccessory(null); setDialogOpen(true); }} data-testid="button-add-accessory">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Accessorio
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Lista Accessori ({filteredAccessories.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-accessories"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-44" data-testid="select-type-filter">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {ACCESSORY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAccessories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nessun accessorio nel catalogo</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Prodotto</TableHead>
                    <TableHead>Rivenditore</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Compatibilità</TableHead>
                    <TableHead>Condizione</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-center">Shop</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessories.map((accessory) => (
                    <TableRow key={accessory.id} data-testid={`row-accessory-${accessory.id}`}>
                      <TableCell>
                        {accessory.imageUrl ? (
                          <img
                            src={accessory.imageUrl}
                            alt={accessory.name}
                            className="w-12 h-12 object-cover rounded"
                            data-testid={`img-accessory-${accessory.id}`}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Image className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{accessory.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {accessory.brand} {accessory.color && `• ${accessory.color}`}
                          </div>
                          <div className="text-xs text-muted-foreground">SKU: {accessory.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Store className="h-4 w-4" />
                          {accessory.reseller?.fullName || accessory.reseller?.username || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Tag className="h-3 w-3 mr-1" />
                          {getTypeLabel(accessory.specs?.accessoryType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {accessory.specs?.isUniversal ? (
                          <Badge variant="secondary">Universale</Badge>
                        ) : accessory.specs?.compatibleBrands?.length ? (
                          <span className="text-sm text-muted-foreground">
                            {accessory.specs.compatibleBrands.slice(0, 2).join(", ")}
                            {accessory.specs.compatibleBrands.length > 2 && ` +${accessory.specs.compatibleBrands.length - 2}`}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={accessory.condition === "nuovo" ? "default" : "secondary"}>
                          {accessory.condition === "nuovo" ? "Nuovo" : accessory.condition === "ricondizionato" ? "Ricondizionato" : "Usato"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(accessory.unitPrice / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {accessory.isVisibleInShop ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={accessory.isVisibleInShop}
                            onCheckedChange={(checked) =>
                              toggleVisibilityMutation.mutate({ id: accessory.id, isVisibleInShop: checked })
                            }
                            disabled={toggleVisibilityMutation.isPending}
                            data-testid={`switch-visibility-accessory-${accessory.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDetailProductId(accessory.id); setDetailDialogOpen(true); }}
                            title="Visualizza dettagli"
                            data-testid={`button-detail-accessory-${accessory.id}`}
                          >
                            <Search className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setAccessoryToAssign(accessory); setSelectedResellerId(accessory.reseller?.id || ""); setAssignDialogOpen(true); }}
                            title="Assegna a rivenditore"
                            data-testid={`button-assign-accessory-${accessory.id}`}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(accessory)}
                            data-testid={`button-edit-accessory-${accessory.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setAccessoryToDelete(accessory); setDeleteDialogOpen(true); }}
                            data-testid={`button-delete-accessory-${accessory.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAccessory ? "Modifica Accessorio" : "Aggiungi Accessorio"}</DialogTitle>
            <DialogDescription>
              {editingAccessory ? "Modifica i dettagli dell'accessorio" : "Inserisci i dettagli del nuovo accessorio"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome prodotto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Cover silicone iPhone 14"
                  data-testid="input-accessory-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="es. COV-IP14-BLK"
                  data-testid="input-accessory-sku"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessoryType">Tipo accessorio</Label>
                <Select value={formData.accessoryType} onValueChange={(v) => setFormData({ ...formData, accessoryType: v })}>
                  <SelectTrigger data-testid="select-accessory-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESSORY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger data-testid="select-accessory-brand">
                    <SelectValue placeholder="Seleziona marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condizione</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                  <SelectTrigger data-testid="select-accessory-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Colore</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                  <SelectTrigger data-testid="select-accessory-color">
                    <SelectValue placeholder="Seleziona colore" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Materiale</Label>
                <Select value={formData.material} onValueChange={(v) => setFormData({ ...formData, material: v })}>
                  <SelectTrigger data-testid="select-accessory-material">
                    <SelectValue placeholder="Seleziona materiale" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isUniversal"
                checked={formData.isUniversal}
                onCheckedChange={(checked) => setFormData({ ...formData, isUniversal: !!checked })}
                data-testid="checkbox-universal"
              />
              <Label htmlFor="isUniversal">Accessorio universale</Label>
            </div>

            {!formData.isUniversal && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dispositivi Compatibili</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewBrandDialogOpen(true)}
                      data-testid="button-new-brand"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Brand
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewModelDialogOpen(true)}
                      data-testid="button-new-model"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Modello
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Seleziona i brand e modelli di dispositivo con cui questo accessorio è compatibile
                </p>
                <ScrollArea className="h-64 border rounded-md p-2">
                  {deviceBrands.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">Nessun brand di dispositivo disponibile</p>
                  ) : (
                    <div className="space-y-1">
                      {deviceBrands.map((brand) => {
                        const models = getModelsForBrand(brand.id);
                        const isExpanded = expandedBrands.has(brand.id);
                        const hasAnyCompatibility = deviceCompatibilities.some(c => c.deviceBrandId === brand.id);
                        const hasBrandOnlyCompatibility = deviceCompatibilities.some(c => c.deviceBrandId === brand.id && !c.deviceModelId);
                        
                        return (
                          <div key={brand.id} className="border rounded-md">
                            <div className="flex items-center gap-2 p-2 hover-elevate">
                              <Checkbox
                                checked={hasAnyCompatibility}
                                onCheckedChange={() => toggleBrandCompatibility(brand.id)}
                                data-testid={`checkbox-brand-${brand.id}`}
                              />
                              <button
                                type="button"
                                onClick={() => toggleBrandExpansion(brand.id)}
                                className="flex items-center gap-1 flex-1 text-left"
                              >
                                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                <span className="font-medium">{brand.name}</span>
                                {hasBrandOnlyCompatibility && (
                                  <Badge variant="outline" className="ml-2 text-xs">Tutti i modelli</Badge>
                                )}
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => { e.stopPropagation(); openNewModelDialog(brand.id); }}
                                data-testid={`button-add-model-${brand.id}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            {isExpanded && (
                              <div className="pl-8 pb-2 space-y-1">
                                {models.map((model) => {
                                  const isModelSelected = deviceCompatibilities.some(c => c.deviceBrandId === brand.id && c.deviceModelId === model.id);
                                  return (
                                    <div key={model.id} className="flex items-center gap-2 p-1 hover-elevate rounded">
                                      <Checkbox
                                        checked={isModelSelected || hasBrandOnlyCompatibility}
                                        disabled={hasBrandOnlyCompatibility}
                                        onCheckedChange={() => toggleModelCompatibility(brand.id, model.id)}
                                        data-testid={`checkbox-model-${model.id}`}
                                      />
                                      <span className="text-sm">{model.modelName}</span>
                                    </div>
                                  );
                                })}
                                {models.length === 0 && (
                                  <p className="text-xs text-muted-foreground italic">Nessun modello. Clicca + per aggiungerne uno.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
                {deviceCompatibilities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {deviceCompatibilities.map((c, idx) => {
                      const brand = deviceBrands.find(b => b.id === c.deviceBrandId);
                      const model = c.deviceModelId ? deviceModels.find(m => m.id === c.deviceModelId) : null;
                      return (
                        <Badge key={idx} variant="secondary">
                          {brand?.name}{model ? ` - ${model.modelName}` : ' (tutti)'}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Prezzo vendita</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-accessory-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Prezzo costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-accessory-cost"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyMonths">Garanzia (mesi)</Label>
              <Input
                id="warrantyMonths"
                type="number"
                value={formData.warrantyMonths}
                onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                placeholder="12"
                data-testid="input-accessory-warranty"
              />
            </div>

            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  {editingAccessory ? "Aggiungi stock" : "Quantità iniziali per magazzino"}
                </Label>
                <Select onValueChange={addInitialStock}>
                  <SelectTrigger className="w-56" data-testid="select-add-stock-warehouse">
                    <SelectValue placeholder="Aggiungi magazzino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedWarehouses.admin.filter(w => !initialStock.find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Admin</SelectLabel>
                        {groupedWarehouses.admin
                          .filter(w => !initialStock.find(s => s.warehouseId === w.id))
                          .map(wh => (
                            <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                    {groupedWarehouses.reseller.filter(w => !initialStock.find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Rivenditori</SelectLabel>
                        {groupedWarehouses.reseller
                          .filter(w => !initialStock.find(s => s.warehouseId === w.id))
                          .map(wh => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name} ({wh.owner?.fullName || wh.owner?.username})
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                    {groupedWarehouses.sub_reseller.filter(w => !initialStock.find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Sotto-Rivenditori</SelectLabel>
                        {groupedWarehouses.sub_reseller
                          .filter(w => !initialStock.find(s => s.warehouseId === w.id))
                          .map(wh => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name} ({wh.owner?.fullName || wh.owner?.username})
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                    {groupedWarehouses.repair_center.filter(w => !initialStock.find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Centri Riparazione</SelectLabel>
                        {groupedWarehouses.repair_center
                          .filter(w => !initialStock.find(s => s.warehouseId === w.id))
                          .map(wh => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name} ({wh.owner?.fullName || wh.owner?.username})
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {initialStock.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna quantità iniziale. Seleziona un magazzino per aggiungere.
                </p>
              ) : (
                <div className="space-y-2">
                  {initialStock.map(stock => {
                    const wh = warehouses.find(w => w.id === stock.warehouseId);
                    return (
                      <div key={stock.warehouseId} className="flex items-center gap-3 p-3 border rounded-md">
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="font-medium">{wh?.name || "Magazzino"}</span>
                          {wh && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({wh.ownerType === 'admin' ? 'Admin' : wh.owner?.fullName || wh.owner?.username})
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={stock.quantity}
                          onChange={(e) => updateInitialStock(stock.warehouseId, parseInt(e.target.value) || 0)}
                          className="w-24"
                          data-testid={`input-stock-${stock.warehouseId}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInitialStock(stock.warehouseId)}
                          data-testid={`button-remove-stock-${stock.warehouseId}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {editingAccessory && (
                <p className="text-xs text-muted-foreground">
                  Le quantità saranno aggiunte come carico ai magazzini selezionati
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione del prodotto..."
                rows={2}
                data-testid="textarea-accessory-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note interne</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note per uso interno..."
                rows={2}
                data-testid="textarea-accessory-notes"
              />
            </div>

            <div className="space-y-2">
                <Label>Immagine prodotto</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                          data-testid="button-clear-preview"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : editingAccessory?.imageUrl ? (
                      <div className="relative">
                        <img src={editingAccessory.imageUrl} alt={editingAccessory.name} className="w-24 h-24 object-cover rounded" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => deleteImage(editingAccessory.id)}
                          data-testid="button-delete-image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageSelect}
                      data-testid="input-image-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-select-image"
                    >
                      <ImagePlus className="mr-2 h-4 w-4" />
                      Seleziona immagine
                    </Button>
                    {editingAccessory && imageFile && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => uploadImage(editingAccessory.id)}
                        disabled={uploadingImage}
                        data-testid="button-upload-image"
                      >
                        {uploadingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Carica immagine
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP o GIF. Max 10MB.</p>
                  </div>
                </div>
              </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-accessory"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccessory ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{accessoryToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => accessoryToDelete && deleteMutation.mutate(accessoryToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog per nuovo brand */}
      <Dialog open={newBrandDialogOpen} onOpenChange={setNewBrandDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Brand Dispositivo</DialogTitle>
            <DialogDescription>Aggiungi un nuovo brand di dispositivo al sistema</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-brand-name">Nome Brand</Label>
              <Input
                id="new-brand-name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Es. Apple, Samsung, Xiaomi..."
                data-testid="input-new-brand-name"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewBrandDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={!newBrandName.trim() || createBrandMutation.isPending} data-testid="button-create-brand">
                {createBrandMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crea Brand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog per nuovo modello */}
      <Dialog open={newModelDialogOpen} onOpenChange={setNewModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Modello Dispositivo</DialogTitle>
            <DialogDescription>Aggiungi un nuovo modello di dispositivo</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateModel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-model-brand">Brand</Label>
              <Select value={newModelBrandId} onValueChange={setNewModelBrandId}>
                <SelectTrigger data-testid="select-new-model-brand">
                  <SelectValue placeholder="Seleziona brand..." />
                </SelectTrigger>
                <SelectContent>
                  {deviceBrands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-model-name">Nome Modello</Label>
              <Input
                id="new-model-name"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Es. iPhone 15 Pro, Galaxy S24 Ultra..."
                data-testid="input-new-model-name"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewModelDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={!newModelName.trim() || !newModelBrandId || createModelMutation.isPending} data-testid="button-create-model">
                {createModelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crea Modello
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog per assegnare accessorio a rivenditore */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assegna Accessorio</DialogTitle>
            <DialogDescription>
              Seleziona il rivenditore a cui assegnare "{accessoryToAssign?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rivenditore</Label>
              <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
                <SelectTrigger data-testid="select-assign-reseller">
                  <SelectValue placeholder="Seleziona rivenditore..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nessuno (rimuovi assegnazione)</SelectItem>
                  {resellers.map((reseller) => (
                    <SelectItem key={reseller.id} value={reseller.id}>
                      {reseller.fullName || reseller.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {accessoryToAssign?.reseller && (
              <p className="text-sm text-muted-foreground">
                Attualmente assegnato a: <strong>{accessoryToAssign.reseller.fullName || accessoryToAssign.reseller.username}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => accessoryToAssign && assignMutation.mutate({ 
                productId: accessoryToAssign.id, 
                resellerId: selectedResellerId === "__none__" ? null : selectedResellerId 
              })}
              disabled={assignMutation.isPending}
              data-testid="button-confirm-assign"
            >
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assegna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDetailDialog 
        open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
        productId={detailProductId} 
      />
    </div>
  );
}
