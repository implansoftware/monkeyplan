import { useState, useRef } from "react";
import { BarcodeDisplay } from "@/components/barcode-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Search, Plus, Pencil, Trash2, Loader2, Headphones, Cable, Battery, Shield, ImagePlus, X, Image, ChevronDown, Store, Save, User, Minus, Wrench as WrenchIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUser } from "@/hooks/use-user";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AccessorySpecs, Product, DeviceModel, DeviceBrand } from "@shared/schema";
import { AccessoryWizard } from "@/components/AccessoryWizard";
import { useTranslation } from "react-i18next";

type DeviceCompatibilityEntry = {
  deviceBrandId: string;
  deviceModelId: string | null;
  brandName?: string;
  modelName?: string | null;
};

type WarehouseStock = {
  warehouseId: string;
  warehouseName: string;
  ownerType: 'reseller' | 'sub_reseller' | 'repair_center';
  ownerName: string;
  quantity: number;
};

type AccessibleWarehouse = {
  id: string;
  name: string;
  ownerType: 'reseller' | 'sub_reseller' | 'repair_center';
  owner?: { fullName?: string; username?: string };
};

type AccessoryWithSpecs = Product & {
  specs: AccessorySpecs | null;
  deviceCompatibilities?: Array<{
    deviceBrandId: string;
    deviceBrandName: string | null;
    deviceModelId: string | null;
    deviceModelName: string | null;
  }>;
  supplier?: { id: string; name: string; code: string } | null;
};

const COLOR_OPTIONS = [
  "Nero", "Bianco", "Trasparente", "Blu", "Rosso", "Verde", "Rosa", 
  "Oro", "Argento", "Grigio", "Viola", "Arancione", "Giallo", "Marrone"
];

const MATERIAL_OPTIONS = [
  "Silicone", "TPU", "Plastica", "Vetro temperato", "Pelle", 
  "Pelle sintetica", "Tessuto", "Metallo", "Carbonio", "Ibrido"
];

function getAccessoryTypes(t: (key: string) => string) {
  return [
    { value: "cover", label: "Cover/Custodie", icon: Shield },
    { value: "pellicola", label: "Pellicole Protettive", icon: Shield },
    { value: "caricatore", label: "Caricatori", icon: Battery },
    { value: "cavo", label: "Cavi", icon: Cable },
    { value: "powerbank", label: "Power Bank", icon: Battery },
    { value: "auricolari", label: "Auricolari/Cuffie", icon: Headphones },
    { value: "supporto", label: "Supporti", icon: Package },
    { value: "adattatore", label: "Adattatori", icon: Cable },
    { value: "memoria", label: "Schede Memoria", icon: Package },
    { value: "altro", label: t("common.other"), icon: Package },
  ];
}

function getConditionOptions(t: (key: string) => string) {
  return [
    { value: "nuovo", label: t("common.new") },
    { value: "ricondizionato", label: t("products.refurbished") },
    { value: "usato", label: t("products.used") },
    { value: "difettoso", label: "Difettoso" },
  ];
}

const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Universale", "Altro"];

export default function AccessoryCatalog() {
  const { t } = useTranslation();
  const ACCESSORY_TYPES = getAccessoryTypes(t);
  const CONDITION_OPTIONS = getConditionOptions(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<AccessoryWithSpecs | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessoryToDelete, setAccessoryToDelete] = useState<AccessoryWithSpecs | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Marketplace P2P state
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);
  const [marketplaceProduct, setMarketplaceProduct] = useState<AccessoryWithSpecs | null>(null);
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(false);
  const [marketplacePrice, setMarketplacePrice] = useState("");
  const [marketplaceMinQty, setMarketplaceMinQty] = useState("1");

  // Stock management state
  const [editStock, setEditStock] = useState<Array<{ 
    warehouseId: string; 
    warehouseName: string;
    ownerType: 'reseller' | 'sub_reseller' | 'repair_center';
    ownerName: string;
    quantity: number; 
    originalQuantity: number 
  }>>([]);
  const [loadingEditStock, setLoadingEditStock] = useState(false);

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
    supplierId: "",
  });

  // Query per fornitori
  interface Supplier {
    id: string;
    name: string;
    code: string;
  }
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers/list"],
  });

  const { data: accessories = [], isLoading } = useQuery<AccessoryWithSpecs[]>({
    queryKey: ["/api/accessories"],
  });

  // Fetch device brands and models for compatibility selection
  const { data: deviceBrands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [] } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models"],
  });

  // Query per magazzini accessibili
  const { data: accessibleWarehouses = [] } = useQuery<AccessibleWarehouse[]>({
    queryKey: ["/api/warehouses/accessible"],
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
      toast({ title: t("products.brandCreated"), description: `"${newBrand.name}" aggiunto con successo` });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.modelCreated"), description: `"${newModel.modelName}" aggiunto con successo` });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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

  const createMutation = useMutation({
    mutationFn: async (data: { product: any; specs: any; imageFile?: File | null; compatibleDeviceModelIds?: string[]; supplierId?: string }) => {
      let createdProduct;
      if (data.imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("product", JSON.stringify(data.product));
        formDataUpload.append("specs", JSON.stringify(data.specs));
        formDataUpload.append("compatibleDeviceModelIds", JSON.stringify(data.compatibleDeviceModelIds || []));
        formDataUpload.append("image", data.imageFile);
        const response = await fetch("/api/accessories", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!response.ok) throw new Error(await response.text());
        createdProduct = await response.json();
      } else {
        const res = await apiRequest("POST", "/api/accessories", { 
          product: data.product, 
          specs: data.specs,
          compatibleDeviceModelIds: data.compatibleDeviceModelIds || []
        });
        createdProduct = res;
      }
      
      // Save supplier if provided
      if (data.supplierId && createdProduct?.id) {
        try {
          await fetch(`/api/products/${createdProduct.id}/suppliers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ supplierId: data.supplierId, isPreferred: true }),
          });
        } catch (e) {
          // Ignore supplier errors
        }
      }
      return createdProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: t("products.accessoryAdded"), description: t("products.accessoryAddedDesc") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => {
      await apiRequest("PATCH", `/api/accessories/${productId}`, { 
        product: data.product, 
        specs: data.specs,
        compatibleDeviceModelIds: data.compatibleDeviceModelIds || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setDialogOpen(false);
      setEditingAccessory(null);
      setEditStock([]);
      resetForm();
      toast({ title: "Accessorio aggiornato", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  // Mutation per aggiornare stock
  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, warehouseId, quantity }: { productId: string; warehouseId: string; quantity: number }) => {
      return apiRequest("POST", `/api/reseller/products/${productId}/stock`, { warehouseId, quantity });
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
      toast({ title: t("pages.deleted"), description: "L'accessorio è stato rimosso dal catalogo." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  // Marketplace mutation
  const updateMarketplaceMutation = useMutation({
    mutationFn: async ({ productId, enabled, priceCents, minQuantity }: { productId: string; enabled: boolean; priceCents: number | null; minQuantity: number }) => {
      return apiRequest("PATCH", `/api/accessories/${productId}/marketplace`, { enabled, priceCents, minQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      setMarketplaceDialogOpen(false);
      setMarketplaceProduct(null);
      toast({ title: "Salvato", description: "Impostazioni Marketplace aggiornate." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  
  const openMarketplaceDialog = (product: AccessoryWithSpecs) => {
    setMarketplaceProduct(product);
    setMarketplaceEnabled((product as any).isMarketplaceEnabled || false);
    setMarketplacePrice((product as any).marketplacePriceCents ? ((product as any).marketplacePriceCents / 100).toString() : "");
    setMarketplaceMinQty(((product as any).marketplaceMinQuantity || 1).toString());
    setMarketplaceDialogOpen(true);
  };

  const saveMarketplaceSettings = () => {
    if (!marketplaceProduct) return;
    const priceCents = marketplacePrice ? Math.round(parseFloat(marketplacePrice) * 100) : null;
    const minQuantity = parseInt(marketplaceMinQty) || 1;
    updateMarketplaceMutation.mutate({ productId: marketplaceProduct.id, enabled: marketplaceEnabled, priceCents, minQuantity });
  };

  const formatCurrency = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
        toast({ title: t("common.error"), description: "Formato non supportato. Usa JPEG, PNG, WebP o GIF.", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: t("common.error"), description: "Immagine troppo grande. Max 10MB.", variant: "destructive" });
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
      const response = await fetch(`/api/reseller/products/${productId}/image`, {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({ title: t("products.imageUploaded"), description: t("products.imageSaved") });
    } catch (error: any) {
      toast({ title: t("tickets.uploadError"), description: error.message, variant: "destructive" });
    } finally {
      setUploadingImage(false);
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const deleteImage = async (productId: string) => {
    try {
      const response = await fetch(`/api/reseller/products/${productId}/image`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/accessories"] });
      toast({ title: t("products.imageRemoved") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setDeviceCompatibilities([]);
    setExpandedBrands(new Set());
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
      supplierId: "",
    });
  };

  const openEditDialog = async (accessory: AccessoryWithSpecs) => {
    setEditingAccessory(accessory);
    setImageFile(null);
    setImagePreview(accessory.imageUrl || null);
    setExpandedBrands(new Set());
    setLoadingEditStock(true);
    setEditStock([]);
    // Extract device compatibilities from existing data
    const existingCompatibilities: DeviceCompatibilityEntry[] = (accessory.deviceCompatibilities || []).map(dc => ({
      deviceBrandId: dc.deviceBrandId,
      deviceModelId: dc.deviceModelId,
      brandName: dc.deviceBrandName || dc.deviceBrand?.name,
      modelName: dc.deviceModelName || dc.deviceModel?.modelName
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
      supplierId: accessory.supplier?.id || "",
    });
    setDialogOpen(true);
    
    // Load stock for this product
    try {
      const res = await fetch(`/api/reseller/products/${accessory.id}/stock`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data: WarehouseStock[] = await res.json();
        setEditStock(data.map(s => ({
          warehouseId: s.warehouseId,
          warehouseName: s.warehouseName,
          ownerType: s.ownerType,
          ownerName: s.ownerName,
          quantity: s.quantity,
          originalQuantity: s.quantity
        })));
      } else {
        setEditStock([]);
      }
    } catch (error) {
      setEditStock([]);
    } finally {
      setLoadingEditStock(false);
    }
  };
  
  // Stock helper functions
  const addEditStock = (warehouseId: string) => {
    const warehouse = accessibleWarehouses.find(w => w.id === warehouseId);
    if (!warehouse) {
      toast({ title: t("common.error"), description: "Magazzino non trovato", variant: "destructive" });
      return;
    }
    setEditStock(prev => {
      if (prev.find(s => s.warehouseId === warehouseId)) return prev;
      return [...prev, { 
        warehouseId, 
        warehouseName: warehouse.name,
        ownerType: warehouse.ownerType as 'reseller' | 'sub_reseller' | 'repair_center',
        ownerName: warehouse.owner?.fullName || warehouse.owner?.username || '',
        quantity: 0, 
        originalQuantity: 0 
      }];
    });
  };

  const updateEditStock = (warehouseId: string, quantity: number) => {
    setEditStock(prev => prev.map(s => 
      s.warehouseId === warehouseId ? { ...s, quantity } : s
    ));
  };

  const removeEditStock = (warehouseId: string) => {
    setEditStock(prev => prev.filter(s => s.warehouseId !== warehouseId));
  };

  const handleSubmit = async () => {
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
    // For brand-level selections (no specific model), expand to all models for that brand
    let compatibleDeviceModelIds: string[] = [];
    if (!formData.isUniversal) {
      deviceCompatibilities.forEach(c => {
        if (c.deviceModelId) {
          // Specific model selected
          compatibleDeviceModelIds.push(c.deviceModelId);
        } else {
          // Brand-level selection - add all models for this brand
          const brandModels = getModelsForBrand(c.deviceBrandId);
          brandModels.forEach(m => {
            if (!compatibleDeviceModelIds.includes(m.id)) {
              compatibleDeviceModelIds.push(m.id);
            }
          });
        }
      });
    }

    if (editingAccessory) {
      const productId = editingAccessory.id;
      const currentEditStock = [...editStock];
      
      try {
        await updateMutation.mutateAsync({ productId, data: { product, specs, compatibleDeviceModelIds } });
        
        // Update or remove supplier
        try {
          if (formData.supplierId) {
            await fetch(`/api/products/${productId}/suppliers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ supplierId: formData.supplierId, isPreferred: true }),
            });
          } else {
            // Remove all suppliers when "Nessun fornitore" is selected
            await fetch(`/api/products/${productId}/suppliers`, {
              method: "DELETE",
              credentials: "include",
            });
          }
        } catch (supplierError) {
          // Silently ignore supplier errors
        }
        
        // Update stock for each warehouse that changed
        const stockToUpdate = currentEditStock.filter(s => s.quantity !== s.originalQuantity);
        if (stockToUpdate.length > 0) {
          try {
            await Promise.all(stockToUpdate.map(s => 
              updateStockMutation.mutateAsync({
                productId: productId,
                warehouseId: s.warehouseId,
                quantity: s.quantity,
              })
            ));
          } catch (stockError: any) {
            toast({ 
              title: t("common.warning"), 
              description: "Accessorio salvato ma alcune giacenze non sono state aggiornate", 
              variant: "destructive" 
            });
          }
        }
      } catch (error) {
        // Error handled by mutation
      }
    } else {
      createMutation.mutate({ product, specs, imageFile, compatibleDeviceModelIds, supplierId: formData.supplierId || undefined });
    }
  };

  const filteredAccessories = accessories.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || a.specs?.accessoryType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getAccessoryTypeInfo = (type: string | null | undefined) => {
    return ACCESSORY_TYPES.find(t => t.value === type) || ACCESSORY_TYPES.find(t => t.value === "altro");
  };

  const toggleCompatibleBrand = (brand: string) => {
    setFormData(prev => {
      const brands = prev.compatibleBrands.includes(brand)
        ? prev.compatibleBrands.filter(b => b !== brand)
        : [...prev.compatibleBrands, brand];
      return { ...prev, compatibleBrands: brands };
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t("products.accessoryCatalog")}</h1>
              <p className="text-sm text-white/80">Gestisci cover, caricatori, cavi, auricolari e altri accessori</p>
            </div>
          </div>
          <Button onClick={() => setWizardOpen(true)} variant="secondary" className="bg-white/20 backdrop-blur-sm border border-white/30 text-white" data-testid="button-add-accessory">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Accessorio
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Lista Accessori ({filteredAccessories.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2 flex-wrap">
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
                <SelectValue placeholder={t("common.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allTypes")}</SelectItem>
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
              <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>{t("products.noAccessories")}</p>
              <p className="text-sm">Clicca "Aggiungi Accessorio" per iniziare</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="min-w-[1000px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("common.photo")}</TableHead>
                    <TableHead>{t("products.accessory")}</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>{t("common.type")}</TableHead>
                    <TableHead>{t("products.compatibility")}</TableHead>
                    <TableHead>{t("products.material")}</TableHead>
                    <TableHead>{t("common.supplier")}</TableHead>
                    <TableHead className="text-right">{t("common.price")}</TableHead>
                    <TableHead className="text-center">{t("marketplace.title")}</TableHead>
                    <TableHead className="w-24">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccessories.map((accessory) => {
                    const typeInfo = getAccessoryTypeInfo(accessory.specs?.accessoryType);
                    const TypeIcon = typeInfo?.icon || Package;
                    return (
                      <TableRow key={accessory.id} data-testid={`row-accessory-${accessory.id}`}>
                        <TableCell>
                          {accessory.imageUrl ? (
                            <img
                              src={accessory.imageUrl}
                              alt={accessory.name}
                              className="h-12 w-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{accessory.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {accessory.brand && `${accessory.brand} • `}
                              {accessory.specs?.color || accessory.color}
                            </div>
                            <div className="text-xs text-muted-foreground">SKU: {accessory.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BarcodeDisplay value={accessory.barcode || ""} size="sm" />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{typeInfo?.label || accessory.specs?.accessoryType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {accessory.specs?.isUniversal ? (
                            <Badge variant="secondary">{t("products.universal")}</Badge>
                          ) : accessory.deviceCompatibilities && accessory.deviceCompatibilities.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {accessory.deviceCompatibilities.slice(0, 3).map((dc, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {dc.deviceBrandName}{dc.deviceModelName ? ` ${dc.deviceModelName}` : " (tutti)"}
                                </Badge>
                              ))}
                              {accessory.deviceCompatibilities.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{accessory.deviceCompatibilities.length - 3}</Badge>
                              )}
                            </div>
                          ) : accessory.specs?.compatibleBrands?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {accessory.specs.compatibleBrands.slice(0, 3).map(b => (
                                <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                              ))}
                              {accessory.specs.compatibleBrands.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{accessory.specs.compatibleBrands.length - 3}</Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{accessory.specs?.material || "-"}</span>
                        </TableCell>
                        <TableCell>
                          {accessory.supplier ? (
                            <Badge variant="outline" className="text-xs">{accessory.supplier.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          €{(accessory.unitPrice / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {(accessory as any).isOwn ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => openMarketplaceDialog(accessory)}
                                  data-testid={`button-marketplace-accessory-${accessory.id}`}
                                >
                                  <Store className="h-3 w-3" />
                                  {(accessory as any).isMarketplaceEnabled ? (
                                    <Badge variant="default" className="text-xs">{t("common.active")}</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">Off</Badge>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Configura vendita su Marketplace P2P</TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
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
                    );
                  })}
                </TableBody>
              </Table>
              </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome accessorio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. Cover Silicone iPhone 15"
                  data-testid="input-accessory-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="es. CVR-IP15-BLK"
                  data-testid="input-accessory-sku"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessoryType">Tipo Accessorio *</Label>
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
                <Label htmlFor="brand">{t("products.brand")}</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger data-testid="select-accessory-brand">
                    <SelectValue placeholder={t("products.selectBrand")} />
                  </SelectTrigger>
                  <SelectContent>
                    {BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">{t("products.condition")}</Label>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">{t("products.color")}</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                  <SelectTrigger data-testid="select-accessory-color">
                    <SelectValue placeholder={t("products.selectColor")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">{t("products.material")}</Label>
                <Select value={formData.material} onValueChange={(v) => setFormData({ ...formData, material: v })}>
                  <SelectTrigger data-testid="select-accessory-material">
                    <SelectValue placeholder={t("products.selectMaterial")} />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isUniversal"
                  checked={formData.isUniversal}
                  onCheckedChange={(checked) => setFormData({ ...formData, isUniversal: checked as boolean })}
                  data-testid="checkbox-accessory-universal"
                />
                <Label htmlFor="isUniversal" className="text-sm cursor-pointer">
                  Compatibile con tutti i dispositivi (universale)
                </Label>
              </div>
            </div>

            {!formData.isUniversal && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("products.compatibleDevices")}</Label>
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
                      <Plus className="h-3 w-3 mr-1" />{t("products.model")}</Button>
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
                            <div className="flex flex-wrap items-center gap-2 p-2 hover-elevate">
                              <Checkbox
                                checked={hasAnyCompatibility}
                                onCheckedChange={() => toggleBrandCompatibility(brand.id)}
                                data-testid={`checkbox-brand-${brand.id}`}
                              />
                              <button
                                type="button"
                                onClick={() => toggleBrandExpansion(brand.id)}
                                className="flex flex-wrap items-center gap-1 flex-1 text-left"
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
                                    <div key={model.id} className="flex flex-wrap items-center gap-2 p-1 hover-elevate rounded">
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
                    {deviceCompatibilities.map((c, idx) => (
                      <Badge key={idx} variant="secondary">
                        {c.brandName || "?"}{c.modelName ? ` - ${c.modelName}` : " (tutti)"}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Prezzo Vendita *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="es. 19.90"
                  data-testid="input-accessory-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Prezzo Costo</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="es. 8.00"
                  data-testid="input-accessory-cost"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">{t("products.warrantyMonths")}</Label>
                <Input
                  id="warrantyMonths"
                  type="number"
                  value={formData.warrantyMonths}
                  onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                  placeholder="12"
                  data-testid="input-accessory-warranty"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">{t("products.preferredSupplier")}</Label>
              <Select value={formData.supplierId || "none"} onValueChange={(v) => setFormData({ ...formData, supplierId: v === "none" ? "" : v })}>
                <SelectTrigger data-testid="select-accessory-supplier">
                  <SelectValue placeholder="Seleziona fornitore (opzionale)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("products.productDescription")}
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
                placeholder={t("products.internalNotes")}
                rows={2}
                data-testid="textarea-accessory-notes"
              />
            </div>

            <div className="space-y-2">
                <Label>Immagine prodotto</Label>
                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-24 w-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                        data-testid="button-cancel-image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : editingAccessory?.imageUrl ? (
                    <div className="relative">
                      <img
                        src={editingAccessory.imageUrl}
                        alt="Existing"
                        className="h-24 w-24 object-cover rounded-lg border"
                      />
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
                    <div
                      className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
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

            {/* Sezione Magazzino - solo in modifica */}
            {editingAccessory && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Giacenza Magazzini
                  </Label>
                  <Select
                    value=""
                    onValueChange={(val) => addEditStock(val)}
                  >
                    <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-add-warehouse">
                      <SelectValue placeholder={t("warehouse.addWarehouse")} />
                    </SelectTrigger>
                    <SelectContent>
                      {accessibleWarehouses
                        .filter(w => !editStock.find(s => s.warehouseId === w.id))
                        .map(w => (
                          <SelectItem key={w.id} value={w.id} data-testid={`option-warehouse-${w.id}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              {w.ownerType === 'reseller' && <User className="h-3 w-3 text-blue-500" />}
                              {w.ownerType === 'sub_reseller' && <Store className="h-3 w-3 text-green-500" />}
                              {w.ownerType === 'repair_center' && <WrenchIcon className="h-3 w-3 text-orange-500" />}
                              {w.name}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingEditStock ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Caricamento giacenze...</span>
                  </div>
                ) : editStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">
                    Nessuna giacenza configurata. Seleziona un magazzino per aggiungere stock.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editStock.map((stock) => (
                      <div 
                        key={stock.warehouseId} 
                        className="flex flex-wrap items-center gap-3 p-2 rounded-md border bg-muted/30"
                        data-testid={`stock-row-${stock.warehouseId}`}
                      >
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                          {stock.ownerType === 'reseller' && <User className="h-4 w-4 text-blue-500 shrink-0" />}
                          {stock.ownerType === 'sub_reseller' && <Store className="h-4 w-4 text-green-500 shrink-0" />}
                          {stock.ownerType === 'repair_center' && <WrenchIcon className="h-4 w-4 text-orange-500 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{stock.warehouseName}</p>
                            <p className="text-xs text-muted-foreground truncate">{stock.ownerName}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateEditStock(stock.warehouseId, Math.max(0, stock.quantity - 1))}
                            data-testid={`button-decrease-${stock.warehouseId}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            value={stock.quantity}
                            onChange={(e) => updateEditStock(stock.warehouseId, Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 text-center"
                            data-testid={`input-quantity-${stock.warehouseId}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateEditStock(stock.warehouseId, stock.quantity + 1)}
                            data-testid={`button-increase-${stock.warehouseId}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeEditStock(stock.warehouseId)}
                            data-testid={`button-remove-${stock.warehouseId}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {stock.quantity !== stock.originalQuantity && (
                          <span className="text-xs text-muted-foreground">
                            (era: {stock.originalQuantity})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingAccessory(null); }}>{t("common.cancel")}</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || !formData.unitPrice || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-accessory"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingAccessory ? t("profile.saveChanges") : t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.teams.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{accessoryToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t("common.cancel")}</Button>
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

      <Dialog open={newBrandDialogOpen} onOpenChange={setNewBrandDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("products.newDeviceBrand")}</DialogTitle>
            <DialogDescription>
              Crea un nuovo brand di dispositivo per le compatibilità accessori
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newBrandName">{t("products.brandName")}</Label>
              <Input
                id="newBrandName"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="es. Apple, Samsung, Xiaomi..."
                data-testid="input-new-brand-name"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewBrandDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={!newBrandName.trim() || createBrandMutation.isPending} data-testid="button-create-brand">
                {createBrandMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crea Brand
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newModelDialogOpen} onOpenChange={setNewModelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("products.newDeviceModel")}</DialogTitle>
            <DialogDescription>{t("products.addNewDeviceModel")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateModel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelBrand">Brand</Label>
              <Select value={newModelBrandId} onValueChange={setNewModelBrandId}>
                <SelectTrigger data-testid="select-model-brand">
                  <SelectValue placeholder="Seleziona brand" />
                </SelectTrigger>
                <SelectContent>
                  {deviceBrands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newModelName">{t("products.modelName")}</Label>
              <Input
                id="newModelName"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="es. iPhone 15 Pro, Galaxy S24 Ultra..."
                data-testid="input-new-model-name"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewModelDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button 
                type="submit" 
                disabled={!newModelName.trim() || !newModelBrandId || createModelMutation.isPending}
                data-testid="button-create-model"
              >
                {createModelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crea Modello
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Marketplace Settings */}
      <Dialog open={marketplaceDialogOpen} onOpenChange={setMarketplaceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Store className="h-5 w-5" />
              Impostazioni Marketplace P2P
            </DialogTitle>
            <DialogDescription>
              Configura la vendita di questo accessorio ad altri rivenditori nel marketplace.
            </DialogDescription>
          </DialogHeader>
          {marketplaceProduct && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{marketplaceProduct.name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {marketplaceProduct.sku}</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Attivo su Marketplace</Label>
                  <p className="text-sm text-muted-foreground">
                    Rendi visibile questo prodotto agli altri rivenditori
                  </p>
                </div>
                <Switch
                  checked={marketplaceEnabled}
                  onCheckedChange={setMarketplaceEnabled}
                  data-testid="switch-marketplace-accessory-enabled"
                />
              </div>
              
              {marketplaceEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="marketplace-accessory-price">Prezzo Marketplace (opzionale)</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground">€</span>
                      <Input
                        id="marketplace-accessory-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={`Default: ${formatCurrency(marketplaceProduct.unitPrice)}`}
                        value={marketplacePrice}
                        onChange={(e) => setMarketplacePrice(e.target.value)}
                        data-testid="input-marketplace-accessory-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Se vuoto, verrà usato il prezzo standard del prodotto
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marketplace-accessory-min-qty">Quantità Minima Ordine</Label>
                    <Input
                      id="marketplace-accessory-min-qty"
                      type="number"
                      min="1"
                      value={marketplaceMinQty}
                      onChange={(e) => setMarketplaceMinQty(e.target.value)}
                      data-testid="input-marketplace-accessory-min-qty"
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMarketplaceDialogOpen(false)}
              data-testid="button-cancel-marketplace-accessory"
            >{t("common.cancel")}</Button>
            <Button
              onClick={saveMarketplaceSettings}
              disabled={updateMarketplaceMutation.isPending}
              data-testid="button-save-marketplace-accessory"
            >
              {updateMarketplaceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />{t("profile.saving")}</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />{t("common.save")}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AccessoryWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        userRole="reseller"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/reseller/accessories"] });
        }}
      />
    </div>
  );
}
