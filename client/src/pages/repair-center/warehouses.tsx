import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Warehouse, Package, ArrowLeftRight, Plus, Search, 
  TrendingUp, TrendingDown, RotateCcw, MapPin, Boxes, Pencil
} from "lucide-react";
import type { Warehouse as WarehouseType, WarehouseStock, WarehouseMovement, Product } from "@shared/schema";

type EnrichedStock = WarehouseStock & { product: { id: string; name: string; sku: string; category: string; imageUrl?: string | null } | null };
type EnrichedMovement = WarehouseMovement & { 
  product: { id: string; name: string; sku: string } | null;
  createdByUser: { id: string; fullName: string; username: string } | null;
  relatedWarehouse?: { id: string; name: string } | null;
};

export default function RepairCenterWarehousesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stock");
  const [searchTerm, setSearchTerm] = useState("");
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

  const createMovementMutation = useMutation({
    mutationFn: async (data: typeof movementData) => {
      return apiRequest("POST", `/api/warehouses/${warehouseId}/movements`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", warehouseId, "movements"] });
      toast({ title: t("warehouse.movementRegistered"), description: t("warehouse.movementRegisteredDesc") });
      setShowMovementDialog(false);
      setMovementData({ productId: "", movementType: "carico", quantity: 0, notes: "" });
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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
      toast({ title: t("warehouse.stockUpdated"), description: "Min. stock e posizione salvati" });
      setShowEditStockDialog(false);
      setEditingStockItem(null);
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleEditStock = (item: EnrichedStock) => {
    setEditingStockItem(item);
    setEditStockData({ 
      minStock: item.minStock || 0, 
      location: item.location || "" 
    });
    setShowEditStockDialog(true);
  };

  const filteredStock = stock.filter(item => 
    item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const movementTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    carico: { label: t("warehouse.loadIn"), icon: TrendingUp, color: "text-green-500" },
    scarico: { label: t("warehouse.loadOut"), icon: TrendingDown, color: "text-red-500" },
    trasferimento_in: { label: t("warehouse.transferIn"), icon: ArrowLeftRight, color: "text-blue-500" },
    trasferimento_out: { label: t("warehouse.transferOut"), icon: ArrowLeftRight, color: "text-orange-500" },
    rettifica: { label: t("warehouse.adjust"), icon: RotateCcw, color: "text-purple-500" },
  };

  if (loadingWarehouse) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Warehouse className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-warehouse-title">
                {t("sidebar.items.warehouse")}
              </h1>
              <p className="text-emerald-100">
                {myWarehouse?.name || t("warehouses.myWarehouse")}{myWarehouse?.address && ` - ${myWarehouse.address}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
              <DialogTrigger asChild>
                <Button className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" variant="outline" data-testid="button-new-movement">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Movimento
                </Button>
              </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("warehouse.registerMovement")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("common.product")}</Label>
                <Select 
                  value={movementData.productId} 
                  onValueChange={(v) => setMovementData(prev => ({ ...prev, productId: v }))}
                >
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder={t("warehouse.selectProduct")} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("warehouse.movementType")}</Label>
                <Select 
                  value={movementData.movementType} 
                  onValueChange={(v) => setMovementData(prev => ({ ...prev, movementType: v }))}
                >
                  <SelectTrigger data-testid="select-movement-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carico">{t("warehouse.loadIn")}</SelectItem>
                    <SelectItem value="scarico">{t("warehouse.loadOut")}</SelectItem>
                    <SelectItem value="rettifica">{t("warehouse.adjust")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("common.quantity")}</Label>
                <Input 
                  type="number" 
                  value={movementData.quantity}
                  onChange={(e) => setMovementData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  data-testid="input-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.note")}</Label>
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
                {createMovementMutation.isPending ? t("settings.saving") : "Registra Movimento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditStockDialog} onOpenChange={setShowEditStockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("warehouse.editStock")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Prodotto: <span className="font-medium text-foreground">{editingStockItem?.product?.name}</span>
              </p>
              <div className="space-y-2">
                <Label>{t("warehouse.minStock")}</Label>
                <Input 
                  type="number" 
                  min="0"
                  value={editStockData.minStock}
                  onChange={(e) => setEditStockData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  data-testid="input-min-stock"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("warehouse.warehousePosition")}</Label>
                <Input 
                  value={editStockData.location}
                  onChange={(e) => setEditStockData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder={t("warehouse.positionPlaceholder")}
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
                {updateStockMutation.isPending ? t("settings.saving") : t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("warehouse.quantitTotale")}</p>
                <p className="text-2xl font-bold" data-testid="text-total-quantity">
                  {stock.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <TrendingDown className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("warehouse.lowStockItems")}</p>
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("warehouse.searchProduct")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-stock"
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">{t("common.product")}</th>
                      <th className="text-left p-4 font-medium hidden md:table-cell">SKU</th>
                      <th className="text-left p-4 font-medium hidden lg:table-cell">{t("common.type")}</th>
                      <th className="text-right p-4 font-medium">{t("common.quantity")}</th>
                      <th className="text-right p-4 font-medium hidden md:table-cell">Min. Stock</th>
                      <th className="text-left p-4 font-medium hidden lg:table-cell">{t("warehouse.location")}</th>
                      <th className="text-center p-4 font-medium">{t("common.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStock ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8">{t("profile.uploadingLogo")}</td>
                      </tr>
                    ) : filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                          {t("warehouse.nessunProdottoInStock")}
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-stock-${item.id}`}>
                          <td className="p-4">
                            <div className="flex flex-wrap items-center gap-3">
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
                          <td className="p-4 text-muted-foreground hidden md:table-cell">{item.product?.sku || "N/D"}</td>
                          <td className="p-4 hidden lg:table-cell">
                            <Badge variant="outline">{item.product?.category || "N/D"}</Badge>
                          </td>
                          <td className="p-4 text-right">
                            <span className={item.minStock && item.quantity < item.minStock ? "text-red-500 font-bold" : ""}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-right text-muted-foreground hidden md:table-cell">{item.minStock || "-"}</td>
                          <td className="p-4 hidden lg:table-cell">{item.location || "-"}</td>
                          <td className="p-4 text-center">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              onClick={() => handleEditStock(item)}
                              title={t("profile.edit")}
                              data-testid={`button-edit-stock-${item.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
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
                      <th className="text-left p-4 font-medium">{t("common.date")}</th>
                      <th className="text-left p-4 font-medium">{t("common.type")}</th>
                      <th className="text-left p-4 font-medium">{t("common.product")}</th>
                      <th className="text-right p-4 font-medium">{t("common.quantity")}</th>
                      <th className="text-left p-4 font-medium hidden md:table-cell">{t("warehouse.operator")}</th>
                      <th className="text-left p-4 font-medium hidden lg:table-cell">{t("common.note")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMovements ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8">{t("profile.uploadingLogo")}</td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          {t("warehouse.nessunMovimentoRegistrato")}
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
                            <td className="p-4 font-medium">{mov.product?.name || "N/D"}</td>
                            <td className="p-4 text-right font-medium">
                              {['carico', 'trasferimento_in'].includes(mov.movementType) ? '+' : '-'}
                              {mov.quantity}
                            </td>
                            <td className="p-4 text-muted-foreground hidden md:table-cell">
                              {mov.createdByUser?.fullName || mov.createdByUser?.username || "N/D"}
                            </td>
                            <td className="p-4 text-muted-foreground truncate max-w-[200px] hidden lg:table-cell">
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
    </div>
  );
}
