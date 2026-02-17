import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Smartphone, Search, Plus, Pencil, Trash2, Battery, HardDrive, Wifi, Loader2, ImagePlus, X, Image, ShoppingCart, Settings, Eye, Store, Save, Warehouse, User, Package, Minus, Wrench as WrenchIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import type { SmartphoneSpecs, Product, ResellerProduct } from "@shared/schema";
import { SmartphoneWizard } from "@/components/SmartphoneWizard";
import { getSpecsConfig } from "@/lib/device-category-config";
import { useTranslation } from "react-i18next";

type WarehouseStock = {
  warehouseId: string;
  warehouseName: string;
  ownerType: 'reseller' | 'sub_reseller' | 'repair_center';
  ownerId: string;
  ownerName: string;
  quantity: number;
};

type AccessibleWarehouse = {
  id: string;
  name: string;
  ownerType: string;
  ownerId: string;
  isActive: boolean;
  owner?: { id: string; username: string; fullName: string | null } | null;
};

type SmartphoneWithSpecs = Product & {
  specs: SmartphoneSpecs | null;
  supplier?: { id: string; name: string; code: string } | null;
};

const STORAGE_OPTIONS = ["16GB", "32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];
const GRADE_OPTIONS = [
  { value: "A+", label: t("products.gradeAPlus") },
  { value: "A", label: t("products.gradeA") },
  { value: "B", label: t("products.gradeB") },
  { value: "C", label: t("products.gradeC") },
  { value: "D", label: t("products.gradeD") },
];
const NETWORK_LOCK_OPTIONS = [
  { value: "unlocked", label: t("products.unlocked") },
  { value: "locked", label: t("products.operatorLocked") },
  { value: "icloud_locked", label: t("products.icloudLocked") },
];
function getConditionOptions(t: (key: string) => string) {
  return [
    { value: "nuovo", label: t("common.new") },
    { value: "ricondizionato", label: t("products.refurbished") },
    { value: "usato", label: t("products.used") },
    { value: "difettoso", label: t("products.defective") },
  ];
}
// Categorie dispositivi
function getDeviceCategories(t: (key: string) => string) {
  return [
    { value: "smartphone", label: t("products.smartphone") },
    { value: "tablet", label: t("products.tablet") },
    { value: "portatile", label: t("products.laptop") },
    { value: "pc_fisso", label: t("products.desktop") },
    { value: "smartwatch", label: t("products.smartwatch") },
    { value: "console", label: t("products.console") },
    { value: "altro", label: t("common.other") },
  ];
}

// Brand per dispositivi mobili
const MOBILE_BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Motorola", "Sony", "Nokia", "Realme", "Vivo", "Honor", "Nothing", "Asus ROG", "Altro"];

// Brand per PC/Laptop
const PC_BRANDS = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "Apple", "MSI", "Microsoft", "Razer", "Samsung", "LG", "Toshiba", "Fujitsu", "Altro"];

// Funzione per ottenere i brand in base alla categoria
const getBrandsForCategory = (category: string) => {
  if (category === "smartphone" || category === "tablet") {
    return MOBILE_BRANDS;
  }
  if (category === "portatile" || category === "pc_fisso") {
    return PC_BRANDS;
  }
  return Array.from(new Set([...MOBILE_BRANDS, ...PC_BRANDS]));
};

// Tutti i brand combinati per il filtro
const ALL_BRANDS = Array.from(new Set([...MOBILE_BRANDS, ...PC_BRANDS]));

const COLOR_OPTIONS = [
  "Nero", "Bianco", "Argento", "Grigio", "Oro", "Oro Rosa", "Blu", "Blu Notte", 
  "Verde", "Verde Alpino", "Viola", "Rosso", "Giallo", "Arancione", "Rosa", "Titanio Nero", 
  "Titanio Naturale", "Titanio Blu", "Titanio Bianco", "Altro"
];

const BATTERY_OPTIONS = [
  { value: "100", label: "100%" },
  { value: "95-99", label: "95-99%" },
  { value: "90-94", label: "90-94%" },
  { value: "85-89", label: "85-89%" },
  { value: "80-84", label: "80-84%" },
  { value: "<80", label: t("products.lessThan80") },
];

const ACCESSORY_OPTIONS = [
  t("products.originalCharger"),
  t("products.usbCable"),
  t("products.earphones"),
  t("products.cover"),
  t("products.screenProtector"),
];

export default function SmartphoneCatalog() {
  const { t } = useTranslation();
  const CONDITION_OPTIONS = getConditionOptions(t);
  const DEVICE_CATEGORIES = getDeviceCategories(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingSmartphone, setEditingSmartphone] = useState<SmartphoneWithSpecs | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [smartphoneToDelete, setSmartphoneToDelete] = useState<SmartphoneWithSpecs | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Dialog per impostazioni venditore (prodotti assegnati)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsProduct, setSettingsProduct] = useState<SmartphoneWithSpecs | null>(null);
  const [settingsData, setSettingsData] = useState({ customPriceCents: 0, isPublished: false });
  
  // Dialog per acquisto da admin
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buyProduct, setBuyProduct] = useState<SmartphoneWithSpecs | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  
  // Carrello B2B (in localStorage per persistenza)
  const [cart, setCart] = useState<Array<{ productId: string; quantity: number; name: string; b2bPrice: number }>>(() => {
    const saved = localStorage.getItem('b2b-cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Marketplace P2P state
  const [marketplaceDialogOpen, setMarketplaceDialogOpen] = useState(false);
  const [marketplaceProduct, setMarketplaceProduct] = useState<SmartphoneWithSpecs | null>(null);
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

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "smartphone",
    brand: "",
    color: "",
    description: "",
    unitPrice: "",
    costPrice: "",
    condition: "ricondizionato",
    warrantyMonths: "12",
    storage: "128GB",
    batteryHealth: "",
    grade: "A",
    networkLock: "unlocked",
    imei: "",
    imei2: "",
    serialNumber: "",
    originalBox: false,
    accessories: [] as string[],
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

  // Brand dinamici basati sulla categoria selezionata
  const availableBrands = getBrandsForCategory(formData.category);

  const { data: smartphones = [], isLoading } = useQuery<SmartphoneWithSpecs[]>({
    queryKey: ["/api/smartphones"],
  });

  // Query per le assegnazioni prodotti del reseller
  const { data: assignments = [] } = useQuery<ResellerProduct[]>({
    queryKey: ["/api/reseller/products"],
    select: (data: any[]) => data.filter((a: any) => a.productId),
  });

  // Mappa per accesso rapido alle assegnazioni
  const assignmentMap = new Map(assignments.map(a => [a.productId, a]));

  // Query per magazzini accessibili
  const { data: accessibleWarehouses = [] } = useQuery<AccessibleWarehouse[]>({
    queryKey: ["/api/warehouses/accessible"],
  });
  
  // Mutation per aggiornare impostazioni venditore
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ productId, settings }: { productId: string; settings: { customPriceCents?: number; isPublished?: boolean } }) => {
      return apiRequest("PATCH", `/api/reseller/products/${productId}/settings`, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/products"] });
      setSettingsDialogOpen(false);
      setSettingsProduct(null);
      toast({ title: t("settings.saved"), description: t("products.salesSettingsUpdated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  // Salva carrello in localStorage
  const updateCart = (newCart: typeof cart) => {
    setCart(newCart);
    localStorage.setItem('b2b-cart', JSON.stringify(newCart));
  };

  // Aggiungi al carrello B2B con validazione quantità
  const addToCart = (product: SmartphoneWithSpecs, quantity: number, b2bPrice: number) => {
    const assignment = assignmentMap.get(product.id);
    const minQty = assignment?.minimumOrderQuantity || 1;
    
    // Validazione quantità
    if (quantity < 1) {
      toast({ title: t("common.error"), description: t("products.quantityMinOne"), variant: "destructive" });
      return;
    }
    if (quantity < minQty) {
      toast({ title: t("common.error"), description: t("products.minQuantityIs", { qty: minQty }), variant: "destructive" });
      return;
    }
    
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty < minQty) {
        toast({ title: t("common.error"), description: t("products.minQuantityIs", { qty: minQty }), variant: "destructive" });
        return;
      }
      updateCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: newQty }
          : item
      ));
    } else {
      updateCart([...cart, { productId: product.id, quantity, name: product.name, b2bPrice }]);
    }
    toast({ title: t("products.addedToCart"), description: `${quantity}x ${product.name}` });
    setBuyDialogOpen(false);
    setBuyProduct(null);
    setBuyQuantity(1);
  };

  const createMutation = useMutation({
    mutationFn: async (data: { product: any; specs: any; imageFile?: File | null; supplierId?: string }) => {
      let createdProduct;
      if (data.imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("product", JSON.stringify(data.product));
        formDataUpload.append("specs", JSON.stringify(data.specs));
        formDataUpload.append("image", data.imageFile);
        const response = await fetch("/api/smartphones", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!response.ok) throw new Error(await response.text());
        createdProduct = await response.json();
      } else {
        const res = await apiRequest("POST", "/api/smartphones", { product: data.product, specs: data.specs });
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
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: t("products.smartphoneAdded"), description: t("products.smartphoneAddedDesc") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: any }) => {
      await apiRequest("PATCH", `/api/smartphones/${productId}`, { product: data.product, specs: data.specs });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      setDialogOpen(false);
      setEditingSmartphone(null);
      setEditStock([]);
      resetForm();
      toast({ title: t("products.smartphoneUpdated"), description: t("products.changesSaved") });
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
      return apiRequest("DELETE", `/api/smartphones/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      setDeleteDialogOpen(false);
      setSmartphoneToDelete(null);
      toast({ title: t("pages.deleted"), description: t("products.smartphoneDeleted") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  // Marketplace mutation
  const updateMarketplaceMutation = useMutation({
    mutationFn: async ({ productId, enabled, priceCents, minQuantity }: { productId: string; enabled: boolean; priceCents: number | null; minQuantity: number }) => {
      return apiRequest("PATCH", `/api/smartphones/${productId}/marketplace`, { enabled, priceCents, minQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      setMarketplaceDialogOpen(false);
      setMarketplaceProduct(null);
      toast({ title: t("common.saved"), description: t("products.marketplaceSettingsUpdated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const openMarketplaceDialog = (product: SmartphoneWithSpecs) => {
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
        toast({ title: t("common.error"), description: t("products.unsupportedFormat"), variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: t("common.error"), description: t("products.imageTooLarge"), variant: "destructive" });
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
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      toast({ title: t("products.imageRemoved") });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      name: "",
      sku: "",
      category: "smartphone",
      brand: "",
      color: "",
      description: "",
      unitPrice: "",
      costPrice: "",
      condition: "ricondizionato",
      warrantyMonths: "12",
      storage: "128GB",
      batteryHealth: "",
      grade: "A",
      networkLock: "unlocked",
      imei: "",
      imei2: "",
      serialNumber: "",
      originalBox: false,
      accessories: [],
      notes: "",
      supplierId: "",
    });
  };

  const openEditDialog = async (smartphone: SmartphoneWithSpecs) => {
    setEditingSmartphone(smartphone);
    setImageFile(null);
    setImagePreview(smartphone.imageUrl || null);
    setLoadingEditStock(true);
    setEditStock([]);
    setFormData({
      name: smartphone.name,
      sku: smartphone.sku,
      category: smartphone.category || "smartphone",
      brand: smartphone.brand || "",
      color: smartphone.color || "",
      description: smartphone.description || "",
      unitPrice: smartphone.unitPrice ? (smartphone.unitPrice / 100).toString() : "",
      costPrice: smartphone.costPrice ? (smartphone.costPrice / 100).toString() : "",
      condition: smartphone.condition,
      warrantyMonths: smartphone.warrantyMonths?.toString() || "12",
      storage: smartphone.specs?.storage || "128GB",
      batteryHealth: smartphone.specs?.batteryHealth?.toString() || "",
      grade: smartphone.specs?.grade || "A",
      networkLock: smartphone.specs?.networkLock || "unlocked",
      imei: smartphone.specs?.imei || "",
      imei2: smartphone.specs?.imei2 || "",
      serialNumber: smartphone.specs?.serialNumber || "",
      originalBox: smartphone.specs?.originalBox || false,
      accessories: smartphone.specs?.accessories || [],
      notes: smartphone.specs?.notes || "",
      supplierId: smartphone.supplier?.id || "",
    });
    setDialogOpen(true);
    
    // Load stock for this product
    try {
      const res = await fetch(`/api/reseller/products/${smartphone.id}/stock`, {
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
      toast({ title: t("common.error"), description: t("warehouse.notFound"), variant: "destructive" });
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
      category: formData.category,
      brand: formData.brand,
      color: formData.color,
      description: formData.description,
      unitPrice: Math.round(parseFloat(formData.unitPrice || "0") * 100),
      costPrice: formData.costPrice ? Math.round(parseFloat(formData.costPrice) * 100) : null,
      condition: formData.condition,
      warrantyMonths: parseInt(formData.warrantyMonths) || 12,
    };

    const specs = {
      storage: formData.storage,
      batteryHealth: formData.batteryHealth || null,
      grade: formData.grade,
      networkLock: formData.networkLock,
      imei: formData.imei || null,
      imei2: formData.imei2 || null,
      serialNumber: formData.serialNumber || null,
      originalBox: formData.originalBox,
      accessories: formData.accessories.length > 0 ? formData.accessories : null,
      notes: formData.notes || null,
    };

    if (editingSmartphone) {
      const productId = editingSmartphone.id;
      const currentEditStock = [...editStock];
      
      try {
        await updateMutation.mutateAsync({ productId, data: { product, specs } });
        
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
              description: t("products.savedButStockNotUpdated"), 
              variant: "destructive" 
            });
          }
        }
      } catch (error) {
        // Error handled by mutation
      }
    } else {
      createMutation.mutate({ product, specs, imageFile, supplierId: formData.supplierId || undefined });
    }
  };

  const filteredSmartphones = smartphones.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specs?.imei?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    const matchesBrand = brandFilter === "all" || s.brand === brandFilter;
    const matchesGrade = gradeFilter === "all" || s.specs?.grade === gradeFilter;
    return matchesSearch && matchesCategory && matchesBrand && matchesGrade;
  });

  const getGradeColor = (grade: string | null | undefined) => {
    switch (grade) {
      case "A+": return "bg-green-500";
      case "A": return "bg-green-400";
      case "B": return "bg-yellow-500";
      case "C": return "bg-orange-500";
      case "D": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getNetworkLockBadge = (lock: string | null | undefined) => {
    switch (lock) {
      case "unlocked": return <Badge variant="outline" className="text-green-600 border-green-600">{t("products.unlocked")}</Badge>;
      case "locked": return <Badge variant="outline" className="text-yellow-600 border-yellow-600">{t("warehouse.operator")}</Badge>;
      case "icloud_locked": return <Badge variant="destructive">iCloud Lock</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header - Modern Glass Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{t("products.deviceCatalog")}</h1>
              <p className="text-sm text-white/80">{t("products.manageCatalogDesc")}</p>
            </div>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white shadow-lg" data-testid="button-add-device">
            <Plus className="mr-2 h-4 w-4" />
            t("products.addDevice")
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>{t("products.deviceList")} ({filteredSmartphones.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("products.searchByNameSkuImei")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-devices"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36" data-testid="select-category-filter">
                <SelectValue placeholder={t("common.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("products.allCategories")}</SelectItem>
                {DEVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-36" data-testid="select-brand-filter">
                <SelectValue placeholder={t("products.brand")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("products.allBrands")}</SelectItem>
                {ALL_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-36" data-testid="select-grade-filter">
                <SelectValue placeholder={t("products.grade")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("products.allGrades")}</SelectItem>
                {GRADE_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
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
          ) : filteredSmartphones.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Smartphone className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>{t("products.noDevicesInCatalog")}</p>
              <p className="text-sm">{t("products.clickAddToStart")}</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t("common.photo")}</TableHead>
                    <TableHead>{t("repairs.device")}</TableHead>
                    <TableHead>{t("products.barcode")}</TableHead>
                    <TableHead>{t("common.category")}</TableHead>
                    <TableHead>{t("common.type")}</TableHead>
                    <TableHead>{t("common.supplier")}</TableHead>
                    <TableHead className="text-right">{t("common.price")}</TableHead>
                    <TableHead className="text-center">{t("marketplace.title")}</TableHead>
                    <TableHead className="w-32">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSmartphones.map((smartphone) => (
                    <TableRow key={smartphone.id} data-testid={`row-smartphone-${smartphone.id}`}>
                      <TableCell>
                        {smartphone.imageUrl ? (
                          <img
                            src={smartphone.imageUrl}
                            alt={smartphone.name}
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
                          <div className="font-medium">{smartphone.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {smartphone.brand} {smartphone.color && `• ${smartphone.color}`}
                          </div>
                          <div className="text-xs text-muted-foreground">SKU: {smartphone.sku}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <BarcodeDisplay value={smartphone.barcode || ""} size="sm" />
                      </TableCell>
                      <TableCell>
                        {smartphone.category ? (
                          <Badge variant="outline" className="text-xs">
                            {DEVICE_CATEGORIES.find(c => c.value === smartphone.category)?.label || smartphone.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(smartphone as any).isOwn ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            t("products.own")
                          </Badge>
                        ) : assignmentMap.has(smartphone.id) ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            t("products.assigned")
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            {t("common.admin")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {smartphone.supplier ? (
                          <Badge variant="outline" className="text-xs">{smartphone.supplier.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(() => {
                          const assignment = assignmentMap.get(smartphone.id);
                          if (assignment?.customPriceCents) {
                            return `€${(assignment.customPriceCents / 100).toFixed(2)}`;
                          }
                          return `€${(smartphone.unitPrice / 100).toFixed(2)}`;
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        {(smartphone as any).isOwn ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1"
                                onClick={() => openMarketplaceDialog(smartphone)}
                                data-testid={`button-marketplace-smartphone-${smartphone.id}`}
                              >
                                <Store className="h-3 w-3" />
                                {(smartphone as any).isMarketplaceEnabled ? (
                                  <Badge variant="default" className="text-xs">{t("common.active")}</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Off</Badge>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("products.configureMarketplaceSale")}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {(smartphone as any).isOwn ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(smartphone)}
                                title={t("common.edit")}
                                data-testid={`button-edit-smartphone-${smartphone.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSmartphoneToDelete(smartphone); setDeleteDialogOpen(true); }}
                                title={t("common.delete")}
                                data-testid={`button-delete-smartphone-${smartphone.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          ) : assignmentMap.has(smartphone.id) ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const assignment = assignmentMap.get(smartphone.id);
                                  setSettingsProduct(smartphone);
                                  setSettingsData({
                                    customPriceCents: assignment?.customPriceCents || smartphone.unitPrice,
                                    isPublished: assignment?.isPublished || false,
                                  });
                                  setSettingsDialogOpen(true);
                                }}
                                title={t("products.salesSettings")}
                                data-testid={`button-settings-smartphone-${smartphone.id}`}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const assignment = assignmentMap.get(smartphone.id);
                                  setBuyProduct(smartphone);
                                  setBuyQuantity(assignment?.minimumOrderQuantity || 1);
                                  setBuyDialogOpen(true);
                                }}
                                title={t("products.buyFromAdmin")}
                                data-testid={`button-buy-smartphone-${smartphone.id}`}
                              >
                                <ShoppingCart className="h-4 w-4 text-green-600" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(smartphone)}
                              title={t("common.view")}
                              data-testid={`button-view-smartphone-${smartphone.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
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
            <DialogTitle>{editingSmartphone ? t("products.editSmartphone") : t("products.addSmartphone")}</DialogTitle>
            <DialogDescription>
              {editingSmartphone ? t("products.editSmartphoneDesc") : t("products.addSmartphoneDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("products.deviceName")} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("products.deviceNamePlaceholder")}
                  data-testid="input-smartphone-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder={t("products.skuPlaceholder")}
                  data-testid="input-smartphone-sku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t("common.category")} *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger data-testid="select-smartphone-category">
                    <SelectValue placeholder={t("utility.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">{t("products.brand")}</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger data-testid="select-smartphone-brand">
                    <SelectValue placeholder={t("products.selectBrand")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrands.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">{t("products.color")}</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                  <SelectTrigger data-testid="select-smartphone-color">
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
                <Label htmlFor="condition">{t("products.condition")}</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                  <SelectTrigger data-testid="select-smartphone-condition">
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

            {/* Specifiche dinamiche in base alla categoria */}
            {(() => {
              const specsConfig = getSpecsConfig(formData.category);
              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {specsConfig.storage && (
                      <div className="space-y-2">
                        <Label htmlFor="storage">{t("products.storage")} *</Label>
                        <Select value={formData.storage} onValueChange={(v) => setFormData({ ...formData, storage: v })}>
                          <SelectTrigger data-testid="select-smartphone-storage">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STORAGE_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {specsConfig.grade && (
                      <div className="space-y-2">
                        <Label htmlFor="grade">{t("products.grade")}</Label>
                        <Select value={formData.grade} onValueChange={(v) => setFormData({ ...formData, grade: v })}>
                          <SelectTrigger data-testid="select-smartphone-grade">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GRADE_OPTIONS.map((g) => (
                              <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {specsConfig.networkLock && (
                      <div className="space-y-2">
                        <Label htmlFor="networkLock">{t("products.networkStatus")}</Label>
                        <Select value={formData.networkLock} onValueChange={(v) => setFormData({ ...formData, networkLock: v })}>
                          <SelectTrigger data-testid="select-smartphone-network">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {NETWORK_LOCK_OPTIONS.map((n) => (
                              <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {specsConfig.batteryHealth && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="batteryHealth">{t("products.batteryHealth")}</Label>
                        <Select value={formData.batteryHealth} onValueChange={(v) => setFormData({ ...formData, batteryHealth: v })}>
                          <SelectTrigger data-testid="select-smartphone-battery">
                            <SelectValue placeholder={t("products.selectBattery")} />
                          </SelectTrigger>
                          <SelectContent>
                            {BATTERY_OPTIONS.map((b) => (
                              <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {specsConfig.imei && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="imei">{t("repairs.imei")}</Label>
                          <Input
                            id="imei"
                            value={formData.imei}
                            onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                            placeholder={t("products.imeiPlaceholder")}
                            data-testid="input-smartphone-imei"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imei2">{t("products.imei2DualSim")}</Label>
                          <Input
                            id="imei2"
                            value={formData.imei2}
                            onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                            placeholder={t("common.optional")}
                            data-testid="input-smartphone-imei2"
                          />
                        </div>
                      </>
                    )}
                    {specsConfig.serialNumber && (
                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">{t("products.serialNumber")}</Label>
                        <Input
                          id="serialNumber"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          placeholder={t("products.serialNumberPlaceholder")}
                          data-testid="input-smartphone-serial"
                        />
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">{t("products.sellingPrice")} *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder={t("products.pricePlaceholder")}
                  data-testid="input-smartphone-price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">{t("products.costPrice")}</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder={t("products.costPricePlaceholder")}
                  data-testid="input-smartphone-cost"
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
                  data-testid="input-smartphone-warranty"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">{t("products.preferredSupplier")}</Label>
              <Select value={formData.supplierId || "none"} onValueChange={(v) => setFormData({ ...formData, supplierId: v === "none" ? "" : v })}>
                <SelectTrigger data-testid="select-smartphone-supplier">
                  <SelectValue placeholder={t("products.selectSupplierOptional")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.none")}</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campi opzionali dinamici in base alla categoria */}
            {(() => {
              const specsConfig = getSpecsConfig(formData.category);
              return (
                <>
                  {specsConfig.originalBox && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="originalBox"
                        checked={formData.originalBox}
                        onCheckedChange={(checked) => setFormData({ ...formData, originalBox: checked as boolean })}
                        data-testid="checkbox-smartphone-box"
                      />
                      <Label htmlFor="originalBox" className="text-sm cursor-pointer">
                        t("products.includesOriginalBox")
                      </Label>
                    </div>
                  )}

                  {specsConfig.accessories && (
                    <div className="space-y-2">
                      <Label>{t("products.includedAccessories")}</Label>
                      <div className="flex flex-wrap gap-4">
                        {ACCESSORY_OPTIONS.map((acc) => (
                          <div key={acc} className="flex flex-wrap items-center gap-2">
                            <Checkbox
                              id={`acc-${acc}`}
                              checked={formData.accessories.includes(acc)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({ ...formData, accessories: [...formData.accessories, acc] });
                                } else {
                                  setFormData({ ...formData, accessories: formData.accessories.filter(a => a !== acc) });
                                }
                              }}
                              data-testid={`checkbox-accessory-${acc.replace(/\s/g, '-').toLowerCase()}`}
                            />
                            <Label htmlFor={`acc-${acc}`} className="text-sm">{acc}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {specsConfig.description && (
                    <div className="space-y-2">
                      <Label htmlFor="description">{t("common.description")}</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder={t("products.deviceDescription")}
                        rows={2}
                        data-testid="textarea-smartphone-description"
                      />
                    </div>
                  )}
                </>
              );
            })()}

            <div className="space-y-2">
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("products.additionalDeviceNotes")}
                rows={3}
                data-testid="textarea-smartphone-notes"
              />
            </div>

            <div className="space-y-2">
                <Label>{t("products.productImage")}</Label>
                <div className="flex items-start gap-4">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt={t("common.preview")}
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
                  ) : editingSmartphone?.imageUrl ? (
                    <div className="relative">
                      <img
                        src={editingSmartphone.imageUrl}
                        alt={t("common.existing")}
                        className="h-24 w-24 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => deleteImage(editingSmartphone.id)}
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
                      t("products.selectImage")
                    </Button>
                    {editingSmartphone && imageFile && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => uploadImage(editingSmartphone.id)}
                        disabled={uploadingImage}
                        data-testid="button-upload-image"
                      >
                        {uploadingImage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        t("products.uploadImage")
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">JPEG, PNG, WebP o GIF. Max 10MB.</p>
                  </div>
                </div>
              </div>

            {/* Sezione Magazzino - solo in modifica */}
            {editingSmartphone && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    t("warehouse.warehouseStock")
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
                    <span className="ml-2 text-sm text-muted-foreground">{t("warehouse.loadingStock")}</span>
                  </div>
                ) : editStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">
                    {t("warehouse.noStockConfigured")}
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
                            ({t("common.was")}: {stock.originalQuantity})
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
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingSmartphone(null); }}>{t("common.cancel")}</Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || !formData.unitPrice || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-smartphone"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSmartphone ? t("profile.saveChanges") : t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.teams.deleteConfirm")}</DialogTitle>
            <DialogDescription>
              {t("products.confirmDeleteDevice", { name: smartphoneToDelete?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => smartphoneToDelete && deleteMutation.mutate(smartphoneToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Impostazioni Venditore */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("products.salesSettings")}</DialogTitle>
            <DialogDescription>
              {t("products.configurePriceVisibility", { name: settingsProduct?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("products.originalPriceAdmin")}</Label>
              <div className="text-lg font-medium text-muted-foreground">
                €{settingsProduct ? (settingsProduct.unitPrice / 100).toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customPrice">{t("products.yourSellingPrice")}</Label>
              <Input
                id="customPrice"
                type="number"
                step="0.01"
                min="0"
                value={(settingsData.customPriceCents / 100).toFixed(2)}
                onChange={(e) => setSettingsData({ ...settingsData, customPriceCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                data-testid="input-custom-price"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isPublished">{t("products.publishToShop")}</Label>
                <p className="text-sm text-muted-foreground">{t("products.makeVisibleToCustomers")}</p>
              </div>
              <Switch
                id="isPublished"
                checked={settingsData.isPublished}
                onCheckedChange={(checked) => setSettingsData({ ...settingsData, isPublished: checked })}
                data-testid="switch-is-published"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => settingsProduct && updateSettingsMutation.mutate({
                productId: settingsProduct.id,
                settings: settingsData
              })}
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Acquista da Admin */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("products.buyFromAdmin")}</DialogTitle>
            <DialogDescription>
              {t("products.addToB2BCart", { name: buyProduct?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap items-center gap-4">
              {buyProduct?.imageUrl ? (
                <img src={buyProduct.imageUrl} alt={buyProduct.name} className="h-16 w-16 object-cover rounded-md" />
              ) : (
                <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="font-medium">{buyProduct?.name}</div>
                <div className="text-sm text-muted-foreground">{buyProduct?.brand}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("products.b2bPrice")}</Label>
              <div className="text-xl font-bold text-green-600">
                €{(() => {
                  if (!buyProduct) return '0.00';
                  const assignment = assignmentMap.get(buyProduct.id);
                  const b2bPrice = assignment?.b2bPriceCents || buyProduct.costPrice || Math.round(buyProduct.unitPrice * 0.7);
                  return (b2bPrice / 100).toFixed(2);
                })()}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyQuantity">{t("common.quantity")}</Label>
              <Input
                id="buyQuantity"
                type="number"
                min={assignmentMap.get(buyProduct?.id || '')?.minimumOrderQuantity || 1}
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(parseInt(e.target.value) || 1)}
                data-testid="input-buy-quantity"
              />
              {assignmentMap.get(buyProduct?.id || '')?.minimumOrderQuantity && (
                <p className="text-xs text-muted-foreground">
                  {t("products.minQuantity")}: {assignmentMap.get(buyProduct?.id || '')?.minimumOrderQuantity}
                </p>
              )}
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between">
                <span>{t("common.total")}:</span>
                <span className="font-bold">
                  €{(() => {
                    if (!buyProduct) return '0.00';
                    const assignment = assignmentMap.get(buyProduct.id);
                    const b2bPrice = assignment?.b2bPriceCents || buyProduct.costPrice || Math.round(buyProduct.unitPrice * 0.7);
                    return ((b2bPrice * buyQuantity) / 100).toFixed(2);
                  })()}
                </span>
              </div>
            </div>
            {cart.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {t("products.itemsInB2BCart", { count: cart.reduce((sum, item) => sum + item.quantity, 0) })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button
              onClick={() => {
                if (!buyProduct) return;
                const assignment = assignmentMap.get(buyProduct.id);
                const b2bPrice = assignment?.b2bPriceCents || buyProduct.costPrice || Math.round(buyProduct.unitPrice * 0.7);
                addToCart(buyProduct, buyQuantity, b2bPrice);
              }}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              t("products.addToCart")
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Marketplace Settings */}
      <Dialog open={marketplaceDialogOpen} onOpenChange={setMarketplaceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Store className="h-5 w-5" />
              t("products.marketplaceP2PSettings")
            </DialogTitle>
            <DialogDescription>
              t("products.configureMarketplaceDesc")
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
                  <Label className="text-base">{t("products.activeOnMarketplace")}</Label>
                  <p className="text-sm text-muted-foreground">
                    t("products.makeVisibleToResellers")
                  </p>
                </div>
                <Switch
                  checked={marketplaceEnabled}
                  onCheckedChange={setMarketplaceEnabled}
                  data-testid="switch-marketplace-smartphone-enabled"
                />
              </div>
              
              {marketplaceEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="marketplace-smartphone-price">{t("products.marketplacePrice")}</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground">€</span>
                      <Input
                        id="marketplace-smartphone-price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={`Default: ${formatCurrency(marketplaceProduct.unitPrice)}`}
                        value={marketplacePrice}
                        onChange={(e) => setMarketplacePrice(e.target.value)}
                        data-testid="input-marketplace-smartphone-price"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      t("products.emptyUsesStandardPrice")
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marketplace-smartphone-min-qty">{t("products.minOrderQuantity")}</Label>
                    <Input
                      id="marketplace-smartphone-min-qty"
                      type="number"
                      min="1"
                      value={marketplaceMinQty}
                      onChange={(e) => setMarketplaceMinQty(e.target.value)}
                      data-testid="input-marketplace-smartphone-min-qty"
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
              data-testid="button-cancel-marketplace-smartphone"
            >{t("common.cancel")}</Button>
            <Button
              onClick={saveMarketplaceSettings}
              disabled={updateMarketplaceMutation.isPending}
              data-testid="button-save-marketplace-smartphone"
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

      <SmartphoneWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
        }}
      />
    </div>
  );
}
