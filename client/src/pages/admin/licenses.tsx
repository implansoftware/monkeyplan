import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Shield, Calendar, User, Gift, Search, Filter, RefreshCw, Loader2 } from "lucide-react";
import { SiPaypal } from "react-icons/si";
import type { LicensePlan } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface EnrichedLicense {
  id: string;
  resellerId: string;
  licensePlanId: string;
  status: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  paymentId: string | null;
  autoRenew: boolean;
  notes: string | null;
  createdAt: string;
  planName: string;
  planDuration: number;
  resellerName: string;
  resellerCategory: string;
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "active", variant: "default" },
  expired: { label: "expired", variant: "destructive" },
  cancelled: { label: "cancelled", variant: "secondary" },
  pending: { label: "pending", variant: "outline" },
};

const PAYMENT_LABELS: Record<string, string> = {
  stripe: "stripe",
  paypal: "paypal",
  manual: "manual",
  free: "free",
};

export default function AdminLicenses() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantResellerId, setGrantResellerId] = useState("");
  const [grantPlanId, setGrantPlanId] = useState("");
  const [grantNotes, setGrantNotes] = useState("");
  const [grantPaymentMethod, setGrantPaymentMethod] = useState("free");

  const { data: licenses, isLoading } = useQuery<EnrichedLicense[]>({
    queryKey: ["/api/admin/licenses", { status: statusFilter !== "all" ? statusFilter : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/licenses?${params}`);
      if (!res.ok) throw new Error(t("licenses.loadError"));
      return res.json();
    },
  });

  const { data: plans } = useQuery<LicensePlan[]>({
    queryKey: ["/api/admin/license-plans"],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(t("common.error"));
      return res.json();
    },
  });

  const resellers = (users || []).filter((u: any) => u.role === "reseller" && u.isActive);

  const grantMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/licenses/grant", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/licenses"] });
      setGrantOpen(false);
      setGrantResellerId("");
      setGrantPlanId("");
      setGrantNotes("");
      toast({ title: t("license.licenseAssigned") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/licenses/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/licenses"] });
      toast({ title: t("license.licenseUpdated") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const [syncPaypalPlanId, setSyncPaypalPlanId] = useState<string | null>(null);
  const syncPaypalMutation = useMutation({
    mutationFn: async (planId: string) => {
      setSyncPaypalPlanId(planId);
      const res = await apiRequest("POST", `/api/admin/license-plans/${planId}/sync-paypal`);
      return res.json();
    },
    onSuccess: (data) => {
      setSyncPaypalPlanId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      toast({ title: "PayPal sincronizzato", description: `Piano ID PayPal: ${data.paypalPlanId}` });
    },
    onError: (err: any) => {
      setSyncPaypalPlanId(null);
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const filtered = (licenses || []).filter(lic => {
    if (!search) return true;
    return lic.resellerName.toLowerCase().includes(search.toLowerCase()) ||
      lic.planName.toLowerCase().includes(search.toLowerCase());
  });

  const stats = {
    total: (licenses || []).length,
    active: (licenses || []).filter(l => l.status === "active").length,
    expired: (licenses || []).filter(l => l.status === "expired").length,
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Gestione Licenze</h1>
          <p className="text-sm text-muted-foreground">Visualizza e gestisci le licenze dei rivenditori</p>
        </div>
        <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-grant-license"><Gift className="w-4 h-4 mr-2" /> Assegna Licenza</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("license.assignLicense")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("license.reseller")} *</Label>
                <Select value={grantResellerId} onValueChange={setGrantResellerId}>
                  <SelectTrigger data-testid="select-grant-reseller">
                    <SelectValue placeholder={t("utility.selectReseller")} />
                  </SelectTrigger>
                  <SelectContent>
                    {resellers.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.fullName || r.ragioneSociale || r.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("license.plan")} *</Label>
                <Select value={grantPlanId} onValueChange={setGrantPlanId}>
                  <SelectTrigger data-testid="select-grant-plan">
                    <SelectValue placeholder={t("license.selectPlan")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(plans || []).filter(p => p.isActive).map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {(p.priceCents / 100).toFixed(2)} EUR ({p.durationMonths} mesi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("license.paymentMethod")}</Label>
                <Select value={grantPaymentMethod} onValueChange={setGrantPaymentMethod}>
                  <SelectTrigger data-testid="select-grant-payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t("license.free")}</SelectItem>
                    <SelectItem value="manual">{t("license.manual")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("common.notes")}</Label>
                <Textarea value={grantNotes} onChange={e => setGrantNotes(e.target.value)} placeholder={t("common.optionalNotes")} data-testid="input-grant-notes" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setGrantOpen(false)} data-testid="button-cancel-grant">{t("common.cancel")}</Button>
                <Button onClick={() => grantMutation.mutate({
                  resellerId: grantResellerId,
                  licensePlanId: grantPlanId,
                  paymentMethod: grantPaymentMethod,
                  notes: grantNotes || null,
                })} disabled={!grantResellerId || !grantPlanId || grantMutation.isPending} data-testid="button-confirm-grant">
                  {grantMutation.isPending ? t("licenses.assigning") : t("licenses.assign")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Totale Licenze</p>
                <p className="text-2xl font-bold" data-testid="text-total-licenses">{stats.total}</p>
              </div>
              <Shield className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Attive</p>
                <p className="text-2xl font-bold text-emerald-600" data-testid="text-active-licenses">{stats.active}</p>
              </div>
              <Calendar className="w-8 h-8 text-emerald-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Scadute</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-expired-licenses">{stats.expired}</p>
              </div>
              <Calendar className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-licenses"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder={t("common.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allMasc")}</SelectItem>
            <SelectItem value="active">{t("common.active")}</SelectItem>
            <SelectItem value="expired">{t("license.expired")}</SelectItem>
            <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
            <SelectItem value="pending">{t("b2b.status.pending")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(plans || []).filter(p => p.priceCents > 0).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Integrazione PayPal — Piani</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(plans || []).filter(p => p.priceCents > 0).map(plan => (
              <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(plan.priceCents / 100).toFixed(2)} EUR / {plan.durationMonths} mesi
                    {(plan as any).paypalPlanId && (
                      <span className="ml-2 text-emerald-600">• PayPal ID: {(plan as any).paypalPlanId}</span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncPaypalMutation.mutate(plan.id)}
                  disabled={syncPaypalMutation.isPending && syncPaypalPlanId === plan.id}
                  data-testid={`button-sync-paypal-${plan.id}`}
                >
                  {syncPaypalMutation.isPending && syncPaypalPlanId === plan.id ? (
                    <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Sync...</>
                  ) : (
                    <><SiPaypal className="w-3 h-3 mr-2" />{(plan as any).paypalPlanId ? "Risincronizza PayPal" : "Sincronizza PayPal"}</>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{t("license.noLicenses")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(lic => {
            const statusInfo = STATUS_MAP[lic.status] || { label: lic.status, variant: "outline" as const };
            const endDate = new Date(lic.endDate);
            const now = new Date();
            const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isExpiring = lic.status === "active" && daysLeft <= 7;
            return (
              <Card key={lic.id} data-testid={`card-license-${lic.id}`}>
                <CardContent className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate" data-testid={`text-reseller-name-${lic.id}`}>{lic.resellerName}</p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{lic.planName}</span>
                          <span>-</span>
                          <span>{PAYMENT_LABELS[lic.paymentMethod] || lic.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          {format(new Date(lic.startDate), "dd MMM yyyy", { locale: it })} - {format(endDate, "dd MMM yyyy", { locale: it })}
                        </p>
                        {lic.status === "active" && (
                          <p className={isExpiring ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                            {daysLeft > 0 ? `${daysLeft} ${t("licenses.daysRemaining")}` : t("licenses.expiredToday")}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      {lic.status === "active" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          if (confirm("Sei sicuro di voler cancellare questa licenza?")) {
                            updateMutation.mutate({ id: lic.id, data: { status: "cancelled" } });
                          }
                        }} data-testid={`button-cancel-license-${lic.id}`}>
                          Cancella
                        </Button>
                      )}
                      {lic.status === "expired" && (
                        <Button size="sm" variant="outline" onClick={() => {
                          updateMutation.mutate({ id: lic.id, data: { status: "active", endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } });
                        }} data-testid={`button-renew-license-${lic.id}`}>
                          Rinnova 30gg
                        </Button>
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
