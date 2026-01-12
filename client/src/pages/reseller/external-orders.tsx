import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Package, Clock, CheckCircle, Truck, XCircle, Warehouse, Check, AlertCircle, Search } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

type ExternalOrder = {
  id: string;
  source: "mobilesentrix" | "foneday" | "sifar" | "trovausati";
  sourceLabel: string;
  orderNumber: string | null;
  mobilesentrixOrderId?: string;
  fonedayOrderNumber?: string;
  status: string;
  total: number;
  currency?: string;
  isReceivedInWarehouse?: boolean;
  receivedAt?: string;
  targetWarehouseId?: string | null;
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
};

type Warehouse = {
  id: string;
  name: string;
  type: string;
};

type OrderItem = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  price: number;
  brand?: string | null;
  monkeyplanProductId?: string | null;
  quantityReceived?: number;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }> = {
  pending: { label: "In Attesa", variant: "secondary", icon: Clock },
  processing: { label: "In Elaborazione", variant: "default", icon: Package },
  shipped: { label: "Spedito", variant: "default", icon: Truck },
  Shipped: { label: "Spedito", variant: "default", icon: Truck },
  complete: { label: "Completato", variant: "default", icon: CheckCircle },
  completed: { label: "Completato", variant: "default", icon: CheckCircle },
  cancelled: { label: "Annullato", variant: "destructive", icon: XCircle },
  canceled: { label: "Annullato", variant: "destructive", icon: XCircle },
  confirmed: { label: "Confermato", variant: "default", icon: CheckCircle },
};

const sourceColors: Record<string, string> = {
  mobilesentrix: "bg-blue-500",
  foneday: "bg-green-500",
  sifar: "bg-orange-500",
  trovausati: "bg-purple-500",
};

export default function ExternalOrdersPage() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<ExternalOrder | null>(null);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>("");
  const [itemMappings, setItemMappings] = useState<Record<string, string>>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: orders, isLoading } = useQuery<ExternalOrder[]>({
    queryKey: ["/api/external-orders"],
  });

  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const receiveMutation = useMutation({
    mutationFn: async (data: { orderId: string; source: string; items: any[]; targetWarehouseId: string }) => {
      const response = await apiRequest("POST", `/api/${data.source}/orders/${data.orderId}/receive`, {
        items: data.items,
        targetWarehouseId: data.targetWarehouseId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Ordine ricevuto",
        description: data.message || "L'ordine è stato ricevuto in magazzino con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/external-orders"] });
      setShowReceiveDialog(false);
      setSelectedOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile ricevere l'ordine",
        variant: "destructive",
      });
    },
  });

  const formatPrice = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return "0,00 €";
    const cents = amount / 100;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents);
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status.toLowerCase()] || { label: status, variant: "secondary" as const, icon: Clock };
  };

  const handleReceiveOrder = async (order: ExternalOrder) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    setItemMappings({});

    try {
      if (order.source === "mobilesentrix") {
        const response = await apiRequest("GET", `/api/mobilesentrix/orders/${order.id}`);
        const data = await response.json();
        setOrderItems(data.items || []);
        
        const mappings: Record<string, string> = {};
        for (const item of data.items || []) {
          if (item.monkeyplanProductId) {
            mappings[item.id] = item.monkeyplanProductId;
          }
        }
        setItemMappings(mappings);
      }
    } catch (error) {
      console.error("Error loading order items:", error);
    } finally {
      setLoadingItems(false);
      setShowReceiveDialog(true);
    }
  };

  const handleConfirmReceive = () => {
    if (!selectedOrder || !targetWarehouseId) {
      toast({
        title: "Errore",
        description: "Seleziona un magazzino di destinazione",
        variant: "destructive",
      });
      return;
    }

    const items = orderItems.map(item => ({
      orderItemId: item.id,
      monkeyplanProductId: itemMappings[item.id] || null,
      quantity: item.quantity,
    }));

    receiveMutation.mutate({
      orderId: selectedOrder.id,
      source: selectedOrder.source,
      items,
      targetWarehouseId,
    });
  };

  const filteredOrders = orders?.filter(order => {
    if (sourceFilter !== "all" && order.source !== sourceFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const orderNum = order.orderNumber || order.mobilesentrixOrderId || order.fonedayOrderNumber || "";
      if (!orderNum.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Ordini Fornitori Esterni</h1>
            <p className="text-muted-foreground">Gestione ordini da MobileSentrix, Foneday, SIFAR, TrovaUsati</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Tutti gli Ordini</CardTitle>
              <CardDescription>Ordini effettuati sui portali fornitori esterni</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca ordine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-48"
                  data-testid="input-search-orders"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40" data-testid="select-source-filter">
                  <SelectValue placeholder="Tutti i fornitori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i fornitori</SelectItem>
                  <SelectItem value="mobilesentrix">MobileSentrix</SelectItem>
                  <SelectItem value="foneday">Foneday</SelectItem>
                  <SelectItem value="sifar">SIFAR</SelectItem>
                  <SelectItem value="trovausati">TrovaUsati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredOrders || filteredOrders.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nessun ordine</h2>
              <p className="text-muted-foreground">Non ci sono ordini dai fornitori esterni</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const config = getStatusConfig(order.status);
                const StatusIcon = config.icon;
                const orderNum = order.orderNumber || order.mobilesentrixOrderId || order.fonedayOrderNumber || "N/A";
                
                return (
                  <div
                    key={`${order.source}-${order.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                    data-testid={`order-row-${order.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-12 rounded-full ${sourceColors[order.source]}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{orderNum}</span>
                          <Badge variant="outline" className="text-xs">
                            {order.sourceLabel}
                          </Badge>
                          {order.isReceivedInWarehouse && (
                            <Badge variant="default" className="text-xs bg-green-500">
                              <Warehouse className="h-3 w-3 mr-1" />
                              Ricevuto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), "d MMMM yyyy HH:mm", { locale: it })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(order.total)}</p>
                        <Badge variant={config.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      {!order.isReceivedInWarehouse && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleReceiveOrder(order)}
                          data-testid={`button-receive-${order.id}`}
                        >
                          <Warehouse className="h-4 w-4 mr-1" />
                          Ricevi
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Ricevi Ordine in Magazzino
            </DialogTitle>
            <DialogDescription>
              Mappa i prodotti esterni ai prodotti MonkeyPlan e seleziona il magazzino di destinazione
            </DialogDescription>
          </DialogHeader>

          {loadingItems ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Magazzino di destinazione</Label>
                <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
                  <SelectTrigger data-testid="select-target-warehouse">
                    <SelectValue placeholder="Seleziona magazzino..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name} ({wh.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Mappatura Prodotti</Label>
                <p className="text-sm text-muted-foreground">
                  Associa ogni prodotto esterno al corrispondente prodotto nel tuo catalogo MonkeyPlan
                </p>
                
                {orderItems.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Nessun prodotto nell'ordine</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              SKU: {item.sku} | Qtà: {item.quantity}
                            </p>
                          </div>
                          <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                        </div>
                        <Select
                          value={itemMappings[item.id] || ""}
                          onValueChange={(value) => setItemMappings(prev => ({ ...prev, [item.id]: value }))}
                        >
                          <SelectTrigger data-testid={`select-product-mapping-${item.id}`}>
                            <SelectValue placeholder="Seleziona prodotto MonkeyPlan..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Nessuna mappatura --</SelectItem>
                            {products?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {itemMappings[item.id] && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <Check className="h-4 w-4" />
                            Mappato
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleConfirmReceive}
              disabled={!targetWarehouseId || receiveMutation.isPending}
              data-testid="button-confirm-receive"
            >
              {receiveMutation.isPending ? "Ricezione..." : "Conferma Ricezione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
