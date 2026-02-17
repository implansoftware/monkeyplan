import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  AlertTriangle, Plus, Pencil, Trash2, GripVertical, Filter,
  AlertCircle, Ban, XCircle, Flame, Droplets, Cpu, Battery, Zap, 
  Shield, Wrench, HardDrive, Smartphone, Monitor, CircuitBoard,
  Skull, ThermometerSun, Waves, Bug, Bomb, ShieldX, CircleSlash,
  type LucideIcon
} from "lucide-react";

const ICON_ENTRIES: { name: string; icon: LucideIcon; labelKey: string }[] = [
  { name: "AlertTriangle", icon: AlertTriangle, labelKey: "icons.warning" },
  { name: "AlertCircle", icon: AlertCircle, labelKey: "icons.alert" },
  { name: "Ban", icon: Ban, labelKey: "icons.forbidden" },
  { name: "XCircle", icon: XCircle, labelKey: "icons.error" },
  { name: "Flame", icon: Flame, labelKey: "icons.burned" },
  { name: "Droplets", icon: Droplets, labelKey: "icons.oxidation" },
  { name: "Cpu", icon: Cpu, labelKey: "icons.cpu" },
  { name: "Battery", icon: Battery, labelKey: "icons.battery" },
  { name: "Zap", icon: Zap, labelKey: "icons.shortCircuit" },
  { name: "Shield", icon: Shield, labelKey: "icons.protection" },
  { name: "ShieldX", icon: ShieldX, labelKey: "icons.unprotected" },
  { name: "Wrench", icon: Wrench, labelKey: "icons.mechanical" },
  { name: "HardDrive", icon: HardDrive, labelKey: "icons.storage" },
  { name: "Smartphone", icon: Smartphone, labelKey: "icons.display" },
  { name: "Monitor", icon: Monitor, labelKey: "icons.screen" },
  { name: "CircuitBoard", icon: CircuitBoard, labelKey: "icons.motherboard" },
  { name: "Skull", icon: Skull, labelKey: "icons.unrepairable" },
  { name: "ThermometerSun", icon: ThermometerSun, labelKey: "icons.overheating" },
  { name: "Waves", icon: Waves, labelKey: "icons.liquid" },
  { name: "Bug", icon: Bug, labelKey: "icons.defect" },
  { name: "Bomb", icon: Bomb, labelKey: "icons.explosion" },
  { name: "CircleSlash", icon: CircleSlash, labelKey: "icons.unavailable" },
];

function getIconComponent(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null;
  const found = ICON_ENTRIES.find(i => i.name === iconName);
  return found?.icon || null;
}
import type { UnrepairableReason, DeviceType } from "@shared/schema";
import { useTranslation } from "react-i18next";

export default function AdminUnrepairableReasons() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<UnrepairableReason | null>(null);
  const [filterDeviceTypeId, setFilterDeviceTypeId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    deviceTypeId: "",
    isActive: true,
    sortOrder: 0,
  });

  const queryUrl = `/api/unrepairable-reasons?activeOnly=false${filterDeviceTypeId ? `&deviceTypeId=${filterDeviceTypeId}` : ''}`;

  const { data: reasons = [], isLoading } = useQuery<UnrepairableReason[]>({
    queryKey: [queryUrl],
  });

  const { data: deviceTypes = [] } = useQuery<DeviceType[]>({
    queryKey: ["/api/device-types"],
  });

  const invalidateReasonQueries = () => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === "string" && key.startsWith("/api/unrepairable-reasons");
      },
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/admin/unrepairable-reasons", {
        ...data,
        deviceTypeId: data.deviceTypeId || null,
      });
    },
    onSuccess: () => {
      invalidateReasonQueries();
      toast({ title: t("repairs.reasonCreated"), description: t("repairs.reasonCreatedDesc") });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/admin/unrepairable-reasons/${id}`, {
        ...data,
        deviceTypeId: data.deviceTypeId === "" ? null : data.deviceTypeId,
      });
    },
    onSuccess: () => {
      invalidateReasonQueries();
      toast({ title: t("repairs.reasonUpdated"), description: t("common.savedSuccessfully") });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await apiRequest("PATCH", `/api/admin/unrepairable-reasons/${id}`, { isActive });
    },
    onSuccess: () => {
      invalidateReasonQueries();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/unrepairable-reasons/${id}`);
    },
    onSuccess: () => {
      invalidateReasonQueries();
      toast({ title: t("repairs.reasonDeleted"), description: t("repairs.reasonDeletedDesc") });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: t("common.error"), description: error.message });
    },
  });

  const openCreateDialog = () => {
    setEditingReason(null);
    setFormData({
      name: "",
      description: "",
      icon: "",
      deviceTypeId: "",
      isActive: true,
      sortOrder: reasons.length + 1,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (reason: UnrepairableReason) => {
    setEditingReason(reason);
    setFormData({
      name: reason.name,
      description: reason.description || "",
      icon: reason.icon || "",
      deviceTypeId: reason.deviceTypeId || "",
      isActive: reason.isActive,
      sortOrder: reason.sortOrder,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingReason(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.nameRequired") });
      return;
    }
    if (editingReason) {
      updateMutation.mutate({ id: editingReason.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleActive = (reason: UnrepairableReason) => {
    toggleActiveMutation.mutate({ id: reason.id, isActive: !reason.isActive });
  };

  const getDeviceTypeName = (deviceTypeId: string | null) => {
    if (!deviceTypeId) return null;
    const dt = deviceTypes.find((d) => d.id === deviceTypeId);
    return dt?.name || deviceTypeId;
  };

  const sortedReasons = [...reasons].sort((a, b) => a.sortOrder - b.sortOrder);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <h1 className="text-2xl font-bold">{t("repairs.unrepairableReasons")}</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-2xl font-bold">{t("repairs.unrepairableReasons")}</h1>
            <p className="text-muted-foreground">
              {t("repairs.unrepairableReasonsDesc")}
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-reason">
          <Plus className="h-4 w-4 mr-2" />
          {t("repairs.newReason")}
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>{t("repairs.reasonList")} ({reasons.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={filterDeviceTypeId || "_all"}
              onValueChange={(v) => setFilterDeviceTypeId(v === "_all" ? "" : v)}
            >
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="filter-device-type">
                <SelectValue placeholder={t("common.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">{t("common.allTypes")}</SelectItem>
                {deviceTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-16">{t("utility.icon")}</TableHead>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("common.description")}</TableHead>
                <TableHead>{t("products.deviceType")}</TableHead>
                <TableHead>{t("common.active")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReasons.map((reason) => {
                const ReasonIcon = getIconComponent(reason.icon);
                return (
                <TableRow key={reason.id} data-testid={`row-reason-${reason.id}`}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    {ReasonIcon ? (
                      <ReasonIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{reason.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {reason.description || "-"}
                  </TableCell>
                  <TableCell>
                    {reason.deviceTypeId ? (
                      <Badge variant="outline">{getDeviceTypeName(reason.deviceTypeId)}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("products.universal")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={reason.isActive}
                      onCheckedChange={() => handleToggleActive(reason)}
                      disabled={toggleActiveMutation.isPending}
                      data-testid={`switch-active-${reason.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(reason)}
                        data-testid={`button-edit-reason-${reason.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(t("repairs.confirmDeleteReason"))) {
                            deleteMutation.mutate(reason.id);
                          }
                        }}
                        data-testid={`button-delete-reason-${reason.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
              })}
              {reasons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {t("repairs.noReasonsConfigured")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReason ? t("repairs.editReason") : t("repairs.newReason")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("repairs.reasonNamePlaceholder")}
                data-testid="input-reason-name"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("utility.icon")}</Label>
              <div className="grid grid-cols-6 gap-2 p-3 border rounded-md max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: "" })}
                  className={`p-2 rounded-md flex flex-col items-center gap-1 text-xs transition-colors ${
                    !formData.icon 
                      ? "bg-primary text-primary-foreground" 
                      : "hover-elevate"
                  }`}
                  data-testid="button-icon-none"
                >
                  <CircleSlash className="h-5 w-5" />
                  <span>{t("common.none")}</span>
                </button>
                {ICON_ENTRIES.map((iconItem) => {
                  const IconComp = iconItem.icon;
                  return (
                    <button
                      type="button"
                      key={iconItem.name}
                      onClick={() => setFormData({ ...formData, icon: iconItem.name })}
                      className={`p-2 rounded-md flex flex-col items-center gap-1 text-xs transition-colors ${
                        formData.icon === iconItem.name 
                          ? "bg-primary text-primary-foreground" 
                          : "hover-elevate"
                      }`}
                      data-testid={`button-icon-${iconItem.name}`}
                    >
                      <IconComp className="h-5 w-5" />
                      <span className="truncate w-full text-center">{t(iconItem.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("settings.optionalReasonDesc")}
                rows={2}
                data-testid="textarea-reason-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deviceType">{t("products.deviceType")}</Label>
              <Select
                value={formData.deviceTypeId || "_universal"}
                onValueChange={(v) => setFormData({ ...formData, deviceTypeId: v === "_universal" ? "" : v })}
              >
                <SelectTrigger data-testid="select-device-type">
                  <SelectValue placeholder={t("settings.universalAllDevices")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_universal">{t("settings.universalAllDevices")}</SelectItem>
                  {deviceTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("repairs.deviceTypeHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">{t("settings.displayOrder")}</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                data-testid="input-sort-order"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive">{t("common.active")}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-reason"
            >
              {editingReason ? t("common.saveChanges") : t("repairs.createReason")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
