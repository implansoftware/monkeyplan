import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Warehouse, Search, Boxes, Package, Eye, 
  TrendingUp, TrendingDown, ArrowLeftRight, Building2, ImageIcon
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { WarehouseStock, WarehouseMovement } from "@shared/schema";

type NetworkWarehouse = {
  id: string;
  name: string;
  ownerType: string;
  ownerId: string;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  owner?: { id: string; username: string; fullName?: string | null } | null;
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
  reseller: { label: "Rivenditore", color: "bg-blue-500/10 text-blue-500" },
  sub_reseller: { label: "Sub-Rivenditore", color: "bg-cyan-500/10 text-cyan-500" },
  repair_center: { label: "Centro Riparazioni", color: "bg-orange-500/10 text-orange-500" },
};

export default function NetworkWarehousesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<NetworkWarehouse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("stock");
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<EnrichedStock | null>(null);
  const [transferDestWarehouseId, setTransferDestWarehouseId] = useState<string>("");
  const [transferQuantity, setTransferQuantity] = useState<number>(1);

  const { data: warehouses = [], isLoading } = useQuery<NetworkWarehouse[]>({
    queryKey: ["/api/warehouses/accessible"],
    queryFn: async () => {
      const res = await fetch("/api/warehouses/accessible", { credentials: "include" });
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

  const transferMutation = useMutation({
    mutationFn: async (data: { sourceWarehouseId: string; destinationWarehouseId: string; productId: string; quantity: number }) => {
      return apiRequest("POST", "/api/warehouses/transfer-immediate", data);
    },
    onSuccess: () => {
      toast({ title: "Trasferimento completato con successo" });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", selectedWarehouse?.id, "stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouses", selectedWarehouse?.id, "movements"] });
      setTransferDialogOpen(false);
      setTransferItem(null);
    },
    onError: (error: any) => {
      toast({ title: "Errore trasferimento", description: error.message, variant: "destructive" });
    },
  });

  const filteredWarehouses = warehouses.filter(wh => 
    wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wh.owner?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wh.owner?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStock = warehouseStock.filter(item =>
    item.product?.name?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
    item.product?.sku?.toLowerCase().includes(stockSearchTerm.toLowerCase())
  );

  const openDetailDialog = (warehouse: NetworkWarehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailDialogOpen(true);
    setActiveDetailTab("stock");
    setStockSearchTerm("");
  };

  const openTransferDialog = (item: EnrichedStock) => {
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

  const getOwnerTypeStyle = (ownerType: string) => {
    return OWNER_TYPE_LABELS[ownerType] || { label: ownerType, color: "bg-gray-500/10 text-gray-500" };
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
              <Warehouse className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-network-warehouses-title">Magazzini Rete</h1>
              <p className="text-sm text-white/80">Gestisci i magazzini della tua rete: sub-rivenditori e centri di riparazione</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Building2 className="h-5 w-5" />
              Magazzini ({filteredWarehouses.length})
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca magazzino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-warehouses"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Caricamento...</div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Warehouse className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun magazzino trovato nella tua rete</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Magazzino</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Proprietario</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.map((warehouse) => {
                  const typeStyle = getOwnerTypeStyle(warehouse.ownerType);
                  return (
                    <TableRow key={warehouse.id} data-testid={`row-warehouse-${warehouse.id}`}>
                      <TableCell className="font-medium">{warehouse.name}</TableCell>
                      <TableCell>
                        <Badge className={typeStyle.color}>{typeStyle.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {warehouse.owner?.fullName || warehouse.owner?.username || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={warehouse.isActive ? "default" : "secondary"}>
                          {warehouse.isActive ? "Attivo" : "Inattivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailDialog(warehouse)}
                          data-testid={`button-view-warehouse-${warehouse.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {selectedWarehouse?.name}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab}>
            <TabsList>
              <TabsTrigger value="stock" className="flex flex-wrap items-center gap-1">
                <Boxes className="h-4 w-4" />
                Stock
              </TabsTrigger>
              <TabsTrigger value="movements" className="flex flex-wrap items-center gap-1">
                <ArrowLeftRight className="h-4 w-4" />
                Movimenti
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stock" className="mt-4">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca prodotto..."
                    value={stockSearchTerm}
                    onChange={(e) => setStockSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-stock"
                  />
                </div>
              </div>
              
              <ScrollArea className="h-[400px]">
                {loadingStock ? (
                  <div className="text-center py-8">Caricamento stock...</div>
                ) : filteredStock.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun prodotto in stock</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Img</TableHead>
                        <TableHead>Prodotto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Quantità</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStock.map((item) => (
                        <TableRow key={item.id} data-testid={`row-stock-${item.id}`}>
                          <TableCell>
                            <Avatar className="h-10 w-10 rounded-md">
                              <AvatarImage 
                                src={item.product?.imageUrl || undefined} 
                                alt={item.product?.name || "Prodotto"} 
                                className="object-cover"
                              />
                              <AvatarFallback className="rounded-md bg-muted">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.product?.name || "Prodotto non trovato"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.product?.sku || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.product?.category || "-"}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openTransferDialog(item)}
                              disabled={item.quantity <= 0}
                              data-testid={`button-transfer-${item.id}`}
                            >
                              <ArrowLeftRight className="h-4 w-4 mr-1" />
                              Trasferisci
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="movements" className="mt-4">
              <ScrollArea className="h-[400px]">
                {loadingMovements ? (
                  <div className="text-center py-8">Caricamento movimenti...</div>
                ) : warehouseMovements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nessun movimento registrato</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Prodotto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Da/Verso</TableHead>
                        <TableHead className="text-right">Quantità</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseMovements.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell className="text-sm">
                            {new Date(mov.createdAt).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="font-medium">
                            {mov.product?.name || "-"}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const typeConfig: Record<string, { label: string; color: string; iconType: 'up' | 'down' | 'transfer' | 'neutral' }> = {
                                carico: { label: 'Carico', color: 'text-green-500', iconType: 'up' },
                                scarico: { label: 'Scarico', color: 'text-red-500', iconType: 'down' },
                                trasferimento_in: { label: 'Trasf. In', color: 'text-blue-500', iconType: 'transfer' },
                                trasferimento_out: { label: 'Trasf. Out', color: 'text-orange-500', iconType: 'transfer' },
                                rettifica: { label: 'Rettifica', color: 'text-purple-500', iconType: 'neutral' },
                              };
                              const cfg = typeConfig[mov.movementType] || { label: mov.movementType, color: 'text-muted-foreground', iconType: 'neutral' };
                              return (
                                <div className={`flex items-center gap-1 ${cfg.color}`}>
                                  {cfg.iconType === 'up' && <TrendingUp className="h-4 w-4" />}
                                  {cfg.iconType === 'down' && <TrendingDown className="h-4 w-4" />}
                                  {cfg.iconType === 'transfer' && <ArrowLeftRight className="h-4 w-4" />}
                                  {cfg.iconType === 'neutral' && <Package className="h-4 w-4" />}
                                  <span className="text-sm">{cfg.label}</span>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {mov.relatedWarehouse ? (
                              <span className="text-muted-foreground">
                                {mov.movementType === 'trasferimento_out' ? 'Verso: ' : 'Da: '}
                                <span className="text-foreground">{mov.relatedWarehouse.name}</span>
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {['carico', 'trasferimento_in'].includes(mov.movementType) ? '+' : 
                             ['scarico', 'trasferimento_out'].includes(mov.movementType) ? '-' : ''}
                            {mov.quantity}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {mov.notes || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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
              <label className="text-sm font-medium">Magazzino destinazione</label>
              <Select value={transferDestWarehouseId} onValueChange={setTransferDestWarehouseId}>
                <SelectTrigger data-testid="select-dest-warehouse">
                  <SelectValue placeholder="Seleziona magazzino..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter(wh => wh.id !== selectedWarehouse?.id)
                    .map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} ({getOwnerTypeStyle(wh.ownerType).label})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantità</label>
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
    </div>
  );
}
