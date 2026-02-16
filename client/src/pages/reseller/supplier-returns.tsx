import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Search, Building2, Truck, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type SupplierReturnWithDetails = {
  id: string;
  returnNumber: string;
  supplierId: string;
  repairCenterId: string;
  status: string;
  reason: string;
  reasonDetails: string | null;
  totalAmount: number;
  refundAmount: number | null;
  requestedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  refundedAt: string | null;
  rmaNumber: string | null;
  createdAt: string;
  supplier: { id: string; name: string; code: string } | null;
  repairCenter: { id: string; name: string; city: string } | null;
};

type RepairCenter = {
  id: string;
  name: string;
  city: string;
};

const statusLabels: Record<string, string> = {
  draft: t("invoices.draft"),
  requested: "Richiesto",
  approved: t("repairs.status.approved"),
  shipped: t("b2b.status.shipped"),
  received: t("repairs.status.received"),
  refunded: "Rimborsato",
  rejected: t("b2b.status.cancelled"),
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  requested: "outline",
  approved: "default",
  shipped: "default",
  received: "default",
  refunded: "default",
  rejected: "destructive",
};

const reasonLabels: Record<string, string> = {
  defective: "Difettoso",
  wrong_item: "Articolo Errato",
  damaged: "Danneggiato",
  not_needed: "Non Necessario",
  other: t("common.other"),
};

export default function ResellerSupplierReturns() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: returns = [], isLoading } = useQuery<SupplierReturnWithDetails[]>({
    queryKey: ["/api/reseller/supplier-returns"],
  });

  const { data: repairCenters = [] } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const filteredReturns = returns.filter((ret) => {
    const matchesSearch = 
      ret.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ret.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (ret.rmaNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCenter = centerFilter === "all" || ret.repairCenterId === centerFilter;
    const matchesStatus = statusFilter === "all" || ret.status === statusFilter;
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
      {/* Hero Header - Modern Glass Style */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        {/* Animated background blobs */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <RotateCcw className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">Resi Fornitori</h1>
              <p className="text-sm text-white/80">Gestione resi ricambi</p>
            </div>
          </div>
          <Badge className="bg-white/20 backdrop-blur-sm border border-white/30 text-white" data-testid="badge-returns-count">
            {returns.length} resi
          </Badge>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
          <CardTitle className="flex flex-wrap items-center gap-2">
            <RotateCcw className="h-5 w-5" />{t("sidebar.items.supplierReturns")}</CardTitle>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("b2b.searchReturn")}
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
          {filteredReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("b2b.noReturnsFound")}</p>
              <p className="text-sm mt-1">I resi ai fornitori dei centri di riparazione associati appariranno qui</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero Reso</TableHead>
                  <TableHead>{t("common.supplier")}</TableHead>
                  <TableHead>{t("admin.common.center")}</TableHead>
                  <TableHead>{t("common.reason")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>Valore</TableHead>
                  <TableHead>RMA</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id} data-testid={`row-return-${ret.id}`}>
                    <TableCell className="font-mono text-sm" data-testid={`text-return-number-${ret.id}`}>
                      {ret.returnNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-return-supplier-${ret.id}`}>
                          {ret.supplier?.name || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium" data-testid={`text-return-center-${ret.id}`}>
                            {ret.repairCenter?.name || "-"}
                          </div>
                          {ret.repairCenter?.city && (
                            <div className="text-xs text-muted-foreground">{ret.repairCenter.city}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" data-testid={`badge-return-reason-${ret.id}`}>
                        {reasonLabels[ret.reason] || ret.reason}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[ret.status] || "secondary"} data-testid={`badge-return-status-${ret.id}`}>
                        {statusLabels[ret.status] || ret.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium" data-testid={`text-return-total-${ret.id}`}>
                      {formatCurrency(ret.totalAmount)}
                    </TableCell>
                    <TableCell className="font-mono text-sm" data-testid={`text-return-rma-${ret.id}`}>
                      {ret.rmaNumber || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-return-date-${ret.id}`}>
                      <div className="flex flex-wrap items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(ret.createdAt), "dd MMM yyyy", { locale: it })}
                      </div>
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
