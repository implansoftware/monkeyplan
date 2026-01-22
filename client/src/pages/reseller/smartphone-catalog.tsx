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
  { value: "A+", label: "A+ - Come nuovo" },
  { value: "A", label: "A - Ottimo" },
  { value: "B", label: "B - Buono" },
  { value: "C", label: "C - Discreto" },
  { value: "D", label: "D - Danneggiato" },
];
const NETWORK_LOCK_OPTIONS = [
  { value: "unlocked", label: "Sbloccato" },
  { value: "locked", label: "Bloccato operatore" },
  { value: "icloud_locked", label: "Bloccato iCloud" },
];
const CONDITION_OPTIONS = [
  { value: "nuovo", label: "Nuovo" },
  { value: "ricondizionato", label: "Ricondizionato" },
  { value: "usato", label: "Usato" },
  { value: "difettoso", label: "Difettoso" },
];
// Categorie dispositivi
const DEVICE_CATEGORIES = [
  { value: "smartphone", label: "Smartphone" },
  { value: "tablet", label: "Tablet" },
  { value: "portatile", label: "PC Portatile" },
  { value: "pc_fisso", label: "PC Fisso" },
  { value: "smartwatch", label: "Smartwatch" },
  { value: "console", label: "Console" },
  { value: "altro", label: "Altro" },
];

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
  { value: "<80", label: "Meno di 80%" },
];

const ACCESSORY_OPTIONS = [
  "Caricatore originale",
  "Cavo USB",
  "Auricolari",
  "Cover",
  "Pellicola",
];

export default function SmartphoneCatalog() {
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
      toast({ title: "Impostazioni salvate", description: "Le impostazioni di vendita sono state aggiornate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: "La quantità deve essere almeno 1", variant: "destructive" });
      return;
    }
    if (quantity < minQty) {
      toast({ title: "Errore", description: `La quantità minima per questo prodotto è ${minQty}`, variant: "destructive" });
      return;
    }
    
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty < minQty) {
        toast({ title: "Errore", description: `La quantità minima per questo prodotto è ${minQty}`, variant: "destructive" });
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
    toast({ title: "Aggiunto al carrello", description: `${quantity}x ${product.name}` });
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
      toast({ title: "Smartphone aggiunto", description: "Il dispositivo è stato aggiunto al catalogo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Smartphone aggiornato", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Eliminato", description: "Lo smartphone è stato rimosso dal catalogo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Salvato", description: "Impostazioni Marketplace aggiornate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      const response = await fetch(`/api/reseller/products/${productId}/image`, {
        method: "POST",
        body: formDataUpload,
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
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
      const response = await fetch(`/api/reseller/products/${productId}/image`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      toast({ title: "Immagine rimossa" });
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: "Magazzino non trovato", variant: "destructive" });
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
              title: "Attenzione", 
              description: "Smartphone salvato ma alcune giacenze non sono state aggiornate", 
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
      case "unlocked": return <Badge variant="outline" className="text-green-600 border-green-600">Sbloccato</Badge>;
      case "locked": return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Operatore</Badge>;
      case "icloud_locked": return <Badge variant="destructive">iCloud Lock</Badge>;
      default: return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
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
              <p className="text-sm text-muted-foreground">Gestisci il tuo catalogo di dispositivi nuovi, ricondizionati e usati</p>
            </div>
          </div>
          <Button onClick={() => setWizardOpen(true)} className="shadow-lg shadow-primary/25" data-testid="button-add-device">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Dispositivo
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Lista Dispositivi ({filteredSmartphones.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, SKU o IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-devices"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-36" data-testid="select-category-filter">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {DEVICE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-36" data-testid="select-brand-filter">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le marche</SelectItem>
                {ALL_BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-36" data-testid="select-grade-filter">
                <SelectValue placeholder="Grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i gradi</SelectItem>
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
              <p>Nessuno smartphone nel catalogo</p>
              <p className="text-sm">Clicca "Aggiungi Smartphone" per iniziare</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Foto</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fornitore</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-center">Marketplace</TableHead>
                    <TableHead className="w-32">Azioni</TableHead>
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
                            Proprio
                          </Badge>
                        ) : assignmentMap.has(smartphone.id) ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Assegnato
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Admin
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
                                  <Badge variant="default" className="text-xs">Attivo</Badge>
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
                        <div className="flex items-center gap-1">
                          {(smartphone as any).isOwn ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(smartphone)}
                                title="Modifica"
                                data-testid={`button-edit-smartphone-${smartphone.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSmartphoneToDelete(smartphone); setDeleteDialogOpen(true); }}
                                title="Elimina"
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
                                title="Impostazioni vendita"
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
                                title="Acquista da Admin"
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
                              title="Visualizza"
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
            <DialogTitle>{editingSmartphone ? "Modifica Smartphone" : "Aggiungi Smartphone"}</DialogTitle>
            <DialogDescription>
              {editingSmartphone ? "Modifica i dettagli dello smartphone" : "Inserisci i dettagli del nuovo smartphone"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome dispositivo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es. iPhone 14 Pro Max"
                  data-testid="input-smartphone-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="es. IP14PM-256-BLK"
                  data-testid="input-smartphone-sku"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger data-testid="select-smartphone-category">
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger data-testid="select-smartphone-brand">
                    <SelectValue placeholder="Seleziona marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBrands.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Colore</Label>
                <Select value={formData.color} onValueChange={(v) => setFormData({ ...formData, color: v })}>
                  <SelectTrigger data-testid="select-smartphone-color">
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
                <Label htmlFor="condition">Condizione</Label>
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
                  <div className="grid grid-cols-3 gap-4">
                    {specsConfig.storage && (
                      <div className="space-y-2">
                        <Label htmlFor="storage">Storage *</Label>
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
                        <Label htmlFor="grade">Grado</Label>
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
                        <Label htmlFor="networkLock">Stato Rete</Label>
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="batteryHealth">Batteria %</Label>
                        <Select value={formData.batteryHealth} onValueChange={(v) => setFormData({ ...formData, batteryHealth: v })}>
                          <SelectTrigger data-testid="select-smartphone-battery">
                            <SelectValue placeholder="Seleziona batteria" />
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

                  <div className="grid grid-cols-3 gap-4">
                    {specsConfig.imei && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="imei">IMEI</Label>
                          <Input
                            id="imei"
                            value={formData.imei}
                            onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                            placeholder="es. 353012345678901"
                            data-testid="input-smartphone-imei"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imei2">IMEI 2 (Dual SIM)</Label>
                          <Input
                            id="imei2"
                            value={formData.imei2}
                            onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                            placeholder="Opzionale"
                            data-testid="input-smartphone-imei2"
                          />
                        </div>
                      </>
                    )}
                    {specsConfig.serialNumber && (
                      <div className="space-y-2">
                        <Label htmlFor="serialNumber">Seriale</Label>
                        <Input
                          id="serialNumber"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          placeholder="es. DNPX12345678"
                          data-testid="input-smartphone-serial"
                        />
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Prezzo Vendita *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  placeholder="es. 599.00"
                  data-testid="input-smartphone-price"
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
                  placeholder="es. 450.00"
                  data-testid="input-smartphone-cost"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warrantyMonths">Garanzia (mesi)</Label>
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
              <Label htmlFor="supplierId">Fornitore Preferito</Label>
              <Select value={formData.supplierId || "none"} onValueChange={(v) => setFormData({ ...formData, supplierId: v === "none" ? "" : v })}>
                <SelectTrigger data-testid="select-smartphone-supplier">
                  <SelectValue placeholder="Seleziona fornitore (opzionale)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuno</SelectItem>
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
                        Include scatola originale
                      </Label>
                    </div>
                  )}

                  {specsConfig.accessories && (
                    <div className="space-y-2">
                      <Label>Accessori Inclusi</Label>
                      <div className="flex flex-wrap gap-4">
                        {ACCESSORY_OPTIONS.map((acc) => (
                          <div key={acc} className="flex items-center gap-2">
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
                      <Label htmlFor="description">Descrizione</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrizione del dispositivo..."
                        rows={2}
                        data-testid="textarea-smartphone-description"
                      />
                    </div>
                  )}
                </>
              );
            })()}

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Note aggiuntive sul dispositivo..."
                rows={3}
                data-testid="textarea-smartphone-notes"
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
                  ) : editingSmartphone?.imageUrl ? (
                    <div className="relative">
                      <img
                        src={editingSmartphone.imageUrl}
                        alt="Existing"
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
                      Seleziona immagine
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
                        Carica immagine
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
                    Giacenza Magazzini
                  </Label>
                  <Select
                    value=""
                    onValueChange={(val) => addEditStock(val)}
                  >
                    <SelectTrigger className="w-[200px]" data-testid="select-add-warehouse">
                      <SelectValue placeholder="Aggiungi magazzino..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accessibleWarehouses
                        .filter(w => !editStock.find(s => s.warehouseId === w.id))
                        .map(w => (
                          <SelectItem key={w.id} value={w.id} data-testid={`option-warehouse-${w.id}`}>
                            <div className="flex items-center gap-2">
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
                        className="flex items-center gap-3 p-2 rounded-md border bg-muted/30"
                        data-testid={`stock-row-${stock.warehouseId}`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {stock.ownerType === 'reseller' && <User className="h-4 w-4 text-blue-500 shrink-0" />}
                          {stock.ownerType === 'sub_reseller' && <Store className="h-4 w-4 text-green-500 shrink-0" />}
                          {stock.ownerType === 'repair_center' && <WrenchIcon className="h-4 w-4 text-orange-500 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{stock.warehouseName}</p>
                            <p className="text-xs text-muted-foreground truncate">{stock.ownerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingSmartphone(null); }}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || !formData.unitPrice || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-smartphone"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSmartphone ? "Salva Modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{smartphoneToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => smartphoneToDelete && deleteMutation.mutate(smartphoneToDelete.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Impostazioni Venditore */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Impostazioni Vendita</DialogTitle>
            <DialogDescription>
              Configura il prezzo e la visibilità di "{settingsProduct?.name}" nel tuo shop.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Prezzo originale (Admin)</Label>
              <div className="text-lg font-medium text-muted-foreground">
                €{settingsProduct ? (settingsProduct.unitPrice / 100).toFixed(2) : '0.00'}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customPrice">Tuo prezzo di vendita (€)</Label>
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
                <Label htmlFor="isPublished">Pubblica nello Shop</Label>
                <p className="text-sm text-muted-foreground">Rendi visibile questo prodotto ai tuoi clienti</p>
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
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => settingsProduct && updateSettingsMutation.mutate({
                productId: settingsProduct.id,
                settings: settingsData
              })}
              disabled={updateSettingsMutation.isPending}
              data-testid="button-save-settings"
            >
              {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Acquista da Admin */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Acquista da Admin</DialogTitle>
            <DialogDescription>
              Aggiungi "{buyProduct?.name}" al carrello B2B.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
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
              <Label>Prezzo B2B</Label>
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
              <Label htmlFor="buyQuantity">Quantità</Label>
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
                  Quantità minima: {assignmentMap.get(buyProduct?.id || '')?.minimumOrderQuantity}
                </p>
              )}
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Totale:</span>
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
                Hai {cart.reduce((sum, item) => sum + item.quantity, 0)} articoli nel carrello B2B
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
              Annulla
            </Button>
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
              Aggiungi al Carrello
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Marketplace Settings */}
      <Dialog open={marketplaceDialogOpen} onOpenChange={setMarketplaceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Impostazioni Marketplace P2P
            </DialogTitle>
            <DialogDescription>
              Configura la vendita di questo smartphone ad altri rivenditori nel marketplace.
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
                  data-testid="switch-marketplace-smartphone-enabled"
                />
              </div>
              
              {marketplaceEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="marketplace-smartphone-price">Prezzo Marketplace (opzionale)</Label>
                    <div className="flex items-center gap-2">
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
                      Se vuoto, verrà usato il prezzo standard del prodotto
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="marketplace-smartphone-min-qty">Quantità Minima Ordine</Label>
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
            >
              Annulla
            </Button>
            <Button
              onClick={saveMarketplaceSettings}
              disabled={updateMarketplaceMutation.isPending}
              data-testid="button-save-marketplace-smartphone"
            >
              {updateMarketplaceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salva
                </>
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
