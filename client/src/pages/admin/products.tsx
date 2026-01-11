import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Product, InsertProduct, Supplier, ProductSupplier, InsertProductSupplier, DeviceType, DeviceBrand, DeviceModel } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarcodeDisplay } from "@/components/barcode-display";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Pencil, Trash2, Package, Warehouse, AlertTriangle, X, Building2, Star, StarOff, Users, Smartphone, Check, ChevronDown, ImageIcon, Upload, Loader2, Store, EyeOff, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductDetailDialog } from "@/components/product-detail-dialog";
import { Info } from "lucide-react";

interface InitialStockEntry {
  warehouseId: string;
  quantity: number;
  location?: string;
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

interface ProductWithStock {
  product: Product;
  stockByWarehouse: Array<{ warehouseId: string; warehouseName: string; ownerType: string; ownerName: string; quantity: number }>;
  totalStock: number;
  compatibilities: Array<{ brandId: string; brandName: string; modelId: string | null; modelName: string | null }>;
}

interface ProductSupplierWithDetails extends Omit<ProductSupplier, 'supplierName'> {
  supplierName?: string | null;
}

interface DeviceCompatibilityEntry {
  deviceBrandId: string;
  deviceModelId?: string | null;
}

interface DeviceCompatibilityWithNames extends DeviceCompatibilityEntry {
  id: string;
  brandName?: string;
  modelName?: string | null;
}

const CATEGORIES = [
  { value: "display", label: "Display/Schermo" },
  { value: "batteria", label: "Batteria" },
  { value: "scheda_madre", label: "Scheda Madre" },
  { value: "fotocamera", label: "Fotocamera" },
  { value: "altoparlante", label: "Altoparlante/Speaker" },
  { value: "microfono", label: "Microfono" },
  { value: "connettore", label: "Connettore Ricarica" },
  { value: "tasto", label: "Tasti/Pulsanti" },
  { value: "cover", label: "Cover/Scocca" },
  { value: "vetro", label: "Vetro Posteriore" },
  { value: "sensore", label: "Sensori" },
  { value: "flex", label: "Flat/Flex Cable" },
  { value: "antenna", label: "Antenna" },
  { value: "vibrazione", label: "Motore Vibrazione" },
  { value: "sim_tray", label: "Carrello SIM" },
  { value: "accessorio", label: "Accessorio" },
  { value: "altro", label: "Altro" },
];

const BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "Vivo", "OnePlus",
  "Google", "Motorola", "LG", "Sony", "Nokia", "Realme", "Honor",
  "ASUS", "Lenovo", "HP", "Dell", "Acer", "Microsoft", "Universale", "Altro"
];

const COLORS = [
  "Nero", "Bianco", "Argento", "Oro", "Blu", "Verde", "Rosso",
  "Viola", "Rosa", "Grigio", "Trasparente", "Altro"
];

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [initialStock, setInitialStock] = useState<InitialStockEntry[]>([]);
  const [editStock, setEditStock] = useState<Array<{ warehouseId: string; warehouseName: string; ownerType: string; ownerName: string; quantity: number; originalQuantity: number; location: string; originalLocation: string }>>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [productSuppliers, setProductSuppliers] = useState<ProductSupplierWithDetails[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingProductSupplier, setEditingProductSupplier] = useState<ProductSupplierWithDetails | null>(null);
  const [resellerPricesDialogOpen, setResellerPricesDialogOpen] = useState(false);
  const [selectedProductForPricing, setSelectedProductForPricing] = useState<Product | null>(null);
  const [resellerPrices, setResellerPrices] = useState<Array<{
    reseller: { id: string; username: string; fullName: string | null; email: string };
    customPrice: { id: string; priceCents: number; costPriceCents: number | null } | null;
    defaultPrice: number;
    effectivePrice: number;
  }>>([]);
  const [isLoadingResellerPrices, setIsLoadingResellerPrices] = useState(false);
  const [deviceCompatibilities, setDeviceCompatibilities] = useState<DeviceCompatibilityEntry[]>([]);
  const [editDeviceCompatibilities, setEditDeviceCompatibilities] = useState<DeviceCompatibilityWithNames[]>([]);
  const [isLoadingCompatibilities, setIsLoadingCompatibilities] = useState(false);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [newBrandDialogOpen, setNewBrandDialogOpen] = useState(false);
  const [newModelDialogOpen, setNewModelDialogOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newModelBrandId, setNewModelBrandId] = useState<string>("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [newProductCategory, setNewProductCategory] = useState<string>("display");
  const [newProductType, setNewProductType] = useState<string>("ricambio");
  const [newProductCondition, setNewProductCondition] = useState<string>("nuovo");
  const [newProductName, setNewProductName] = useState<string>("");
  const [newProductSku, setNewProductSku] = useState<string>("");
  const [newProductUnitPrice, setNewProductUnitPrice] = useState<string>("");
  const [newProductCostPrice, setNewProductCostPrice] = useState<string>("");
  const [newProductDescription, setNewProductDescription] = useState<string>("");
  const [newProductBrand, setNewProductBrand] = useState<string>("");
  const [newProductColor, setNewProductColor] = useState<string>("");
  const [newProductDeviceTypeId, setNewProductDeviceTypeId] = useState<string>("all");
  const [newProductWarrantyMonths, setNewProductWarrantyMonths] = useState<string>("");
  const [newProductMinStock, setNewProductMinStock] = useState<string>("");
  const [newProductLocation, setNewProductLocation] = useState<string>("");
  const [newProductSupplierCode, setNewProductSupplierCode] = useState<string>("");
  const { toast } = useToast();

  const { data: productsWithStock = [], isLoading } = useQuery<ProductWithStock[]>({
    queryKey: ["/api/products/with-stock"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: deviceTypes = [] } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const { data: deviceBrands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
  });

  const { data: deviceModels = [] } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models"],
  });

  const { data: warehouses = [] } = useQuery<WarehouseForStock[]>({
    queryKey: ["/api/admin/all-warehouses"],
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct & { initialStock?: InitialStockEntry[]; deviceCompatibilities?: DeviceCompatibilityEntry[] }) => {
      const { deviceCompatibilities: compatibilities, ...productData } = data;
      const res = await apiRequest("POST", "/api/products", productData);
      const product = await res.json();
      
      // Save device compatibilities if any
      if (compatibilities && compatibilities.length > 0) {
        await apiRequest("PUT", `/api/products/${product.id}/compatibilities`, { 
          compatibilities 
        });
      }
      
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-warehouse"] });
      setDialogOpen(false);
      setInitialStock([]);
      setDeviceCompatibilities([]);
      setSelectedSupplierId("");
      toast({ title: "Prodotto creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data, deviceCompatibilities: compatibilities }: { id: string; data: Partial<Product>; deviceCompatibilities?: DeviceCompatibilityEntry[] }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, data);
      const product = await res.json();
      
      // Save device compatibilities (including empty array to clear them)
      if (compatibilities !== undefined) {
        await apiRequest("PUT", `/api/products/${id}/compatibilities`, { 
          compatibilities 
        });
      }
      
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      setEditDialogOpen(false);
      setEditingProduct(null);
      setEditDeviceCompatibilities([]);
      toast({ title: "Prodotto aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, warehouseId, quantity, location }: { productId: string; warehouseId: string; quantity: number; location?: string }) => {
      const res = await apiRequest("POST", `/api/products/${productId}/warehouse-stock`, { warehouseId, quantity, location });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-warehouse"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
      toast({ title: "Quantità aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      toast({ title: "Prodotto eliminato" });
    },
  });

  const toggleShopVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisibleInShop }: { id: string; isVisibleInShop: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}/visibility`, { isVisibleInShop });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      toast({ 
        title: variables.isVisibleInShop ? "Prodotto visibile nello shop" : "Prodotto nascosto dallo shop"
      });
    },
    onError: () => {
      toast({ title: "Errore", description: "Impossibile modificare la visibilità", variant: "destructive" });
    },
  });

  const updateResellerPriceMutation = useMutation({
    mutationFn: async (data: { productId: string; resellerId: string; priceCents: number; costPriceCents?: number }) => {
      const res = await apiRequest("POST", "/api/admin/product-prices", data);
      return await res.json();
    },
    onSuccess: () => {
      if (selectedProductForPricing) {
        loadResellerPrices(selectedProductForPricing.id);
      }
      toast({ title: "Prezzo aggiornato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteResellerPriceMutation = useMutation({
    mutationFn: async (priceId: string) => {
      await apiRequest("DELETE", `/api/admin/product-prices/${priceId}`);
    },
    onSuccess: () => {
      if (selectedProductForPricing) {
        loadResellerPrices(selectedProductForPricing.id);
      }
      toast({ title: "Prezzo personalizzato rimosso" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/admin/products/${productId}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Errore upload immagine");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      if (editingProduct && data.imageUrl) {
        setEditingProduct({ ...editingProduct, imageUrl: data.imageUrl });
      }
      toast({ title: "Immagine caricata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore upload", description: error.message, variant: "destructive" });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/admin/products/${productId}/image`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Errore eliminazione immagine");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      if (editingProduct) {
        setEditingProduct({ ...editingProduct, imageUrl: null });
      }
      toast({ title: "Immagine eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = (productId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate({ productId, file });
    }
  };

  const loadResellerPrices = async (productId: string) => {
    setIsLoadingResellerPrices(true);
    try {
      const res = await apiRequest("GET", `/api/admin/products/${productId}/reseller-prices`);
      const data = await res.json();
      setResellerPrices(data);
    } catch (error) {
      toast({ title: "Errore nel caricamento prezzi reseller", variant: "destructive" });
    } finally {
      setIsLoadingResellerPrices(false);
    }
  };

  const openResellerPricesDialog = async (product: Product) => {
    setSelectedProductForPricing(product);
    setResellerPricesDialogOpen(true);
    await loadResellerPrices(product.id);
  };

  const createProductSupplierMutation = useMutation({
    mutationFn: async (data: InsertProductSupplier) => {
      const res = await apiRequest("POST", "/api/product-suppliers", data);
      return await res.json();
    },
    onSuccess: () => {
      if (editingProduct) {
        loadProductSuppliers(editingProduct.id);
      }
      setSupplierDialogOpen(false);
      setEditingProductSupplier(null);
      toast({ title: "Fornitore associato al prodotto" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateProductSupplierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProductSupplier> }) => {
      const res = await apiRequest("PATCH", `/api/product-suppliers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      if (editingProduct) {
        loadProductSuppliers(editingProduct.id);
      }
      setSupplierDialogOpen(false);
      setEditingProductSupplier(null);
      toast({ title: "Associazione aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteProductSupplierMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/product-suppliers/${id}`);
    },
    onSuccess: () => {
      if (editingProduct) {
        loadProductSuppliers(editingProduct.id);
      }
      toast({ title: "Fornitore rimosso dal prodotto" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const loadProductSuppliers = async (productId: string) => {
    setIsLoadingSuppliers(true);
    try {
      const res = await apiRequest("GET", `/api/product-suppliers?productId=${productId}`);
      const data = await res.json();
      const enrichedData = data.map((ps: ProductSupplier) => ({
        ...ps,
        supplierName: suppliers.find(s => s.id === ps.supplierId)?.name || "Fornitore sconosciuto"
      }));
      setProductSuppliers(enrichedData);
    } catch {
      setProductSuppliers([]);
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  const loadDeviceCompatibilities = async (productId: string) => {
    setIsLoadingCompatibilities(true);
    try {
      const res = await apiRequest("GET", `/api/products/${productId}/compatibilities`);
      const data = await res.json();
      setEditDeviceCompatibilities(data);
    } catch {
      setEditDeviceCompatibilities([]);
    } finally {
      setIsLoadingCompatibilities(false);
    }
  };

  const saveDeviceCompatibilitiesMutation = useMutation({
    mutationFn: async ({ productId, compatibilities }: { productId: string; compatibilities: DeviceCompatibilityEntry[] }) => {
      const res = await apiRequest("PUT", `/api/products/${productId}/compatibilities`, { compatibilities });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Compatibilità dispositivi salvate" });
    },
    onError: (error: Error) => {
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
      // Auto-expand the brand to show the new model
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

  const toggleBrandCompatibility = (brandId: string, isEdit: boolean) => {
    if (isEdit) {
      const hasAnyFromBrand = editDeviceCompatibilities.some(c => c.deviceBrandId === brandId);
      if (hasAnyFromBrand) {
        setEditDeviceCompatibilities(editDeviceCompatibilities.filter(c => c.deviceBrandId !== brandId));
      } else {
        const brand = deviceBrands.find(b => b.id === brandId);
        setEditDeviceCompatibilities([...editDeviceCompatibilities, {
          id: `temp-${Date.now()}`,
          deviceBrandId: brandId,
          deviceModelId: null,
          brandName: brand?.name,
          modelName: null
        }]);
      }
    } else {
      const hasAnyFromBrand = deviceCompatibilities.some(c => c.deviceBrandId === brandId);
      if (hasAnyFromBrand) {
        setDeviceCompatibilities(deviceCompatibilities.filter(c => c.deviceBrandId !== brandId));
      } else {
        setDeviceCompatibilities([...deviceCompatibilities, { deviceBrandId: brandId, deviceModelId: null }]);
      }
    }
  };

  const toggleModelCompatibility = (brandId: string, modelId: string, isEdit: boolean) => {
    if (isEdit) {
      const exists = editDeviceCompatibilities.some(c => c.deviceBrandId === brandId && c.deviceModelId === modelId);
      if (exists) {
        setEditDeviceCompatibilities(editDeviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && c.deviceModelId === modelId)));
      } else {
        const brandOnly = editDeviceCompatibilities.find(c => c.deviceBrandId === brandId && !c.deviceModelId);
        if (brandOnly) {
          setEditDeviceCompatibilities(editDeviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && !c.deviceModelId)));
        }
        const brand = deviceBrands.find(b => b.id === brandId);
        const model = deviceModels.find(m => m.id === modelId);
        setEditDeviceCompatibilities([...editDeviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && !c.deviceModelId)), {
          id: `temp-${Date.now()}`,
          deviceBrandId: brandId,
          deviceModelId: modelId,
          brandName: brand?.name,
          modelName: model?.modelName
        }]);
      }
    } else {
      const exists = deviceCompatibilities.some(c => c.deviceBrandId === brandId && c.deviceModelId === modelId);
      if (exists) {
        setDeviceCompatibilities(deviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && c.deviceModelId === modelId)));
      } else {
        const brandOnly = deviceCompatibilities.find(c => c.deviceBrandId === brandId && !c.deviceModelId);
        if (brandOnly) {
          setDeviceCompatibilities(deviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && !c.deviceModelId)));
        }
        setDeviceCompatibilities([...deviceCompatibilities.filter(c => !(c.deviceBrandId === brandId && !c.deviceModelId)), { deviceBrandId: brandId, deviceModelId: modelId }]);
      }
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

  const getWarehouseLabel = (wh: WarehouseForStock) => {
    const typeLabels: Record<string, string> = {
      admin: 'Admin',
      reseller: 'Rivenditore',
      sub_reseller: 'Sotto-Rivenditore',
      repair_center: 'Centro Riparazione'
    };
    const ownerName = wh.owner?.fullName || wh.owner?.username || 'Sistema';
    return `${wh.name} (${typeLabels[wh.ownerType]} - ${ownerName})`;
  };

  const groupedWarehouses = {
    admin: warehouses.filter(w => w.ownerType === 'admin'),
    reseller: warehouses.filter(w => w.ownerType === 'reseller'),
    sub_reseller: warehouses.filter(w => w.ownerType === 'sub_reseller'),
    repair_center: warehouses.filter(w => w.ownerType === 'repair_center'),
  };

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
    setIsLoadingStock(true);
    setExpandedBrands(new Set()); // Reset expanded brands when opening dialog
    
    try {
      const res = await apiRequest("GET", `/api/products/${product.id}/warehouse-stocks`);
      const data = await res.json();
      const stockData = data.stocks || [];
      setEditStock(stockData.map((s: any) => ({
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse?.name || 'Sconosciuto',
        ownerType: s.warehouse?.ownerType || 'admin',
        ownerName: s.warehouse?.ownerName || 'Sistema',
        quantity: s.quantity,
        originalQuantity: s.quantity,
        location: s.location || '',
        originalLocation: s.location || ''
      })));
    } catch {
      setEditStock([]);
    } finally {
      setIsLoadingStock(false);
    }
    
    loadProductSuppliers(product.id);
    loadDeviceCompatibilities(product.id);
  };

  const handleSupplierSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(e.currentTarget);
    const purchasePriceValue = formData.get("purchasePrice") as string;
    
    const data: InsertProductSupplier = {
      productId: editingProduct.id,
      supplierId: formData.get("supplierId") as string,
      supplierCode: formData.get("supplierCode") as string || undefined,
      supplierName: formData.get("supplierName") as string || undefined,
      purchasePrice: purchasePriceValue ? Math.round(parseFloat(purchasePriceValue) * 100) : undefined,
      minOrderQty: formData.get("minOrderQty") ? parseInt(formData.get("minOrderQty") as string) : 1,
      packSize: formData.get("packSize") ? parseInt(formData.get("packSize") as string) : 1,
      leadTimeDays: formData.get("leadTimeDays") ? parseInt(formData.get("leadTimeDays") as string) : undefined,
      isPreferred: formData.get("isPreferred") === "true",
      isActive: true,
    };

    if (editingProductSupplier) {
      updateProductSupplierMutation.mutate({ id: editingProductSupplier.id, data });
    } else {
      createProductSupplierMutation.mutate(data);
    }
  };

  const openSupplierDialog = (ps?: ProductSupplierWithDetails) => {
    setEditingProductSupplier(ps || null);
    setSupplierDialogOpen(true);
  };

  const addEditStock = (warehouseId: string) => {
    const wh = warehouses.find(w => w.id === warehouseId);
    if (wh && !editStock.find(s => s.warehouseId === warehouseId)) {
      const ownerName = wh.owner?.fullName || wh.owner?.username || 'Sistema';
      setEditStock([...editStock, { 
        warehouseId, 
        warehouseName: wh.name,
        ownerType: wh.ownerType,
        ownerName,
        quantity: 0,
        originalQuantity: 0,
        location: '',
        originalLocation: ''
      }]);
    }
  };

  const updateEditStock = (warehouseId: string, quantity: number) => {
    setEditStock(editStock.map(s => 
      s.warehouseId === warehouseId ? { ...s, quantity } : s
    ));
  };

  const updateEditStockLocation = (warehouseId: string, location: string) => {
    setEditStock(editStock.map(s => 
      s.warehouseId === warehouseId ? { ...s, location } : s
    ));
  };

  const saveStockChange = async (warehouseId: string) => {
    if (!editingProduct) return;
    const stock = editStock.find(s => s.warehouseId === warehouseId);
    if (!stock) return;
    
    await updateStockMutation.mutateAsync({
      productId: editingProduct.id,
      warehouseId,
      quantity: stock.quantity,
      location: stock.location
    });
    setEditStock(editStock.map(s => 
      s.warehouseId === warehouseId ? { ...s, originalQuantity: stock.quantity, originalLocation: stock.location } : s
    ));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const data = {
      name: newProductName,
      sku: newProductSku,
      category: newProductCategory,
      productType: newProductType as any,
      description: newProductDescription || undefined,
      deviceTypeId: newProductDeviceTypeId && newProductDeviceTypeId !== "all" ? newProductDeviceTypeId : undefined,
      brand: newProductBrand || undefined,
      color: newProductColor || undefined,
      costPrice: newProductCostPrice ? Math.round(parseFloat(newProductCostPrice) * 100) : undefined,
      unitPrice: Math.round(parseFloat(newProductUnitPrice) * 100),
      condition: newProductCondition as any,
      warrantyMonths: newProductWarrantyMonths ? parseInt(newProductWarrantyMonths) : undefined,
      supplier: selectedSupplierId && selectedSupplierId !== 'none' 
        ? suppliers.find(s => s.id === selectedSupplierId)?.name 
        : undefined,
      supplierCode: newProductSupplierCode || undefined,
      minStock: newProductMinStock ? parseInt(newProductMinStock) : undefined,
      location: newProductLocation || undefined,
      initialStock: initialStock.filter(s => s.quantity > 0),
      deviceCompatibilities: deviceCompatibilities.length > 0 ? deviceCompatibilities : undefined,
      supplierId: selectedSupplierId && selectedSupplierId !== 'none' ? selectedSupplierId : undefined,
    };
    createProductMutation.mutate(data as any);
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(e.currentTarget);
    
    const costPriceValue = formData.get("costPrice") as string;
    const warrantyValue = formData.get("warrantyMonths") as string;
    const minStockValue = formData.get("minStock") as string;
    
    const editDeviceTypeIdValue = formData.get("deviceTypeId") as string;
    const data: Partial<Product> = {
      name: (formData.get("name") as string) || editingProduct.name,
      sku: (formData.get("sku") as string) || editingProduct.sku,
      category: (formData.get("category") as string) || editingProduct.category,
      productType: (formData.get("productType") as any) || editingProduct.productType,
      description: (formData.get("description") as string) || editingProduct.description || undefined,
      deviceTypeId: editDeviceTypeIdValue && editDeviceTypeIdValue !== "all" ? editDeviceTypeIdValue : null,
      brand: (formData.get("brand") as string) || editingProduct.brand || undefined,
      color: (formData.get("color") as string) || editingProduct.color || undefined,
      costPrice: costPriceValue ? Math.round(parseFloat(costPriceValue) * 100) : editingProduct.costPrice ?? undefined,
      unitPrice: (formData.get("unitPrice") as string) ? Math.round(parseFloat(formData.get("unitPrice") as string) * 100) : editingProduct.unitPrice,
      condition: (formData.get("condition") as any) || editingProduct.condition,
      warrantyMonths: warrantyValue ? parseInt(warrantyValue) : editingProduct.warrantyMonths ?? undefined,
      supplier: (formData.get("supplier") as string) || editingProduct.supplier || undefined,
      supplierCode: (formData.get("supplierCode") as string) || editingProduct.supplierCode || undefined,
      minStock: minStockValue ? parseInt(minStockValue) : editingProduct.minStock ?? undefined,
      location: (formData.get("location") as string) || editingProduct.location || undefined,
      isActive: formData.has("isActive") ? formData.get("isActive") === "true" : editingProduct.isActive,
    };
    
    // Map editDeviceCompatibilities to simplified format for API
    const deviceCompatibilitiesForApi: DeviceCompatibilityEntry[] = editDeviceCompatibilities.map(c => ({
      deviceBrandId: c.deviceBrandId,
      deviceModelId: c.deviceModelId || null
    }));
    
    updateProductMutation.mutate({ 
      id: editingProduct.id, 
      data,
      deviceCompatibilities: deviceCompatibilitiesForApi
    });
  };

  const filteredProducts = productsWithStock.filter(({ product }) => {
    // Mostra solo ricambi (escludi dispositivi e accessori)
    if (product.productType !== 'ricambio') return false;
    
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.brand?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return "-";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getConditionBadge = (condition: string | undefined) => {
    switch (condition) {
      case "nuovo": return <Badge variant="default">Nuovo</Badge>;
      case "ricondizionato": return <Badge variant="secondary">Ricondizionato</Badge>;
      case "usato": return <Badge variant="outline">Usato</Badge>;
      case "compatibile": return <Badge variant="outline">Compatibile</Badge>;
      default: return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  const getStockBadge = (totalStock: number, minStock: number | null | undefined) => {
    const min = minStock ?? 5;
    if (totalStock === 0) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Esaurito</Badge>;
    } else if (totalStock <= min) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" />Scorta Bassa</Badge>;
    }
    return <Badge variant="outline">{totalStock}</Badge>;
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
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ricambi</h1>
              <p className="text-sm text-muted-foreground">Gestisci il catalogo ricambi</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-4">
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setDeviceCompatibilities([]);
            setSelectedSupplierId("");
            setInitialStock([]);
            setNewProductCategory("display");
            setNewProductType("ricambio");
            setNewProductCondition("nuovo");
            setNewProductName("");
            setNewProductSku("");
            setNewProductUnitPrice("");
            setNewProductCostPrice("");
            setNewProductDescription("");
            setNewProductBrand("");
            setNewProductColor("");
            setNewProductDeviceTypeId("all");
            setNewProductWarrantyMonths("");
            setNewProductMinStock("");
            setNewProductLocation("");
            setNewProductSupplierCode("");
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-product">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Prodotto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Crea Nuovo Prodotto
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">Info Base</TabsTrigger>
                    <TabsTrigger value="compatibility">Compatibilità</TabsTrigger>
                    <TabsTrigger value="pricing">Prezzi</TabsTrigger>
                    <TabsTrigger value="inventory">Magazzino</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Prodotto *</Label>
                        <Input 
                          id="name" 
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          required 
                          placeholder="es. Display LCD iPhone 14"
                          data-testid="input-name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU/Codice *</Label>
                        <Input 
                          id="sku" 
                          value={newProductSku}
                          onChange={(e) => setNewProductSku(e.target.value)}
                          required 
                          placeholder="es. LCD-IP14-001"
                          data-testid="input-sku" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria *</Label>
                        <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                          <SelectTrigger id="category" data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productType">Tipo Prodotto *</Label>
                        <Select value={newProductType} onValueChange={setNewProductType}>
                          <SelectTrigger id="productType" data-testid="select-product-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ricambio">Ricambio</SelectItem>
                            <SelectItem value="accessorio">Accessorio</SelectItem>
                            <SelectItem value="dispositivo">Dispositivo</SelectItem>
                            <SelectItem value="consumabile">Consumabile</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="condition">Condizione *</Label>
                        <Select value={newProductCondition} onValueChange={setNewProductCondition}>
                          <SelectTrigger id="condition" data-testid="select-condition">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuovo">Nuovo Originale</SelectItem>
                            <SelectItem value="ricondizionato">Ricondizionato</SelectItem>
                            <SelectItem value="usato">Usato</SelectItem>
                            <SelectItem value="compatibile">Compatibile (aftermarket)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">Colore</Label>
                        <Select name="color">
                          <SelectTrigger id="color" data-testid="select-color">
                            <SelectValue placeholder="Seleziona colore" />
                          </SelectTrigger>
                          <SelectContent>
                            {COLORS.map(color => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrizione</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Descrizione dettagliata del prodotto..."
                        rows={3}
                        data-testid="textarea-description" 
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="compatibility" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="deviceTypeId">Tipo Dispositivo</Label>
                      <Select name="deviceTypeId">
                        <SelectTrigger id="deviceTypeId" data-testid="select-device-type">
                          <Smartphone className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Tutti i dispositivi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti i dispositivi</SelectItem>
                          {deviceTypes.map(dt => (
                            <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Categoria generale del dispositivo</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca</Label>
                      <Select name="brand">
                        <SelectTrigger id="brand" data-testid="select-brand">
                          <SelectValue placeholder="Seleziona marca" />
                        </SelectTrigger>
                        <SelectContent>
                          {BRANDS.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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
                        Seleziona i brand e modelli di dispositivo con cui questo ricambio è compatibile
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
                                      onCheckedChange={() => toggleBrandCompatibility(brand.id, false)}
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
                                              onCheckedChange={() => toggleModelCompatibility(brand.id, model.id, false)}
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
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="costPrice">Prezzo Acquisto (€)</Label>
                        <Input
                          id="costPrice"
                          value={newProductCostPrice}
                          onChange={(e) => setNewProductCostPrice(e.target.value)}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          data-testid="input-cost-price"
                        />
                        <p className="text-xs text-muted-foreground">Costo dal fornitore</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">Prezzo Vendita (€) *</Label>
                        <Input
                          id="unitPrice"
                          value={newProductUnitPrice}
                          onChange={(e) => setNewProductUnitPrice(e.target.value)}
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          data-testid="input-price"
                        />
                        <p className="text-xs text-muted-foreground">Prezzo al cliente</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warrantyMonths">Garanzia (mesi)</Label>
                      <Input
                        id="warrantyMonths"
                        name="warrantyMonths"
                        type="number"
                        min="0"
                        defaultValue="3"
                        placeholder="3"
                        data-testid="input-warranty"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="inventory" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Fornitore</Label>
                        <Select 
                          value={selectedSupplierId} 
                          onValueChange={setSelectedSupplierId}
                        >
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Seleziona fornitore..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nessun fornitore</SelectItem>
                            {suppliers.filter(s => s.isActive).map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplierCode">Codice Fornitore</Label>
                        <Input
                          id="supplierCode"
                          name="supplierCode"
                          placeholder="Codice articolo fornitore"
                          data-testid="input-supplier-code"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minStock">Scorta Minima</Label>
                        <Input
                          id="minStock"
                          name="minStock"
                          type="number"
                          min="0"
                          defaultValue="5"
                          placeholder="5"
                          data-testid="input-min-stock"
                        />
                        <p className="text-xs text-muted-foreground">Alert quando scende sotto</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Ubicazione</Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder="es. Scaffale A3"
                          data-testid="input-location"
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Quantità Iniziali per Magazzino</Label>
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
                      <p className="text-xs text-muted-foreground">
                        Puoi assegnare quantità iniziali ai magazzini di Admin, Rivenditori e Centri Riparazione
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createProductMutation.isPending}
                  data-testid="button-submit-product"
                >
                  {createProductMutation.isPending ? "Creazione..." : "Crea Prodotto"}
                </Button>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setEditDeviceCompatibilities([]);
            setEditStock([]);
            setProductSuppliers([]);
            setSupplierDialogOpen(false);
            setEditingProductSupplier(null);
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="h-5 w-5" />
                Modifica Prodotto
              </DialogTitle>
              <DialogDescription>
                Modifica i dettagli del prodotto
              </DialogDescription>
            </DialogHeader>
            {editingProduct && (
              <ScrollArea className="max-h-[70vh] pr-4">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="info">Info</TabsTrigger>
                      <TabsTrigger value="compatibility">Compatibilità</TabsTrigger>
                      <TabsTrigger value="pricing">Prezzi</TabsTrigger>
                      <TabsTrigger value="suppliers">Fornitori</TabsTrigger>
                      <TabsTrigger value="inventory">Magazzino</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Immagine Prodotto</Label>
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                            {editingProduct.imageUrl ? (
                              <img 
                                src={editingProduct.imageUrl} 
                                alt={editingProduct.name}
                                className="w-full h-full object-cover"
                                data-testid={`img-product-${editingProduct.id}`}
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                id={`admin-image-upload-${editingProduct.id}`}
                                className="hidden"
                                onChange={(e) => handleImageUpload(editingProduct.id, e)}
                                data-testid="input-upload-image"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => document.getElementById(`admin-image-upload-${editingProduct.id}`)?.click()}
                                disabled={uploadImageMutation.isPending}
                                data-testid="button-upload-image"
                              >
                                {uploadImageMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Upload className="h-4 w-4 mr-2" />
                                )}
                                Carica Immagine
                              </Button>
                            </div>
                            {editingProduct.imageUrl && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteImageMutation.mutate(editingProduct.id)}
                                disabled={deleteImageMutation.isPending}
                                className="text-destructive hover:text-destructive"
                                data-testid="button-delete-image"
                              >
                                {deleteImageMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Rimuovi
                              </Button>
                            )}
                            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP o GIF. Max 10MB</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">Nome Prodotto *</Label>
                          <Input 
                            id="edit-name" 
                            name="name" 
                            required 
                            defaultValue={editingProduct.name}
                            data-testid="edit-input-name" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-sku">SKU/Codice *</Label>
                          <Input 
                            id="edit-sku" 
                            name="sku" 
                            required 
                            defaultValue={editingProduct.sku}
                            data-testid="edit-input-sku" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-category">Categoria *</Label>
                          <Select name="category" defaultValue={editingProduct.category}>
                            <SelectTrigger id="edit-category" data-testid="edit-select-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-productType">Tipo Prodotto *</Label>
                          <Select name="productType" defaultValue={editingProduct.productType}>
                            <SelectTrigger id="edit-productType" data-testid="edit-select-product-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ricambio">Ricambio</SelectItem>
                              <SelectItem value="accessorio">Accessorio</SelectItem>
                              <SelectItem value="dispositivo">Dispositivo</SelectItem>
                              <SelectItem value="consumabile">Consumabile</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-condition">Condizione *</Label>
                          <Select name="condition" defaultValue={editingProduct.condition}>
                            <SelectTrigger id="edit-condition" data-testid="edit-select-condition">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nuovo">Nuovo Originale</SelectItem>
                              <SelectItem value="ricondizionato">Ricondizionato</SelectItem>
                              <SelectItem value="usato">Usato</SelectItem>
                              <SelectItem value="compatibile">Compatibile (aftermarket)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-color">Colore</Label>
                          <Select name="color" defaultValue={editingProduct.color || undefined}>
                            <SelectTrigger id="edit-color" data-testid="edit-select-color">
                              <SelectValue placeholder="Seleziona colore" />
                            </SelectTrigger>
                            <SelectContent>
                              {COLORS.map(color => (
                                <SelectItem key={color} value={color}>{color}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-description">Descrizione</Label>
                        <Textarea 
                          id="edit-description" 
                          name="description" 
                          defaultValue={editingProduct.description || ""}
                          rows={3}
                          data-testid="edit-textarea-description" 
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor="edit-isActive">Stato Prodotto</Label>
                        <Select name="isActive" defaultValue={editingProduct.isActive ? "true" : "false"}>
                          <SelectTrigger className="w-40" data-testid="edit-select-is-active">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Attivo</SelectItem>
                            <SelectItem value="false">Disattivato</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="compatibility" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-deviceTypeId">Tipo Dispositivo</Label>
                        <Select name="deviceTypeId" defaultValue={editingProduct.deviceTypeId || "all"}>
                          <SelectTrigger id="edit-deviceTypeId" data-testid="edit-select-device-type">
                            <Smartphone className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Tutti i dispositivi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tutti i dispositivi</SelectItem>
                            {deviceTypes.map(dt => (
                              <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Categoria generale del dispositivo</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-brand">Marca</Label>
                        <Select name="brand" defaultValue={editingProduct.brand || undefined}>
                          <SelectTrigger id="edit-brand" data-testid="edit-select-brand">
                            <SelectValue placeholder="Seleziona marca" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRANDS.map(brand => (
                              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Dispositivi Compatibili</Label>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setNewBrandDialogOpen(true)}
                              data-testid="edit-button-new-brand"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Brand
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setNewModelDialogOpen(true)}
                              data-testid="edit-button-new-model"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Modello
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Seleziona i brand e modelli di dispositivo con cui questo ricambio è compatibile.
                          Le modifiche saranno salvate quando aggiorni il prodotto.
                        </p>
                        {isLoadingCompatibilities ? (
                          <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                        ) : (
                          <ScrollArea className="h-64 border rounded-md p-2">
                            {deviceBrands.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-2">Nessun brand di dispositivo disponibile</p>
                            ) : (
                              <div className="space-y-1">
                                {deviceBrands.map((brand) => {
                                  const models = getModelsForBrand(brand.id);
                                  const isExpanded = expandedBrands.has(brand.id);
                                  const hasAnyCompatibility = editDeviceCompatibilities.some(c => c.deviceBrandId === brand.id);
                                  const hasBrandOnlyCompatibility = editDeviceCompatibilities.some(c => c.deviceBrandId === brand.id && !c.deviceModelId);
                                  
                                  return (
                                    <div key={brand.id} className="border rounded-md">
                                      <div className="flex items-center gap-2 p-2 hover-elevate">
                                        <Checkbox
                                          checked={hasAnyCompatibility}
                                          onCheckedChange={() => toggleBrandCompatibility(brand.id, true)}
                                          data-testid={`edit-checkbox-brand-${brand.id}`}
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
                                          data-testid={`edit-button-add-model-${brand.id}`}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      {isExpanded && (
                                        <div className="pl-8 pb-2 space-y-1">
                                          {models.map((model) => {
                                            const isModelSelected = editDeviceCompatibilities.some(c => c.deviceBrandId === brand.id && c.deviceModelId === model.id);
                                            return (
                                              <div key={model.id} className="flex items-center gap-2 p-1 hover-elevate rounded">
                                                <Checkbox
                                                  checked={isModelSelected || hasBrandOnlyCompatibility}
                                                  disabled={hasBrandOnlyCompatibility}
                                                  onCheckedChange={() => toggleModelCompatibility(brand.id, model.id, true)}
                                                  data-testid={`edit-checkbox-model-${model.id}`}
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
                        )}
                        {editDeviceCompatibilities.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {editDeviceCompatibilities.map((c, idx) => (
                              <Badge key={idx} variant="secondary">
                                {c.brandName || 'Brand'}{c.modelName ? ` - ${c.modelName}` : ' (tutti)'}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4 mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-costPrice">Prezzo Acquisto (€)</Label>
                          <Input
                            id="edit-costPrice"
                            name="costPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={editingProduct.costPrice ? (editingProduct.costPrice / 100).toFixed(2) : ""}
                            data-testid="edit-input-cost-price"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-unitPrice">Prezzo Vendita (€) *</Label>
                          <Input
                            id="edit-unitPrice"
                            name="unitPrice"
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            defaultValue={(editingProduct.unitPrice / 100).toFixed(2)}
                            data-testid="edit-input-price"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-warrantyMonths">Garanzia (mesi)</Label>
                        <Input
                          id="edit-warrantyMonths"
                          name="warrantyMonths"
                          type="number"
                          min="0"
                          defaultValue={editingProduct.warrantyMonths ?? 3}
                          data-testid="edit-input-warranty"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="suppliers" className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base">Fornitori Associati</Label>
                          <p className="text-xs text-muted-foreground">
                            Gestisci i fornitori da cui acquistare questo prodotto
                          </p>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => openSupplierDialog()}
                          data-testid="button-add-product-supplier"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Fornitore
                        </Button>
                      </div>

                      {isLoadingSuppliers ? (
                        <div className="space-y-2">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : productSuppliers.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg border-dashed">
                          <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                          <p className="text-muted-foreground">Nessun fornitore associato</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Aggiungi almeno un fornitore per poter ordinare questo prodotto
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {productSuppliers.map((ps) => (
                            <div 
                              key={ps.id} 
                              className="flex items-center gap-3 p-3 border rounded-lg"
                              data-testid={`row-product-supplier-${ps.id}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {suppliers.find(s => s.id === ps.supplierId)?.name || ps.supplierName}
                                  </span>
                                  {ps.isPreferred && (
                                    <Badge variant="default" className="gap-1">
                                      <Star className="h-3 w-3" />
                                      Preferito
                                    </Badge>
                                  )}
                                  {!ps.isActive && (
                                    <Badge variant="secondary">Inattivo</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  {ps.supplierCode && (
                                    <span>Cod: {ps.supplierCode}</span>
                                  )}
                                  {ps.purchasePrice && (
                                    <span className="font-medium text-foreground">
                                      {formatCurrency(ps.purchasePrice)}
                                    </span>
                                  )}
                                  {ps.leadTimeDays && (
                                    <span>{ps.leadTimeDays}gg consegna</span>
                                  )}
                                  {ps.minOrderQty && ps.minOrderQty > 1 && (
                                    <span>Min: {ps.minOrderQty} pz</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openSupplierDialog(ps)}
                                  data-testid={`button-edit-ps-${ps.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Rimuovere questo fornitore dal prodotto?")) {
                                      deleteProductSupplierMutation.mutate(ps.id);
                                    }
                                  }}
                                  disabled={deleteProductSupplierMutation.isPending}
                                  data-testid={`button-delete-ps-${ps.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingProductSupplier ? "Modifica Fornitore" : "Associa Fornitore"}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSupplierSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="ps-supplierId">Fornitore *</Label>
                              <Select 
                                name="supplierId" 
                                defaultValue={editingProductSupplier?.supplierId}
                              >
                                <SelectTrigger data-testid="select-product-supplier">
                                  <SelectValue placeholder="Seleziona fornitore..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {suppliers
                                    .filter(s => s.isActive)
                                    .map(s => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name} ({s.code})
                                      </SelectItem>
                                    ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="ps-supplierCode">Codice Articolo Fornitore</Label>
                                <Input
                                  id="ps-supplierCode"
                                  name="supplierCode"
                                  defaultValue={editingProductSupplier?.supplierCode || ""}
                                  placeholder="Codice presso fornitore"
                                  data-testid="input-ps-code"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="ps-purchasePrice">Prezzo Acquisto (€)</Label>
                                <Input
                                  id="ps-purchasePrice"
                                  name="purchasePrice"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  defaultValue={editingProductSupplier?.purchasePrice ? (editingProductSupplier.purchasePrice / 100).toFixed(2) : ""}
                                  data-testid="input-ps-price"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="ps-minOrderQty">Quantità Min.</Label>
                                <Input
                                  id="ps-minOrderQty"
                                  name="minOrderQty"
                                  type="number"
                                  min="1"
                                  defaultValue={editingProductSupplier?.minOrderQty || 1}
                                  data-testid="input-ps-min-qty"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="ps-packSize">Pezzi/Conf.</Label>
                                <Input
                                  id="ps-packSize"
                                  name="packSize"
                                  type="number"
                                  min="1"
                                  defaultValue={editingProductSupplier?.packSize || 1}
                                  data-testid="input-ps-pack"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="ps-leadTimeDays">Giorni Consegna</Label>
                                <Input
                                  id="ps-leadTimeDays"
                                  name="leadTimeDays"
                                  type="number"
                                  min="0"
                                  defaultValue={editingProductSupplier?.leadTimeDays || ""}
                                  data-testid="input-ps-lead"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="ps-supplierName">Nome Prodotto (presso fornitore)</Label>
                              <Input
                                id="ps-supplierName"
                                name="supplierName"
                                defaultValue={editingProductSupplier?.supplierName || ""}
                                placeholder="Come lo chiama il fornitore"
                                data-testid="input-ps-name"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Label>Fornitore Preferito</Label>
                              <Select 
                                name="isPreferred" 
                                defaultValue={editingProductSupplier?.isPreferred ? "true" : "false"}
                              >
                                <SelectTrigger className="w-32" data-testid="select-ps-preferred">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      Si
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="false">
                                    <div className="flex items-center gap-1">
                                      <StarOff className="h-3 w-3" />
                                      No
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => setSupplierDialogOpen(false)}
                              >
                                Annulla
                              </Button>
                              <Button
                                type="submit"
                                disabled={createProductSupplierMutation.isPending || updateProductSupplierMutation.isPending}
                                data-testid="button-submit-ps"
                              >
                                {(createProductSupplierMutation.isPending || updateProductSupplierMutation.isPending)
                                  ? "Salvataggio..."
                                  : editingProductSupplier ? "Aggiorna" : "Associa"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-minStock">Scorta Minima</Label>
                        <Input
                          id="edit-minStock"
                          name="minStock"
                          type="number"
                          min="0"
                          defaultValue={editingProduct.minStock ?? 5}
                          className="w-48"
                          data-testid="edit-input-min-stock"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Label className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4" />
                            Quantità per Magazzino
                          </Label>
                          <Select onValueChange={addEditStock}>
                            <SelectTrigger className="w-56" data-testid="edit-select-add-warehouse">
                              <SelectValue placeholder="Aggiungi magazzino..." />
                            </SelectTrigger>
                            <SelectContent>
                              {groupedWarehouses.admin.filter(w => !editStock.find(s => s.warehouseId === w.id)).length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Magazzini Admin</SelectLabel>
                                  {groupedWarehouses.admin
                                    .filter(w => !editStock.find(s => s.warehouseId === w.id))
                                    .map(wh => (
                                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                    ))
                                  }
                                </SelectGroup>
                              )}
                              {groupedWarehouses.reseller.filter(w => !editStock.find(s => s.warehouseId === w.id)).length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Magazzini Rivenditori</SelectLabel>
                                  {groupedWarehouses.reseller
                                    .filter(w => !editStock.find(s => s.warehouseId === w.id))
                                    .map(wh => (
                                      <SelectItem key={wh.id} value={wh.id}>
                                        {wh.name} ({wh.owner?.fullName || wh.owner?.username})
                                      </SelectItem>
                                    ))
                                  }
                                </SelectGroup>
                              )}
                              {groupedWarehouses.sub_reseller.filter(w => !editStock.find(s => s.warehouseId === w.id)).length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Magazzini Sotto-Rivenditori</SelectLabel>
                                  {groupedWarehouses.sub_reseller
                                    .filter(w => !editStock.find(s => s.warehouseId === w.id))
                                    .map(wh => (
                                      <SelectItem key={wh.id} value={wh.id}>
                                        {wh.name} ({wh.owner?.fullName || wh.owner?.username})
                                      </SelectItem>
                                    ))
                                  }
                                </SelectGroup>
                              )}
                              {groupedWarehouses.repair_center.filter(w => !editStock.find(s => s.warehouseId === w.id)).length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>Magazzini Centri Riparazione</SelectLabel>
                                  {groupedWarehouses.repair_center
                                    .filter(w => !editStock.find(s => s.warehouseId === w.id))
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

                        {isLoadingStock ? (
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ) : editStock.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            Nessuna giacenza. Seleziona un magazzino per aggiungere quantità.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {editStock.map((stock) => {
                              const hasChanges = stock.quantity !== stock.originalQuantity || stock.location !== stock.originalLocation;
                              return (
                                <div key={stock.warehouseId} className="p-3 bg-muted/50 rounded-md space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-medium">{stock.warehouseName}</span>
                                      <span className="text-xs text-muted-foreground ml-2">({stock.ownerName})</span>
                                    </div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={hasChanges ? "default" : "outline"}
                                      disabled={!hasChanges || updateStockMutation.isPending}
                                      onClick={() => saveStockChange(stock.warehouseId)}
                                      data-testid={`edit-button-save-stock-${stock.warehouseId}`}
                                    >
                                      {updateStockMutation.isPending ? "..." : "Salva"}
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <Label className="text-xs text-muted-foreground">Quantità</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={stock.quantity}
                                        onChange={(e) => updateEditStock(stock.warehouseId, parseInt(e.target.value) || 0)}
                                        data-testid={`edit-input-stock-${stock.warehouseId}`}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <Label className="text-xs text-muted-foreground">Ubicazione</Label>
                                      <Input
                                        value={stock.location}
                                        onChange={(e) => updateEditStockLocation(stock.warehouseId, e.target.value)}
                                        placeholder="es. Scaffale A3"
                                        data-testid={`edit-input-location-${stock.warehouseId}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updateProductMutation.isPending}
                    data-testid="button-update-product"
                  >
                    {updateProductMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
                  </Button>
                </form>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, SKU o marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-products"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessun prodotto trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Condizione</TableHead>
                  <TableHead>Vendita</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Warehouse className="h-4 w-4" />
                      Giacenze
                    </div>
                  </TableHead>
                  <TableHead>Compatibilità</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Store className="h-4 w-4" />
                      Shop
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(({ product, stockByWarehouse, totalStock, compatibilities }) => (
                  <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                    <TableCell>
                      <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            data-testid={`img-product-thumb-${product.id}`}
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.brand && <span>{product.brand}</span>}
                          {product.brand && product.compatibleModels && product.compatibleModels.length > 0 && " - "}
                          {product.compatibleModels && product.compatibleModels.length > 0 && (
                            <span>
                              {product.compatibleModels.slice(0, 2).join(", ")}
                              {product.compatibleModels.length > 2 && ` +${product.compatibleModels.length - 2}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryLabel(product.category)}</TableCell>
                    <TableCell>
                      <BarcodeDisplay value={product.barcode || ""} size="sm" />
                    </TableCell>
                    <TableCell>{getConditionBadge(product.condition)}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(product.unitPrice)}</TableCell>
                    <TableCell>
                      {stockByWarehouse.length > 0 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              {getStockBadge(totalStock, product.minStock)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-semibold mb-2">Giacenze per Magazzino:</div>
                              {stockByWarehouse.map((stock) => (
                                <div key={stock.warehouseId} className="flex justify-between gap-4 text-sm">
                                  <span>{stock.warehouseName} ({stock.ownerName})</span>
                                  <span className="font-mono">{stock.quantity}</span>
                                </div>
                              ))}
                              <Separator className="my-2" />
                              <div className="flex justify-between gap-4 font-semibold">
                                <span>Totale</span>
                                <span className="font-mono">{totalStock}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Nessuna giacenza
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {compatibilities && compatibilities.length > 0 ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <Badge variant="secondary" className="text-xs">
                                {(() => {
                                  const uniqueBrands = Array.from(new Set(compatibilities.map(c => c.brandName)));
                                  const modelCount = compatibilities.filter(c => c.modelId).length;
                                  if (uniqueBrands.length === 1 && modelCount === 0) {
                                    return uniqueBrands[0];
                                  } else if (uniqueBrands.length === 1) {
                                    return `${uniqueBrands[0]} (${modelCount} modelli)`;
                                  } else {
                                    return `${uniqueBrands.length} brand`;
                                  }
                                })()}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-semibold mb-2">Dispositivi Compatibili:</div>
                              {(() => {
                                const brandMap = new Map<string, string[]>();
                                compatibilities.forEach(c => {
                                  if (!brandMap.has(c.brandName)) {
                                    brandMap.set(c.brandName, []);
                                  }
                                  if (c.modelName) {
                                    brandMap.get(c.brandName)!.push(c.modelName);
                                  }
                                });
                                return Array.from(brandMap.entries()).map(([brandName, models]) => (
                                  <div key={brandName} className="text-sm">
                                    <span className="font-medium">{brandName}</span>
                                    {models.length > 0 ? (
                                      <span className="text-muted-foreground">: {models.join(", ")}</span>
                                    ) : (
                                      <span className="text-muted-foreground"> (tutti i modelli)</span>
                                    )}
                                  </div>
                                ));
                              })()}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.isVisibleInShop ?? true}
                              onCheckedChange={(checked) => 
                                toggleShopVisibilityMutation.mutate({ id: product.id, isVisibleInShop: checked })
                              }
                              disabled={toggleShopVisibilityMutation.isPending}
                              data-testid={`switch-shop-visibility-${product.id}`}
                            />
                            {product.isVisibleInShop === false ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {product.isVisibleInShop === false 
                            ? "Nascosto dallo shop - clicca per mostrare" 
                            : "Visibile nello shop - clicca per nascondere"}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setDetailProductId(product.id); setDetailDialogOpen(true); }}
                              data-testid={`button-detail-${product.id}`}
                            >
                              <Info className="h-4 w-4 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Dettagli prodotto</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openResellerPricesDialog(product)}
                              data-testid={`button-reseller-prices-${product.id}`}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Prezzi Reseller</TooltipContent>
                        </Tooltip>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(product)}
                          data-testid={`button-edit-${product.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          disabled={deleteProductMutation.isPending}
                          data-testid={`button-delete-${product.id}`}
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

      {/* Dialog Prezzi Reseller */}
      <Dialog open={resellerPricesDialogOpen} onOpenChange={setResellerPricesDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Prezzi Personalizzati per Reseller
            </DialogTitle>
            <DialogDescription>
              {selectedProductForPricing && (
                <span>
                  Gestisci i prezzi personalizzati per <strong>{selectedProductForPricing.name}</strong>
                  {" "}(Prezzo base: {formatCurrency(selectedProductForPricing.unitPrice)})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            {isLoadingResellerPrices ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : resellerPrices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nessun rivenditore trovato
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rivenditore</TableHead>
                    <TableHead className="text-right">Prezzo Base</TableHead>
                    <TableHead className="text-right">Prezzo Personalizzato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resellerPrices.map((rp) => (
                    <TableRow key={rp.reseller.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rp.reseller.fullName || rp.reseller.username}</div>
                          <div className="text-xs text-muted-foreground">{rp.reseller.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(rp.defaultPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <form
                          className="flex items-center gap-2 justify-end"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const priceValue = formData.get(`price-${rp.reseller.id}`) as string;
                            const priceInCents = Math.round(parseFloat(priceValue) * 100);
                            
                            if (!isNaN(priceInCents) && priceInCents > 0 && selectedProductForPricing) {
                              updateResellerPriceMutation.mutate({
                                productId: selectedProductForPricing.id,
                                resellerId: rp.reseller.id,
                                priceCents: priceInCents,
                              });
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">€</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              name={`price-${rp.reseller.id}`}
                              defaultValue={rp.customPrice ? (rp.customPrice.priceCents / 100).toFixed(2) : ""}
                              placeholder={(rp.defaultPrice / 100).toFixed(2)}
                              className="w-24 text-right"
                              data-testid={`input-price-${rp.reseller.id}`}
                            />
                          </div>
                          <Button 
                            type="submit" 
                            size="sm"
                            disabled={updateResellerPriceMutation.isPending}
                            data-testid={`button-save-price-${rp.reseller.id}`}
                          >
                            Salva
                          </Button>
                        </form>
                      </TableCell>
                      <TableCell className="text-right">
                        {rp.customPrice && (
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="secondary" className="text-xs">
                              Personalizzato
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Rimuovere il prezzo personalizzato? Verrà applicato il prezzo base.")) {
                                  deleteResellerPriceMutation.mutate(rp.customPrice!.id);
                                }
                              }}
                              disabled={deleteResellerPriceMutation.isPending}
                              data-testid={`button-delete-price-${rp.reseller.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Dialog per creare nuovo Brand */}
      <Dialog open={newBrandDialogOpen} onOpenChange={setNewBrandDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuovo Brand Dispositivo</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo brand di dispositivo al catalogo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newBrandName">Nome Brand *</Label>
              <Input
                id="newBrandName"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="es. Apple, Samsung..."
                required
                data-testid="input-new-brand-name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setNewBrandDialogOpen(false); setNewBrandName(""); }}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createBrandMutation.isPending || !newBrandName.trim()}
                data-testid="button-submit-new-brand"
              >
                {createBrandMutation.isPending ? "Creazione..." : "Crea Brand"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog per creare nuovo Modello */}
      <Dialog open={newModelDialogOpen} onOpenChange={setNewModelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuovo Modello Dispositivo</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo modello di dispositivo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateModel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newModelBrand">Brand *</Label>
              <Select value={newModelBrandId} onValueChange={setNewModelBrandId}>
                <SelectTrigger id="newModelBrand" data-testid="select-new-model-brand">
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
              <Label htmlFor="newModelName">Nome Modello *</Label>
              <Input
                id="newModelName"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="es. iPhone 15 Pro, Galaxy S24..."
                required
                data-testid="input-new-model-name"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { setNewModelDialogOpen(false); setNewModelName(""); setNewModelBrandId(""); }}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={createModelMutation.isPending || !newModelName.trim() || !newModelBrandId}
                data-testid="button-submit-new-model"
              >
                {createModelMutation.isPending ? "Creazione..." : "Crea Modello"}
              </Button>
            </div>
          </form>
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
