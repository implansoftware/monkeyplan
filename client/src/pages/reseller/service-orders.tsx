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
import { Loader2, Check, X, Play, Calendar, Eye, Clock, User, Truck, MapPin, Download, Smartphone, Banknote, Building } from "lucide-react";
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

const paymentStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Da pagare", variant: "secondary" },
  paid: { label: "Pagato", variant: "default" },
  cancelled: { label: "Annullato", variant: "destructive" },
};

const paymentMethodLabels: Record<string, { label: string; icon: string }> = {
  in_person: { label: "In negozio", icon: "banknote" },
  bank_transfer: { label: "Bonifico", icon: "building" },
};

export default function ResellerServiceOrders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const [acceptForm, setAcceptForm] = useState({
    repairCenterId: "",
    internalNotes: "",
  });
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");

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
      setAcceptForm({ repairCenterId: "", internalNotes: "" });
      toast({ title: "Ordine accettato", description: "In attesa scelta consegna dal cliente" });
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

  const confirmReceiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/reseller/service-orders/${orderId}/confirm-receipt`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-orders"] });
      toast({ title: "Ricezione confermata", description: "Dispositivo ricevuto, lavorazione avviata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const downloadDdtMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("GET", `/api/reseller/service-orders/${orderId}/ddt`);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ orderId, scheduledAt }: { orderId: string; scheduledAt: string }) => {
      const res = await apiRequest("PATCH", `/api/reseller/service-orders/${orderId}/schedule`, { scheduledAt });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/service-orders"] });
      setIsScheduleDialogOpen(false);
      setSelectedOrder(null);
      setScheduleDate("");
      toast({ title: "Appuntamento programmato" });
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">Ordini Servizi</h1>
              <p className="text-sm text-white/80">Gestisci le richieste di intervento dai tuoi clienti</p>
            </div>
          </div>
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
            <Card className="rounded-2xl">
              <CardContent className="py-8 text-center text-muted-foreground">
                Nessun ordine in questa sezione
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Servizio</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Consegna</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Pagamento</TableHead>
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
                      <TableCell>
                        {order.deliveryMethod ? (
                          <div className="flex items-center gap-1">
                            {order.deliveryMethod === "shipping" ? (
                              <><Truck className="w-3 h-3" /> Spedizione</>
                            ) : (
                              <><MapPin className="w-3 h-3" /> Di persona</>
                            )}
                            {order.deviceReceivedAt && (
                              <Badge variant="outline" className="ml-1 text-xs">
                                <Check className="w-2 h-2 mr-1" />Ricevuto
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">In attesa</span>
                        )}
                      </TableCell>
                      <TableCell>{formatPrice(order.priceCents)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs">
                            {order.paymentMethod === "bank_transfer" ? (
                              <Building className="w-3 h-3" />
                            ) : (
                              <Banknote className="w-3 h-3" />
                            )}
                            <span>{paymentMethodLabels[order.paymentMethod || "in_person"]?.label}</span>
                          </div>
                          <Badge variant={paymentStatusLabels[order.paymentStatus || "pending"]?.variant || "secondary"} className="text-xs w-fit">
                            {paymentStatusLabels[order.paymentStatus || "pending"]?.label}
                          </Badge>
                        </div>
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

                          {order.status === "accepted" && order.deliveryMethod === "in_person" && !order.scheduledAt && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsScheduleDialogOpen(true);
                              }}
                              title="Programma appuntamento"
                              data-testid={`button-schedule-${order.id}`}
                            >
                              <Calendar className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}

                          {(order.status === "accepted" || order.status === "scheduled") && order.deliveryMethod && !order.deviceReceivedAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmReceiptMutation.mutate(order.id)}
                              disabled={confirmReceiptMutation.isPending}
                              title="Conferma che il dispositivo è stato consegnato dal cliente"
                              data-testid={`button-confirm-receipt-${order.id}`}
                              className="text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-950"
                            >
                              <Smartphone className="w-4 h-4 mr-1" />
                              Ricevuto
                            </Button>
                          )}


                          {order.ddtUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => downloadDdtMutation.mutate(order.id)}
                              disabled={downloadDdtMutation.isPending}
                              title="Scarica DDT"
                              data-testid={`button-ddt-${order.id}`}
                            >
                              <Download className="w-4 h-4" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

              {selectedOrder.deliveryMethod && (
                <div className="border-t pt-4">
                  <p className="text-muted-foreground text-sm mb-2">Metodo Consegna</p>
                  <div className="flex items-center gap-2">
                    {selectedOrder.deliveryMethod === "shipping" ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Spedizione
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Consegna di persona
                      </Badge>
                    )}
                    {selectedOrder.deviceReceivedAt && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ricevuto {format(new Date(selectedOrder.deviceReceivedAt), "dd/MM/yy HH:mm", { locale: it })}
                      </Badge>
                    )}
                  </div>
                  {selectedOrder.deliveryMethod === "shipping" && (
                    <div className="mt-2 text-sm space-y-1">
                      {selectedOrder.shippingAddress && (
                        <p><span className="text-muted-foreground">Indirizzo:</span> {selectedOrder.shippingAddress}, {selectedOrder.shippingCap} {selectedOrder.shippingCity} ({selectedOrder.shippingProvince})</p>
                      )}
                      {selectedOrder.courierName && (
                        <p><span className="text-muted-foreground">Corriere:</span> {selectedOrder.courierName}</p>
                      )}
                      {selectedOrder.trackingNumber && (
                        <p><span className="text-muted-foreground">Tracking:</span> {selectedOrder.trackingNumber}</p>
                      )}
                    </div>
                  )}
                  {selectedOrder.ddtUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => downloadDdtMutation.mutate(selectedOrder.id)}
                      disabled={downloadDdtMutation.isPending}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Scarica DDT
                    </Button>
                  )}
                </div>
              )}

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

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Programma Appuntamento</DialogTitle>
            <DialogDescription>
              Seleziona data e ora per la consegna di persona - {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data e Ora Appuntamento</Label>
              <Input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                data-testid="input-schedule-date"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Annulla
            </Button>
            <Button
              onClick={() => {
                if (selectedOrder && scheduleDate) {
                  scheduleMutation.mutate({ orderId: selectedOrder.id, scheduledAt: scheduleDate });
                }
              }}
              disabled={scheduleMutation.isPending || !scheduleDate}
              data-testid="button-confirm-schedule"
            >
              {scheduleMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Calendar className="w-4 h-4 mr-2" />
              )}
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
