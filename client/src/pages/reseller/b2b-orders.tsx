import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ResellerPurchaseOrder, ResellerPurchaseOrderItem, Product, B2bReturn } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ShoppingBag, Clock, CheckCircle, XCircle, Truck, PackageCheck, Eye, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useLocation } from "wouter";

interface B2BOrderWithItems extends ResellerPurchaseOrder {
  items: (ResellerPurchaseOrderItem & { product?: Product })[];
  returns?: B2bReturn[];
}

const returnStatusLabels: Record<string, string> = {
  requested: "Richiesto",
  approved: "Approvato",
  rejected: "Rifiutato",
  awaiting_shipment: "In attesa spedizione",
  shipped: "Spedito",
  received: "Ricevuto",
  inspecting: "In ispezione",
  completed: "Completato",
  cancelled: "Annullato",
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
  draft: { label: "Bozza", variant: "outline", icon: Clock },
  pending: { label: "In Attesa", variant: "secondary", icon: Clock },
  approved: { label: "Approvato", variant: "default", icon: CheckCircle },
  rejected: { label: "Rifiutato", variant: "destructive", icon: XCircle },
  shipped: { label: "Spedito", variant: "default", icon: Truck },
  received: { label: "Ricevuto", variant: "default", icon: PackageCheck },
  cancelled: { label: "Annullato", variant: "destructive", icon: XCircle },
};

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "Bonifico Bancario",
  stripe: "Stripe",
  credit: "Credito Reseller",
};

const returnReasons: Record<string, string> = {
  defective: "Difettoso",
  wrong_item: "Articolo errato",
  not_as_described: "Non conforme alla descrizione",
  damaged_in_transit: "Danneggiato in transito",
  excess_stock: "Eccesso di stock",
  quality_issue: "Problema qualità",
  other: "Altro",
};

export default function ResellerB2BOrders() {
  const [selectedOrder, setSelectedOrder] = useState<B2BOrderWithItems | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState<string>("");
  const [returnReasonDetails, setReturnReasonDetails] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: orders, isLoading } = useQuery<B2BOrderWithItems[]>({
    queryKey: ['/api/reseller/b2b-orders'],
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest('POST', `/api/reseller/b2b-orders/${orderId}/receive`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ricezione confermata", description: "L'ordine è stato segnato come ricevuto" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/b2b-orders'] });
      setDetailOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: async (data: { orderId: string; reason: string; reasonDetails?: string; resellerNotes?: string; items: any[] }) => {
      const res = await apiRequest('POST', '/api/reseller/b2b-returns', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Richiesta reso inviata", description: "La tua richiesta di reso è stata inviata all'admin" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/b2b-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/b2b-returns'] });
      setReturnDialogOpen(false);
      setDetailOpen(false);
      resetReturnForm();
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const resetReturnForm = () => {
    setReturnReason("");
    setReturnReasonDetails("");
    setReturnNotes("");
    setSelectedItems({});
  };

  const openReturnDialog = () => {
    if (selectedOrder) {
      const initialItems: Record<string, number> = {};
      selectedOrder.items?.forEach(item => {
        initialItems[item.id] = item.quantity || 0;
      });
      setSelectedItems(initialItems);
      setReturnDialogOpen(true);
    }
  };

  const handleSubmitReturn = () => {
    if (!selectedOrder || !returnReason) return;
    
    const items = selectedOrder.items
      ?.filter(item => (selectedItems[item.id] || 0) > 0)
      .map(item => ({
        orderItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        quantity: selectedItems[item.id],
        unitPrice: item.unitPrice,
      }));

    if (!items || items.length === 0) {
      toast({ title: "Errore", description: "Seleziona almeno un articolo da rendere", variant: "destructive" });
      return;
    }

    createReturnMutation.mutate({
      orderId: selectedOrder.id,
      reason: returnReason,
      reasonDetails: returnReasonDetails || undefined,
      resellerNotes: returnNotes || undefined,
      items,
    });
  };

  const openDetail = (order: B2BOrderWithItems) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const activeOrders = orders?.filter(o => ['approved', 'shipped'].includes(o.status)) || [];
  const completedOrders = orders?.filter(o => ['received', 'cancelled', 'rejected'].includes(o.status)) || [];

  const OrderCard = ({ order }: { order: B2BOrderWithItems }) => {
    const status = statusConfig[order.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const hasActiveReturn = order.returns?.some(r => 
      ['requested', 'approved', 'awaiting_shipment', 'shipped', 'inspecting'].includes(r.status)
    );
    const hasCompletedReturn = order.returns?.some(r => r.status === 'completed');
    
    return (
      <Card className="hover-elevate cursor-pointer" onClick={() => openDetail(order)} data-testid={`card-order-${order.id}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{order.orderNumber}</CardTitle>
              <CardDescription>
                {order.createdAt && format(new Date(order.createdAt), "d MMMM yyyy", { locale: it })}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant={status.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
              {hasActiveReturn && (
                <Badge variant="outline" className="flex items-center gap-1 text-orange-600 border-orange-300">
                  <RotateCcw className="h-3 w-3" />
                  Reso in corso
                </Badge>
              )}
              {hasCompletedReturn && !hasActiveReturn && (
                <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-300">
                  <CheckCircle className="h-3 w-3" />
                  Reso completato
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Articoli:</span>
            <span>{order.items?.length || 0} prodotti</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Pagamento:</span>
            <span>{paymentMethodLabels[order.paymentMethod || 'bank_transfer']}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <span className="font-semibold text-primary">{formatPrice(order.total || 0)}</span>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Dettagli
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          I Miei Ordini B2B
        </h1>
        <p className="text-muted-foreground">Gestisci i tuoi ordini di acquisto dal magazzino centrale</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            In Attesa ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            In Corso ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completati ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun ordine in attesa di approvazione</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun ordine in corso</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PackageCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nessun ordine completato</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedOrders.map(order => <OrderCard key={order.id} order={order} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Ordine {selectedOrder.orderNumber}</DialogTitle>
                    <DialogDescription>
                      Creato il {selectedOrder.createdAt && format(new Date(selectedOrder.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                    </DialogDescription>
                  </div>
                  <Badge variant={statusConfig[selectedOrder.status]?.variant || "secondary"}>
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-64">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prodotto</TableHead>
                      <TableHead className="text-right">Prezzo</TableHead>
                      <TableHead className="text-right">Qtà</TableHead>
                      <TableHead className="text-right">Totale</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                            ) : (
                              <Package className="w-8 h-8 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              {item.productSku && <div className="text-sm text-muted-foreground">{item.productSku}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(item.unitPrice || 0)}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right font-medium">{formatPrice(item.totalPrice || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotale:</span>
                  <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                </div>
                {(selectedOrder.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Sconto:</span>
                    <span>-{formatPrice(selectedOrder.discountAmount || 0)}</span>
                  </div>
                )}
                {(selectedOrder.shippingCost || 0) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Spedizione:</span>
                    <span>{formatPrice(selectedOrder.shippingCost || 0)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Totale:</span>
                  <span className="text-primary">{formatPrice(selectedOrder.total || 0)}</span>
                </div>
              </div>

              {selectedOrder.resellerNotes && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">Le tue note:</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.resellerNotes}</p>
                </div>
              )}

              {selectedOrder.adminNotes && (
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                  <p className="text-sm font-medium">Note amministratore:</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.adminNotes}</p>
                </div>
              )}

              {selectedOrder.rejectionReason && (
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <p className="text-sm font-medium text-destructive">Motivo rifiuto:</p>
                  <p className="text-sm">{selectedOrder.rejectionReason}</p>
                </div>
              )}

              {selectedOrder.trackingNumber && (
                <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
                  <p className="text-sm font-medium">Tracking spedizione:</p>
                  <p className="text-sm">
                    {selectedOrder.trackingCarrier && <span className="text-muted-foreground">{selectedOrder.trackingCarrier}: </span>}
                    {selectedOrder.trackingNumber}
                  </p>
                </div>
              )}

              {/* Sezione Resi Collegati */}
              {selectedOrder.returns && selectedOrder.returns.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950/30 p-3 rounded-lg space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Resi per questo ordine
                  </p>
                  {selectedOrder.returns.map((ret) => (
                    <div 
                      key={ret.id} 
                      className="flex items-center justify-between bg-background/50 p-2 rounded cursor-pointer hover:bg-background/80"
                      onClick={() => navigate(`/reseller/b2b-returns`)}
                      data-testid={`return-link-${ret.id}`}
                    >
                      <div>
                        <span className="font-medium text-sm">{ret.returnNumber}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {ret.requestedAt && format(new Date(ret.requestedAt), "d MMM yyyy", { locale: it })}
                        </span>
                      </div>
                      <Badge variant={
                        ret.status === 'completed' ? 'default' :
                        ret.status === 'rejected' || ret.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      } className="text-xs">
                        {returnStatusLabels[ret.status] || ret.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Chiudi
                </Button>
                {selectedOrder.status === 'shipped' && (
                  <Button 
                    onClick={() => confirmReceiptMutation.mutate(selectedOrder.id)}
                    disabled={confirmReceiptMutation.isPending}
                    data-testid="button-confirm-receipt"
                  >
                    <PackageCheck className="h-4 w-4 mr-2" />
                    {confirmReceiptMutation.isPending ? "Conferma in corso..." : "Conferma Ricezione"}
                  </Button>
                )}
                {selectedOrder.status === 'received' && 
                 !selectedOrder.returns?.some(r => ['requested', 'approved', 'awaiting_shipment', 'shipped', 'inspecting'].includes(r.status)) && (
                  <Button 
                    variant="destructive"
                    onClick={openReturnDialog}
                    data-testid="button-request-return"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Richiedi Reso
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Request Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Richiesta Reso</DialogTitle>
            <DialogDescription>
              Ordine {selectedOrder?.orderNumber} - Seleziona gli articoli da rendere
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo del reso *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger data-testid="select-return-reason">
                  <SelectValue placeholder="Seleziona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(returnReasons).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {returnReason === 'other' && (
              <div className="space-y-2">
                <Label>Specifica il motivo</Label>
                <Textarea
                  value={returnReasonDetails}
                  onChange={(e) => setReturnReasonDetails(e.target.value)}
                  placeholder="Descrivi il motivo del reso..."
                  data-testid="input-reason-details"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Articoli da rendere</Label>
              <ScrollArea className="max-h-48 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prodotto</TableHead>
                      <TableHead className="text-right">Disponibile</TableHead>
                      <TableHead className="text-right w-32">Qtà da rendere</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder?.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.product?.imageUrl ? (
                              <img src={item.product.imageUrl} alt="" className="w-8 h-8 object-cover rounded" />
                            ) : (
                              <Package className="w-8 h-8 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium text-sm">{item.productName}</div>
                              {item.productSku && <div className="text-xs text-muted-foreground">{item.productSku}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={item.quantity || 0}
                            value={selectedItems[item.id] || 0}
                            onChange={(e) => {
                              const val = Math.min(Math.max(0, parseInt(e.target.value) || 0), item.quantity || 0);
                              setSelectedItems(prev => ({ ...prev, [item.id]: val }));
                            }}
                            className="w-20 text-right"
                            data-testid={`input-return-qty-${item.id}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="space-y-2">
              <Label>Note aggiuntive</Label>
              <Textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Inserisci eventuali note..."
                data-testid="input-return-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setReturnDialogOpen(false); resetReturnForm(); }}>
              Annulla
            </Button>
            <Button 
              onClick={handleSubmitReturn}
              disabled={!returnReason || createReturnMutation.isPending}
              data-testid="button-submit-return"
            >
              {createReturnMutation.isPending ? "Invio in corso..." : "Invia Richiesta Reso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
