import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepairCenterPurchaseOrder, RepairCenterPurchaseOrderItem, Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Package, Clock, CheckCircle, XCircle, Truck, PackageCheck, 
  Eye, Building, User as UserIcon, Store
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface RCB2BOrderWithDetails extends RepairCenterPurchaseOrder {
  items: (RepairCenterPurchaseOrderItem & { product?: Product })[];
  repairCenter: { id: string; name: string; city: string | null } | null;
  reseller: { id: string; fullName: string; email: string } | null;
}

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
  credit: "Credito",
};

export default function AdminRCB2BOrders() {
  const [selectedOrder, setSelectedOrder] = useState<RCB2BOrderWithDetails | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<RCB2BOrderWithDetails[]>({
    queryKey: ['/api/admin/rc-b2b-orders'],
  });

  const openDetail = (order: RCB2BOrderWithDetails) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const pendingOrders = orders?.filter(o => o.status === 'pending') || [];
  const approvedOrders = orders?.filter(o => o.status === 'approved') || [];
  const shippedOrders = orders?.filter(o => o.status === 'shipped') || [];
  const completedOrders = orders?.filter(o => o.status === 'received' || o.status === 'rejected' || o.status === 'cancelled') || [];

  const renderOrdersTable = (ordersList: RCB2BOrderWithDetails[]) => {
    if (ordersList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nessun ordine in questa categoria</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N. Ordine</TableHead>
              <TableHead>Centro Riparazione</TableHead>
              <TableHead>Reseller</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-center">Articoli</TableHead>
              <TableHead className="text-right">Totale</TableHead>
              <TableHead className="text-center">Pagamento</TableHead>
              <TableHead className="text-center">Stato</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersList.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              return (
                <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{order.repairCenter?.name || "N/D"}</div>
                        <div className="text-xs text-muted-foreground">{order.repairCenter?.city || ""}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{order.reseller?.fullName || "N/D"}</div>
                        <div className="text-xs text-muted-foreground">{order.reseller?.email || ""}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.createdAt ? format(new Date(order.createdAt), "dd MMM yyyy", { locale: it }) : "N/D"}
                  </TableCell>
                  <TableCell className="text-center">{order.items?.length || 0}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {order.paymentMethod ? (paymentMethodLabels[order.paymentMethod] || order.paymentMethod) : "N/D"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={status.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openDetail(order)} data-testid={`button-view-${order.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Dettagli
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Ordini B2B Centri Riparazione</h1>
            <p className="text-muted-foreground">Visualizza gli ordini dei centri di riparazione (sola lettura)</p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {orders?.length || 0} Ordini
        </Badge>
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
                <p className="text-2xl font-bold">{pendingOrders.length}</p>
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
                <p className="text-2xl font-bold">{approvedOrders.length}</p>
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
                <p className="text-2xl font-bold">{shippedOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <PackageCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati</p>
                <p className="text-2xl font-bold">{completedOrders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Elenco Ordini</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  <Clock className="h-4 w-4 mr-2" />
                  In Attesa ({pendingOrders.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approvati ({approvedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="shipped">
                  <Truck className="h-4 w-4 mr-2" />
                  Spediti ({shippedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  <PackageCheck className="h-4 w-4 mr-2" />
                  Completati ({completedOrders.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="pending">{renderOrdersTable(pendingOrders)}</TabsContent>
              <TabsContent value="approved">{renderOrdersTable(approvedOrders)}</TabsContent>
              <TabsContent value="shipped">{renderOrdersTable(shippedOrders)}</TabsContent>
              <TabsContent value="completed">{renderOrdersTable(completedOrders)}</TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ordine {selectedOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>
              Dettaglio ordine B2B centro riparazione (sola lettura)
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Centro Riparazione</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4" />
                      <span className="font-medium">{selectedOrder.repairCenter?.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedOrder.repairCenter?.city}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reseller Fornitore</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Store className="h-4 w-4" />
                      <span className="font-medium">{selectedOrder.reseller?.fullName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedOrder.reseller?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Data Ordine</Label>
                    <p className="font-medium">
                      {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "dd MMMM yyyy, HH:mm", { locale: it }) : "N/D"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Stato</Label>
                    <div className="mt-1">
                      <Badge variant={statusConfig[selectedOrder.status]?.variant || "outline"}>
                        {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Metodo Pagamento</Label>
                    <p className="font-medium">{selectedOrder.paymentMethod ? (paymentMethodLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod) : "N/D"}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.trackingNumber && (
                <div>
                  <Label className="text-muted-foreground">Tracking Spedizione</Label>
                  <p className="font-medium">{selectedOrder.carrier}: {selectedOrder.trackingNumber}</p>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground mb-2 block">Articoli Ordinati</Label>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prodotto</TableHead>
                        <TableHead className="text-center">Quantità</TableHead>
                        <TableHead className="text-right">Prezzo Unit.</TableHead>
                        <TableHead className="text-right">Totale</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-xs text-muted-foreground">{item.productSku}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatPrice(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{formatPrice(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">Totale Ordine</TableCell>
                        <TableCell className="text-right font-bold text-lg">{formatPrice(selectedOrder.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <Label className="text-muted-foreground">Note Centro Riparazione</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
