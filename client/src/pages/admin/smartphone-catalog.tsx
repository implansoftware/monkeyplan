import { useState } from "react";
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
import { Smartphone, Search, Plus, Pencil, Trash2, Battery, HardDrive, Loader2, Store, ImagePlus, X, Image, Users, UserPlus, Eye, EyeOff, Warehouse, Link2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import type { SmartphoneSpecs, Product, User, ProductPrice, Warehouse as WarehouseType, DeviceBrand, DeviceModel } from "@shared/schema";
import { ProductDetailDialog } from "@/components/product-detail-dialog";
import { SmartphoneWizard } from "@/components/SmartphoneWizard";

type SmartphoneWithSpecs = Product & {
  specs: SmartphoneSpecs | null;
  reseller?: { id: string; username: string; fullName: string | null } | null;
};

type ProductPriceWithReseller = ProductPrice & {
  reseller?: { id: string; username: string; fullName: string | null } | null;
};

interface InitialStockEntry {
  warehouseId: string;
  quantity: number;
  location: string;
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

interface CompatibilityEntry {
  deviceBrandId: string;
  deviceBrandName?: string;
  deviceModelId: string | null;
  deviceModelName?: string | null;
}

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
const BRANDS = ["Apple", "Samsung", "Xiaomi", "Huawei", "OPPO", "OnePlus", "Google", "Motorola", "Sony", "Nokia", "Altro"];

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

export default function AdminSmartphoneCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
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
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [smartphoneToAssign, setSmartphoneToAssign] = useState<SmartphoneWithSpecs | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [assignPrice, setAssignPrice] = useState<string>("");
  const [assignCostPrice, setAssignCostPrice] = useState<string>("");
  const [initialStock, setInitialStock] = useState<InitialStockEntry[]>([]);
  const [editStock, setEditStock] = useState<Array<{ warehouseId: string; warehouseName: string; ownerType: string; ownerName: string; quantity: number; originalQuantity: number; location: string; originalLocation: string }>>([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [editCompatibilities, setEditCompatibilities] = useState<CompatibilityEntry[]>([]);
  const [selectedDeviceBrandId, setSelectedDeviceBrandId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
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
  });

  const { data: smartphones = [], isLoading } = useQuery<SmartphoneWithSpecs[]>({
    queryKey: ["/api/smartphones"],
  });

  const { data: warehouses = [] } = useQuery<WarehouseForStock[]>({
    queryKey: ["/api/admin/all-warehouses"],
  });

  const { data: resellers = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    select: (users) => users.filter((u) => u.role === "reseller"),
  });

  // Device compatibility queries
  const { data: deviceBrands = [] } = useQuery<DeviceBrand[]>({
    queryKey: ["/api/device-brands"],
    queryFn: async () => {
      const res = await fetch("/api/device-brands", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch brands");
      return res.json();
    },
  });

  const { data: deviceModels = [] } = useQuery<DeviceModel[]>({
    queryKey: ["/api/device-models", selectedDeviceBrandId],
    queryFn: async () => {
      if (!selectedDeviceBrandId) return [];
      const res = await fetch(`/api/device-models?brandId=${selectedDeviceBrandId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch models");
      return res.json();
    },
    enabled: !!selectedDeviceBrandId,
  });

  // Fetch all product assignments for displaying in the table
  const { data: allProductAssignments = [] } = useQuery<ProductPriceWithReseller[]>({
    queryKey: ["/api/admin/product-prices"],
    queryFn: async () => {
      const response = await fetch(`/api/admin/product-prices`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  // Group assignments by product ID for quick lookup
  const assignmentsByProductId = allProductAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.productId]) {
      acc[assignment.productId] = [];
    }
    acc[assignment.productId].push(assignment);
    return acc;
  }, {} as Record<string, ProductPriceWithReseller[]>);

  const { data: productAssignments = [], refetch: refetchAssignments } = useQuery<ProductPriceWithReseller[]>({
    queryKey: ["/api/admin/product-prices", { productId: smartphoneToAssign?.id }],
    queryFn: async () => {
      if (!smartphoneToAssign?.id) return [];
      const response = await fetch(`/api/admin/product-prices?productId=${smartphoneToAssign.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
    enabled: !!smartphoneToAssign,
  });

  const currentProductAssignments = productAssignments;

  const assignMutation = useMutation({
    mutationFn: async (data: { productId: string; resellerId: string; priceCents: number; costPriceCents?: number }) => {
      return apiRequest("POST", "/api/admin/product-prices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-prices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      refetchAssignments();
      toast({ title: "Assegnato", description: "Lo smartphone è stato assegnato al rivenditore." });
      setSelectedResellerId("");
      // Keep prices pre-filled for next assignment
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (priceId: string) => {
      return apiRequest("DELETE", `/api/admin/product-prices/${priceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/product-prices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      refetchAssignments();
      toast({ title: "Rimosso", description: "L'assegnazione è stata rimossa." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { product: any; specs: any; imageFile?: File | null; initialStock?: InitialStockEntry[] }) => {
      if (data.imageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("product", JSON.stringify(data.product));
        formDataUpload.append("specs", JSON.stringify(data.specs));
        formDataUpload.append("image", data.imageFile);
        if (data.initialStock && data.initialStock.length > 0) {
          formDataUpload.append("initialStock", JSON.stringify(data.initialStock));
        }
        const response = await fetch("/api/smartphones", {
          method: "POST",
          body: formDataUpload,
          credentials: "include",
        });
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      } else {
        return apiRequest("POST", "/api/smartphones", { 
          product: data.product, 
          specs: data.specs,
          initialStock: data.initialStock
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
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
      // Stock changes are handled separately via updateStockMutation (per-row save buttons)
      await apiRequest("PATCH", `/api/smartphones/${productId}`, { product: data.product, specs: data.specs });
    },
    // Note: onSuccess moved to handleSubmit to allow sequential compatibility save
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, warehouseId, quantity, location }: { productId: string; warehouseId: string; quantity: number; location?: string }) => {
      const res = await apiRequest("POST", `/api/products/${productId}/warehouse-stock`, { warehouseId, quantity, location });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
      toast({ title: "Quantità aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isVisibleInShop }: { id: string; isVisibleInShop: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}/visibility`, { isVisibleInShop });
      return res.json();
    },
    onMutate: async ({ id, isVisibleInShop }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/smartphones"] });
      const previousData = queryClient.getQueryData<SmartphoneWithSpecs[]>(["/api/smartphones"]);
      queryClient.setQueryData<SmartphoneWithSpecs[]>(["/api/smartphones"], (old) =>
        old?.map((s) => (s.id === id ? { ...s, isVisibleInShop } : s))
      );
      return { previousData };
    },
    onError: (error: Error, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["/api/smartphones"], context.previousData);
      }
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
    onSuccess: (_, { isVisibleInShop }) => {
      toast({
        title: isVisibleInShop ? "Visibile nello shop" : "Nascosto dallo shop",
        description: isVisibleInShop ? "Lo smartphone è ora visibile negli shop." : "Lo smartphone è stato nascosto dagli shop.",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
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
      const response = await fetch(`/api/admin/products/${productId}/image`, {
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

  const addInitialStock = (warehouseId: string) => {
    if (!initialStock.find(s => s.warehouseId === warehouseId)) {
      setInitialStock([...initialStock, { warehouseId, quantity: 0, location: "" }]);
    }
  };

  const updateInitialStock = (warehouseId: string, quantity: number) => {
    setInitialStock(initialStock.map(s => 
      s.warehouseId === warehouseId ? { ...s, quantity } : s
    ));
  };

  const updateInitialStockLocation = (warehouseId: string, location: string) => {
    setInitialStock(initialStock.map(s => 
      s.warehouseId === warehouseId ? { ...s, location } : s
    ));
  };

  const removeInitialStock = (warehouseId: string) => {
    setInitialStock(initialStock.filter(s => s.warehouseId !== warehouseId));
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
        location: "",
        originalLocation: ""
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
    if (!editingSmartphone) return;
    const stock = editStock.find(s => s.warehouseId === warehouseId);
    if (!stock) return;
    
    await updateStockMutation.mutateAsync({
      productId: editingSmartphone.id,
      warehouseId,
      quantity: stock.quantity,
      location: stock.location
    });
    setEditStock(editStock.map(s => 
      s.warehouseId === warehouseId ? { ...s, originalQuantity: stock.quantity, originalLocation: stock.location } : s
    ));
  };

  const groupedWarehouses = {
    admin: warehouses.filter(w => w.ownerType === 'admin'),
    reseller: warehouses.filter(w => w.ownerType === 'reseller'),
    sub_reseller: warehouses.filter(w => w.ownerType === 'sub_reseller'),
    repair_center: warehouses.filter(w => w.ownerType === 'repair_center'),
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setInitialStock([]);
    setEditStock([]);
    setEditCompatibilities([]);
    setSelectedDeviceBrandId("");
    setFormData({
      name: "",
      sku: "",
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
    });
  };

  const openEditDialog = async (smartphone: SmartphoneWithSpecs) => {
    setEditingSmartphone(smartphone);
    setFormData({
      name: smartphone.name,
      sku: smartphone.sku,
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
    });
    setDialogOpen(true);
    
    // Load existing stock for this product
    setIsLoadingStock(true);
    try {
      const response = await fetch(`/api/products/${smartphone.id}/warehouse-stocks`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const stockEntries = data.stocks.map((ws: any) => ({
          warehouseId: ws.warehouseId,
          warehouseName: ws.warehouse?.name || 'Sconosciuto',
          ownerType: ws.warehouse?.ownerType || 'admin',
          ownerName: ws.warehouse?.ownerName || 'Sistema',
          quantity: ws.quantity,
          originalQuantity: ws.quantity,
          location: ws.location || "",
          originalLocation: ws.location || "",
        }));
        setEditStock(stockEntries);
      }
    } catch (error) {
      console.error("Error loading stock:", error);
    } finally {
      setIsLoadingStock(false);
    }

    // Load existing device compatibilities
    try {
      const compatResponse = await fetch(`/api/products/${smartphone.id}/compatibilities`, {
        credentials: "include",
      });
      if (compatResponse.ok) {
        const compatData = await compatResponse.json();
        setEditCompatibilities(compatData.map((c: any) => ({
          deviceBrandId: c.deviceBrandId,
          deviceBrandName: c.deviceBrandName,
          deviceModelId: c.deviceModelId,
          deviceModelName: c.deviceModelName,
        })));
      }
    } catch (error) {
      console.error("Error loading compatibilities:", error);
    }
  };

  // Compatibility management functions
  const addBrandCompatibility = () => {
    if (!selectedDeviceBrandId) return;
    const exists = editCompatibilities.some(c => 
      c.deviceBrandId === selectedDeviceBrandId && c.deviceModelId === null
    );
    if (exists) {
      toast({ title: "Compatibilità già presente", variant: "destructive" });
      return;
    }
    const brand = deviceBrands.find(b => b.id === selectedDeviceBrandId);
    setEditCompatibilities([...editCompatibilities, { 
      deviceBrandId: selectedDeviceBrandId, 
      deviceBrandName: brand?.name,
      deviceModelId: null,
      deviceModelName: null
    }]);
    setSelectedDeviceBrandId("");
  };

  const addModelCompatibility = (modelId: string) => {
    if (!selectedDeviceBrandId || !modelId) return;
    const exists = editCompatibilities.some(c => 
      c.deviceBrandId === selectedDeviceBrandId && c.deviceModelId === modelId
    );
    if (exists) {
      toast({ title: "Compatibilità già presente", variant: "destructive" });
      return;
    }
    const brand = deviceBrands.find(b => b.id === selectedDeviceBrandId);
    const model = deviceModels.find(m => m.id === modelId);
    setEditCompatibilities([...editCompatibilities, { 
      deviceBrandId: selectedDeviceBrandId, 
      deviceBrandName: brand?.name,
      deviceModelId: modelId,
      deviceModelName: model?.modelName
    }]);
  };

  const removeCompatibility = (index: number) => {
    setEditCompatibilities(editCompatibilities.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const product = {
      name: formData.name,
      sku: formData.sku,
      category: "smartphone",
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
      // Stock changes are saved individually via saveStockChange, not via handleSubmit
      try {
        await updateMutation.mutateAsync({ productId: editingSmartphone.id, data: { product, specs } });
        
        // Save compatibilities after product update succeeds
        await apiRequest("PUT", `/api/products/${editingSmartphone.id}/compatibilities`, {
          compatibilities: editCompatibilities.map(c => ({
            deviceBrandId: c.deviceBrandId,
            deviceModelId: c.deviceModelId,
          })),
        });
        
        // Success - invalidate queries, close dialog, reset form
        queryClient.invalidateQueries({ queryKey: ["/api/smartphones"] });
        queryClient.invalidateQueries({ queryKey: ["/api/warehouses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
        setDialogOpen(false);
        setEditingSmartphone(null);
        resetForm();
        toast({ title: "Smartphone aggiornato", description: "Le modifiche sono state salvate." });
      } catch (err: any) {
        console.error("Failed to save product/compatibilities:", err);
        // If error occurs, dialog stays open so user can retry
        toast({ 
          title: "Errore durante il salvataggio", 
          description: "Riprova a salvare le modifiche. " + (err.message || ""), 
          variant: "destructive" 
        });
      }
    } else {
      const stockEntries = initialStock.filter(s => s.quantity > 0);
      createMutation.mutate({ product, specs, imageFile, initialStock: stockEntries });
    }
  };

  const filteredSmartphones = smartphones.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.specs?.imei?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = brandFilter === "all" || s.brand === brandFilter;
    const matchesGrade = gradeFilter === "all" || s.specs?.grade === gradeFilter;
    return matchesSearch && matchesBrand && matchesGrade;
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6" />
            Catalogo Smartphone (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizza e gestisci tutti gli smartphone di tutti i rivenditori
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} data-testid="button-add-smartphone">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Smartphone
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-4">
          <CardTitle>Lista Smartphone ({filteredSmartphones.length})</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per nome, SKU o IMEI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-smartphones"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-36" data-testid="select-brand-filter">
                <SelectValue placeholder="Marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le marche</SelectItem>
                {BRANDS.map((b) => (
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
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Rivenditore</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Stato Rete</TableHead>
                    <TableHead>Batteria</TableHead>
                    <TableHead className="text-right">Prezzo</TableHead>
                    <TableHead className="text-center">Shop</TableHead>
                    <TableHead className="w-24">Azioni</TableHead>
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
                            className="w-12 h-12 object-cover rounded"
                            data-testid={`img-smartphone-${smartphone.id}`}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
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
                        {(() => {
                          const assignments = assignmentsByProductId[smartphone.id] || [];
                          if (assignments.length === 0) {
                            return (
                              <span className="text-sm text-muted-foreground">-</span>
                            );
                          }
                          return (
                            <div className="flex flex-wrap gap-1">
                              {assignments.slice(0, 2).map((a) => (
                                <Badge key={a.id} variant="secondary" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {a.reseller?.fullName || a.reseller?.username || "?"}
                                </Badge>
                              ))}
                              {assignments.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{assignments.length - 2}
                                </Badge>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          {smartphone.specs?.storage || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {smartphone.specs?.grade && (
                          <Badge className={`${getGradeColor(smartphone.specs.grade)} text-white`}>
                            {smartphone.specs.grade}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getNetworkLockBadge(smartphone.specs?.networkLock)}
                      </TableCell>
                      <TableCell>
                        {smartphone.specs?.batteryHealth && (
                          <div className="flex items-center gap-1">
                            <Battery className="h-4 w-4 text-muted-foreground" />
                            {smartphone.specs.batteryHealth}%
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(smartphone.unitPrice / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {smartphone.isVisibleInShop ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                          <Switch
                            checked={smartphone.isVisibleInShop}
                            onCheckedChange={(checked) =>
                              toggleVisibilityMutation.mutate({ id: smartphone.id, isVisibleInShop: checked })
                            }
                            disabled={toggleVisibilityMutation.isPending}
                            data-testid={`switch-visibility-smartphone-${smartphone.id}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDetailProductId(smartphone.id); setDetailDialogOpen(true); }}
                            title="Visualizza dettagli"
                            data-testid={`button-detail-smartphone-${smartphone.id}`}
                          >
                            <Search className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { 
                              setSmartphoneToAssign(smartphone); 
                              setAssignPrice((smartphone.unitPrice / 100).toFixed(2));
                              setAssignCostPrice(smartphone.costPrice ? (smartphone.costPrice / 100).toFixed(2) : "");
                              setAssignDialogOpen(true); 
                            }}
                            title="Assegna a rivenditore"
                            data-testid={`button-assign-smartphone-${smartphone.id}`}
                          >
                            <UserPlus className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(smartphone)}
                            data-testid={`button-edit-smartphone-${smartphone.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSmartphoneToDelete(smartphone); setDeleteDialogOpen(true); }}
                            data-testid={`button-delete-smartphone-${smartphone.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <DialogTitle>{editingSmartphone ? "Modifica Smartphone" : "Aggiungi Smartphone"}</DialogTitle>
            <DialogDescription>
              {editingSmartphone ? "Modifica i dettagli dello smartphone" : "Inserisci i dettagli del nuovo smartphone"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger data-testid="select-smartphone-brand">
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

            <div className="grid grid-cols-3 gap-4">
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
            </div>

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

            <div className="grid grid-cols-3 gap-4">
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
                <Label htmlFor="imei2">IMEI 2</Label>
                <Input
                  id="imei2"
                  value={formData.imei2}
                  onChange={(e) => setFormData({ ...formData, imei2: e.target.value })}
                  placeholder="Per dual SIM"
                  data-testid="input-smartphone-imei2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Numero di serie</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="es. F2LXXX..."
                  data-testid="input-smartphone-serial"
                />
              </div>
            </div>

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
                  data-testid="input-smartphone-price"
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
                  data-testid="input-smartphone-cost"
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
                data-testid="input-smartphone-warranty"
              />
            </div>

            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  {editingSmartphone ? "Gestione stock" : "Quantità iniziali per magazzino"}
                </Label>
                <Select onValueChange={editingSmartphone ? addEditStock : addInitialStock}>
                  <SelectTrigger className="w-56" data-testid="select-add-stock-warehouse">
                    <SelectValue placeholder="Aggiungi magazzino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groupedWarehouses.admin.filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Admin</SelectLabel>
                        {groupedWarehouses.admin
                          .filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id))
                          .map(wh => (
                            <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                    {groupedWarehouses.reseller.filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Rivenditori</SelectLabel>
                        {groupedWarehouses.reseller
                          .filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id))
                          .map(wh => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name} ({wh.owner?.fullName || wh.owner?.username})
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                    {groupedWarehouses.sub_reseller.filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Sotto-Rivenditori</SelectLabel>
                        {groupedWarehouses.sub_reseller
                          .filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id))
                          .map(wh => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name} ({wh.owner?.fullName || wh.owner?.username})
                            </SelectItem>
                          ))
                        }
                      </SelectGroup>
                    )}
                    {groupedWarehouses.repair_center.filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id)).length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Magazzini Centri Riparazione</SelectLabel>
                        {groupedWarehouses.repair_center
                          .filter(w => !(editingSmartphone ? editStock : initialStock).find(s => s.warehouseId === w.id))
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
              
              {editingSmartphone ? (
                // Edit mode: show editStock with save button per row
                isLoadingStock ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ) : editStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessuna giacenza. Seleziona un magazzino per aggiungere quantità.
                  </p>
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
                )
              ) : (
                // Create mode: show initialStock
                initialStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nessuna quantità iniziale. Seleziona un magazzino per aggiungere.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {initialStock.map(stock => {
                      const wh = warehouses.find(w => w.id === stock.warehouseId);
                      return (
                        <div key={stock.warehouseId} className="p-3 border rounded-md space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Warehouse className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{wh?.name || "Magazzino"}</span>
                              {wh && (
                                <span className="text-xs text-muted-foreground">
                                  ({wh.ownerType === 'admin' ? 'Admin' : wh.owner?.fullName || wh.owner?.username})
                                </span>
                              )}
                            </div>
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
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Quantità</Label>
                              <Input
                                type="number"
                                min="0"
                                value={stock.quantity}
                                onChange={(e) => updateInitialStock(stock.warehouseId, parseInt(e.target.value) || 0)}
                                data-testid={`input-stock-${stock.warehouseId}`}
                              />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Ubicazione</Label>
                              <Input
                                value={stock.location}
                                onChange={(e) => updateInitialStockLocation(stock.warehouseId, e.target.value)}
                                placeholder="es. Scaffale A3"
                                data-testid={`input-location-${stock.warehouseId}`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="originalBox"
                checked={formData.originalBox}
                onCheckedChange={(checked) => setFormData({ ...formData, originalBox: !!checked })}
                data-testid="checkbox-original-box"
              />
              <Label htmlFor="originalBox">Scatola originale inclusa</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrizione aggiuntiva..."
                rows={2}
                data-testid="textarea-smartphone-description"
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
                data-testid="textarea-smartphone-notes"
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
                    ) : editingSmartphone?.imageUrl ? (
                      <div className="relative">
                        <img src={editingSmartphone.imageUrl} alt={editingSmartphone.name} className="w-24 h-24 object-cover rounded" />
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

            {editingSmartphone && (
              <div className="space-y-3 border-t pt-4">
                <Label className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Compatibilità Dispositivi
                </Label>
                <p className="text-xs text-muted-foreground">
                  Seleziona i dispositivi con cui questo smartphone è compatibile (es. cover, accessori)
                </p>
                
                <div className="flex gap-2 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <Select value={selectedDeviceBrandId} onValueChange={setSelectedDeviceBrandId}>
                      <SelectTrigger data-testid="select-compat-brand">
                        <SelectValue placeholder="Seleziona marca dispositivo" />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceBrands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBrandCompatibility}
                    disabled={!selectedDeviceBrandId}
                    data-testid="button-add-brand-compat"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tutti i modelli
                  </Button>
                </div>

                {selectedDeviceBrandId && deviceModels.length > 0 && (
                  <div>
                    <Label className="text-xs mb-2 block">Oppure seleziona modelli specifici:</Label>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {deviceModels.map((model) => {
                        const isSelected = editCompatibilities.some(
                          c => c.deviceBrandId === selectedDeviceBrandId && c.deviceModelId === model.id
                        );
                        return (
                          <Badge
                            key={model.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => !isSelected && addModelCompatibility(model.id)}
                            data-testid={`badge-compat-model-${model.id}`}
                          >
                            {model.modelName}
                            {isSelected && " ✓"}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editCompatibilities.length > 0 && (
                  <div className="pt-2 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      Compatibilità selezionate ({editCompatibilities.length})
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {editCompatibilities.map((compat, index) => {
                        const label = compat.deviceModelName 
                          ? `${compat.deviceBrandName || ''} ${compat.deviceModelName}`
                          : `${compat.deviceBrandName || 'Marca'} (tutti)`;
                        return (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {label}
                            <button
                              type="button"
                              onClick={() => removeCompatibility(index)}
                              className="ml-1 hover:text-destructive"
                              data-testid={`button-remove-compat-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {editCompatibilities.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Nessuna compatibilità selezionata
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Annulla
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.sku || createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-smartphone"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingSmartphone ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma eliminazione</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare "{smartphoneToDelete?.name}"? Questa azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
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

      <Dialog open={assignDialogOpen} onOpenChange={(open) => { setAssignDialogOpen(open); if (!open) { setSelectedResellerId(""); setAssignPrice(""); setAssignCostPrice(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Assegna a Rivenditore
            </DialogTitle>
            <DialogDescription>
              Assegna "{smartphoneToAssign?.name}" a uno o più rivenditori con prezzi personalizzati.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {currentProductAssignments.length > 0 && (
              <div className="space-y-2">
                <Label>Rivenditori assegnati</Label>
                <div className="space-y-2">
                  {currentProductAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div>
                        <span className="font-medium">{assignment.reseller?.fullName || assignment.reseller?.username || assignment.resellerId}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          €{(assignment.priceCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unassignMutation.mutate(assignment.id)}
                        disabled={unassignMutation.isPending}
                        data-testid={`button-unassign-${assignment.id}`}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-4">
              <Label>Aggiungi nuovo rivenditore</Label>
              
              <div className="space-y-2">
                <Label htmlFor="reseller">Rivenditore</Label>
                <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
                  <SelectTrigger data-testid="select-assign-reseller">
                    <SelectValue placeholder="Seleziona rivenditore" />
                  </SelectTrigger>
                  <SelectContent>
                    {resellers
                      .filter((r) => !currentProductAssignments.some((a) => a.resellerId === r.id))
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.fullName || r.username}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignPrice">Prezzo vendita (€) *</Label>
                  <Input
                    id="assignPrice"
                    type="number"
                    step="0.01"
                    value={assignPrice}
                    onChange={(e) => setAssignPrice(e.target.value)}
                    placeholder={smartphoneToAssign ? (smartphoneToAssign.unitPrice / 100).toFixed(2) : "0.00"}
                    data-testid="input-assign-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignCostPrice">Prezzo costo (€)</Label>
                  <Input
                    id="assignCostPrice"
                    type="number"
                    step="0.01"
                    value={assignCostPrice}
                    onChange={(e) => setAssignCostPrice(e.target.value)}
                    placeholder={smartphoneToAssign?.costPrice ? (smartphoneToAssign.costPrice / 100).toFixed(2) : "0.00"}
                    data-testid="input-assign-cost-price"
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  if (!smartphoneToAssign || !selectedResellerId || !assignPrice) return;
                  assignMutation.mutate({
                    productId: smartphoneToAssign.id,
                    resellerId: selectedResellerId,
                    priceCents: Math.round(parseFloat(assignPrice) * 100),
                    costPriceCents: assignCostPrice ? Math.round(parseFloat(assignCostPrice) * 100) : undefined,
                  });
                }}
                disabled={!selectedResellerId || !assignPrice || assignMutation.isPending}
                className="w-full"
                data-testid="button-confirm-assign"
              >
                {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UserPlus className="mr-2 h-4 w-4" />
                Assegna
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} data-testid="button-close-assign">
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductDetailDialog 
        open={detailDialogOpen} 
        onOpenChange={setDetailDialogOpen} 
        productId={detailProductId} 
      />

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
