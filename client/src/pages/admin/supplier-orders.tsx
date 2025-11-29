import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { 
  SupplierOrder, 
  Supplier, 
  Product, 
  SupplierOrderItem,
  RepairCenter,
  ProductSupplier
} from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Package,
  Truck,
  FileText,
  Send,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  PackageCheck,
  PackageX,
  Building2,
  ShoppingCart,
  Calendar,
} from "lucide-react";

interface SupplierOrderWithDetails extends SupplierOrder {
  supplier?: Supplier;
  repairCenter?: RepairCenter;
  itemCount?: number;
}

interface OrderItemWithProduct extends SupplierOrderItem {
  product?: Product;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Bozza", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  sent: { label: "Inviato", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Send },
  confirmed: { label: "Confermato", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", icon: CheckCircle },
  partially_shipped: { label: "Parziale", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", icon: Truck },
  shipped: { label: "Spedito", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Truck },
  partially_received: { label: "Ricevuto Parziale", color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300", icon: PackageX },
  received: { label: "Ricevuto", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: PackageCheck },
  cancelled: { label: "Annullato", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: XCircle },
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy", { locale: it });
}

export default function SupplierOrdersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrderWithDetails | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItemWithProduct | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  
  // Queries
  const { data: orders = [], isLoading } = useQuery<SupplierOrderWithDetails[]>({
    queryKey: ["/api/supplier-orders"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Order items for selected order
  const { data: orderItems = [], isLoading: isLoadingItems } = useQuery<OrderItemWithProduct[]>({
    queryKey: ["/api/supplier-orders", selectedOrder?.id, "items"],
    enabled: !!selectedOrder,
  });

  // Product suppliers for adding items
  const { data: productSuppliers = [] } = useQuery<ProductSupplier[]>({
    queryKey: ["/api/product-suppliers"],
    enabled: createDialogOpen || itemDialogOpen,
  });

  // Mutations
  const createOrderMutation = useMutation({
    mutationFn: async (data: Partial<SupplierOrder>) => {
      return apiRequest("POST", "/api/supplier-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      setCreateDialogOpen(false);
      toast({ title: "Ordine creato", description: "Nuovo ordine fornitore creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierOrder> }) => {
      return apiRequest("PATCH", `/api/supplier-orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({ title: "Ordine aggiornato", description: "Modifiche salvate con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/supplier-orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      setDetailsDialogOpen(false);
      setSelectedOrder(null);
      toast({ title: "Ordine eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: Partial<SupplierOrderItem>) => {
      return apiRequest("POST", `/api/supplier-orders/${selectedOrder?.id}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders", selectedOrder?.id, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      setItemDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Articolo aggiunto" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierOrderItem> }) => {
      return apiRequest("PATCH", `/api/supplier-order-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders", selectedOrder?.id, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      setItemDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Articolo aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/supplier-order-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders", selectedOrder?.id, "items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-orders"] });
      toast({ title: "Articolo rimosso" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const supplierId = formData.get("supplierId") as string;
    const repairCenterId = formData.get("repairCenterId") as string;
    const notes = formData.get("notes") as string;
    
    if (!supplierId || !repairCenterId) {
      toast({ title: "Errore", description: "Seleziona fornitore e centro riparazione", variant: "destructive" });
      return;
    }
    
    await createOrderMutation.mutateAsync({
      supplierId,
      repairCenterId,
      notes: notes || undefined,
    });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const now = new Date().toISOString();
    const updates: Partial<SupplierOrder> = { status: newStatus as any };
    
    // Set timestamps based on status
    if (newStatus === "sent") updates.sentAt = now as any;
    if (newStatus === "confirmed") updates.confirmedAt = now as any;
    if (newStatus === "shipped") updates.shippedAt = now as any;
    if (newStatus === "received") updates.receivedAt = now as any;
    
    await updateOrderMutation.mutateAsync({ id: orderId, data: updates });
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productIdRaw = formData.get("productId") as string;
    const productId = productIdRaw && productIdRaw !== "__none__" ? productIdRaw : undefined;
    const description = formData.get("description") as string;
    const supplierCode = formData.get("supplierCode") as string;
    const quantity = parseInt(formData.get("quantity") as string) || 1;
    const unitPrice = Math.round(parseFloat(formData.get("unitPrice") as string || "0") * 100);
    const notes = formData.get("notes") as string;
    
    if (!description) {
      toast({ title: "Errore", description: "La descrizione è obbligatoria", variant: "destructive" });
      return;
    }
    
    const itemData: Partial<SupplierOrderItem> = {
      productId,
      description,
      supplierCode: supplierCode || undefined,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      notes: notes || undefined,
    };
    
    if (editingItem) {
      await updateItemMutation.mutateAsync({ id: editingItem.id, data: itemData });
    } else {
      await createItemMutation.mutateAsync(itemData);
    }
  };

  const openOrderDetails = (order: SupplierOrderWithDetails) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const openItemDialog = (item?: OrderItemWithProduct) => {
    setEditingItem(item || null);
    setItemDialogOpen(true);
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSupplier = filterSupplier === "all" || order.supplierId === filterSupplier;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  // Get available products for selected supplier
  const getSupplierProducts = (supplierId: string) => {
    const supplierProductIds = productSuppliers
      .filter(ps => ps.supplierId === supplierId)
      .map(ps => ps.productId);
    return products.filter(p => supplierProductIds.includes(p.id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Ordini Fornitori</h1>
          <p className="text-muted-foreground text-sm">
            Gestisci gli ordini di acquisto verso i fornitori
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-order">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Ordine
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca ordine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-status">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-[200px]" data-testid="select-filter-supplier">
            <SelectValue placeholder="Fornitore" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i fornitori</SelectItem>
            {suppliers.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Lista Ordini
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nessun ordine trovato</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea un nuovo ordine per iniziare
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead>Consegna Prevista</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => {
                  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusConfig.icon;
                  const supplier = suppliers.find(s => s.id === order.supplierId);
                  const center = repairCenters.find(c => c.id === order.repairCenterId);
                  
                  return (
                    <TableRow 
                      key={order.id} 
                      className="cursor-pointer hover-elevate"
                      onClick={() => openOrderDetails(order)}
                      data-testid={`row-order-${order.id}`}
                    >
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {supplier?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{center?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {order.expectedDelivery ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.expectedDelivery)}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${order.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openOrderDetails(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Dettagli
                            </DropdownMenuItem>
                            {order.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "sent")}>
                                <Send className="h-4 w-4 mr-2" />
                                Invia ordine
                              </DropdownMenuItem>
                            )}
                            {order.status === "sent" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "confirmed")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Conferma ricezione
                              </DropdownMenuItem>
                            )}
                            {order.status === "confirmed" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "shipped")}>
                                <Truck className="h-4 w-4 mr-2" />
                                Segna spedito
                              </DropdownMenuItem>
                            )}
                            {(order.status === "shipped" || order.status === "partially_received") && (
                              <DropdownMenuItem onClick={() => handleStatusChange(order.id, "received")}>
                                <PackageCheck className="h-4 w-4 mr-2" />
                                Segna ricevuto
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {order.status === "draft" && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Eliminare questo ordine?")) {
                                    deleteOrderMutation.mutate(order.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            )}
                            {order.status !== "draft" && order.status !== "cancelled" && order.status !== "received" && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleStatusChange(order.id, "cancelled")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Annulla ordine
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Ordine Fornitore</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Fornitore *</Label>
              <Select name="supplierId">
                <SelectTrigger data-testid="select-new-supplier">
                  <SelectValue placeholder="Seleziona fornitore..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.filter(s => s.isActive).map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="repairCenterId">Centro Riparazione *</Label>
              <Select name="repairCenterId">
                <SelectTrigger data-testid="select-new-center">
                  <SelectValue placeholder="Seleziona centro..." />
                </SelectTrigger>
                <SelectContent>
                  {repairCenters.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Note per il fornitore..."
                className="resize-none"
                data-testid="textarea-notes"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? "Creazione..." : "Crea Ordine"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Ordine {selectedOrder.orderNumber}</span>
                  <Badge className={STATUS_CONFIG[selectedOrder.status]?.color}>
                    {STATUS_CONFIG[selectedOrder.status]?.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[calc(90vh-120px)]">
                <Tabs defaultValue="items" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="items">Articoli</TabsTrigger>
                    <TabsTrigger value="info">Informazioni</TabsTrigger>
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="items" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base">Articoli Ordine</Label>
                      {selectedOrder.status === "draft" && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openItemDialog()}
                          data-testid="button-add-item"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Aggiungi Articolo
                        </Button>
                      )}
                    </div>
                    
                    {isLoadingItems ? (
                      <div className="space-y-2">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : orderItems.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg border-dashed">
                        <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Nessun articolo</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Aggiungi articoli a questo ordine
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Codice</TableHead>
                            <TableHead>Descrizione</TableHead>
                            <TableHead className="text-right">Qtà</TableHead>
                            <TableHead className="text-right">Prezzo</TableHead>
                            <TableHead className="text-right">Totale</TableHead>
                            <TableHead className="text-right">Ricevuti</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map(item => (
                            <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                              <TableCell className="font-mono text-sm">
                                {item.supplierCode || "-"}
                              </TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.unitPrice)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.totalPrice)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={item.quantityReceived >= item.quantity ? "default" : "secondary"}>
                                  {item.quantityReceived}/{item.quantity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {selectedOrder.status === "draft" && (
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openItemDialog(item)}
                                      data-testid={`button-edit-item-${item.id}`}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm("Rimuovere questo articolo?")) {
                                          deleteItemMutation.mutate(item.id);
                                        }
                                      }}
                                      data-testid={`button-delete-item-${item.id}`}
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
                    
                    {/* Totals */}
                    <Separator />
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotale:</span>
                          <span>{formatCurrency(selectedOrder.subtotal)}</span>
                        </div>
                        {(selectedOrder.shippingCost ?? 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Spedizione:</span>
                            <span>{formatCurrency(selectedOrder.shippingCost ?? 0)}</span>
                          </div>
                        )}
                        {(selectedOrder.taxAmount ?? 0) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>IVA:</span>
                            <span>{formatCurrency(selectedOrder.taxAmount ?? 0)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span>Totale:</span>
                          <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fornitore</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {suppliers.find(s => s.id === selectedOrder.supplierId)?.name || "-"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Centro Riparazione</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {repairCenters.find(c => c.id === selectedOrder.repairCenterId)?.name || "-"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Note</Label>
                      <div className="p-3 bg-muted rounded-md min-h-[80px]">
                        {selectedOrder.notes || <span className="text-muted-foreground">Nessuna nota</span>}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Creato il</Label>
                        <div className="text-sm">{formatDate(selectedOrder.createdAt)}</div>
                      </div>
                      {selectedOrder.sentAt && (
                        <div className="space-y-2">
                          <Label>Inviato il</Label>
                          <div className="text-sm">{formatDate(selectedOrder.sentAt)}</div>
                        </div>
                      )}
                      {selectedOrder.confirmedAt && (
                        <div className="space-y-2">
                          <Label>Confermato il</Label>
                          <div className="text-sm">{formatDate(selectedOrder.confirmedAt)}</div>
                        </div>
                      )}
                      {selectedOrder.receivedAt && (
                        <div className="space-y-2">
                          <Label>Ricevuto il</Label>
                          <div className="text-sm">{formatDate(selectedOrder.receivedAt)}</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tracking" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expectedDelivery">Consegna Prevista</Label>
                        <Input
                          id="expectedDelivery"
                          type="date"
                          defaultValue={selectedOrder.expectedDelivery ? format(new Date(selectedOrder.expectedDelivery), "yyyy-MM-dd") : ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              updateOrderMutation.mutate({
                                id: selectedOrder.id,
                                data: { expectedDelivery: new Date(e.target.value) as any }
                              });
                            }
                          }}
                          data-testid="input-expected-delivery"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trackingCarrier">Corriere</Label>
                        <Input
                          id="trackingCarrier"
                          defaultValue={selectedOrder.trackingCarrier || ""}
                          placeholder="Es: DHL, BRT, SDA..."
                          onBlur={(e) => {
                            updateOrderMutation.mutate({
                              id: selectedOrder.id,
                              data: { trackingCarrier: e.target.value || null }
                            });
                          }}
                          data-testid="input-carrier"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trackingNumber">Numero Tracking</Label>
                      <Input
                        id="trackingNumber"
                        defaultValue={selectedOrder.trackingNumber || ""}
                        placeholder="Inserisci numero di tracking..."
                        onBlur={(e) => {
                          updateOrderMutation.mutate({
                            id: selectedOrder.id,
                            data: { trackingNumber: e.target.value || null }
                          });
                        }}
                        data-testid="input-tracking"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifica Articolo" : "Aggiungi Articolo"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Prodotto (opzionale)</Label>
              <Select name="productId" defaultValue={editingItem?.productId || "__none__"}>
                <SelectTrigger data-testid="select-item-product">
                  <SelectValue placeholder="Seleziona prodotto..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nessun prodotto collegato</SelectItem>
                  {selectedOrder && getSupplierProducts(selectedOrder.supplierId).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Collega a un prodotto esistente per aggiornare automaticamente le giacenze
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione *</Label>
              <Input
                id="description"
                name="description"
                required
                defaultValue={editingItem?.description || ""}
                placeholder="Descrizione articolo"
                data-testid="input-item-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierCode">Codice Fornitore</Label>
                <Input
                  id="supplierCode"
                  name="supplierCode"
                  defaultValue={editingItem?.supplierCode || ""}
                  placeholder="Codice articolo"
                  data-testid="input-item-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantità *</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  defaultValue={editingItem?.quantity || 1}
                  data-testid="input-item-qty"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Prezzo Unitario (€) *</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={editingItem?.unitPrice ? (editingItem.unitPrice / 100).toFixed(2) : ""}
                data-testid="input-item-price"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={editingItem?.notes || ""}
                placeholder="Note articolo..."
                className="resize-none"
                data-testid="textarea-item-notes"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setItemDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={createItemMutation.isPending || updateItemMutation.isPending}
                data-testid="button-submit-item"
              >
                {(createItemMutation.isPending || updateItemMutation.isPending)
                  ? "Salvataggio..."
                  : editingItem ? "Aggiorna" : "Aggiungi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
