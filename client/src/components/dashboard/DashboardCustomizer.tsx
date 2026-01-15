import { useState, useMemo } from "react";
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
  getCategoryLabel,
  DashboardLayoutConfig 
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
        <Button variant="outline" size="sm" data-testid="button-customize-dashboard">
          <Settings className="h-4 w-4 mr-2" />
          Personalizza
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Personalizza Dashboard</DialogTitle>
          <DialogDescription>
            Attiva o disattiva i widget e riordinali trascinandoli.
            {" "}
            <span className="text-muted-foreground">
              ({visibleCount}/{totalCount} visibili)
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {Object.entries(groupedWidgets).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {getCategoryLabel(category as WidgetConfig["category"])}
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
                        <div className="font-medium text-sm">{config.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {config.description}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
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
            Ripristina
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-dashboard">
            {isSaving ? "Salvataggio..." : "Salva"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
