import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp, TrendingDown, RotateCcw, MapPin, Boxes,
  ArrowRight, Clock, CheckCircle, XCircle, Truck
} from "lucide-react";
import type { Warehouse as WarehouseType, WarehouseStock, WarehouseMovement, WarehouseTransfer, Product } from "@shared/schema";

type EnrichedStock = WarehouseStock & { product: { id: string; name: string; sku: string; type: string } | null };
type EnrichedMovement = WarehouseMovement & { 
  product: { id: string; name: string; sku: string } | null;
  createdByUser: { id: string; fullName: string; username: string } | null;
};
type EnrichedTransfer = WarehouseTransfer & {
  sourceWarehouse: { id: string; name: string } | null;
  destinationWarehouse: { id: string; name: string } | null;
  requestedByUser: { id: string; fullName: string } | null;
  itemCount: number;
};

export default function WarehousesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stock");
  const [searchTerm, setSearchTerm] = useState("");
  const [showMovementDialog, setShowMovementDialog] = useState(false);
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

  const { data: transfers = [] } = useQuery<EnrichedTransfer[]>({
    queryKey: ["/api/warehouse-transfers"],
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
      toast({ title: "Movimento registrato", description: "Il movimento è stato registrato con successo" });
      setShowMovementDialog(false);
      setMovementData({ productId: "", movementType: "carico", quantity: 0, notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const filteredStock = stock.filter(item => 
    item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const movementTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    carico: { label: "Carico", icon: TrendingUp, color: "text-green-500" },
    scarico: { label: "Scarico", icon: TrendingDown, color: "text-red-500" },
    trasferimento_in: { label: "Trasf. In", icon: ArrowRight, color: "text-blue-500" },
    trasferimento_out: { label: "Trasf. Out", icon: ArrowLeftRight, color: "text-orange-500" },
    rettifica: { label: "Rettifica", icon: RotateCcw, color: "text-purple-500" },
  };

  const transferStatusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "In Attesa", color: "bg-yellow-500/10 text-yellow-500" },
    approved: { label: "Approvato", color: "bg-blue-500/10 text-blue-500" },
    shipped: { label: "Spedito", color: "bg-purple-500/10 text-purple-500" },
    received: { label: "Ricevuto", color: "bg-green-500/10 text-green-500" },
    cancelled: { label: "Annullato", color: "bg-red-500/10 text-red-500" },
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <ArrowLeftRight className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Trasferimenti Attivi</p>
                <p className="text-2xl font-bold" data-testid="text-active-transfers">
                  {transfers.filter(t => !['received', 'cancelled'].includes(t.status)).length}
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
          <TabsTrigger value="transfers" data-testid="tab-transfers">
            <Truck className="h-4 w-4 mr-2" />
            Trasferimenti
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <div className="flex items-center gap-4">
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
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStock ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8">Caricamento...</td>
                      </tr>
                    ) : filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
                          Nessun prodotto in stock
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map((item) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-stock-${item.id}`}>
                          <td className="p-4 font-medium">{item.product?.name || "N/D"}</td>
                          <td className="p-4 text-muted-foreground">{item.product?.sku || "N/D"}</td>
                          <td className="p-4">
                            <Badge variant="outline">{item.product?.type || "N/D"}</Badge>
                          </td>
                          <td className="p-4 text-right">
                            <span className={item.minStock && item.quantity < item.minStock ? "text-red-500 font-bold" : ""}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-right text-muted-foreground">{item.minStock || "-"}</td>
                          <td className="p-4">{item.location || "-"}</td>
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
                      <th className="text-left p-4 font-medium">Prodotto</th>
                      <th className="text-right p-4 font-medium">Quantità</th>
                      <th className="text-left p-4 font-medium">Operatore</th>
                      <th className="text-left p-4 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMovements ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8">Caricamento...</td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-8 text-muted-foreground">
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

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Numero</th>
                      <th className="text-left p-4 font-medium">Da</th>
                      <th className="text-left p-4 font-medium">A</th>
                      <th className="text-left p-4 font-medium">Stato</th>
                      <th className="text-right p-4 font-medium">Articoli</th>
                      <th className="text-left p-4 font-medium">Richiedente</th>
                      <th className="text-left p-4 font-medium">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-muted-foreground">
                          Nessun trasferimento
                        </td>
                      </tr>
                    ) : (
                      transfers.map((transfer) => {
                        const statusInfo = transferStatusLabels[transfer.status] || { label: transfer.status, color: "" };
                        return (
                          <tr key={transfer.id} className="border-b last:border-0 hover:bg-muted/50" data-testid={`row-transfer-${transfer.id}`}>
                            <td className="p-4 font-mono">{transfer.transferNumber}</td>
                            <td className="p-4">{transfer.sourceWarehouse?.name || "N/D"}</td>
                            <td className="p-4">{transfer.destinationWarehouse?.name || "N/D"}</td>
                            <td className="p-4">
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                            </td>
                            <td className="p-4 text-right">{transfer.itemCount}</td>
                            <td className="p-4 text-muted-foreground">
                              {transfer.requestedByUser?.fullName || "N/D"}
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {new Date(transfer.createdAt).toLocaleDateString('it-IT')}
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
