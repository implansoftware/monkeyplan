import { useMemo } from "react";
import { WidgetPreference, WidgetConfig, getWidgetRegistry } from "./widget-registry";

interface DashboardGridProps {
  role: "reseller" | "repair_center";
  layout: { widgets: WidgetPreference[] };
  widgetComponents: Record<string, React.ComponentType<any>>;
  widgetProps?: Record<string, any>;
}

export function DashboardGrid({ role, layout, widgetComponents, widgetProps = {} }: DashboardGridProps) {
  const registry = useMemo(() => getWidgetRegistry(role), [role]);
  const registryMap = useMemo(() => new Map(registry.map((w) => [w.id, w])), [registry]);

  const visibleWidgets = useMemo(() => {
    return layout.widgets
      .filter((w) => w.visible)
      .sort((a, b) => a.order - b.order)
      .map((pref) => ({
        preference: pref,
        config: registryMap.get(pref.id),
      }))
      .filter((item): item is { preference: WidgetPreference; config: WidgetConfig } => 
        item.config !== undefined
      );
  }, [layout.widgets, registryMap]);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-testid="dashboard-grid">
      {visibleWidgets.map(({ preference, config }) => {
        const Component = widgetComponents[preference.id];
        if (!Component) {
          return null;
        }
        const props = widgetProps[preference.id] || {};
        return (
          <div key={preference.id} data-testid={`widget-container-${preference.id}`}>
            <Component {...props} />
          </div>
        );
      })}
    </div>
  );
}
