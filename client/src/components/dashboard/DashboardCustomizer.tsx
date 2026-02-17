import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, GripVertical, Eye, EyeOff, RotateCcw } from "lucide-react";
import { 
  WidgetPreference, 
  WidgetConfig, 
  getWidgetRegistry, 
  getDefaultLayout,
  DashboardLayoutConfig,
  CATEGORY_LABEL_KEYS
} from "./widget-registry";

interface DashboardCustomizerProps {
  role: "reseller" | "repair_center";
  currentLayout: DashboardLayoutConfig;
  onSave: (layout: DashboardLayoutConfig) => void;
  isSaving?: boolean;
}

export function DashboardCustomizer({ 
  role, 
  currentLayout, 
  onSave, 
  isSaving = false 
}: DashboardCustomizerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [widgets, setWidgets] = useState<WidgetPreference[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const registry = useMemo(() => getWidgetRegistry(role), [role]);
  const registryMap = useMemo(() => new Map(registry.map((w) => [w.id, w])), [registry]);

  const handleOpen = () => {
    setWidgets([...currentLayout.widgets].sort((a, b) => a.order - b.order));
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setDraggedIndex(null);
  };

  const handleToggle = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[draggedIndex];
    newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(index, 0, draggedWidget);
    
    newWidgets.forEach((w, i) => {
      w.order = i + 1;
    });

    setWidgets(newWidgets);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleReset = () => {
    const defaults = getDefaultLayout(role);
    const sortedDefaults = [...defaults.widgets].sort((a, b) => a.order - b.order);
    setWidgets(sortedDefaults);
    onSave({ widgets: sortedDefaults });
    handleClose();
  };

  const handleSave = () => {
    onSave({ widgets });
    handleClose();
  };

  const groupedWidgets = useMemo(() => {
    const groups: Record<string, { widget: WidgetPreference; config: WidgetConfig }[]> = {};
    
    for (const widget of widgets) {
      const config = registryMap.get(widget.id);
      if (!config) continue;
      
      const category = config.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ widget, config });
    }
    
    return groups;
  }, [widgets, registryMap]);

  const visibleCount = widgets.filter((w) => w.visible).length;
  const totalCount = widgets.length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? handleOpen() : handleClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm border-white/50 text-emerald-700 shadow-lg" data-testid="button-customize-dashboard">
          <Settings className="h-4 w-4 mr-2" />
          {t("dashboard.customize")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("dashboard.customizeDashboard")}</DialogTitle>
          <DialogDescription>
            {t("dashboard.customizeDesc")}
            {" "}
            <span className="text-muted-foreground">
              ({visibleCount}/{totalCount} {t("dashboard.visible")})
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {Object.entries(groupedWidgets).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {t(CATEGORY_LABEL_KEYS[category as WidgetConfig["category"]])}
              </h4>
              <div className="space-y-2">
                {items.map(({ widget, config }) => {
                  const index = widgets.findIndex((w) => w.id === widget.id);
                  return (
                    <div
                      key={widget.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${
                        draggedIndex === index
                          ? "bg-accent border-accent"
                          : "bg-card hover-elevate"
                      } ${!widget.visible ? "opacity-60" : ""}`}
                      data-testid={`widget-item-${widget.id}`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{t(config.nameKey)}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {t(config.descriptionKey)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {widget.visible ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Switch
                          checked={widget.visible}
                          onCheckedChange={() => handleToggle(widget.id)}
                          data-testid={`switch-widget-${widget.id}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isSaving}
            data-testid="button-reset-dashboard"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("common.restore")}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-dashboard">
            {isSaving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
