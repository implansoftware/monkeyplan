import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { WarrantyProduct, User } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Shield, Search, Calendar, AlertTriangle, CheckCircle2, XCircle, Clock, User as UserIcon, Smartphone, Plus } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type WarrantyItem = {
  id: string;
  repairOrderId: string | null;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
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

function getCoverageLabels(t: (key: string, opts?: any) => string): Record<string, string> {
  return {
    basic: "Base",
    extended: t("warranties.extended"),
    full: "Completa",
  };
}

function getDaysRemainingBadge(daysRemaining: number | null, status: string, t: (key: string, opts?: any) => string) {
  if (status !== "accepted" || daysRemaining === null) return null;
  if (daysRemaining <= 0) {
    return <Badge variant="destructive" className="gap-1 text-xs"><AlertTriangle className="h-3 w-3" />{t("invoices.overdue")}</Badge>;
  }
  if (daysRemaining <= 30) {
    return <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-700 dark:text-amber-400"><AlertTriangle className="h-3 w-3" />{t("warranties.daysRemaining", { days: daysRemaining })}</Badge>;
  }
  return <Badge variant="outline" className="gap-1 text-xs border-emerald-300 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" />{t("warranties.daysRemaining", { days: daysRemaining })}</Badge>;
}

export default function RepairCenterWarranties() {
  const { t } = useTranslation();
  const coverageLabels = getCoverageLabels(t);
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    offered: { label: t("common.pending"), variant: "secondary" },
    accepted: { label: t("license.active"), variant: "default" },
    declined: { label: t("common.rejected"), variant: "destructive" },
    expired: { label: t("invoices.overdue"), variant: "outline" },
  };
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: warranties = [], isLoading } = useQuery<WarrantyItem[]>({
    queryKey: ["/api/repair-center/warranties"],
  });

  const { data: customers = [] } = useQuery<User[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [] } = useQuery<WarrantyProduct[]>({
    queryKey: ["/api/warranty-products"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { customerId: string; warrantyProductId: string; notes?: string }) =>
      apiRequest("POST", "/api/repair-center/warranties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/warranties"] });
      toast({ title: "Garanzia creata", description: t("warranties.laGaranziaStataAssegnataAlClienteConSucce") });
      setIsCreateOpen(false);
      setSelectedCustomerId("");
      setSelectedProductId("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message || "Impossibile creare la garanzia", variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!selectedCustomerId || !selectedProductId) {
      toast({ title: t("auth.error"), description: "Seleziona un cliente e un prodotto garanzia", variant: "destructive" });
      return;
    }
    createMutation.mutate({ customerId: selectedCustomerId, warrantyProductId: selectedProductId, notes: notes || undefined });
  };

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
        (w.brand && w.brand.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const activeCount = warranties.filter(w => w.status === "accepted" && w.daysRemaining !== null && w.daysRemaining > 0).length;
  const expiringCount = warranties.filter(w => w.status === "accepted" && w.daysRemaining !== null && w.daysRemaining > 0 && w.daysRemaining <= 30).length;
  const expiredCount = warranties.filter(w => w.status === "accepted" && w.daysRemaining !== null && w.daysRemaining <= 0).length;
  const pendingCount = warranties.filter(w => w.status === "offered").length;

  const activeProducts = products.filter((p: any) => p.isActive);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loader-warranties" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{t("sidebar.items.customerWarranties")}</h1>
              <p className="text-sm text-white/80">{t("warranties.gestisciLeGaranzieAttiveEMonitoraLeScadenze")}</p>
            </div>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-white/20 backdrop-blur-sm border border-white/30 text-white" data-testid="button-new-warranty">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Garanzia
          </Button>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-active-count">
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
        <Card data-testid="card-expiring-count">
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
        <Card data-testid="card-expired-count">
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
        <Card data-testid="card-pending-count">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">{t("common.pending")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("warranties.cercaPerClienteOrdineProdottoDispositivo")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-warranties"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder={t("common.filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
            <SelectItem value="offered">{t("common.pending")}</SelectItem>
            <SelectItem value="accepted">{t("license.active")}</SelectItem>
            <SelectItem value="declined">{t("common.rejected")}</SelectItem>
            <SelectItem value="expired">{t("invoices.overdue")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">{t("warranties.noWarrantiesFound")}</p>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Prova a modificare i filtri di ricerca"
                : "Le garanzie offerte ai clienti appariranno qui"}
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
              <Card key={w.id} data-testid={`card-warranty-${w.id}`} className="hover-elevate cursor-pointer" onClick={() => navigate(`/repair-center/warranties/${w.id}`)}>
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
                            {isStandalone ? t("warranties.directWarranty") : `Ordine #${w.orderNumber}`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isStandalone && <Badge variant="outline" className="text-xs">Diretta</Badge>}
                          {getDaysRemainingBadge(w.daysRemaining, w.status, t)}
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-muted-foreground">{t("auth.customerTab")}</p>
                            <p className="font-medium truncate">{w.customerName}</p>
                          </div>
                        </div>
                        {!isStandalone && (
                          <div className="flex items-center gap-2">
                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="text-muted-foreground">{t("repairs.device")}</p>
                              <p className="font-medium truncate">{[w.brand, w.deviceModel].filter(Boolean).join(" ") || w.deviceType || "N/A"}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-muted-foreground">{t("warranties.coverage")}</p>
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("warranties.nuovaGaranziaDiretta")}</DialogTitle>
            <DialogDescription>
              Assegna una garanzia a un cliente senza passare dalla riparazione
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="customer">{t("auth.customerTab")}</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger data-testid="select-warranty-customer">
                  <SelectValue placeholder={t("warranties.selezionaUnCliente")} />
                </SelectTrigger>
                <SelectContent>
                  {customers.filter((c: any) => c.role === 'customer').map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.username} {c.email ? `(${c.email})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product">{t("warranties.warrantyProduct")}</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger data-testid="select-warranty-product">
                  <SelectValue placeholder={t("warranties.selezionaUnProdotto")} />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} - {coverageLabels[p.coverageType] || p.coverageType} - {p.durationMonths} mesi - {(p.priceInCents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note (opzionale)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Eventuali note sulla garanzia..."
                data-testid="textarea-warranty-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} data-testid="button-cancel-warranty">{t("profile.cancel")}</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending || !selectedCustomerId || !selectedProductId} data-testid="button-confirm-warranty">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Crea Garanzia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
