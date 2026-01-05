import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, Play, Calendar, Eye, Clock, User } from "lucide-react";
import type { ServiceOrder, RepairCenter } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type ServiceOrderWithDetails = ServiceOrder & {
  customerName: string;
  serviceName: string;
  serviceCode: string;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In attesa", variant: "secondary" },
  accepted: { label: "Accettato", variant: "default" },
  scheduled: { label: "Programmato", variant: "outline" },
  in_progress: { label: "In lavorazione", variant: "default" },
  completed: { label: "Completato", variant: "default" },
  cancelled: { label: "Annullato", variant: "destructive" },
};

export default function ResellerServiceOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const [acceptForm, setAcceptForm] = useState({
    scheduledAt: "",
    repairCenterId: "",
    internalNotes: "",
  });

  const { data: orders, isLoading } = useQuery<ServiceOrderWithDetails[]>({
    queryKey: ["/api/reseller/service-orders"],
  });

  const { data: repairCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/reseller/service-orders/${orderId}/accept`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-orders"] });
      setIsAcceptDialogOpen(false);
      setSelectedOrder(null);
      setAcceptForm({ scheduledAt: "", repairCenterId: "", internalNotes: "" });
      toast({ title: "Ordine accettato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const startMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/reseller/service-orders/${orderId}/start`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-orders"] });
      toast({ title: "Lavorazione avviata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ orderId, internalNotes }: { orderId: string; internalNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/reseller/service-orders/${orderId}/complete`, { internalNotes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-orders"] });
      toast({ title: "Ordine completato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ orderId, internalNotes }: { orderId: string; internalNotes?: string }) => {
      const res = await apiRequest("PATCH", `/api/reseller/service-orders/${orderId}/cancel`, { internalNotes });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-orders"] });
      toast({ title: "Ordine annullato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
  };

  const filterOrdersByTab = (tab: string) => {
    if (!orders) return [];
    switch (tab) {
      case "pending":
        return orders.filter(o => o.status === "pending");
      case "active":
        return orders.filter(o => ["accepted", "scheduled", "in_progress"].includes(o.status));
      case "completed":
        return orders.filter(o => o.status === "completed");
      case "cancelled":
        return orders.filter(o => o.status === "cancelled");
      default:
        return orders;
    }
  };

  const handleAccept = (order: ServiceOrderWithDetails) => {
    setSelectedOrder(order);
    setIsAcceptDialogOpen(true);
  };

  const handleSubmitAccept = () => {
    if (!selectedOrder) return;
    acceptMutation.mutate({
      orderId: selectedOrder.id,
      data: {
        scheduledAt: acceptForm.scheduledAt || undefined,
        repairCenterId: acceptForm.repairCenterId || undefined,
        internalNotes: acceptForm.internalNotes || undefined,
      },
    });
  };

  const pendingCount = orders?.filter(o => o.status === "pending").length || 0;
  const activeCount = orders?.filter(o => ["accepted", "scheduled", "in_progress"].includes(o.status)).length || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Ordini Servizi</h1>
          <p className="text-muted-foreground">Gestisci le richieste di intervento dai tuoi clienti</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            In Attesa
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-2">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="tab-active">
            In Corso
            {activeCount > 0 && (
              <Badge variant="outline" className="ml-2">{activeCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completati</TabsTrigger>
          <TabsTrigger value="cancelled" data-testid="tab-cancelled">Annullati</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filterOrdersByTab(activeTab).length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nessun ordine in questa sezione
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servizio</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterOrdersByTab(activeTab).map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {order.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.serviceName}</p>
                          <p className="text-xs text-muted-foreground">{order.serviceCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.brand && order.model ? (
                          `${order.brand} ${order.model}`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(order.priceCents)}</TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "dd/MM/yy HH:mm", { locale: it })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[order.status]?.variant || "outline"}>
                          {statusLabels[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailOpen(true);
                            }}
                            data-testid={`button-view-${order.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {order.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAccept(order)}
                                data-testid={`button-accept-${order.id}`}
                              >
                                <Check className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => cancelMutation.mutate({ orderId: order.id })}
                                disabled={cancelMutation.isPending}
                                data-testid={`button-reject-${order.id}`}
                              >
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}

                          {(order.status === "accepted" || order.status === "scheduled") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startMutation.mutate(order.id)}
                              disabled={startMutation.isPending}
                              data-testid={`button-start-${order.id}`}
                            >
                              <Play className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}

                          {order.status === "in_progress" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => completeMutation.mutate({ orderId: order.id })}
                              disabled={completeMutation.isPending}
                              data-testid={`button-complete-${order.id}`}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettaglio Ordine</DialogTitle>
            <DialogDescription>{selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stato</p>
                  <Badge variant={statusLabels[selectedOrder.status]?.variant || "outline"}>
                    {statusLabels[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Servizio</p>
                  <p className="font-medium">{selectedOrder.serviceName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Importo</p>
                  <p className="font-medium">{formatPrice(selectedOrder.priceCents)}</p>
                </div>
                {selectedOrder.brand && (
                  <div>
                    <p className="text-muted-foreground">Dispositivo</p>
                    <p className="font-medium">{selectedOrder.brand} {selectedOrder.model}</p>
                  </div>
                )}
                {selectedOrder.imei && (
                  <div>
                    <p className="text-muted-foreground">IMEI</p>
                    <p className="font-medium">{selectedOrder.imei}</p>
                  </div>
                )}
                {selectedOrder.scheduledAt && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Appuntamento</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedOrder.scheduledAt), "dd MMM yyyy HH:mm", { locale: it })}
                    </p>
                  </div>
                )}
              </div>

              {selectedOrder.issueDescription && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Problema Segnalato</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedOrder.issueDescription}</p>
                </div>
              )}

              {selectedOrder.customerNotes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Note Cliente</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedOrder.customerNotes}</p>
                </div>
              )}

              {selectedOrder.internalNotes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Note Interne</p>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedOrder.internalNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Accetta Ordine</DialogTitle>
            <DialogDescription>
              Configura l'accettazione per {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Programma Appuntamento (opzionale)</Label>
              <Input
                type="datetime-local"
                value={acceptForm.scheduledAt}
                onChange={(e) => setAcceptForm({ ...acceptForm, scheduledAt: e.target.value })}
                data-testid="input-scheduled-at"
              />
            </div>

            <div className="space-y-2">
              <Label>Assegna Centro Riparazione (opzionale)</Label>
              <Select
                value={acceptForm.repairCenterId}
                onValueChange={(value) => setAcceptForm({ ...acceptForm, repairCenterId: value })}
              >
                <SelectTrigger data-testid="select-repair-center">
                  <SelectValue placeholder="Seleziona centro..." />
                </SelectTrigger>
                <SelectContent>
                  {repairCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note Interne (opzionale)</Label>
              <Textarea
                value={acceptForm.internalNotes}
                onChange={(e) => setAcceptForm({ ...acceptForm, internalNotes: e.target.value })}
                placeholder="Note per uso interno..."
                rows={3}
                data-testid="textarea-internal-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleSubmitAccept}
              disabled={acceptMutation.isPending}
              data-testid="button-confirm-accept"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Accetta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
