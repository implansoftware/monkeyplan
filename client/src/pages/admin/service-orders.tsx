import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, User, Smartphone, Banknote, Building, CreditCard, Search, Store, Wrench } from "lucide-react";
import type { ServiceOrder } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type ServiceOrderWithDetails = ServiceOrder & {
  customerName: string;
  resellerName: string;
  repairCenterName: string | null;
  serviceName: string;
  serviceCode: string;
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "pending", variant: "secondary" },
  accepted: { label: "accepted", variant: "default" },
  scheduled: { label: "scheduled", variant: "outline" },
  in_progress: { label: "in_progress", variant: "default" },
  completed: { label: "completed", variant: "default" },
  cancelled: { label: "cancelled", variant: "destructive" },
};

const paymentStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "pending", variant: "secondary" },
  paid: { label: "paid", variant: "default" },
  cancelled: { label: "cancelled", variant: "destructive" },
};

const paymentMethodLabels: Record<string, { label: string; icon: any }> = {
  in_person: { label: "in_person", icon: Banknote },
  bank_transfer: { label: "bank_transfer", icon: Building },
  card: { label: "card", icon: CreditCard },
  paypal: { label: "paypal", icon: CreditCard },
};

export default function AdminServiceOrders() {
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrderWithDetails | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders, isLoading } = useQuery<ServiceOrderWithDetails[]>({
    queryKey: ["/api/admin/service-orders"],
  });

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
  };

  const filteredOrders = orders?.filter(order => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      order.resellerName.toLowerCase().includes(search) ||
      order.serviceName.toLowerCase().includes(search) ||
      (order.repairCenterName && order.repairCenterName.toLowerCase().includes(search))
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("serviceOrders.title")}</h1>
          <p className="text-muted-foreground">{t("serviceOrders.desc")}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("customers.searchCustomer")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        <Badge variant="outline">{orders?.length || 0} ordini totali</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.order")}</TableHead>
                <TableHead>{t("common.customer")}</TableHead>
                <TableHead>{t("roles.reseller")}</TableHead>
                <TableHead>{t("admin.repairCenters.center")}</TableHead>
                <TableHead>{t("utility.service")}</TableHead>
                <TableHead>{t("common.amount")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.payment")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-muted-foreground" />
                          {order.resellerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.repairCenterName ? (
                          <div className="flex items-center gap-2">
                            <Wrench className="w-4 h-4 text-muted-foreground" />
                            {order.repairCenterName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{order.serviceName}</div>
                        <div className="text-sm text-muted-foreground">{order.serviceCode}</div>
                      </TableCell>
                      <TableCell className="font-medium">{formatPrice(order.priceCents)}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[order.status]?.variant || "secondary"}>
                          {statusLabels[order.status]?.label || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentIcon className="w-4 h-4 text-muted-foreground" />
                          <Badge variant={paymentStatusLabels[order.paymentStatus]?.variant || "secondary"}>
                            {paymentStatusLabels[order.paymentStatus]?.label || order.paymentStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("serviceOrders.orderDetail")} {selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>{t("utility.serviceOrderInfo")}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("common.customer")}</label>
                  <p>{selectedOrder.customerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("roles.reseller")}</label>
                  <p>{selectedOrder.resellerName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("roles.repairCenter")}</label>
                  <p>{selectedOrder.repairCenterName || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("serviceOrders.service")}</label>
                  <p>{selectedOrder.serviceName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("repairs.device")}</label>
                  <p>{selectedOrder.brand} {selectedOrder.model || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IMEI/Seriale</label>
                  <p>{selectedOrder.imei || selectedOrder.serial || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("common.amount")}</label>
                  <p className="font-medium">{formatPrice(selectedOrder.priceCents)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("serviceOrders.paymentStatus")}</label>
                  <Badge variant={paymentStatusLabels[selectedOrder.paymentStatus]?.variant || "secondary"}>
                    {paymentStatusLabels[selectedOrder.paymentStatus]?.label}
                  </Badge>
                </div>
              </div>
              {selectedOrder.issueDescription && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("serviceOrders.problemDescription")}</label>
                  <p className="whitespace-pre-wrap">{selectedOrder.issueDescription}</p>
                </div>
              )}
              {selectedOrder.customerNotes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t("serviceOrders.customerNotes")}</label>
                  <p className="whitespace-pre-wrap">{selectedOrder.customerNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
