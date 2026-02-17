import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Search, Truck, Calendar, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type SupplierOrderWithDetails = {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: string;
  subtotal: number;
  shippingCost: number | null;
  taxAmount: number | null;
  totalAmount: number;
  expectedDelivery: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  trackingNumber: string | null;
  createdAt: string;
  supplier: { id: string; name: string; code: string } | null;
};

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    draft: t("common.draft"),
    sent: t("supplierOrders.inviato"),
    confirmed: t("common.confirmed"),
    shipped: t("supplierOrders.spedito"),
    partially_received: t("supplierOrders.parziale"),
    received: t("supplierOrders.ricevuto"),
    cancelled: t("common.cancelled"),
  };
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "outline",
  confirmed: "default",
  shipped: "default",
  partially_received: "secondary",
  received: "default",
  cancelled: "destructive",
};

export default function RepairCenterSupplierOrders() {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery<SupplierOrderWithDetails[]>({
    queryKey: ["/api/repair-center/supplier-orders"],
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <ClipboardList className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight" data-testid="text-page-title">{t("admin.permissions.supplierOrders")}</h1>
              <p className="text-emerald-100">{t("supplierOrders.gestioneOrdiniFornitore")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30" data-testid="badge-orders-count">
              {orders.length} {t("supplierOrders.ordini")}
            </Badge>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t("supplierOrders.iMieiOrdini")}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("common.searchSalesOrder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("common.noSalesOrdersFound")}</p>
              <p className="text-sm mt-1">{t("supplierOrders.ordiniApparirannoQui")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("repairs.orderNumber")}</TableHead>
                  <TableHead>{t("common.supplier")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.total")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("b2b.orderDate")}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t("suppliers.expectedDelivery")}</TableHead>
                  <TableHead className="hidden lg:table-cell">Tracking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-order-supplier-${order.id}`}>
                          {order.supplier?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[order.status] || "secondary"} data-testid={`badge-order-status-${order.id}`}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-order-total-${order.id}`}>
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell" data-testid={`text-order-date-${order.id}`}>
                      <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(order.createdAt), "dd MMM yyyy", { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell" data-testid={`text-order-delivery-${order.id}`}>
                      {order.expectedDelivery ? (
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.expectedDelivery), "dd MMM yyyy", { locale: it })}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell" data-testid={`text-order-tracking-${order.id}`}>
                      {order.trackingNumber || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
