import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { 
  SupplierReturn, 
  Supplier,
  RepairCenter,
  SupplierOrder,
  Product,
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
  Trash2,
  Building2,
  Undo2,
  AlertTriangle,
  DollarSign,
  Calendar,
  Ban,
} from "lucide-react";

interface SupplierReturnWithDetails extends SupplierReturn {
  supplier?: Supplier;
  repairCenter?: RepairCenter;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Bozza", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  requested: { label: "Richiesta", color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", icon: Send },
  approved: { label: "Approvato", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300", icon: CheckCircle },
  shipped: { label: "Spedito", color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300", icon: Truck },
  received: { label: "Ricevuto", color: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300", icon: Package },
  refunded: { label: "Rimborsato", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", icon: DollarSign },
  rejected: { label: "Rifiutato", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", icon: Ban },
  cancelled: { label: "Annullato", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
};

const REASON_LABELS: Record<string, string> = {
  defective: "Prodotto difettoso",
  wrong_item: "Articolo sbagliato",
  damaged: "Danneggiato",
  not_as_described: "Non conforme",
  excess_stock: "Eccedenza stock",
  other: "Altro",
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy", { locale: it });
}

export default function SupplierReturnsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSupplier, setFilterSupplier] = useState<string>("all");
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SupplierReturnWithDetails | null>(null);
  
  // Queries
  const { data: returns = [], isLoading } = useQuery<SupplierReturnWithDetails[]>({
    queryKey: ["/api/supplier-returns"],
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  const { data: supplierOrders = [] } = useQuery<SupplierOrder[]>({
    queryKey: ["/api/supplier-orders"],
  });

  // Mutations
  const createReturnMutation = useMutation({
    mutationFn: async (data: Partial<SupplierReturn>) => {
      return apiRequest("POST", "/api/supplier-returns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      setCreateDialogOpen(false);
      toast({ title: "Reso creato", description: "Nuova richiesta reso creata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateReturnMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SupplierReturn> }) => {
      return apiRequest("PATCH", `/api/supplier-returns/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      toast({ title: "Reso aggiornato", description: "Modifiche salvate con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteReturnMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/supplier-returns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/supplier-returns"] });
      setDetailsDialogOpen(false);
      setSelectedReturn(null);
      toast({ title: "Reso eliminato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Handlers
  const handleCreateReturn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const supplierId = formData.get("supplierId") as string;
    const repairCenterId = formData.get("repairCenterId") as string;
    const supplierOrderIdRaw = formData.get("supplierOrderId") as string;
    const supplierOrderId = supplierOrderIdRaw && supplierOrderIdRaw !== "__none__" ? supplierOrderIdRaw : undefined;
    const reason = formData.get("reason") as string;
    const reasonDetails = formData.get("reasonDetails") as string;
    const totalAmount = Math.round(parseFloat(formData.get("totalAmount") as string || "0") * 100);
    
    if (!supplierId || !repairCenterId || !reason) {
      toast({ title: "Errore", description: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    
    await createReturnMutation.mutateAsync({
      supplierId,
      repairCenterId,
      supplierOrderId,
      reason: reason as any,
      reasonDetails: reasonDetails || undefined,
      totalAmount,
    });
  };

  const handleStatusChange = async (returnId: string, newStatus: string) => {
    const now = new Date().toISOString();
    const updates: Partial<SupplierReturn> = { status: newStatus as any };
    
    // Set timestamps based on status
    if (newStatus === "requested") updates.requestedAt = now as any;
    if (newStatus === "approved") updates.approvedAt = now as any;
    if (newStatus === "shipped") updates.shippedAt = now as any;
    if (newStatus === "received") updates.receivedAt = now as any;
    if (newStatus === "refunded") updates.refundedAt = now as any;
    
    await updateReturnMutation.mutateAsync({ id: returnId, data: updates });
  };

  const openReturnDetails = (returnItem: SupplierReturnWithDetails) => {
    setSelectedReturn(returnItem);
    setDetailsDialogOpen(true);
  };

  // Filter returns
  const filteredReturns = returns.filter(ret => {
    const matchesSearch = searchTerm === "" || 
      ret.returnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.rmaNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || ret.status === filterStatus;
    const matchesSupplier = filterSupplier === "all" || ret.supplierId === filterSupplier;
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Resi Fornitori</h1>
          <p className="text-muted-foreground text-sm">
            Gestisci i resi e i rimborsi verso i fornitori
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-return">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Reso
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca reso..."
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

      {/* Returns List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Lista Resi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nessun reso trovato</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crea un nuovo reso per iniziare
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Valore</TableHead>
                  <TableHead>RMA</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map(ret => {
                  const statusConfig = STATUS_CONFIG[ret.status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusConfig.icon;
                  const supplier = suppliers.find(s => s.id === ret.supplierId);
                  const center = repairCenters.find(c => c.id === ret.repairCenterId);
                  
                  return (
                    <TableRow 
                      key={ret.id} 
                      className="cursor-pointer hover-elevate"
                      onClick={() => openReturnDetails(ret)}
                      data-testid={`row-return-${ret.id}`}
                    >
                      <TableCell className="font-medium">
                        {ret.returnNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {supplier?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{center?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {REASON_LABELS[ret.reason] || ret.reason}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(ret.totalAmount)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ret.rmaNumber || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(ret.createdAt)}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-menu-${ret.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openReturnDetails(ret)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Dettagli
                            </DropdownMenuItem>
                            {ret.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "requested")}>
                                <Send className="h-4 w-4 mr-2" />
                                Invia richiesta
                              </DropdownMenuItem>
                            )}
                            {ret.status === "requested" && (
                              <>
                                <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "approved")}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Segna approvato
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "rejected")}>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Segna rifiutato
                                </DropdownMenuItem>
                              </>
                            )}
                            {ret.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "shipped")}>
                                <Truck className="h-4 w-4 mr-2" />
                                Segna spedito
                              </DropdownMenuItem>
                            )}
                            {ret.status === "shipped" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "received")}>
                                <Package className="h-4 w-4 mr-2" />
                                Segna ricevuto
                              </DropdownMenuItem>
                            )}
                            {ret.status === "received" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(ret.id, "refunded")}>
                                <DollarSign className="h-4 w-4 mr-2" />
                                Segna rimborsato
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {ret.status === "draft" && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Eliminare questo reso?")) {
                                    deleteReturnMutation.mutate(ret.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            )}
                            {ret.status !== "draft" && ret.status !== "cancelled" && ret.status !== "refunded" && ret.status !== "rejected" && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleStatusChange(ret.id, "cancelled")}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Annulla reso
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

      {/* Create Return Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuova Richiesta Reso</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReturn} className="space-y-4">
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
              <Label htmlFor="supplierOrderId">Ordine Originale (opzionale)</Label>
              <Select name="supplierOrderId">
                <SelectTrigger data-testid="select-new-order">
                  <SelectValue placeholder="Collega a un ordine..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nessun ordine collegato</SelectItem>
                  {supplierOrders
                    .filter(o => o.status === "received" || o.status === "partially_received")
                    .map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.orderNumber}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo Reso *</Label>
              <Select name="reason">
                <SelectTrigger data-testid="select-reason">
                  <SelectValue placeholder="Seleziona motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reasonDetails">Dettagli Motivo</Label>
              <Textarea
                id="reasonDetails"
                name="reasonDetails"
                placeholder="Descrivi il problema in dettaglio..."
                className="resize-none"
                rows={3}
                data-testid="textarea-reason"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Valore Reso (€)</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                data-testid="input-total"
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
                disabled={createReturnMutation.isPending}
                data-testid="button-submit-return"
              >
                {createReturnMutation.isPending ? "Creazione..." : "Crea Reso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          {selectedReturn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Reso {selectedReturn.returnNumber}</span>
                  <Badge className={STATUS_CONFIG[selectedReturn.status]?.color}>
                    {STATUS_CONFIG[selectedReturn.status]?.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[calc(90vh-120px)]">
                <Tabs defaultValue="info" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="info">Informazioni</TabsTrigger>
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Fornitore</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {suppliers.find(s => s.id === selectedReturn.supplierId)?.name || "-"}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Centro Riparazione</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {repairCenters.find(c => c.id === selectedReturn.repairCenterId)?.name || "-"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Motivo Reso</Label>
                        <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          {REASON_LABELS[selectedReturn.reason] || selectedReturn.reason}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ordine Originale</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {selectedReturn.supplierOrderId 
                            ? supplierOrders.find(o => o.id === selectedReturn.supplierOrderId)?.orderNumber
                            : "Nessuno"}
                        </div>
                      </div>
                    </div>
                    
                    {selectedReturn.reasonDetails && (
                      <div className="space-y-2">
                        <Label>Dettagli Motivo</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {selectedReturn.reasonDetails}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Valore Reso</Label>
                        <div className="p-3 bg-muted rounded-md text-lg font-bold">
                          {formatCurrency(selectedReturn.totalAmount)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Importo Rimborsato</Label>
                        <div className="p-3 bg-muted rounded-md text-lg font-bold text-green-600">
                          {selectedReturn.refundAmount != null 
                            ? formatCurrency(selectedReturn.refundAmount) 
                            : "-"}
                        </div>
                      </div>
                    </div>

                    {selectedReturn.status === "received" && (
                      <div className="space-y-2">
                        <Label htmlFor="refundAmount">Importo Rimborso (€)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="refundAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={selectedReturn.refundAmount ? (selectedReturn.refundAmount / 100).toFixed(2) : ""}
                            placeholder={(selectedReturn.totalAmount / 100).toFixed(2)}
                            data-testid="input-refund"
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById("refundAmount") as HTMLInputElement;
                              const refundAmount = Math.round(parseFloat(input.value || "0") * 100);
                              updateReturnMutation.mutate({
                                id: selectedReturn.id,
                                data: { refundAmount }
                              });
                            }}
                          >
                            Salva
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <Label>Creato il</Label>
                        <div>{formatDate(selectedReturn.createdAt)}</div>
                      </div>
                      {selectedReturn.requestedAt && (
                        <div className="space-y-2">
                          <Label>Richiesta il</Label>
                          <div>{formatDate(selectedReturn.requestedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.approvedAt && (
                        <div className="space-y-2">
                          <Label>Approvato il</Label>
                          <div>{formatDate(selectedReturn.approvedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.shippedAt && (
                        <div className="space-y-2">
                          <Label>Spedito il</Label>
                          <div>{formatDate(selectedReturn.shippedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.receivedAt && (
                        <div className="space-y-2">
                          <Label>Ricevuto il</Label>
                          <div>{formatDate(selectedReturn.receivedAt)}</div>
                        </div>
                      )}
                      {selectedReturn.refundedAt && (
                        <div className="space-y-2">
                          <Label>Rimborsato il</Label>
                          <div>{formatDate(selectedReturn.refundedAt)}</div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tracking" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rmaNumber">Numero RMA</Label>
                      <Input
                        id="rmaNumber"
                        defaultValue={selectedReturn.rmaNumber || ""}
                        placeholder="Numero autorizzazione reso fornitore"
                        onBlur={(e) => {
                          updateReturnMutation.mutate({
                            id: selectedReturn.id,
                            data: { rmaNumber: e.target.value || null }
                          });
                        }}
                        data-testid="input-rma"
                      />
                      <p className="text-xs text-muted-foreground">
                        Numero di autorizzazione al reso fornito dal fornitore
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trackingCarrier">Corriere</Label>
                        <Input
                          id="trackingCarrier"
                          defaultValue={selectedReturn.trackingCarrier || ""}
                          placeholder="Es: DHL, BRT, SDA..."
                          onBlur={(e) => {
                            updateReturnMutation.mutate({
                              id: selectedReturn.id,
                              data: { trackingCarrier: e.target.value || null }
                            });
                          }}
                          data-testid="input-carrier"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trackingNumber">Numero Tracking</Label>
                        <Input
                          id="trackingNumber"
                          defaultValue={selectedReturn.trackingNumber || ""}
                          placeholder="Inserisci numero di tracking..."
                          onBlur={(e) => {
                            updateReturnMutation.mutate({
                              id: selectedReturn.id,
                              data: { trackingNumber: e.target.value || null }
                            });
                          }}
                          data-testid="input-tracking"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
