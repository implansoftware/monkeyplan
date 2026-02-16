import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Search, Building2, Truck, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type SupplierOrderWithDetails = {
  id: string;
  orderNumber: string;
  supplierId: string;
  repairCenterId: string;
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
  repairCenter: { id: string; name: string; city: string } | null;
};

type RepairCenter = {
  id: string;
  name: string;
  city: string;
};

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    draft: t("invoices.draft"),
    sent: "Inviato",
    confirmed: "Confermato",
    shipped: t("b2b.status.shipped"),
    partially_received: t("invoices.partial"),
    received: t("repairs.status.received"),
  };
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  sent: "outline",
  confirmed: "default",
  shipped: "default",
  partially_received: "secondary",
  received: "default",
};

export default function ResellerSupplierOrders() {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery<SupplierOrderWithDetails[]>({
    queryKey: ["/api/reseller/supplier-orders"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (order.trackingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCenter = centerFilter === "all" || order.repairCenterId === centerFilter;
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesCenter && matchesStatus;
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
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">Ordini Ricambi</h1>
              <p className="text-sm text-white/80">Gestione ordini fornitori</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30" data-testid="badge-orders-count">
            {orders.length} ordini
          </Badge>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <ShoppingCart className="h-5 w-5" />{t("admin.permissions.supplierOrders")}</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("b2b.searchOrder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={centerFilter} onValueChange={setCenterFilter}>
              <SelectTrigger className="w-48" data-testid="select-center-filter">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("admin.common.center")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allCenters")}</SelectItem>
                {repairCenters.map((center) => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <p>{t("b2b.noOrdersFound")}</p>
              <p className="text-sm mt-1">Gli ordini ricambi dei centri di riparazione associati appariranno qui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("repairs.orderNumber")}</TableHead>
                  <TableHead>{t("common.supplier")}</TableHead>
                  <TableHead>{t("admin.common.center")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.total")}</TableHead>
                  <TableHead>{t("b2b.orderDate")}</TableHead>
                  <TableHead>{t("suppliers.expectedDelivery")}</TableHead>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium" data-testid={`text-order-center-${order.id}`}>
                            {order.repairCenter?.name || "-"}
                          </div>
                          {order.repairCenter?.city && (
                            <div className="text-xs text-muted-foreground">{order.repairCenter.city}</div>
                          )}
                        </div>
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
                    <TableCell data-testid={`text-order-date-${order.id}`}>
                      <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(order.createdAt), "dd MMM yyyy", { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell data-testid={`text-order-delivery-${order.id}`}>
                      {order.expectedDelivery ? (
                        <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.expectedDelivery), "dd MMM yyyy", { locale: it })}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
