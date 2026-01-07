import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Warehouse, Search, Boxes, Package, Eye, Pencil, 
  TrendingUp, TrendingDown, RotateCcw, ArrowLeftRight, MapPin, User, Building2
} from "lucide-react";
import type { Warehouse as WarehouseType, WarehouseStock, WarehouseMovement, Product } from "@shared/schema";

type EnrichedWarehouse = WarehouseType & {
  owner: { id: string; username: string; fullName: string | null; role: string } | null;
  stockCount: number;
  totalQuantity: number;
};

type EnrichedStock = WarehouseStock & { 
  product: { id: string; name: string; sku: string; category: string; imageUrl?: string | null } | null 
};

type EnrichedMovement = WarehouseMovement & { 
  product: { id: string; name: string; sku: string } | null;
  createdByUser: { id: string; fullName: string; username: string } | null;
  relatedWarehouse?: { id: string; name: string } | null;
};

const OWNER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-purple-500/10 text-purple-500" },
  reseller: { label: "Rivenditore", color: "bg-blue-500/10 text-blue-500" },
  sub_reseller: { label: "Sub-Rivenditore", color: "bg-cyan-500/10 text-cyan-500" },
  repair_center: { label: "Centro Riparazioni", color: "bg-orange-500/10 text-orange-500" },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  admin_staff: "Staff Admin",
  reseller: "Rivenditore",
  reseller_staff: "Staff Rivenditore",
  sub_reseller: "Sub-Rivenditore",
  repair_center: "Centro Riparazioni",
  customer: "Cliente",
};

export default function AllWarehousesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<EnrichedWarehouse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("stock");
  const [editData, setEditData] = useState({ name: "", address: "", notes: "" });
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  
  // Transfer state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<EnrichedStock | null>(null);
  const [transferDestWarehouseId, setTransferDestWarehouseId] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<number>(1);

  const { data: warehouses = [], isLoading } = useQuery<EnrichedWarehouse[]>({
    queryKey: ["/api/admin/all-warehouses", ownerTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (ownerTypeFilter !== "all") params.append("ownerType", ownerTypeFilter);
      const res = await fetch(`/api/admin/all-warehouses?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento magazzini");
      return res.json();
    },
  });

  const { data: warehouseStock = [], isLoading: loadingStock } = useQuery<EnrichedStock[]>({
    queryKey: ["/api/warehouses", selectedWarehouse?.id, "stock"],
    queryFn: async () => {
      if (!selectedWarehouse) return [];
      const res = await fetch(`/api/warehouses/${selectedWarehouse.id}/stock`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento stock");
      return res.json();
    },
    enabled: !!selectedWarehouse && detailDialogOpen,
  });

  const { data: warehouseMovements = [], isLoading: loadingMovements } = useQuery<EnrichedMovement[]>({
    queryKey: ["/api/warehouses", selectedWarehouse?.id, "movements"],
    queryFn: async () => {
      if (!selectedWarehouse) return [];
      const res = await fetch(`/api/warehouses/${selectedWarehouse.id}/movements`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento movimenti");
      return res.json();
    },
    enabled: !!selectedWarehouse && detailDialogOpen && activeDetailTab === "movements",
  });

  const updateWarehouseMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; address: string; notes: string }) => {
      return apiRequest("PATCH", `/api/warehouses/${data.id}`, {
        name: data.name,
        address: data.address || null,
        notes: data.notes || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Magazzino aggiornato con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Query for accessible warehouses (for transfer destination)
  const { data: accessibleWarehouses = [] } = useQuery<Array<{ id: string; name: string; ownerType: string; owner?: { fullName?: string } | null }>>({
    queryKey: ["/api/warehouses/accessible"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses/accessible", { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento magazzini");
      return res.json();
    },
    enabled: transferDialogOpen,
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: { sourceWarehouseId: string; destinationWarehouseId: string; productId: string; quantity: number }) => {
      return apiRequest("POST", "/api/warehouses/transfer-immediate", data);
    },
    onSuccess: (result: any) => {
      toast({ title: "Trasferimento completato", description: result.message });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", selectedWarehouse?.id, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", transferDestWarehouseId, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-warehouses"] });
      setTransferDialogOpen(false);
      setTransferItem(null);
      setTransferDestWarehouseId("");
      setTransferQuantity(1);
    },
    onError: (error: any) => {
      toast({ title: "Errore trasferimento", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenTransfer = (item: EnrichedStock) => {
    setTransferItem(item);
    setTransferQuantity(1);
    setTransferDestWarehouseId("");
    setTransferDialogOpen(true);
  };

  const handleTransfer = () => {
    if (!selectedWarehouse || !transferItem || !transferDestWarehouseId || transferQuantity <= 0) return;
    transferMutation.mutate({
      sourceWarehouseId: selectedWarehouse.id,
      destinationWarehouseId: transferDestWarehouseId,
      productId: transferItem.productId,
      quantity: transferQuantity,
    });
  };

  const filteredWarehouses = warehouses.filter((wh) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      wh.name.toLowerCase().includes(search) ||
      wh.owner?.fullName?.toLowerCase().includes(search) ||
      wh.owner?.username.toLowerCase().includes(search) ||
      wh.address?.toLowerCase().includes(search)
    );
  });

  const handleViewDetails = (warehouse: EnrichedWarehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailDialogOpen(true);
    setActiveDetailTab("stock");
  };

  const handleEdit = (warehouse: EnrichedWarehouse) => {
    setSelectedWarehouse(warehouse);
    setEditData({
      name: warehouse.name,
      address: warehouse.address || "",
      notes: warehouse.notes || "",
    });
    setEditDialogOpen(true);
  };

  const movementTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    carico: { label: "Carico", icon: TrendingUp, color: "text-green-500" },
    scarico: { label: "Scarico", icon: TrendingDown, color: "text-red-500" },
    trasferimento_in: { label: "Trasf. In", icon: ArrowLeftRight, color: "text-blue-500" },
    trasferimento_out: { label: "Trasf. Out", icon: ArrowLeftRight, color: "text-orange-500" },
    rettifica: { label: "Rettifica", icon: RotateCcw, color: "text-purple-500" },
  };

  const totalStock = warehouses.reduce((sum, wh) => sum + wh.totalQuantity, 0);
  const totalItems = warehouses.reduce((sum, wh) => sum + wh.stockCount, 0);

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
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-all-warehouses-title">Gestione Magazzini</h1>
              <p className="text-sm text-muted-foreground">
                Visualizza e gestisci tutti i magazzini del sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Warehouse className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Magazzini Totali</p>
                <p className="text-2xl font-bold" data-testid="text-total-warehouses">{warehouses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Articoli Unici</p>
                <p className="text-2xl font-bold" data-testid="text-total-items">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Boxes className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantità Totale</p>
                <p className="text-2xl font-bold" data-testid="text-total-quantity">{totalStock}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <User className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proprietari</p>
                <p className="text-2xl font-bold" data-testid="text-total-owners">
                  {new Set(warehouses.map(w => w.ownerId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Lista Magazzini
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca magazzino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                  data-testid="input-search-warehouses"
                />
              </div>
              <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
                <SelectTrigger className="w-48" data-testid="select-owner-type-filter">
                  <SelectValue placeholder="Tipo proprietario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i tipi</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reseller">Rivenditori</SelectItem>
                  <SelectItem value="sub_reseller">Sub-Rivenditori</SelectItem>
                  <SelectItem value="repair_center">Centri Riparazione</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun magazzino trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Magazzino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Proprietario</TableHead>
                  <TableHead>Indirizzo</TableHead>
                  <TableHead className="text-right">Articoli</TableHead>
                  <TableHead className="text-right">Quantità</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((wh) => (
                  <TableRow key={wh.id} data-testid={`row-warehouse-${wh.id}`}>
                    <TableCell className="font-medium">{wh.name}</TableCell>
                    <TableCell>
                      <Badge className={OWNER_TYPE_LABELS[wh.ownerType]?.color || ""}>
                        {OWNER_TYPE_LABELS[wh.ownerType]?.label || wh.ownerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {wh.owner?.fullName || wh.owner?.username || "-"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[wh.owner?.role || ""] || wh.owner?.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {wh.address ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {wh.address}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{wh.stockCount}</TableCell>
                    <TableCell className="text-right font-medium">{wh.totalQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={wh.isActive ? "default" : "secondary"}>
                        {wh.isActive ? "Attivo" : "Inattivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleViewDetails(wh)}
                          data-testid={`button-view-warehouse-${wh.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(wh)}
                          data-testid={`button-edit-warehouse-${wh.id}`}
                        >
                          <Pencil className="h-4 w-4" />
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

      <Dialog open={detailDialogOpen} onOpenChange={(open) => { setDetailDialogOpen(open); if (!open) setStockSearchTerm(""); }}>
        <DialogContent className="max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {selectedWarehouse?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedWarehouse && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge className={OWNER_TYPE_LABELS[selectedWarehouse.ownerType]?.color || ""}>
                    {OWNER_TYPE_LABELS[selectedWarehouse.ownerType]?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedWarehouse.owner?.fullName || selectedWarehouse.owner?.username}</span>
                </div>
                {selectedWarehouse.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedWarehouse.address}</span>
                  </div>
                )}
              </div>

              <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
                <TabsList>
                  <TabsTrigger value="stock" data-testid="tab-stock">
                    Stock ({warehouseStock.length})
                  </TabsTrigger>
                  <TabsTrigger value="movements" data-testid="tab-movements">
                    Movimenti
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stock">
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cerca prodotto per nome, SKU o categoria..."
                        value={stockSearchTerm}
                        onChange={(e) => setStockSearchTerm(e.target.value)}
                        className="pl-9"
                        data-testid="input-stock-search"
                      />
                    </div>
                  </div>
                  <ScrollArea className="h-[360px]">
                    {loadingStock ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    ) : warehouseStock.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nessun prodotto in stock
                      </div>
                    ) : (
                      (() => {
                        const filteredStock = warehouseStock.filter((item) => {
                          if (!stockSearchTerm) return true;
                          const search = stockSearchTerm.toLowerCase();
                          return (
                            item.product?.name?.toLowerCase().includes(search) ||
                            item.product?.sku?.toLowerCase().includes(search) ||
                            item.product?.category?.toLowerCase().includes(search) ||
                            item.location?.toLowerCase().includes(search)
                          );
                        });
                        return filteredStock.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            Nessun prodotto trovato per "{stockSearchTerm}"
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Prodotto</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead className="text-right">Quantità</TableHead>
                                <TableHead className="text-right">Min. Stock</TableHead>
                                <TableHead>Posizione</TableHead>
                                <TableHead className="text-right">Azioni</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredStock.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-mono text-xs">{item.product?.sku || "-"}</TableCell>
                                  <TableCell className="font-medium">{item.product?.name || "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{item.product?.category || "-"}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Badge variant={item.quantity > 0 ? (item.minStock && item.quantity <= item.minStock ? "destructive" : "default") : "secondary"}>
                                      {item.quantity}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {item.minStock || "-"}
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">
                                    {item.location || "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => handleOpenTransfer(item)}
                                      disabled={item.quantity <= 0}
                                      title="Trasferisci a un altro magazzino"
                                      data-testid={`button-transfer-${item.id}`}
                                    >
                                      <ArrowLeftRight className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        );
                      })()
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="movements">
                  <ScrollArea className="h-[400px]">
                    {loadingMovements ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    ) : warehouseMovements.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Nessun movimento registrato
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Da/Verso</TableHead>
                            <TableHead>Prodotto</TableHead>
                            <TableHead className="text-right">Quantità</TableHead>
                            <TableHead>Operatore</TableHead>
                            <TableHead>Note</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {warehouseMovements.map((mov) => {
                            const typeInfo = movementTypeLabels[mov.movementType] || { label: mov.movementType, color: "" };
                            const Icon = typeInfo.icon || Package;
                            return (
                              <TableRow key={mov.id}>
                                <TableCell className="text-sm">
                                  {new Date(mov.createdAt).toLocaleDateString("it-IT", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </TableCell>
                                <TableCell>
                                  <div className={`flex items-center gap-1 ${typeInfo.color}`}>
                                    <Icon className="h-4 w-4" />
                                    <span className="text-sm">{typeInfo.label}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {mov.relatedWarehouse ? (
                                    <span className="text-muted-foreground">
                                      {mov.movementType === 'trasferimento_out' ? 'Verso: ' : 'Da: '}
                                      <span className="text-foreground">{mov.relatedWarehouse.name}</span>
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                <TableCell className="font-medium">{mov.product?.name || "-"}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {['carico', 'trasferimento_in'].includes(mov.movementType) ? '+' : 
                                   ['scarico', 'trasferimento_out'].includes(mov.movementType) ? '-' : ''}
                                  {mov.quantity}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {mov.createdByUser?.fullName || mov.createdByUser?.username || "-"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                                  {mov.notes || "-"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Modifica Magazzino
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome Magazzino</Label>
              <Input
                value={editData.name}
                onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-edit-warehouse-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Indirizzo</Label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Via, Città, CAP"
                data-testid="input-edit-warehouse-address"
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Note aggiuntive..."
                data-testid="input-edit-warehouse-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (selectedWarehouse) {
                  updateWarehouseMutation.mutate({
                    id: selectedWarehouse.id,
                    ...editData,
                  });
                }
              }}
              disabled={updateWarehouseMutation.isPending || !editData.name.trim()}
              data-testid="button-save-warehouse"
            >
              {updateWarehouseMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Trasferisci Prodotto
            </DialogTitle>
          </DialogHeader>
          {transferItem && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{transferItem.product?.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {transferItem.product?.sku}</p>
                <p className="text-sm">Disponibili: <Badge variant="secondary">{transferItem.quantity}</Badge></p>
              </div>
              
              <div className="space-y-2">
                <Label>Da Magazzino</Label>
                <Input value={selectedWarehouse?.name || ""} disabled data-testid="input-source-warehouse" />
              </div>

              <div className="space-y-2">
                <Label>A Magazzino</Label>
                <Select value={transferDestWarehouseId} onValueChange={setTransferDestWarehouseId}>
                  <SelectTrigger data-testid="select-dest-warehouse">
                    <SelectValue placeholder="Seleziona magazzino destinazione" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibleWarehouses
                      .filter(wh => wh.id !== selectedWarehouse?.id)
                      .map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name} {wh.owner?.fullName ? `(${wh.owner.fullName})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantità da trasferire</Label>
                <Input
                  type="number"
                  min={1}
                  max={transferItem.quantity}
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Math.min(parseInt(e.target.value) || 1, transferItem.quantity))}
                  data-testid="input-transfer-quantity"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={transferMutation.isPending || !transferDestWarehouseId || transferQuantity <= 0}
              data-testid="button-confirm-transfer"
            >
              {transferMutation.isPending ? "Trasferimento..." : "Trasferisci"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
