import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Warehouse, Package, ArrowLeftRight, Plus, Search, 
  TrendingUp, TrendingDown, RotateCcw, MapPin, Boxes,
  ArrowRight, Clock, CheckCircle, XCircle, Pencil, Smartphone, Settings2, Battery, HardDrive, Hash
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Warehouse as WarehouseType, WarehouseStock, WarehouseMovement, Product, SmartphoneSpecs } from "@shared/schema";

type AccessibleWarehouse = {
  id: string;
  name: string;
  ownerType: string;
  owner?: { id: string; username: string; fullName?: string | null } | null;
};

type EnrichedStock = WarehouseStock & { product: { id: string; name: string; sku: string; category: string; imageUrl?: string | null; isDeviceCatalogProduct?: boolean } | null };
type EnrichedMovement = WarehouseMovement & { 
  product: { id: string; name: string; sku: string } | null;
  createdByUser: { id: string; fullName: string; username: string } | null;
  relatedWarehouse?: { id: string; name: string } | null;
};

export default function WarehousesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stock");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyDevices, setShowOnlyDevices] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showEditStockDialog, setShowEditStockDialog] = useState(false);
  const [editingStockItem, setEditingStockItem] = useState<EnrichedStock | null>(null);
  const [editStockData, setEditStockData] = useState({ minStock: 0, location: "" });
  const [movementData, setMovementData] = useState({
    productId: "",
    movementType: "carico" as string,
    quantity: 0,
    notes: "",
  });
  
  // Stati per trasferimento
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<EnrichedStock | null>(null);
  const [transferDestWarehouseId, setTransferDestWarehouseId] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<number>(1);
  
  // Stati per specifiche dispositivo
  const [specsDialogOpen, setSpecsDialogOpen] = useState(false);
  const [specsItem, setSpecsItem] = useState<EnrichedStock | null>(null);
  const [specsData, setSpecsData] = useState({
    imei: "",
    imei2: "",
    serialNumber: "",
    storage: "128GB" as string,
    grade: "" as string,
    batteryHealth: "",
    networkLock: "unlocked" as string,
    originalBox: false,
    accessories: [] as string[],
    notes: "",
  });

  const { data: myWarehouse, isLoading: loadingWarehouse } = useQuery<WarehouseType>({
    queryKey: ["/api/my-warehouse"],
  });

  const warehouseId = myWarehouse?.id;

  const { data: stock = [], isLoading: loadingStock } = useQuery<EnrichedStock[]>({
    queryKey: ["/api/warehouses", warehouseId, "stock"],
    queryFn: async () => {
      const res = await fetch(`/api/warehouses/${warehouseId}/stock`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load stock");
      return res.json();
    },
    enabled: !!warehouseId,
  });

  const { data: movements = [], isLoading: loadingMovements } = useQuery<EnrichedMovement[]>({
    queryKey: ["/api/warehouses", warehouseId, "movements"],
    queryFn: async () => {
      const res = await fetch(`/api/warehouses/${warehouseId}/movements`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load movements");
      return res.json();
    },
    enabled: !!warehouseId,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Query per magazzini accessibili (destinazioni trasferimento)
  const { data: accessibleWarehouses = [] } = useQuery<AccessibleWarehouse[]>({
    queryKey: ["/api/warehouses/accessible"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses/accessible", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load accessible warehouses");
      return res.json();
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (data: typeof movementData) => {
      return apiRequest("POST", `/api/warehouses/${warehouseId}/movements`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "movements"] });
      toast({ title: "Movimento registrato", description: "Il movimento è stato registrato con successo" });
      setShowMovementDialog(false);
      setMovementData({ productId: "", movementType: "carico", quantity: 0, notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async (data: { stockId: string; minStock: number | null; location: string | null }) => {
      return apiRequest("PATCH", `/api/warehouse-stock/${data.stockId}`, { 
        minStock: data.minStock, 
        location: data.location 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "stock"] });
      toast({ title: "Stock aggiornato", description: "Min. stock e posizione salvati" });
      setShowEditStockDialog(false);
      setEditingStockItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Mutation per trasferimento immediato
  const transferMutation = useMutation({
    mutationFn: async (data: { sourceWarehouseId: string; destinationWarehouseId: string; productId: string; quantity: number; notes?: string }) => {
      return apiRequest("POST", "/api/warehouses/transfer-immediate", data);
    },
    onSuccess: () => {
      toast({ title: "Trasferimento completato", description: "Il prodotto è stato trasferito con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "movements"] });
      setTransferDialogOpen(false);
      setTransferItem(null);
      setTransferDestWarehouseId("");
      setTransferQuantity(1);
    },
    onError: (error: any) => {
      toast({ title: "Errore trasferimento", description: error.message, variant: "destructive" });
    },
  });

  const openTransferDialog = (item: EnrichedStock) => {
    setTransferItem(item);
    setTransferQuantity(1);
    setTransferDestWarehouseId("");
    setTransferDialogOpen(true);
  };

  const handleTransfer = () => {
    if (!warehouseId || !transferItem || !transferDestWarehouseId || transferQuantity <= 0) return;
    
    transferMutation.mutate({
      sourceWarehouseId: warehouseId,
      destinationWarehouseId: transferDestWarehouseId,
      productId: transferItem.productId,
      quantity: transferQuantity,
    });
  };

  // Magazzini destinazione (escluso il proprio)
  const destinationWarehouses = accessibleWarehouses.filter(wh => wh.id !== warehouseId);

  // Query per specifiche dispositivo
  const { data: currentSpecs, isLoading: loadingSpecs, refetch: refetchSpecs } = useQuery<SmartphoneSpecs | null>({
    queryKey: ["/api/products", specsItem?.productId, "device-specs"],
    queryFn: async () => {
      if (!specsItem?.productId) return null;
      const res = await fetch(`/api/products/${specsItem.productId}/device-specs`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!specsItem?.productId && specsDialogOpen,
  });

  // Mutation per salvare specifiche
  const saveSpecsMutation = useMutation({
    mutationFn: async (data: typeof specsData) => {
      return apiRequest("PATCH", `/api/products/${specsItem?.productId}/device-specs`, data);
    },
    onSuccess: () => {
      toast({ title: "Specifiche salvate", description: "Le specifiche del dispositivo sono state aggiornate" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", specsItem?.productId, "device-specs"] });
      setSpecsDialogOpen(false);
      setSpecsItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const openSpecsDialog = async (item: EnrichedStock) => {
    setSpecsItem(item);
    setSpecsData({
      imei: "",
      imei2: "",
      serialNumber: "",
      storage: "128GB",
      grade: "",
      batteryHealth: "",
      networkLock: "unlocked",
      originalBox: false,
      accessories: [],
      notes: "",
    });
    setSpecsDialogOpen(true);
  };

  // Auto-popola i dati quando le specifiche vengono caricate
  useEffect(() => {
    if (currentSpecs && specsDialogOpen) {
      setSpecsData({
        imei: currentSpecs.imei || "",
        imei2: currentSpecs.imei2 || "",
        serialNumber: currentSpecs.serialNumber || "",
        storage: currentSpecs.storage || "128GB",
        grade: currentSpecs.grade || "",
        batteryHealth: currentSpecs.batteryHealth || "",
        networkLock: currentSpecs.networkLock || "unlocked",
        originalBox: currentSpecs.originalBox || false,
        accessories: currentSpecs.accessories || [],
        notes: currentSpecs.notes || "",
      });
    }
  }, [currentSpecs, specsDialogOpen]);

  const handleEditStock = (item: EnrichedStock) => {
    setEditingStockItem(item);
    setEditStockData({ 
      minStock: item.minStock || 0, 
      location: item.location || "" 
    });
    setShowEditStockDialog(true);
  };

  const filteredStock = stock.filter(item => {
    const matchesSearch = 
      item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDeviceFilter = !showOnlyDevices || item.product?.isDeviceCatalogProduct;
    return matchesSearch && matchesDeviceFilter;
  });

  const movementTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    carico: { label: "Carico", icon: TrendingUp, color: "text-green-500" },
    scarico: { label: "Scarico", icon: TrendingDown, color: "text-red-500" },
    trasferimento_in: { label: "Trasf. In", icon: ArrowRight, color: "text-blue-500" },
    trasferimento_out: { label: "Trasf. Out", icon: ArrowLeftRight, color: "text-orange-500" },
    rettifica: { label: "Rettifica", icon: RotateCcw, color: "text-purple-500" },
  };


  if (loadingWarehouse) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Warehouse className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-warehouse-title">
              {myWarehouse?.name || "Il Mio Magazzino"}
            </h1>
            {myWarehouse?.address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {myWarehouse.address}
              </p>
            )}
          </div>
        </div>

        <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-movement">
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Movimento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registra Movimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Prodotto</Label>
                <Select 
                  value={movementData.productId} 
                  onValueChange={(v) => setMovementData(prev => ({ ...prev, productId: v }))}
                >
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="Seleziona prodotto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo Movimento</Label>
                <Select 
                  value={movementData.movementType} 
                  onValueChange={(v) => setMovementData(prev => ({ ...prev, movementType: v }))}
                >
                  <SelectTrigger data-testid="select-movement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carico">Carico</SelectItem>
                    <SelectItem value="scarico">Scarico</SelectItem>
                    <SelectItem value="rettifica">Rettifica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantità</Label>
                <Input 
                  type="number" 
                  value={movementData.quantity}
                  onChange={(e) => setMovementData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  data-testid="input-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea 
                  value={movementData.notes}
                  onChange={(e) => setMovementData(prev => ({ ...prev, notes: e.target.value }))}
                  data-testid="input-notes"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => createMovementMutation.mutate(movementData)}
                disabled={!movementData.productId || movementData.quantity === 0 || createMovementMutation.isPending}
                data-testid="button-save-movement"
              >
                {createMovementMutation.isPending ? "Salvataggio..." : "Registra Movimento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditStockDialog} onOpenChange={setShowEditStockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Stock</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Prodotto: <span className="font-medium text-foreground">{editingStockItem?.product?.name}</span>
              </p>
              <div className="space-y-2">
                <Label>Scorta Minima</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={editStockData.minStock}
                  onChange={(e) => setEditStockData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  data-testid="input-min-stock"
                />
                <p className="text-xs text-muted-foreground">Riceverai un avviso quando la quantità scende sotto questo valore</p>
              </div>
              <div className="space-y-2">
                <Label>Posizione in Magazzino</Label>
                <Input 
                  value={editStockData.location}
                  onChange={(e) => setEditStockData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Es: Scaffale A3, Ripiano 2"
                  data-testid="input-location"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => {
                  if (editingStockItem) {
                    updateStockMutation.mutate({
                      stockId: editingStockItem.id,
                      minStock: editStockData.minStock || null,
                      location: editStockData.location || null
                    });
                  }
                }}
                disabled={updateStockMutation.isPending}
                data-testid="button-save-stock"
              >
                {updateStockMutation.isPending ? "Salvataggio..." : "Salva"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Boxes className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Articoli in Stock</p>
                <p className="text-2xl font-bold" data-testid="text-stock-count">{stock.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantità Totale</p>
                <p className="text-2xl font-bold" data-testid="text-total-quantity">
                  {stock.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <TrendingDown className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sotto Scorta</p>
                <p className="text-2xl font-bold" data-testid="text-low-stock">
                  {stock.filter(item => item.minStock && item.quantity < item.minStock).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stock" data-testid="tab-stock">
            <Package className="h-4 w-4 mr-2" />
            Stock
          </TabsTrigger>
          <TabsTrigger value="movements" data-testid="tab-movements">
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Movimenti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca prodotto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-stock"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                id="device-filter"
                checked={showOnlyDevices}
                onCheckedChange={setShowOnlyDevices}
                data-testid="switch-show-only-devices"
              />
              <Label htmlFor="device-filter" className="flex items-center gap-1 cursor-pointer">
                <Smartphone className="h-4 w-4" />
                Solo dispositivi
              </Label>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Prodotto</th>
                      <th className="text-left p-4 font-medium">SKU</th>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-right p-4 font-medium">Quantità</th>
                      <th className="text-right p-4 font-medium">Min. Stock</th>
                      <th className="text-left p-4 font-medium">Posizione</th>
                      <th className="text-center p-4 font-medium">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStock ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8">Caricamento...</td>
                      </tr>
                    ) : filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                          Nessun prodotto in stock
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-stock-${item.id}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {item.product?.imageUrl ? (
                                <img 
                                  src={item.product.imageUrl} 
                                  alt={item.product.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <span className="font-medium">{item.product?.name || "N/D"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">{item.product?.sku || "N/D"}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge variant="outline">{item.product?.category || "N/D"}</Badge>
                              {item.product?.isDeviceCatalogProduct && (
                                <Badge variant="secondary" className="gap-1">
                                  <Smartphone className="h-3 w-3" />
                                  Catalogo
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <span className={item.minStock && item.quantity < item.minStock ? "text-red-500 font-bold" : ""}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-right text-muted-foreground">{item.minStock || "-"}</td>
                          <td className="p-4">{item.location || "-"}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {item.product?.isDeviceCatalogProduct && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => openSpecsDialog(item)}
                                  title="Specifiche unità"
                                  data-testid={`button-specs-${item.id}`}
                                >
                                  <Settings2 className="h-4 w-4" />
                                </Button>
                              )}
                              {item.quantity > 0 && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => openTransferDialog(item)}
                                  title="Trasferisci"
                                  data-testid={`button-transfer-${item.id}`}
                                >
                                  <ArrowLeftRight className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleEditStock(item)}
                                title="Modifica"
                                data-testid={`button-edit-stock-${item.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Data</th>
                      <th className="text-left p-4 font-medium">Tipo</th>
                      <th className="text-left p-4 font-medium">Da/Verso</th>
                      <th className="text-left p-4 font-medium">Prodotto</th>
                      <th className="text-right p-4 font-medium">Quantità</th>
                      <th className="text-left p-4 font-medium">Operatore</th>
                      <th className="text-left p-4 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMovements ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8">Caricamento...</td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                          Nessun movimento registrato
                        </td>
                      </tr>
                    ) : (
                      movements.map((mov) => {
                        const typeInfo = movementTypeLabels[mov.movementType] || { label: mov.movementType, icon: Package, color: "" };
                        const TypeIcon = typeInfo.icon;
                        return (
                          <tr key={mov.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-movement-${mov.id}`}>
                            <td className="p-4 text-muted-foreground">
                              {new Date(mov.createdAt).toLocaleDateString('it-IT', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                              })}
                            </td>
                            <td className="p-4">
                              <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                                <TypeIcon className="h-4 w-4" />
                                {typeInfo.label}
                              </div>
                            </td>
                            <td className="p-4 text-sm">
                              {mov.relatedWarehouse ? (
                                <span className="text-muted-foreground">
                                  {mov.movementType === 'trasferimento_out' ? 'Verso: ' : 'Da: '}
                                  <span className="text-foreground">{mov.relatedWarehouse.name}</span>
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-4 font-medium">{mov.product?.name || "N/D"}</td>
                            <td className="p-4 text-right font-medium">
                              {['carico', 'trasferimento_in'].includes(mov.movementType) ? '+' : '-'}
                              {mov.quantity}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {mov.createdByUser?.fullName || mov.createdByUser?.username || "N/D"}
                            </td>
                            <td className="p-4 text-muted-foreground truncate max-w-[200px]">
                              {mov.notes || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Trasferimento */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trasferisci Prodotto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Prodotto:</p>
              <p className="font-medium">{transferItem?.product?.name}</p>
              <p className="text-sm text-muted-foreground">SKU: {transferItem?.product?.sku}</p>
              <p className="text-sm">Disponibilità: <span className="font-semibold">{transferItem?.quantity}</span></p>
            </div>
            
            <div className="space-y-2">
              <Label>Magazzino destinazione</Label>
              {destinationWarehouses.length === 0 ? (
                <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  Nessun magazzino disponibile per il trasferimento. Crea prima dei sub-rivenditori o centri di riparazione.
                </p>
              ) : (
                <Select value={transferDestWarehouseId} onValueChange={setTransferDestWarehouseId}>
                  <SelectTrigger data-testid="select-dest-warehouse">
                    <SelectValue placeholder="Seleziona magazzino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationWarehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} ({wh.owner?.fullName || wh.owner?.username || wh.ownerType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Quantità</Label>
              <Input
                type="number"
                min={1}
                max={transferItem?.quantity || 1}
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(Math.min(parseInt(e.target.value) || 1, transferItem?.quantity || 1))}
                data-testid="input-transfer-quantity"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!transferDestWarehouseId || transferQuantity <= 0 || transferMutation.isPending}
              data-testid="button-confirm-transfer"
            >
              {transferMutation.isPending ? "Trasferimento..." : "Conferma Trasferimento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Specifiche Dispositivo */}
      <Dialog 
        open={specsDialogOpen} 
        onOpenChange={(open) => {
          setSpecsDialogOpen(open);
          if (!open) setSpecsItem(null);
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Specifiche Dispositivo
            </DialogTitle>
          </DialogHeader>
          
          {loadingSpecs ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{specsItem?.product?.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {specsItem?.product?.sku}</p>
              </div>

              {/* Sezione IMEI e Identificativi */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Identificativi
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">IMEI</Label>
                    <Input 
                      value={specsData.imei}
                      onChange={(e) => setSpecsData(prev => ({ ...prev, imei: e.target.value }))}
                      placeholder="15 cifre"
                      maxLength={15}
                      data-testid="input-imei"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">IMEI 2 (dual SIM)</Label>
                    <Input 
                      value={specsData.imei2}
                      onChange={(e) => setSpecsData(prev => ({ ...prev, imei2: e.target.value }))}
                      placeholder="Opzionale"
                      maxLength={15}
                      data-testid="input-imei2"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Numero di Serie</Label>
                  <Input 
                    value={specsData.serialNumber}
                    onChange={(e) => setSpecsData(prev => ({ ...prev, serialNumber: e.target.value }))}
                    placeholder="Numero seriale dispositivo"
                    data-testid="input-serial-number"
                  />
                </div>
              </div>

              {/* Sezione Memoria */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Memoria
                </h4>
                <div className="space-y-1">
                  <Label className="text-xs">Storage</Label>
                  <Select 
                    value={specsData.storage} 
                    onValueChange={(v) => setSpecsData(prev => ({ ...prev, storage: v }))}
                  >
                    <SelectTrigger data-testid="select-storage">
                      <SelectValue placeholder="Seleziona capacità" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="32GB">32GB</SelectItem>
                      <SelectItem value="64GB">64GB</SelectItem>
                      <SelectItem value="128GB">128GB</SelectItem>
                      <SelectItem value="256GB">256GB</SelectItem>
                      <SelectItem value="512GB">512GB</SelectItem>
                      <SelectItem value="1TB">1TB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sezione Condizione */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Condizione</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Grado</Label>
                    <Select 
                      value={specsData.grade} 
                      onValueChange={(v) => setSpecsData(prev => ({ ...prev, grade: v }))}
                    >
                      <SelectTrigger data-testid="select-grade">
                        <SelectValue placeholder="Seleziona grado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+ (Come nuovo)</SelectItem>
                        <SelectItem value="A">A (Ottimo)</SelectItem>
                        <SelectItem value="B">B (Buono)</SelectItem>
                        <SelectItem value="C">C (Discreto)</SelectItem>
                        <SelectItem value="D">D (Usato)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Blocco Rete</Label>
                    <Select 
                      value={specsData.networkLock} 
                      onValueChange={(v) => setSpecsData(prev => ({ ...prev, networkLock: v }))}
                    >
                      <SelectTrigger data-testid="select-network-lock">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlocked">Sbloccato</SelectItem>
                        <SelectItem value="locked">Bloccato</SelectItem>
                        <SelectItem value="unknown">Sconosciuto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sezione Batteria */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  Batteria
                </h4>
                <div className="space-y-1">
                  <Label className="text-xs">Salute Batteria</Label>
                  <Select 
                    value={specsData.batteryHealth} 
                    onValueChange={(v) => setSpecsData(prev => ({ ...prev, batteryHealth: v }))}
                  >
                    <SelectTrigger data-testid="select-battery-health">
                      <SelectValue placeholder="Seleziona stato batteria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100%</SelectItem>
                      <SelectItem value="95-99">95-99%</SelectItem>
                      <SelectItem value="90-94">90-94%</SelectItem>
                      <SelectItem value="85-89">85-89%</SelectItem>
                      <SelectItem value="80-84">80-84%</SelectItem>
                      <SelectItem value="<80">{"<80%"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sezione Extra */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="original-box"
                    checked={specsData.originalBox}
                    onCheckedChange={(checked) => setSpecsData(prev => ({ ...prev, originalBox: !!checked }))}
                    data-testid="checkbox-original-box"
                  />
                  <Label htmlFor="original-box" className="text-sm cursor-pointer">
                    Include scatola originale
                  </Label>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <Label className="text-xs">Note aggiuntive</Label>
                <Textarea 
                  value={specsData.notes}
                  onChange={(e) => setSpecsData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Eventuali note sul dispositivo..."
                  className="resize-none"
                  rows={2}
                  data-testid="textarea-specs-notes"
                />
              </div>

              {/* Indicatore specifiche esistenti */}
              {currentSpecs && (
                <div className="text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded">
                  Specifiche esistenti caricate automaticamente
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecsDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                const cleanedData = {
                  ...specsData,
                  imei: specsData.imei || null,
                  imei2: specsData.imei2 || null,
                  serialNumber: specsData.serialNumber || null,
                  grade: specsData.grade || null,
                  batteryHealth: specsData.batteryHealth || null,
                  notes: specsData.notes || null,
                };
                saveSpecsMutation.mutate(cleanedData);
              }}
              disabled={saveSpecsMutation.isPending || loadingSpecs}
              data-testid="button-save-specs"
            >
              {saveSpecsMutation.isPending ? "Salvataggio..." : "Salva Specifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
