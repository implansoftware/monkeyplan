import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, Play, Eye, Clock, User, Smartphone, Banknote, Building, CreditCard } from "lucide-react";
import type { ServiceOrder } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type ServiceOrderWithDetails = ServiceOrder & {
  customerName: string;
  serviceName: string;
  serviceCode: string;
};




export default function RepairCenterServiceOrders() {
  const { t } = useTranslation();
  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("b2b.status.pending"), variant: "secondary" },
    accepted: { label: t("standalone.accepted"), variant: "default" },
    scheduled: { label: t("serviceOrders.scheduled"), variant: "outline" },
    in_progress: { label: t("tickets.status.inProgress"), variant: "default" },
    completed: { label: t("repairs.status.completed"), variant: "default" },
    cancelled: { label: t("repairs.status.cancelled"), variant: "destructive" },
  };
  const paymentStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: t("serviceOrders.toPay"), variant: "secondary" },
    paid: { label: t("serviceOrders.paid"), variant: "default" },
    cancelled: { label: t("repairs.status.cancelled"), variant: "destructive" },
  };
  const paymentMethodLabels: Record<string, { label: string; icon: any }> = {
    in_person: { label: t("services.inNegozio"), icon: Banknote },
    bank_transfer: { label: t("settings.bankTransfer"), icon: Building },
    card: { label: t("pos.card"), icon: CreditCard },
    paypal: { label: "PayPal", icon: CreditCard },
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("accepted");

  const { data: orders, isLoading } = useQuery<ServiceOrderWithDetails[]>({
    queryKey: ["/api/repair-center/service-orders"],
  });

  const startMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/repair-center/service-orders/${orderId}/start`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/service-orders"] });
      toast({ title: "Lavorazione avviata" });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/repair-center/service-orders/${orderId}/complete`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/service-orders"] });
      setIsDetailOpen(false);
      setSelectedOrder(null);
      toast({ title: "Intervento completato" });
    },
    onError: (error: Error) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  const filteredOrders = orders?.filter(order => {
    if (activeTab === "accepted") return order.status === "accepted" || order.status === "scheduled";
    if (activeTab === "in_progress") return order.status === "in_progress";
    if (activeTab === "completed") return order.status === "completed";
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("services.ordiniIntervento")}</h1>
          <p className="text-muted-foreground">{t("services.gestisciGliInterventiAssegnatiAlTuoCentro")}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accepted" data-testid="tab-accepted">
            Da lavorare ({orders?.filter(o => o.status === "accepted" || o.status === "scheduled").length || 0})
          </TabsTrigger>
          <TabsTrigger value="in_progress" data-testid="tab-in-progress">
            In lavorazione ({orders?.filter(o => o.status === "in_progress").length || 0})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completati ({orders?.filter(o => o.status === "completed").length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.order")}</TableHead>
                    <TableHead>{t("auth.customerTab")}</TableHead>
                    <TableHead>{t("common.service")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("repairs.device")}</TableHead>
                    <TableHead>{t("common.amount")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t("common.payment")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nessun ordine trovato
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const PaymentIcon = paymentMethodLabels[order.paymentMethod]?.icon || Banknote;
                      return (
                        <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                          <TableCell>
                            <div className="font-medium">{order.orderNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(order.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              {order.customerName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{order.serviceName}</div>
                            <div className="text-sm text-muted-foreground">{order.serviceCode}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {order.brand || order.model ? (
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-muted-foreground" />
                                {order.brand} {order.model}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{formatPrice(order.priceCents)}</TableCell>
                          <TableCell>
                            <Badge variant={statusLabels[order.status]?.variant || "secondary"}>
                              {statusLabels[order.status]?.label || order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <PaymentIcon className="w-4 h-4 text-muted-foreground" />
                              <Badge variant={paymentStatusLabels[order.paymentStatus]?.variant || "secondary"}>
                                {paymentStatusLabels[order.paymentStatus]?.label || order.paymentStatus}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsDetailOpen(true);
                                }}
                                data-testid={`button-view-${order.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {(order.status === "accepted" || order.status === "scheduled") && (
                                <Button
                                  size="sm"
                                  onClick={() => startMutation.mutate(order.id)}
                                  disabled={startMutation.isPending}
                                  data-testid={`button-start-${order.id}`}
                                >
                                  <Play className="w-4 h-4 mr-1" />
                                  Avvia
                                </Button>
                              )}
                              {order.status === "in_progress" && (
                                <Button
                                  size="sm"
                                  onClick={() => completeMutation.mutate(order.id)}
                                  disabled={completeMutation.isPending}
                                  data-testid={`button-complete-${order.id}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Completa
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("serviceOrders.dettaglioOrdine")} {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>{t("utility.serviceOrderInfo")}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("auth.customerTab")}</label>
                  <p>{selectedOrder.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("common.service")}</label>
                  <p>{selectedOrder.serviceName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("repairs.device")}</label>
                  <p>{selectedOrder.brand} {selectedOrder.model || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("serviceOrders.imeiSeriale")}</label>
                  <p>{selectedOrder.imei || selectedOrder.serial || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("common.amount")}</label>
                  <p className="font-medium">{formatPrice(selectedOrder.priceCents)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("services.statoPagamento")}</label>
                  <Badge variant={paymentStatusLabels[selectedOrder.paymentStatus]?.variant || "secondary"}>
                    {paymentStatusLabels[selectedOrder.paymentStatus]?.label}
                  </Badge>
                </div>
              </div>
              {selectedOrder.issueDescription && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrizione problema</label>
                  <p className="whitespace-pre-wrap">{selectedOrder.issueDescription}</p>
                </div>
              )}
              {selectedOrder.customerNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Note cliente</label>
                  <p className="whitespace-pre-wrap">{selectedOrder.customerNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>{t("common.close")}</Button>
            {selectedOrder?.status === "in_progress" && (
              <Button onClick={() => completeMutation.mutate(selectedOrder.id)} disabled={completeMutation.isPending}>
                <Check className="w-4 h-4 mr-1" />
                Completa Intervento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
