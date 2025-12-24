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
  ProductSupplier,
  SupplierOrderOwnerType,
  Warehouse
} from "@shared/schema";

// Types for reseller/sub-reseller lists returned by API
interface Reseller {
  id: string;
  name: string;
  username: string;
  email: string | null;
  category: string | null;
}

interface SubReseller {
  id: string;
  name: string;
  username: string;
  email: string | null;
  parentResellerId: string | null;
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Shield,
  Users,
  Store,
  Wrench,
  Warehouse as WarehouseIcon,
} from "lucide-react";

interface SupplierOrderWithDetails extends SupplierOrder {
  supplier?: Supplier;
  repairCenter?: RepairCenter;
  ownerName?: string;
  itemCount?: number;
}

// Owner type configuration
const OWNER_TYPE_CONFIG: Record<SupplierOrderOwnerType, { label: string; icon: typeof Shield }> = {
  admin: { label: "Admin", icon: Shield },
  reseller: { label: "Reseller", icon: Users },
  sub_reseller: { label: "Sub-Reseller", icon: Store },
  repair_center: { label: "Centro Riparazione", icon: Wrench },
};

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
  const [filterOwnerType, setFilterOwnerType] = useState<string>("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrderWithDetails | null>(null);
  const [editingItem, setEditingItem] = useState<OrderItemWithProduct | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  
  // Item form states for auto-population
  const [itemFormData, setItemFormData] = useState({
    productId: "__none__",
    description: "",
    supplierCode: "",
    quantity: 1,
    unitPrice: "",
    notes: ""
  });
  
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

  const { data: resellers = [] } = useQuery<Reseller[]>({
    queryKey: ["/api/resellers"],
  });

  const { data: subResellers = [] } = useQuery<SubReseller[]>({
    queryKey: ["/api/sub-resellers"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: warehouses = [] } = useQuery<Warehouse[]>({
    queryKey: ["/api/warehouses"],
  });

  // State for create dialog owner type
  const [newOrderOwnerType, setNewOrderOwnerType] = useState<SupplierOrderOwnerType>("repair_center");
  const [newOrderOwnerId, setNewOrderOwnerId] = useState<string>("");
  const [newOrderWarehouseId, setNewOrderWarehouseId] = useState<string>("");

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
    const notes = formData.get("notes") as string;
    
    if (!supplierId) {
      toast({ title: "Errore", description: "Seleziona un fornitore", variant: "destructive" });
      return;
    }
    
    if (newOrderOwnerType !== "admin" && !newOrderOwnerId) {
      toast({ title: "Errore", description: "Seleziona il destinatario dell'ordine", variant: "destructive" });
      return;
    }
    
    await createOrderMutation.mutateAsync({
      supplierId,
      ownerType: newOrderOwnerType,
      ownerId: newOrderOwnerType === "admin" ? null : newOrderOwnerId,
      repairCenterId: newOrderOwnerType === "repair_center" ? newOrderOwnerId : undefined,
      targetWarehouseId: (newOrderWarehouseId && newOrderWarehouseId !== "__auto__") ? newOrderWarehouseId : undefined,
      notes: notes || undefined,
    });
    
    // Reset form state
    setNewOrderOwnerType("repair_center");
    setNewOrderOwnerId("");
    setNewOrderWarehouseId("");
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
    
    const productId = itemFormData.productId !== "__none__" ? itemFormData.productId : undefined;
    const quantity = itemFormData.quantity;
    const unitPrice = Math.round(parseFloat(itemFormData.unitPrice || "0") * 100);
    
    if (!itemFormData.description) {
      toast({ title: "Errore", description: "La descrizione è obbligatoria", variant: "destructive" });
      return;
    }
    
    const itemData: Partial<SupplierOrderItem> = {
      productId,
      description: itemFormData.description,
      supplierCode: itemFormData.supplierCode || undefined,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      notes: itemFormData.notes || undefined,
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
    if (item) {
      setItemFormData({
        productId: item.productId || "__none__",
        description: item.description,
        supplierCode: item.supplierCode || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice ? (item.unitPrice / 100).toFixed(2) : "",
        notes: item.notes || ""
      });
    } else {
      setItemFormData({
        productId: "__none__",
        description: "",
        supplierCode: "",
        quantity: 1,
        unitPrice: "",
        notes: ""
      });
    }
    setItemDialogOpen(true);
  };

  const handleProductSelect = (productId: string) => {
    setItemFormData(prev => ({ ...prev, productId }));
    
    if (productId && productId !== "__none__") {
      const product = products.find(p => p.id === productId);
      if (product) {
        const supplierLink = selectedOrder 
          ? productSuppliers.find(ps => ps.productId === productId && ps.supplierId === selectedOrder.supplierId)
          : null;
        
        setItemFormData(prev => ({
          ...prev,
          description: product.name,
          supplierCode: supplierLink?.supplierSku || product.sku || "",
          unitPrice: supplierLink?.unitPrice 
            ? (supplierLink.unitPrice / 100).toFixed(2) 
            : (product.costPrice ? (product.costPrice / 100).toFixed(2) : "")
        }));
      }
    }
  };

  // Helper to get owner name
  const getOwnerName = (order: SupplierOrderWithDetails): string => {
    if (order.ownerName) return order.ownerName;
    
    // Backward compatibility: legacy orders only have repairCenterId
    const ownerType = order.ownerType || (order.repairCenterId ? "repair_center" : "admin");
    const ownerId = order.ownerId || order.repairCenterId;
    
    switch (ownerType) {
      case "admin":
        return "Piattaforma";
      case "reseller":
        return resellers.find(r => r.id === ownerId)?.name || "Reseller";
      case "sub_reseller":
        return subResellers.find(sr => sr.id === ownerId)?.name || "Sub-Reseller";
      case "repair_center":
        return repairCenters.find(c => c.id === ownerId)?.name || "Centro";
      default:
        return "-";
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const matchesSupplier = filterSupplier === "all" || order.supplierId === filterSupplier;
    // Backward compatibility for legacy orders  
    const orderOwnerType = order.ownerType || (order.repairCenterId ? "repair_center" : "admin");
    const matchesOwnerType = filterOwnerType === "all" || orderOwnerType === filterOwnerType;
    
    return matchesSearch && matchesStatus && matchesSupplier && matchesOwnerType;
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
        
        <Select value={filterOwnerType} onValueChange={setFilterOwnerType}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-owner-type">
            <SelectValue placeholder="Tipo Proprietario" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            {Object.entries(OWNER_TYPE_CONFIG).map(([key, config]) => {
              const OwnerIcon = config.icon;
              return (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <OwnerIcon className="h-4 w-4" />
                    {config.label}
                  </div>
                </SelectItem>
              );
            })}
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
                  <TableHead>Destinatario</TableHead>
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
                  // Backward compatibility for legacy orders
                  const ownerType = (order.ownerType || (order.repairCenterId ? "repair_center" : "admin")) as SupplierOrderOwnerType;
                  const ownerConfig = OWNER_TYPE_CONFIG[ownerType];
                  const OwnerIcon = ownerConfig.icon;
                  
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <OwnerIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{getOwnerName(order)}</span>
                        </div>
                      </TableCell>
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
              <Label>Tipo Destinatario *</Label>
              <Select 
                value={newOrderOwnerType} 
                onValueChange={(value) => {
                  setNewOrderOwnerType(value as SupplierOrderOwnerType);
                  setNewOrderOwnerId("");
                }}
              >
                <SelectTrigger data-testid="select-owner-type">
                  <SelectValue placeholder="Seleziona tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Admin (Piattaforma)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="reseller">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Reseller</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sub_reseller">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span>Sub-Reseller</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="repair_center">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      <span>Centro Riparazione</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destinatario *</Label>
              <Select 
                value={newOrderOwnerId} 
                onValueChange={setNewOrderOwnerId}
              >
                <SelectTrigger data-testid="select-new-owner">
                  <SelectValue placeholder={
                    newOrderOwnerType === "admin" ? "Ordine per Admin" :
                    newOrderOwnerType === "reseller" ? "Seleziona reseller..." :
                    newOrderOwnerType === "sub_reseller" ? "Seleziona sub-reseller..." :
                    "Seleziona centro..."
                  } />
                </SelectTrigger>
                <SelectContent>
                  {newOrderOwnerType === "admin" && (
                    <SelectItem value="__admin__">
                      Ordine per conto Admin
                    </SelectItem>
                  )}
                  {newOrderOwnerType === "reseller" && resellers.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                  {newOrderOwnerType === "sub_reseller" && subResellers.map(sr => (
                    <SelectItem key={sr.id} value={sr.id}>
                      {sr.name}
                    </SelectItem>
                  ))}
                  {newOrderOwnerType === "repair_center" && repairCenters.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Magazzino Destinazione</Label>
              <Select 
                value={newOrderWarehouseId} 
                onValueChange={setNewOrderWarehouseId}
              >
                <SelectTrigger data-testid="select-target-warehouse">
                  <SelectValue placeholder="Seleziona magazzino (opzionale)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__auto__">
                    Automatico (magazzino del destinatario)
                  </SelectItem>
                  {warehouses.filter(w => w.isActive).map(w => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Se non selezionato, verrà usato il magazzino del destinatario
              </p>
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
              <Select value={itemFormData.productId} onValueChange={handleProductSelect}>
                <SelectTrigger data-testid="select-item-product">
                  {itemFormData.productId && itemFormData.productId !== "__none__" ? (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selectedProduct = products.find(p => p.id === itemFormData.productId);
                        return selectedProduct ? (
                          <>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedProduct.imageUrl || undefined} alt={selectedProduct.name} />
                              <AvatarFallback className="bg-muted">
                                <Package className="h-3 w-3" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedProduct.name} ({selectedProduct.sku})</span>
                          </>
                        ) : (
                          <SelectValue placeholder="Seleziona prodotto..." />
                        );
                      })()}
                    </div>
                  ) : (
                    <SelectValue placeholder="Seleziona prodotto..." />
                  )}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span>Nessun prodotto collegato</span>
                    </div>
                  </SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id} data-testid={`select-item-product-${p.id}`}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.imageUrl || undefined} alt={p.name} />
                          <AvatarFallback className="bg-muted">
                            <Package className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.sku}</span>
                        </div>
                      </div>
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
                required
                value={itemFormData.description}
                onChange={(e) => setItemFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrizione articolo"
                data-testid="input-item-description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplierCode">Codice Fornitore</Label>
                <Input
                  id="supplierCode"
                  value={itemFormData.supplierCode}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, supplierCode: e.target.value }))}
                  placeholder="Codice articolo"
                  data-testid="input-item-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantità *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  required
                  value={itemFormData.quantity}
                  onChange={(e) => setItemFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  data-testid="input-item-qty"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Prezzo Unitario (€) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                required
                value={itemFormData.unitPrice}
                onChange={(e) => setItemFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                data-testid="input-item-price"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={itemFormData.notes}
                onChange={(e) => setItemFormData(prev => ({ ...prev, notes: e.target.value }))}
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
