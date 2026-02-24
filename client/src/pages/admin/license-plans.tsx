import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, CreditCard, Clock, Users, Tag, Wrench, Package, FileText, ShoppingCart, Store, BarChart3, Headphones, Shield, Smartphone, Receipt, RefreshCw, Loader2, Bot, Truck, Factory, CalendarClock, FileSpreadsheet, Monitor, Phone, Mail, Network, ClipboardList, Hammer, BookOpen } from "lucide-react";
import { SiStripe } from "react-icons/si";
import type { LicensePlan } from "@shared/schema";
import { useTranslation } from "react-i18next";

const TARGET_LABEL_KEYS: Record<string, string> = {
  all: "license.targetAll",
  standard: "admin.resellers.standard",
  franchising: "admin.resellers.franchising",
  gdo: "admin.resellers.gdo",
};

const DURATION_LABEL_KEYS: Record<number, string> = {
  1: "license.durationLabel1",
  3: "license.months3",
  6: "license.months6",
  12: "license.months12",
};

const AVAILABLE_FEATURES = [
  { id: "repairs", label: "Repair Management", labelKey: "license.featureRepairs", icon: Wrench },
  { id: "warehouse", label: "Warehouse & Inventory", labelKey: "license.featureWarehouse", icon: Package },
  { id: "invoicing", label: "Invoicing", labelKey: "license.featureInvoicing", icon: FileText },
  { id: "pos", label: "POS & Receipts", labelKey: "license.featurePos", icon: Receipt },
  { id: "fiscal_rt", label: "Fiscal Register (RT)", labelKey: "license.featureFiscalRt", icon: Receipt },
  { id: "b2b_orders", label: "B2B Orders", labelKey: "license.featureB2bOrders", icon: ShoppingCart },
  { id: "marketplace", label: "P2P Marketplace", labelKey: "license.featureMarketplace", icon: Store },
  { id: "analytics", label: "Statistics & Reports", labelKey: "license.featureAnalytics", icon: BarChart3 },
  { id: "ticketing", label: "Ticketing & Support", labelKey: "license.featureTicketing", icon: Headphones },
  { id: "warranty", label: "Warranties & Insurance", labelKey: "license.featureWarranty", icon: Shield },
  { id: "push_notifications", label: "Push Notifications", labelKey: "license.featurePushNotifications", icon: Smartphone },
  { id: "crm", label: "Customer Management", labelKey: "license.featureCrm", icon: Users },
  { id: "payments", label: "Online Payments", labelKey: "license.featurePayments", icon: CreditCard },
  { id: "ai_assistant", label: "AI Assistant", labelKey: "license.featureAiAssistant", icon: Bot },
  { id: "shipping", label: "Shipping & Logistics", labelKey: "license.featureShipping", icon: Truck },
  { id: "suppliers", label: "Suppliers & Procurement", labelKey: "license.featureSuppliers", icon: Factory },
  { id: "hr", label: "HR & Staff Management", labelKey: "license.featureHr", icon: CalendarClock },
  { id: "quotes", label: "Standalone Quotes", labelKey: "license.featureQuotes", icon: ClipboardList },
  { id: "remote_requests", label: "Remote Repair Requests", labelKey: "license.featureRemoteRequests", icon: Monitor },
  { id: "device_catalog", label: "Device & Parts Catalog", labelKey: "license.featureDeviceCatalog", icon: Hammer },
  { id: "courtesy_phones", label: "Courtesy Phones", labelKey: "license.featureCourtesyPhones", icon: Phone },
  { id: "email_notifications", label: "Email Notifications", labelKey: "license.featureEmailNotifications", icon: Mail },
  { id: "sub_resellers", label: "Sub-Reseller Network", labelKey: "license.featureSubResellers", icon: Network },
  { id: "price_lists", label: "Price Lists", labelKey: "license.featurePriceLists", icon: BookOpen },
  { id: "csv_import", label: "CSV Import", labelKey: "license.featureCsvImport", icon: FileSpreadsheet },
];

const MAX_STAFF_OPTIONS = [
  { value: "1", labelKey: "license.user1" },
  { value: "3", labelKey: "license.users3" },
  { value: "5", labelKey: "license.users5" },
  { value: "10", labelKey: "license.users10" },
  { value: "25", labelKey: "license.users25" },
  { value: "50", labelKey: "license.users50" },
  { value: "unlimited", labelKey: "license.unlimited" },
];

function parseExistingFeatures(features: string | null | undefined): { selected: Set<string>; custom: string[] } {
  if (!features) return { selected: new Set(), custom: [] };
  const lines = features.split("\n").map(l => l.trim()).filter(Boolean);
  const selected = new Set<string>();
  const custom: string[] = [];
  for (const line of lines) {
    const match = AVAILABLE_FEATURES.find(
      f => f.label.toLowerCase() === line.toLowerCase() || f.id === line.toLowerCase()
    );
    if (match) {
      selected.add(match.id);
    } else {
      custom.push(line);
    }
  }
  return { selected, custom };
}

function PlanForm({ plan, onSave, onCancel }: { plan?: LicensePlan; onSave: (data: any) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(plan?.name || "");
  const [description, setDescription] = useState(plan?.description || "");
  const [targetCategory, setTargetCategory] = useState<string>(plan?.targetCategory || "all");
  const [durationMonths, setDurationMonths] = useState(String(plan?.durationMonths || "1"));
  const [priceCents, setPriceCents] = useState(String(plan ? (plan.priceCents / 100).toFixed(2) : ""));
  const [parsedData] = useState(() => parseExistingFeatures(plan?.features));
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(() => parsedData.selected);
  const [customFeatures] = useState<string[]>(() => parsedData.custom);
  const [maxStaffUsers, setMaxStaffUsers] = useState<string>(() => {
    if (plan?.maxStaffUsers === null || plan?.maxStaffUsers === undefined) return "unlimited";
    return String(plan.maxStaffUsers);
  });
  const [isActive, setIsActive] = useState(plan?.isActive !== false);
  const [sortOrder, setSortOrder] = useState(String(plan?.sortOrder || 0));

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
      }
      return next;
    });
  };

  const selectAllFeatures = () => {
    setSelectedFeatures(new Set(AVAILABLE_FEATURES.map(f => f.id)));
  };

  const clearAllFeatures = () => {
    setSelectedFeatures(new Set());
  };

  const handleSubmit = () => {
    if (!name.trim() || !priceCents) return;
    const selectedLabels = AVAILABLE_FEATURES
      .filter(f => selectedFeatures.has(f.id))
      .map(f => f.id);
    const allFeatures = [...selectedLabels, ...customFeatures];
    const featuresString = allFeatures.length > 0 ? allFeatures.join("\n") : null;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      targetCategory,
      durationMonths: parseInt(durationMonths),
      priceCents: Math.round(parseFloat(priceCents) * 100),
      features: featuresString,
      maxStaffUsers: maxStaffUsers === "unlimited" ? null : parseInt(maxStaffUsers),
      isActive,
      sortOrder: parseInt(sortOrder) || 0,
    });
  };

  return (
    <ScrollArea className="max-h-[70vh]">
      <div className="space-y-5 pr-4">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("license.basicInfo")}</p>
          <div className="space-y-2">
            <Label>{t("license.planNameLabel")}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("license.planNamePlaceholder")} data-testid="input-plan-name" />
          </div>
          <div className="space-y-2">
            <Label>{t("common.description")}</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder={t("license.planDescriptionPlaceholder")} data-testid="input-plan-description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("license.targetCategory")}</Label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger data-testid="select-target-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allMasc")}</SelectItem>
                  <SelectItem value="standard">{t("admin.resellers.standard")}</SelectItem>
                  <SelectItem value="franchising">{t("admin.resellers.franchising")}</SelectItem>
                  <SelectItem value="gdo">{t("admin.resellers.gdo")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.duration")}</Label>
              <Select value={durationMonths} onValueChange={setDurationMonths}>
                <SelectTrigger data-testid="select-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("license.month1")}</SelectItem>
                  <SelectItem value="3">{t("license.months3")}</SelectItem>
                  <SelectItem value="6">{t("license.months6")}</SelectItem>
                  <SelectItem value="12">{t("license.months12")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("license.priceAndLimits")}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("license.priceEur")}</Label>
              <Input type="number" step="0.01" min="0" value={priceCents} onChange={e => setPriceCents(e.target.value)} placeholder="29.99" data-testid="input-plan-price" />
            </div>
            <div className="space-y-2">
              <Label>{t("license.maxStaffUsers")}</Label>
              <Select value={maxStaffUsers} onValueChange={setMaxStaffUsers}>
                <SelectTrigger data-testid="select-max-staff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MAX_STAFF_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("license.featuresIncluded")}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAllFeatures} data-testid="button-select-all-features">
                {t("license.selectAll")}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAllFeatures} data-testid="button-clear-all-features">
                {t("license.deselectAll")}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_FEATURES.map(feature => {
              const Icon = feature.icon;
              return (
                <label
                  key={feature.id}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover-elevate"
                  data-testid={`checkbox-feature-${feature.id}`}
                >
                  <Checkbox
                    checked={selectedFeatures.has(feature.id)}
                    onCheckedChange={() => toggleFeature(feature.id)}
                  />
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm">{t(feature.labelKey)}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("license.featuresSelected", { selected: selectedFeatures.size, total: AVAILABLE_FEATURES.length })}
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{t("license.optionsLabel")}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("settings.displayOrder")}</Label>
              <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} data-testid="input-sort-order" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-is-active" />
              <Label>{t("license.activePlan")}</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-plan">{t("common.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !priceCents} data-testid="button-save-plan">
            {plan ? t("license.update") : t("license.createPlan")}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}

export default function AdminLicensePlans() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: plans, isLoading } = useQuery<LicensePlan[]>({
    queryKey: ["/api/admin/license-plans"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/license-plans", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      setIsCreateOpen(false);
      toast({ title: t("license.planCreated") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/license-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      setEditingPlan(null);
      toast({ title: t("license.planUpdated") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/license-plans/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      toast({ title: t("license.planDeleted") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    },
  });

  const [syncingPlanId, setSyncingPlanId] = useState<string | null>(null);
  const syncStripeMutation = useMutation({
    mutationFn: async (planId: string) => {
      setSyncingPlanId(planId);
      const res = await apiRequest("POST", `/api/admin/license-plans/${planId}/sync-stripe`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/license-plans"] });
      toast({ title: t("license.syncSuccess"), description: t("license.syncSuccessDesc") });
      setSyncingPlanId(null);
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
      setSyncingPlanId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t("license.licensePlans")}</h1>
          <p className="text-sm text-muted-foreground">{t("license.managePlansDesc")}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-plan"><Plus className="w-4 h-4 mr-2" /> {t("license.newPlan")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("license.createNewPlan")}</DialogTitle>
            </DialogHeader>
            <PlanForm
              onSave={(data) => createMutation.mutate(data)}
              onCancel={() => setIsCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {(!plans || plans.length === 0) ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">{t("license.noPlansCreated")}</p>
            <p className="text-sm mt-1">{t("license.createFirstPlan")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""} data-testid={`card-plan-${plan.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{plan.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {t(TARGET_LABEL_KEYS[plan.targetCategory] || "common.allMasc")}
                    </Badge>
                    {!plan.isActive && <Badge variant="secondary" className="text-xs">{t("license.inactive")}</Badge>}
                    {(plan as any).stripePriceId && (
                      <Badge variant="default" className="text-xs" data-testid={`badge-stripe-synced-${plan.id}`}>
                        <SiStripe className="w-3 h-3 mr-1" />
                        {t("license.stripeSynced")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {plan.priceCents > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => syncStripeMutation.mutate(plan.id)}
                      disabled={syncingPlanId === plan.id}
                      title={t("license.syncWithStripe")}
                      data-testid={`button-sync-stripe-${plan.id}`}
                    >
                      {syncingPlanId === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <SiStripe className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Dialog open={editingPlan?.id === plan.id} onOpenChange={(open) => !open && setEditingPlan(null)}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => setEditingPlan(plan)} data-testid={`button-edit-plan-${plan.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{t("license.editPlan")}</DialogTitle>
                      </DialogHeader>
                      {editingPlan && (
                        <PlanForm
                          plan={editingPlan}
                          onSave={(data) => updateMutation.mutate({ id: editingPlan.id, data })}
                          onCancel={() => setEditingPlan(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm(t("license.confirmDeletePlan"))) {
                      deleteMutation.mutate(plan.id);
                    }
                  }} data-testid={`button-delete-plan-${plan.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-3xl font-bold">{(plan.priceCents / 100).toFixed(2)} EUR</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t(DURATION_LABEL_KEYS[plan.durationMonths] || "license.months12")}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
                {plan.maxStaffUsers && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {t("license.maxStaffLabel", { count: plan.maxStaffUsers })}
                  </div>
                )}
                {plan.features && (
                  <div className="text-sm space-y-1 pt-2 border-t">
                    {plan.features.split("\n").filter(Boolean).map((f, i) => {
                      const trimmed = f.trim();
                      const feature = AVAILABLE_FEATURES.find(
                        feat => feat.id === trimmed || feat.label.toLowerCase() === trimmed.toLowerCase()
                      );
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 shrink-0">&#10003;</span>
                          <span>{feature ? t(feature.labelKey) : trimmed}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
