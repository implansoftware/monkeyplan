import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, Search, Package, FileText, Truck, Clock, CheckCircle, XCircle, Plus, AlertCircle, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RcB2bReturn, RepairCenterPurchaseOrder, RepairCenterPurchaseOrderItem } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type ReturnWithItems = RcB2bReturn & {
  items?: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    returnReason?: string | null;
    condition?: string | null;
  }>;
};

const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  requested: { label: "Richiesto", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", icon: Clock },
  approved: { label: "Approvato", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", icon: CheckCircle },
  awaiting_shipment: { label: "In attesa spedizione", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400", icon: Package },
  shipped: { label: "Spedito", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400", icon: Truck },
  received: { label: "Ricevuto", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400", icon: Package },
  inspecting: { label: "In ispezione", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400", icon: Search },
  completed: { label: "Completato", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", icon: CheckCircle },
  rejected: { label: "Rifiutato", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", icon: XCircle },
  cancelled: { label: "Annullato", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400", icon: XCircle },
};

const reasonLabels: Record<string, string> = {
  defective: "Prodotto difettoso",
  wrong_item: "Articolo errato",
  damaged: "Danneggiato",
  not_as_described: "Non conforme alla descrizione",
  excess_quantity: "Quantità in eccesso",
  other: "Altro",
};

export default function RepairCenterB2BReturns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnWithItems | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: returns = [], isLoading } = useQuery<RcB2bReturn[]>({
    queryKey: ["/api/repair-center/b2b-returns"],
  });

  const { data: orders = [] } = useQuery<RepairCenterPurchaseOrder[]>({
    queryKey: ["/api/repair-center/b2b-orders"],
  });

  const receivedOrders = orders.filter(o => o.status === 'received');

  const { data: returnDetail } = useQuery<ReturnWithItems>({
    queryKey: ["/api/repair-center/b2b-returns", selectedReturn?.id],
    enabled: !!selectedReturn?.id,
  });

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = !searchQuery || 
      ret.returnNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ret.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/D";
    return format(new Date(date), "dd MMM yyyy", { locale: it });
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents && cents !== 0) return "N/D";
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents);
  };

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
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">I Miei Resi B2B</h1>
              <p className="text-sm text-muted-foreground">Gestisci i resi dei tuoi ordini B2B</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {returns.length} Resi
            </Badge>
            <Button 
              className="shadow-lg shadow-primary/25"
              onClick={() => setCreateDialogOpen(true)}
              disabled={receivedOrders.length === 0}
              data-testid="button-create-return"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Reso
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Attesa</p>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'requested').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approvati</p>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'approved' || r.status === 'awaiting_shipment').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <Truck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Spediti</p>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'shipped').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati</p>
                <p className="text-2xl font-bold">{returns.filter(r => r.status === 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <CardTitle className="text-lg">Elenco Resi</CardTitle>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="requested">Richiesti</SelectItem>
                  <SelectItem value="approved">Approvati</SelectItem>
                  <SelectItem value="shipped">Spediti</SelectItem>
                  <SelectItem value="completed">Completati</SelectItem>
                  <SelectItem value="rejected">Rifiutati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessun reso trovato</p>
              {returns.length === 0 && (
                <p className="text-sm mt-2">Crea un nuovo reso da un ordine ricevuto</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero Reso</TableHead>
                    <TableHead>Data Richiesta</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                    <TableHead className="text-center">Stato</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map(ret => {
                    const status = statusLabels[ret.status] || statusLabels.requested;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={ret.id} data-testid={`row-return-${ret.id}`}>
                        <TableCell className="font-medium">{ret.returnNumber}</TableCell>
                        <TableCell>{formatDate(ret.requestedAt)}</TableCell>
                        <TableCell>{reasonLabels[ret.reason] || ret.reason}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(ret.totalAmount)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setSelectedReturn(ret);
                                setDetailDialogOpen(true);
                              }}
                              data-testid={`button-view-${ret.id}`}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Dettagli
                            </Button>
                            {(ret.status === 'approved' || ret.status === 'awaiting_shipment') && (
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setSelectedReturn(ret);
                                  setShipDialogOpen(true);
                                }}
                                data-testid={`button-ship-${ret.id}`}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Spedisci
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Dettaglio Reso {selectedReturn?.returnNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Stato</Label>
                  <Badge className={statusLabels[selectedReturn.status]?.color || ""}>
                    {statusLabels[selectedReturn.status]?.label || selectedReturn.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Motivo</Label>
                  <p className="font-medium">{reasonLabels[selectedReturn.reason] || selectedReturn.reason}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data Richiesta</Label>
                  <p className="font-medium">{formatDate(selectedReturn.requestedAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Importo Totale</Label>
                  <p className="font-medium text-lg">{formatCurrency(selectedReturn.totalAmount)}</p>
                </div>
                {selectedReturn.trackingNumber && (
                  <div>
                    <Label className="text-muted-foreground">Tracking</Label>
                    <p className="font-medium">{selectedReturn.carrier}: {selectedReturn.trackingNumber}</p>
                  </div>
                )}
                {selectedReturn.creditAmount && (
                  <div>
                    <Label className="text-muted-foreground">Credito Accreditato</Label>
                    <p className="font-medium text-green-600">{formatCurrency(selectedReturn.creditAmount)}</p>
                  </div>
                )}
              </div>
              
              {selectedReturn.reasonDetails && (
                <div>
                  <Label className="text-muted-foreground">Dettagli Motivo</Label>
                  <p className="mt-1">{selectedReturn.reasonDetails}</p>
                </div>
              )}

              {selectedReturn.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg">
                  <Label className="text-red-600">Motivo Rifiuto</Label>
                  <p className="mt-1 text-red-600">{selectedReturn.rejectionReason}</p>
                </div>
              )}

              {returnDetail?.items && returnDetail.items.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Articoli</Label>
                  <div className="mt-2 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prodotto</TableHead>
                          <TableHead className="text-center">Qtà</TableHead>
                          <TableHead className="text-right">Prezzo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnDetail.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShipReturnDialog 
        open={shipDialogOpen}
        onClose={() => setShipDialogOpen(false)}
        returnDoc={selectedReturn}
      />

      <CreateReturnDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        orders={receivedOrders}
      />
    </div>
  );
}

function ShipReturnDialog({ open, onClose, returnDoc }: { 
  open: boolean; 
  onClose: () => void; 
  returnDoc: RcB2bReturn | null;
}) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const { toast } = useToast();

  const shipMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/repair-center/b2b-returns/${returnDoc?.id}/ship`, {
        trackingNumber,
        carrier,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/b2b-returns"] });
      toast({ title: "Reso spedito", description: "La spedizione è stata registrata" });
      onClose();
      setTrackingNumber("");
      setCarrier("");
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registra Spedizione Reso</DialogTitle>
          <DialogDescription>
            Inserisci i dati di spedizione per il reso {returnDoc?.returnNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Corriere</Label>
            <Input 
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Es: BRT, DHL, GLS..."
              data-testid="input-carrier"
            />
          </div>
          <div>
            <Label>Numero Tracking</Label>
            <Input 
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Inserisci il codice tracking"
              data-testid="input-tracking"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button 
            onClick={() => shipMutation.mutate()}
            disabled={!trackingNumber || !carrier || shipMutation.isPending}
            data-testid="button-confirm-ship"
          >
            <Send className="h-4 w-4 mr-2" />
            {shipMutation.isPending ? "Invio..." : "Conferma Spedizione"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateReturnDialog({ open, onClose, orders }: {
  open: boolean;
  onClose: () => void;
  orders: RepairCenterPurchaseOrder[];
}) {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [reasonDetails, setReasonDetails] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const { data: orderItems = [] } = useQuery<RepairCenterPurchaseOrderItem[]>({
    queryKey: ["/api/repair-center/b2b-orders", selectedOrderId, "items"],
    enabled: !!selectedOrderId,
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; selected: boolean }>>({});

  const createMutation = useMutation({
    mutationFn: async () => {
      const items = orderItems
        .filter(item => selectedItems[item.id]?.selected && selectedItems[item.id]?.quantity > 0)
        .map(item => ({
          orderItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: selectedItems[item.id].quantity,
          unitPrice: item.unitPrice / 100,
        }));

      if (items.length === 0) {
        throw new Error("Seleziona almeno un articolo");
      }

      return apiRequest("POST", "/api/repair-center/b2b-returns", {
        orderId: selectedOrderId,
        reason,
        reasonDetails,
        repairCenterNotes: notes,
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/b2b-returns"] });
      toast({ title: "Reso creato", description: "La richiesta di reso è stata inviata" });
      onClose();
      setSelectedOrderId("");
      setReason("");
      setReasonDetails("");
      setNotes("");
      setSelectedItems({});
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuova Richiesta di Reso</DialogTitle>
          <DialogDescription>
            Seleziona l'ordine e gli articoli da rendere
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Ordine</Label>
            <Select value={selectedOrderId} onValueChange={(v) => {
              setSelectedOrderId(v);
              setSelectedItems({});
            }}>
              <SelectTrigger data-testid="select-order">
                <SelectValue placeholder="Seleziona ordine" />
              </SelectTrigger>
              <SelectContent>
                {orders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.orderNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Motivo del Reso</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="select-reason">
                <SelectValue placeholder="Seleziona motivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reasonLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Descrizione Problema</Label>
            <Textarea 
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Descrivi il problema..."
              data-testid="input-reason-details"
            />
          </div>

          {orderItems.length > 0 && (
            <div>
              <Label>Articoli da Rendere</Label>
              <div className="border rounded-lg mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Sel.</TableHead>
                      <TableHead>Prodotto</TableHead>
                      <TableHead className="text-center">Ord.</TableHead>
                      <TableHead className="text-center">Qtà Reso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input 
                            type="checkbox"
                            checked={selectedItems[item.id]?.selected || false}
                            onChange={(e) => setSelectedItems(prev => ({
                              ...prev,
                              [item.id]: { 
                                selected: e.target.checked, 
                                quantity: e.target.checked ? item.quantity : 0 
                              }
                            }))}
                          />
                        </TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Input 
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={selectedItems[item.id]?.quantity || ""}
                            onChange={(e) => setSelectedItems(prev => ({
                              ...prev,
                              [item.id]: { 
                                ...prev[item.id],
                                quantity: parseInt(e.target.value) || 0 
                              }
                            }))}
                            className="w-20 text-center"
                            disabled={!selectedItems[item.id]?.selected}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button 
            onClick={() => createMutation.mutate()}
            disabled={!selectedOrderId || !reason || createMutation.isPending}
            data-testid="button-create-return"
          >
            {createMutation.isPending ? "Invio..." : "Invia Richiesta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
