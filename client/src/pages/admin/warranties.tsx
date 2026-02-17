import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Shield, Search, Calendar, AlertTriangle, CheckCircle2, XCircle, Clock, User, Smartphone, Store } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type AdminWarrantyItem = {
  id: string;
  repairOrderId: string | null;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  sellerName: string;
  sellerType: string;
  sellerId: string;
  deviceType: string;
  brand: string;
  deviceModel: string;
  productName: string;
  coverageType: string;
  durationMonths: number;
  price: number;
  status: "offered" | "accepted" | "declined" | "expired";
  startsAt: string | null;
  endsAt: string | null;
  offeredAt: string;
  daysRemaining: number | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  offered: { label: "offered", variant: "secondary" },
  accepted: { label: "accepted", variant: "default" },
  declined: { label: "declined", variant: "destructive" },
  expired: { label: "expired", variant: "outline" },
};

const coverageLabels: Record<string, string> = {
  basic: "basic",
  extended: "extended",
  full: "full",
};

const sellerTypeLabels: Record<string, string> = {
  reseller: "reseller",
  repair_center: "repair_center",
};

function getDaysRemainingBadge(daysRemaining: number | null, status: string) {
  if (status !== "accepted" || daysRemaining === null) return null;
  if (daysRemaining <= 0) {
    return <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" />Scaduta</Badge>;
  }
  if (daysRemaining <= 30) {
    return <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3" />{daysRemaining}g rimasti</Badge>;
  }
  return <Badge variant="outline" className="gap-1 text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />{daysRemaining}g rimasti</Badge>;
}

export default function AdminWarranties() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: warranties = [], isLoading } = useQuery<AdminWarrantyItem[]>({
    queryKey: ["/api/admin/warranties"],
  });

  const filtered = warranties.filter(w => {
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        w.customerName.toLowerCase().includes(s) ||
        w.customerEmail.toLowerCase().includes(s) ||
        w.orderNumber.toLowerCase().includes(s) ||
        w.productName.toLowerCase().includes(s) ||
        w.deviceModel.toLowerCase().includes(s) ||
        w.sellerName.toLowerCase().includes(s) ||
        (w.brand && w.brand.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const activeCount = warranties.filter(w => w.status === "accepted" && w.daysRemaining !== null && w.daysRemaining > 0).length;
  const expiringCount = warranties.filter(w => w.status === "accepted" && w.daysRemaining !== null && w.daysRemaining > 0 && w.daysRemaining <= 30).length;
  const expiredCount = warranties.filter(w => w.status === "accepted" && w.daysRemaining !== null && w.daysRemaining <= 0).length;
  const pendingCount = warranties.filter(w => w.status === "offered").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-admin-warranties" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Garanzie Clienti</h1>
            <p className="text-sm text-white/80">Panoramica globale di tutte le garanzie vendute dai rivenditori</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-admin-active-count">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Attive</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-admin-expiring-count">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiringCount}</p>
              <p className="text-xs text-muted-foreground">In Scadenza</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-admin-expired-count">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredCount}</p>
              <p className="text-xs text-muted-foreground">Scadute</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-admin-pending-count">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">In Attesa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("products.searchProduct")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-admin-warranties"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-admin-status-filter">
            <SelectValue placeholder={t("common.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("repairs.allStatuses")}</SelectItem>
            <SelectItem value="offered">{t("common.pending")}</SelectItem>
            <SelectItem value="accepted">{t("common.active")}</SelectItem>
            <SelectItem value="declined">{t("common.rejected")}</SelectItem>
            <SelectItem value="expired">{t("license.expired")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessuna garanzia trovata</p>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? t("warranties.modifyFilters")
                : t("warranties.willAppearHere")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((w) => {
            const status = statusConfig[w.status] || statusConfig.offered;
            const isActive = w.status === "accepted" && w.daysRemaining !== null && w.daysRemaining > 0;
            const isStandalone = !w.repairOrderId;

            return (
              <Card key={w.id} data-testid={`card-admin-warranty-${w.id}`} className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'}`}>
                      <Shield className={`h-5 w-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">{w.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {isStandalone ? t("warranties.directWarranty") : `${t("common.order")} #${w.orderNumber}`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isStandalone && <Badge variant="outline" className="text-xs">Diretta</Badge>}
                          {getDaysRemainingBadge(w.daysRemaining, w.status)}
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-muted-foreground">{t("common.customer")}</p>
                            <p className="font-medium truncate">{w.customerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-muted-foreground">{t("roles.reseller")}</p>
                            <p className="font-medium truncate">{w.sellerName}</p>
                            <p className="text-muted-foreground truncate">{sellerTypeLabels[w.sellerType] || w.sellerType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-muted-foreground">{t("repairs.device")}</p>
                            <p className="font-medium truncate">{[w.brand, w.deviceModel].filter(Boolean).join(" ") || w.deviceType || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-muted-foreground">Copertura</p>
                            <p className="font-medium">{coverageLabels[w.coverageType] || w.coverageType} - {w.durationMonths} mesi</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-muted-foreground">{t("common.price")}</p>
                            <p className="font-medium">{(w.price / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                          </div>
                        </div>
                      </div>

                      {w.status === "accepted" && w.startsAt && w.endsAt && (
                        <div className={`flex items-center gap-2 p-2 rounded-md text-xs ${
                          w.daysRemaining !== null && w.daysRemaining <= 0
                            ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                            : w.daysRemaining !== null && w.daysRemaining <= 30
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            Dal {format(new Date(w.startsAt), "dd/MM/yyyy", { locale: it })} al {format(new Date(w.endsAt), "dd/MM/yyyy", { locale: it })}
                          </span>
                        </div>
                      )}

                      {w.status === "offered" && (
                        <div className="flex items-center gap-2 p-2 rounded-md text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>Offerta inviata il {format(new Date(w.offeredAt), "dd/MM/yyyy", { locale: it })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
