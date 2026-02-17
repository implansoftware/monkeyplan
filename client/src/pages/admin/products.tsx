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
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

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
  { value: "display", labelKey: "products.categories.display" },
  { value: "batteria", labelKey: "products.categories.battery" },
  { value: "scheda_madre", labelKey: "products.categories.motherboard" },
  { value: "fotocamera", labelKey: "products.categories.camera" },
  { value: "altoparlante", labelKey: "products.categories.speaker" },
  { value: "microfono", labelKey: "products.categories.microphone" },
  { value: "connettore", labelKey: "products.categories.chargingConnector" },
  { value: "tasto", labelKey: "products.categories.buttons" },
  { value: "cover", labelKey: "products.categories.cover" },
  { value: "vetro", labelKey: "products.categories.rearGlass" },
  { value: "sensore", labelKey: "products.categories.sensors" },
  { value: "flex", labelKey: "products.categories.flexCable" },
  { value: "antenna", labelKey: "products.categories.antenna" },
  { value: "vibrazione", labelKey: "products.categories.vibrationMotor" },
  { value: "sim_tray", labelKey: "products.categories.simTray" },
  { value: "accessorio", labelKey: "products.categories.accessory" },
  { value: "altro", labelKey: "products.categories.other" },
];

const BRANDS = [
  "Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "Vivo", "OnePlus",
  "Google", "Motorola", "LG", "Sony", "Nokia", "Realme", "Honor",
  "ASUS", "Lenovo", "HP", "Dell", "Acer", "Microsoft", "Universale", "Altro"
];

const COLORS = [
  { value: "Nero", labelKey: "colors.black" },
  { value: "Bianco", labelKey: "colors.white" },
  { value: "Argento", labelKey: "colors.silver" },
  { value: "Oro", labelKey: "colors.gold" },
  { value: "Blu", labelKey: "colors.blue" },
  { value: "Verde", labelKey: "colors.green" },
  { value: "Rosso", labelKey: "colors.red" },
  { value: "Viola", labelKey: "colors.purple" },
  { value: "Rosa", labelKey: "colors.pink" },
  { value: "Grigio", labelKey: "colors.grey" },
  { value: "Trasparente", labelKey: "colors.transparent" },
  { value: "Altro", labelKey: "colors.other" },
];

export default function AdminProducts() {
  const { t } = useTranslation();
  usePageTitle(t("products.title"));
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
      toast({ title: t("products.productCreated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.productUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.quantityUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      toast({ title: t("warranties.productDeleted") });
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
        title: variables.isVisibleInShop ? t("products.visibleInShop") : t("products.hiddenFromShop")
      });
    },
    onError: () => {
      toast({ title: t("common.error"), description: t("products.cannotChangeVisibility"), variant: "destructive" });
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
      toast({ title: t("products.priceUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.customPriceRemoved") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
        throw new Error(text || t("products.uploadImageError"));
      }
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      if (editingProduct && data.imageUrl) {
        setEditingProduct({ ...editingProduct, imageUrl: data.imageUrl });
      }
      toast({ title: t("products.imageUploaded") });
    },
    onError: (error: Error) => {
      toast({ title: t("tickets.uploadError"), description: error.message, variant: "destructive" });
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
        throw new Error(text || t("products.deleteImageError"));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/with-stock"] });
      if (editingProduct) {
        setEditingProduct({ ...editingProduct, imageUrl: null });
      }
      toast({ title: t("products.imageRemoved") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.resellerPriceError"), variant: "destructive" });
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
      toast({ title: t("products.supplierLinked") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.associationUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("products.supplierRemoved") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const loadProductSuppliers = async (productId: string) => {
    setIsLoadingSuppliers(true);
    try {
      const res = await apiRequest("GET", `/api/product-suppliers?productId=${productId}`);
      const data = await res.json();
      const enrichedData = data.map((ps: ProductSupplier) => ({
        ...ps,
        supplierName: suppliers.find(s => s.id === ps.supplierId)?.name || t("products.unknownSupplier")
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
      toast({ title: t("products.compatibilitiesSaved") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      // Auto-expand the brand to show the new model
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
      case "nuovo": return <Badge variant="default">{t("products.new")}</Badge>;
      case "ricondizionato": return <Badge variant="secondary">{t("products.refurbished")}</Badge>;
      case "usato": return <Badge variant="outline">{t("products.used")}</Badge>;
      case "compatibile": return <Badge variant="outline">{t("products.compatible")}</Badge>;
      default: return null;
    }
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? t(cat.labelKey) : category;
  };

  const getStockBadge = (totalStock: number, minStock: number | null | undefined) => {
    const min = minStock ?? 5;
    if (totalStock === 0) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{t("warehouse.outOfStock")}</Badge>;
    } else if (totalStock <= min) {
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"><AlertTriangle className="h-3 w-3 mr-1" />{t("warehouse.lowStock")}</Badge>;
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
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("products.spareParts")}</h1>
              <p className="text-sm text-muted-foreground">{t("products.manageSparePartsCatalog")}</p>
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
              {t("products.newProduct")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <Package className="h-5 w-5" />
                {t("products.createNewProduct")}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="info">{t("admin.repairCenters.infoBase")}</TabsTrigger>
                    <TabsTrigger value="compatibility">{t("products.compatibility")}</TabsTrigger>
                    <TabsTrigger value="pricing">{t("products.prices")}</TabsTrigger>
                    <TabsTrigger value="inventory">{t("sidebar.items.warehouse")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("products.productName")} *</Label>
                        <Input 
                          id="name" 
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          required 
                          placeholder={t("products.namePlaceholder")}
                          data-testid="input-name" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU/{t("common.code")} *</Label>
                        <Input 
                          id="sku" 
                          value={newProductSku}
                          onChange={(e) => setNewProductSku(e.target.value)}
                          required 
                          placeholder={t("products.skuPlaceholder")}
                          data-testid="input-sku" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">{t("utility.category")} *</Label>
                        <Select value={newProductCategory} onValueChange={setNewProductCategory}>
                          <SelectTrigger id="category" data-testid="select-category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {t(cat.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="productType">{t("products.productType")} *</Label>
                        <Select value={newProductType} onValueChange={setNewProductType}>
                          <SelectTrigger id="productType" data-testid="select-product-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ricambio">{t("products.sparePart")}</SelectItem>
                            <SelectItem value="accessorio">{t("products.accessory")}</SelectItem>
                            <SelectItem value="dispositivo">{t("repairs.device")}</SelectItem>
                            <SelectItem value="consumabile">{t("products.consumable")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="condition">{t("products.condition")} *</Label>
                        <Select value={newProductCondition} onValueChange={setNewProductCondition}>
                          <SelectTrigger id="condition" data-testid="select-condition">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nuovo">{t("products.newOriginal")}</SelectItem>
                            <SelectItem value="ricondizionato">{t("products.refurbished")}</SelectItem>
                            <SelectItem value="usato">{t("products.used")}</SelectItem>
                            <SelectItem value="compatibile">{t("products.compatibleAftermarket")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="color">{t("products.color")}</Label>
                        <Select name="color">
                          <SelectTrigger id="color" data-testid="select-color">
                            <SelectValue placeholder={t("products.selectColor")} />
                          </SelectTrigger>
                          <SelectContent>
                            {COLORS.map(color => (
                              <SelectItem key={color.value} value={color.value}>{t(color.labelKey)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t("common.description")}</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder={t("products.detailedDescription")}
                        rows={3}
                        data-testid="textarea-description" 
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="compatibility" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="deviceTypeId">{t("products.deviceType")}</Label>
                      <Select name="deviceTypeId">
                        <SelectTrigger id="deviceTypeId" data-testid="select-device-type">
                          <Smartphone className="h-4 w-4 mr-2" />
                          <SelectValue placeholder={t("products.allDevices")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("products.allDevices")}</SelectItem>
                          {deviceTypes.map(dt => (
                            <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t("products.deviceCategoryGeneral")}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">{t("products.brand")}</Label>
                      <Select name="brand">
                        <SelectTrigger id="brand" data-testid="select-brand">
                          <SelectValue placeholder={t("products.selectBrand")} />
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
                            {t("products.brand")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setNewModelDialogOpen(true)}
                            data-testid="button-new-model"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {t("products.model")}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {t("products.selectCompatibleDevices")}
                      </p>
                      <ScrollArea className="h-64 border rounded-md p-2">
                        {deviceBrands.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-2">{t("products.noDeviceBrandsAvailable")}</p>
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
                                      onCheckedChange={() => toggleBrandCompatibility(brand.id, false)}
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
                                        <Badge variant="outline" className="ml-2 text-xs">{t("products.allModels")}</Badge>
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
                                              onCheckedChange={() => toggleModelCompatibility(brand.id, model.id, false)}
                                              data-testid={`checkbox-model-${model.id}`}
                                            />
                                            <span className="text-sm">{model.modelName}</span>
                                          </div>
                                        );
                                      })}
                                      {models.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">{t("products.noModelsClickToAdd")}</p>
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
                                {brand?.name}{model ? ` - ${model.modelName}` : ` (${t("products.allLabel")})`}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="costPrice">{t("products.purchasePrice")} (€)</Label>
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
                        <p className="text-xs text-muted-foreground">{t("products.supplierCost")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitPrice">{t("products.salePrice")} (€) *</Label>
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
                        <p className="text-xs text-muted-foreground">{t("products.customerPrice")}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="warrantyMonths">{t("products.warrantyMonths")}</Label>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supplier">{t("suppliers.supplier")}</Label>
                        <Select 
                          value={selectedSupplierId} 
                          onValueChange={setSelectedSupplierId}
                        >
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder={t("suppliers.selectSupplier")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("suppliers.noSupplier")}</SelectItem>
                            {suppliers.filter(s => s.isActive).map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplierCode">{t("suppliers.supplierCode")}</Label>
                        <Input
                          id="supplierCode"
                          name="supplierCode"
                          placeholder={t("suppliers.supplierCode")}
                          data-testid="input-supplier-code"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minStock">{t("warehouse.minStock")}</Label>
                        <Input
                          id="minStock"
                          name="minStock"
                          type="number"
                          min="0"
                          defaultValue="5"
                          placeholder="5"
                          data-testid="input-min-stock"
                        />
                        <p className="text-xs text-muted-foreground">{t("warehouse.alertWhenBelow")}</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">{t("warehouse.location")}</Label>
                        <Input
                          id="location"
                          name="location"
                          placeholder={t("warehouse.locationPlaceholder")}
                          data-testid="input-location"
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{t("warehouse.initialQuantities")}</Label>
                        <Select onValueChange={addInitialStock}>
                          <SelectTrigger className="w-56" data-testid="select-add-stock-warehouse">
                            <SelectValue placeholder={t("warehouse.addWarehouse")} />
                          </SelectTrigger>
                          <SelectContent>
                            {groupedWarehouses.admin.filter(w => !initialStock.find(s => s.warehouseId === w.id)).length > 0 && (
                              <SelectGroup>
                                <SelectLabel>{t("warehouse.adminWarehouses")}</SelectLabel>
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
                                <SelectLabel>{t("warehouse.resellerWarehouses")}</SelectLabel>
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
                                <SelectLabel>{t("warehouse.subResellerWarehouses")}</SelectLabel>
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
                                <SelectLabel>{t("warehouse.repairCenterWarehouses")}</SelectLabel>
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
                          {t("warehouse.noInitialQuantity")}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {initialStock.map(stock => {
                            const wh = warehouses.find(w => w.id === stock.warehouseId);
                            return (
                              <div key={stock.warehouseId} className="flex flex-wrap items-center gap-3 p-3 border rounded-md">
                                <Warehouse className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <span className="font-medium">{wh?.name || t("products.warehouseLabel")}</span>
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
                        {t("warehouse.assignInitialQuantitiesDesc")}
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
                  {createProductMutation.isPending ? t("admin.repairCenters.creating") : t("products.createProduct")}
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
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <Pencil className="h-5 w-5" />
                {t("products.editProduct")}
              </DialogTitle>
              <DialogDescription>
                {t("products.editProductDesc")}
              </DialogDescription>
            </DialogHeader>
            {editingProduct && (
              <ScrollArea className="max-h-[70vh] pr-4">
                <form onSubmit={handleEditSubmit} className="space-y-6">
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="info">{t("common.info")}</TabsTrigger>
                      <TabsTrigger value="compatibility">{t("products.compatibility")}</TabsTrigger>
                      <TabsTrigger value="pricing">{t("products.prices")}</TabsTrigger>
                      <TabsTrigger value="suppliers">{t("sidebar.items.suppliers")}</TabsTrigger>
                      <TabsTrigger value="inventory">{t("sidebar.items.warehouse")}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>{t("products.productImage")}</Label>
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
                                {t("products.uploadImage")}
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
                                {t("common.remove")}
                              </Button>
                            )}
                            <p className="text-xs text-muted-foreground">{t("products.imageFormatHint")}</p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-name">{t("products.productName")} *</Label>
                          <Input 
                            id="edit-name" 
                            name="name" 
                            required 
                            defaultValue={editingProduct.name}
                            data-testid="edit-input-name" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-sku">SKU/{t("common.code")} *</Label>
                          <Input 
                            id="edit-sku" 
                            name="sku" 
                            required 
                            defaultValue={editingProduct.sku}
                            data-testid="edit-input-sku" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-category">{t("utility.category")} *</Label>
                          <Select name="category" defaultValue={editingProduct.category}>
                            <SelectTrigger id="edit-category" data-testid="edit-select-category">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {t(cat.labelKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-productType">{t("products.productType")} *</Label>
                          <Select name="productType" defaultValue={editingProduct.productType}>
                            <SelectTrigger id="edit-productType" data-testid="edit-select-product-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ricambio">{t("products.sparePart")}</SelectItem>
                              <SelectItem value="accessorio">{t("products.accessory")}</SelectItem>
                              <SelectItem value="dispositivo">{t("repairs.device")}</SelectItem>
                              <SelectItem value="consumabile">{t("products.consumable")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-condition">{t("products.condition")} *</Label>
                          <Select name="condition" defaultValue={editingProduct.condition}>
                            <SelectTrigger id="edit-condition" data-testid="edit-select-condition">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nuovo">{t("products.newOriginal")}</SelectItem>
                              <SelectItem value="ricondizionato">{t("products.refurbished")}</SelectItem>
                              <SelectItem value="usato">{t("products.used")}</SelectItem>
                              <SelectItem value="compatibile">{t("products.compatibleAftermarket")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-color">{t("products.color")}</Label>
                          <Select name="color" defaultValue={editingProduct.color || undefined}>
                            <SelectTrigger id="edit-color" data-testid="edit-select-color">
                              <SelectValue placeholder={t("products.selectColor")} />
                            </SelectTrigger>
                            <SelectContent>
                              {COLORS.map(color => (
                                <SelectItem key={color.value} value={color.value}>{t(color.labelKey)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-description">{t("common.description")}</Label>
                        <Textarea 
                          id="edit-description" 
                          name="description" 
                          defaultValue={editingProduct.description || ""}
                          rows={3}
                          data-testid="edit-textarea-description" 
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Label htmlFor="edit-isActive">{t("products.productStatus")}</Label>
                        <Select name="isActive" defaultValue={editingProduct.isActive ? "true" : "false"}>
                          <SelectTrigger className="w-40" data-testid="edit-select-is-active">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">{t("common.active")}</SelectItem>
                            <SelectItem value="false">{t("common.disabled")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value="compatibility" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-deviceTypeId">{t("products.deviceType")}</Label>
                        <Select name="deviceTypeId" defaultValue={editingProduct.deviceTypeId || "all"}>
                          <SelectTrigger id="edit-deviceTypeId" data-testid="edit-select-device-type">
                            <Smartphone className="h-4 w-4 mr-2" />
                            <SelectValue placeholder={t("settings.allDevices")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("products.allDevices")}</SelectItem>
                            {deviceTypes.map(dt => (
                              <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{t("products.deviceCategoryGeneral")}</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-brand">{t("products.brand")}</Label>
                        <Select name="brand" defaultValue={editingProduct.brand || undefined}>
                          <SelectTrigger id="edit-brand" data-testid="edit-select-brand">
                            <SelectValue placeholder={t("products.selectBrand")} />
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
                          <Label>{t("products.compatibleDevices")}</Label>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setNewBrandDialogOpen(true)}
                              data-testid="edit-button-new-brand"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {t("products.brand")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setNewModelDialogOpen(true)}
                              data-testid="edit-button-new-model"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {t("products.model")}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {t("products.selectCompatibleDevicesEdit")}
                        </p>
                        {isLoadingCompatibilities ? (
                          <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                        ) : (
                          <ScrollArea className="h-64 border rounded-md p-2">
                            {deviceBrands.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-2">{t("products.noDeviceBrandsAvailable")}</p>
                            ) : (
                              <div className="space-y-1">
                                {deviceBrands.map((brand) => {
                                  const models = getModelsForBrand(brand.id);
                                  const isExpanded = expandedBrands.has(brand.id);
                                  const hasAnyCompatibility = editDeviceCompatibilities.some(c => c.deviceBrandId === brand.id);
                                  const hasBrandOnlyCompatibility = editDeviceCompatibilities.some(c => c.deviceBrandId === brand.id && !c.deviceModelId);
                                  
                                  return (
                                    <div key={brand.id} className="border rounded-md">
                                      <div className="flex flex-wrap items-center gap-2 p-2 hover-elevate">
                                        <Checkbox
                                          checked={hasAnyCompatibility}
                                          onCheckedChange={() => toggleBrandCompatibility(brand.id, true)}
                                          data-testid={`edit-checkbox-brand-${brand.id}`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => toggleBrandExpansion(brand.id)}
                                          className="flex flex-wrap items-center gap-1 flex-1 text-left"
                                        >
                                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                          <span className="font-medium">{brand.name}</span>
                                          {hasBrandOnlyCompatibility && (
                                            <Badge variant="outline" className="ml-2 text-xs">{t("products.allModels")}</Badge>
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
                                              <div key={model.id} className="flex flex-wrap items-center gap-2 p-1 hover-elevate rounded">
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
                                            <p className="text-xs text-muted-foreground italic">{t("products.noModelsClickToAdd")}</p>
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
                                {c.brandName || t("products.brand")}{c.modelName ? ` - ${c.modelName}` : ` (${t("products.allLabel")})`}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-costPrice">{t("products.purchasePrice")} (€)</Label>
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
                          <Label htmlFor="edit-unitPrice">{t("products.salePrice")} (€) *</Label>
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
                        <Label htmlFor="edit-warrantyMonths">{t("products.warrantyMonths")}</Label>
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
                              className="flex flex-wrap items-center gap-3 p-3 border rounded-lg"
                              data-testid={`row-product-supplier-${ps.id}`}
                            >
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
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
                                    <Badge variant="secondary">{t("common.inactive")}</Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                                  {ps.supplierCode && (
                                    <span>{t("common.code")}: {ps.supplierCode}</span>
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
                              <div className="flex flex-wrap items-center gap-1">
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
                                    if (confirm(t("products.removeSupplierConfirm"))) {
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
                              {editingProductSupplier ? t("products.editSupplier") : t("products.associateSupplier")}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleSupplierSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="ps-supplierId">{t("suppliers.supplier")} *</Label>
                              <Select 
                                name="supplierId" 
                                defaultValue={editingProductSupplier?.supplierId}
                              >
                                <SelectTrigger data-testid="select-product-supplier">
                                  <SelectValue placeholder={t("suppliers.selectSupplier")} />
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="ps-supplierCode">{t("suppliers.supplierCode")}</Label>
                                <Input
                                  id="ps-supplierCode"
                                  name="supplierCode"
                                  defaultValue={editingProductSupplier?.supplierCode || ""}
                                  placeholder={t("suppliers.supplierCode")}
                                  data-testid="input-ps-code"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="ps-purchasePrice">{t("products.purchasePrice")} (€)</Label>
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="ps-minOrderQty">{t("products.minQty")}</Label>
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
                                <Label htmlFor="ps-packSize">{t("products.packSize")}</Label>
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
                                <Label htmlFor="ps-leadTimeDays">{t("products.leadTimeDays")}</Label>
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
                              <Label htmlFor="ps-supplierName">{t("products.supplierProductName")}</Label>
                              <Input
                                id="ps-supplierName"
                                name="supplierName"
                                defaultValue={editingProductSupplier?.supplierName || ""}
                                placeholder={t("products.supplierProductName")}
                                data-testid="input-ps-name"
                              />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Label>{t("products.preferredSupplier")}</Label>
                              <Select 
                                name="isPreferred" 
                                defaultValue={editingProductSupplier?.isPreferred ? "true" : "false"}
                              >
                                <SelectTrigger className="w-32" data-testid="select-ps-preferred">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="true">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <Star className="h-3 w-3" />
                                      {t("common.yes")}
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="false">
                                    <div className="flex flex-wrap items-center gap-1">
                                      <StarOff className="h-3 w-3" />
                                      {t("common.no")}
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
                                {t("common.cancel")}
                              </Button>
                              <Button
                                type="submit"
                                disabled={createProductSupplierMutation.isPending || updateProductSupplierMutation.isPending}
                                data-testid="button-submit-ps"
                              >
                                {(createProductSupplierMutation.isPending || updateProductSupplierMutation.isPending)
                                  ? t("settings.savingRate")
                                  : editingProductSupplier ? t("common.update") : t("products.associate")}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-minStock">{t("warehouse.minStock")}</Label>
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
                          <Label className="flex flex-wrap items-center gap-2">
                            <Warehouse className="h-4 w-4" />
                            {t("warehouse.quantityByWarehouse")}
                          </Label>
                          <Select onValueChange={addEditStock}>
                            <SelectTrigger className="w-56" data-testid="edit-select-add-warehouse">
                              <SelectValue placeholder={t("warehouse.addWarehouse")} />
                            </SelectTrigger>
                            <SelectContent>
                              {groupedWarehouses.admin.filter(w => !editStock.find(s => s.warehouseId === w.id)).length > 0 && (
                                <SelectGroup>
                                  <SelectLabel>{t("warehouse.adminWarehouses")}</SelectLabel>
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
                                  <SelectLabel>{t("warehouse.resellerWarehouses")}</SelectLabel>
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
                                  <SelectLabel>{t("warehouse.subResellerWarehouses")}</SelectLabel>
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
                                  <SelectLabel>{t("warehouse.repairCenterWarehouses")}</SelectLabel>
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
                            {t("warehouse.noStockSelectWarehouse")}
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
                                      {updateStockMutation.isPending ? "..." : t("common.save")}
                                    </Button>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex-1">
                                      <Label className="text-xs text-muted-foreground">{t("common.quantity")}</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        value={stock.quantity}
                                        onChange={(e) => updateEditStock(stock.warehouseId, parseInt(e.target.value) || 0)}
                                        data-testid={`edit-input-stock-${stock.warehouseId}`}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <Label className="text-xs text-muted-foreground">{t("warehouse.location")}</Label>
                                      <Input
                                        value={stock.location}
                                        onChange={(e) => updateEditStockLocation(stock.warehouseId, e.target.value)}
                                        placeholder={t("warehouse.locationPlaceholder")}
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
                    {updateProductMutation.isPending ? t("settings.savingRate") : t("products.saveChanges")}
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
                placeholder={t("common.search")}
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
                <SelectItem value="all">{t("products.allCategories")}</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{t(cat.labelKey)}</SelectItem>
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
              <p>{t("products.noProductsFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>{t("products.product")}</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>{t("common.category")}</TableHead>
                  <TableHead>{t("products.condition")}</TableHead>
                  <TableHead>{t("products.sale")}</TableHead>
                  <TableHead>
                    <div className="flex flex-wrap items-center gap-1">
                      <Warehouse className="h-4 w-4" />
                      {t("warehouse.stock")}
                    </div>
                  </TableHead>
                  <TableHead>{t("products.compatibility")}</TableHead>
                  <TableHead>
                    <div className="flex flex-wrap items-center gap-1">
                      <Store className="h-4 w-4" />
                      {t("products.shop")}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                              <div className="font-semibold mb-2">{t("warehouse.stockByWarehouse")}:</div>
                              {stockByWarehouse.map((stock) => (
                                <div key={stock.warehouseId} className="flex justify-between gap-4 text-sm">
                                  <span>{stock.warehouseName} ({stock.ownerName})</span>
                                  <span className="font-mono">{stock.quantity}</span>
                                </div>
                              ))}
                              <Separator className="my-2" />
                              <div className="flex justify-between gap-4 font-semibold">
                                <span>{t("common.total")}</span>
                                <span className="font-mono">{totalStock}</span>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          {t("warehouse.noStock")}
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
                                    return `${uniqueBrands[0]} (${modelCount} ${t("products.modelsCount")})`;
                                  } else {
                                    return `${uniqueBrands.length} ${t("products.brandsCount")}`;
                                  }
                                })()}
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <div className="font-semibold mb-2">{t("products.compatibleDevicesLabel")}:</div>
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
                                      <span className="text-muted-foreground"> ({t("products.allModels")})</span>
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
                          <div className="flex flex-wrap items-center gap-2">
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
                            ? t("products.hiddenFromShopToggle") 
                            : t("products.visibleInShopToggle")}
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
                          <TooltipContent>{t("products.productDetails")}</TooltipContent>
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
                          <TooltipContent>{t("products.resellerPrices")}</TooltipContent>
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
            <DialogTitle className="flex flex-wrap items-center gap-2">
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
                    <TableHead>{t("roles.reseller")}</TableHead>
                    <TableHead className="text-right">Prezzo Base</TableHead>
                    <TableHead className="text-right">Prezzo Personalizzato</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                          className="flex flex-wrap items-center gap-2 justify-end"
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
                          <div className="flex flex-wrap items-center gap-1">
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
                          <div className="flex flex-wrap items-center gap-2 justify-end">
                            <Badge variant="secondary" className="text-xs">
                              Personalizzato
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(t("products.removeCustomPriceConfirm"))) {
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
            <DialogTitle>{t("products.newDeviceBrand")}</DialogTitle>
            <DialogDescription>
              Aggiungi un nuovo brand di dispositivo al catalogo
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newBrandName">{t("products.brandName")} *</Label>
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
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={createBrandMutation.isPending || !newBrandName.trim()}
                data-testid="button-submit-new-brand"
              >
                {createBrandMutation.isPending ? t("admin.repairCenters.creating") : t("products.createBrand")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog per creare nuovo Modello */}
      <Dialog open={newModelDialogOpen} onOpenChange={setNewModelDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("products.newDeviceModel")}</DialogTitle>
            <DialogDescription>
              {t("products.addNewDeviceModel")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateModel} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newModelBrand">{t("products.brand")} *</Label>
              <Select value={newModelBrandId} onValueChange={setNewModelBrandId}>
                <SelectTrigger id="newModelBrand" data-testid="select-new-model-brand">
                  <SelectValue placeholder={t("products.selectBrand")} />
                </SelectTrigger>
                <SelectContent>
                  {deviceBrands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newModelName">{t("products.modelName")} *</Label>
              <Input
                id="newModelName"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder={t("products.modelNamePlaceholder")}
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
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={createModelMutation.isPending || !newModelName.trim() || !newModelBrandId}
                data-testid="button-submit-new-model"
              >
                {createModelMutation.isPending ? t("admin.repairCenters.creating") : t("products.createModel")}
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
