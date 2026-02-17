import { ComponentType } from "react";

export interface WidgetConfig {
  id: string;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  category: "stats" | "activity" | "management" | "integrations" | "communications";
  minWidth?: number;
  minHeight?: number;
  defaultVisible: boolean;
  defaultOrder: number;
}

export interface WidgetDefinition extends WidgetConfig {
  component: ComponentType<any>;
}

export interface WidgetPreference {
  id: string;
  visible: boolean;
  order: number;
}

export interface DashboardLayoutConfig {
  widgets: WidgetPreference[];
}

export const RESELLER_WIDGETS: WidgetConfig[] = [
  {
    id: "urgent-actions",
    name: "Needs Attention",
    nameKey: "dashboard.widgetUrgentActions",
    description: "Urgent items that require immediate action",
    descriptionKey: "dashboard.descUrgent",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 0,
  },
  {
    id: "stats-repairs",
    name: "Active Repairs",
    nameKey: "dashboard.widgetActiveRepairs",
    description: "Active and total repairs KPI",
    descriptionKey: "dashboard.descActiveRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: "stats-users",
    name: "Customers",
    nameKey: "dashboard.widgetCustomers",
    description: "Number of managed customers KPI",
    descriptionKey: "dashboard.descCustomers",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: "stats-invoices",
    name: "Revenue",
    nameKey: "dashboard.widgetRevenue",
    description: "Revenue from repairs KPI",
    descriptionKey: "dashboard.descRevenue",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: "stats-inventory",
    name: "Warehouse Stock",
    nameKey: "dashboard.widgetStock",
    description: "Warehouse items KPI",
    descriptionKey: "dashboard.descStock",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: "stats-tickets",
    name: "Exchange",
    nameKey: "dashboard.widgetExchange",
    description: "Pending exchange requests",
    descriptionKey: "dashboard.descExchange",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: "stats-b2b-orders",
    name: "B2B Orders",
    nameKey: "dashboard.widgetB2BOrders",
    description: "Pending B2B orders",
    descriptionKey: "dashboard.descB2BOrders",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: "stats-pos",
    name: "Utility Practices",
    nameKey: "dashboard.widgetUtilityPractices",
    description: "Active utility practices",
    descriptionKey: "dashboard.descUtilityPractices",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    id: "stats-network",
    name: "Repair Centers",
    nameKey: "dashboard.widgetRepairCenters",
    description: "Number of centers in network",
    descriptionKey: "dashboard.descRepairCenters",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    id: "activity-sales",
    name: "Sales Overview",
    nameKey: "dashboard.widgetSalesOverview",
    description: "Sales summary from all sources",
    descriptionKey: "dashboard.descSalesOverview",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    id: "management-quick-actions",
    name: "Quick Actions",
    nameKey: "dashboard.widgetQuickActions",
    description: "Quick access to main features",
    descriptionKey: "dashboard.descQuickActions",
    category: "management",
    defaultVisible: true,
    defaultOrder: 10,
  },
  {
    id: "activity-repairs",
    name: "Operational Activity",
    nameKey: "dashboard.widgetOperationalActivity",
    description: "Repairs in progress by status",
    descriptionKey: "dashboard.descOperationalActivity",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 11,
  },
  {
    id: "activity-recent-repairs",
    name: "Recent Repairs",
    nameKey: "dashboard.widgetRecentRepairs",
    description: "Recent repairs list",
    descriptionKey: "dashboard.descRecentRepairs",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 12,
  },
  {
    id: "chart-repairs-status",
    name: "Repairs by Status",
    nameKey: "dashboard.widgetRepairsByStatus",
    description: "Bar chart repairs by status",
    descriptionKey: "dashboard.descRepairsByStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 13,
  },
  {
    id: "chart-work-status",
    name: "Work Status",
    nameKey: "dashboard.widgetWorkStatus",
    description: "Pie chart work status",
    descriptionKey: "dashboard.descWorkStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 14,
  },
];

export const REPAIR_CENTER_WIDGETS: WidgetConfig[] = [
  {
    id: "stats-repairs",
    name: "Active Repairs",
    nameKey: "dashboard.widgetActiveRepairs",
    description: "Active and total repairs KPI",
    descriptionKey: "dashboard.descActiveRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: "stats-customers",
    name: "Customers",
    nameKey: "dashboard.widgetCustomers",
    description: "Number of assigned customers KPI",
    descriptionKey: "dashboard.descCustomersAssigned",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: "stats-revenue",
    name: "Revenue",
    nameKey: "dashboard.widgetRevenue",
    description: "Revenue from repairs KPI",
    descriptionKey: "dashboard.descRevenueRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: "stats-stock",
    name: "Warehouse Stock",
    nameKey: "dashboard.widgetStock",
    description: "Warehouse items KPI",
    descriptionKey: "dashboard.descStockItems",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: "stats-completed",
    name: "Completed",
    nameKey: "dashboard.widgetCompleted",
    description: "Completed repairs",
    descriptionKey: "dashboard.descCompletedRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: "stats-b2b-orders",
    name: "B2B Orders",
    nameKey: "dashboard.widgetB2BOrders",
    description: "Pending B2B orders",
    descriptionKey: "dashboard.descB2BOrdersPending",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: "stats-tickets",
    name: "Tickets",
    nameKey: "dashboard.widgetTickets",
    description: "Assigned support tickets",
    descriptionKey: "dashboard.descTicketsAssigned",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    id: "stats-customers-list",
    name: "Customer List",
    nameKey: "dashboard.widgetCustomersList",
    description: "Quick access to customer list",
    descriptionKey: "dashboard.descCustomersList",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    id: "management-quick-actions",
    name: "Quick Actions",
    nameKey: "dashboard.widgetQuickActions",
    description: "Quick access to main features",
    descriptionKey: "dashboard.descQuickActions",
    category: "management",
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    id: "activity-repairs",
    name: "Operational Activity",
    nameKey: "dashboard.widgetOperationalActivity",
    description: "Repairs in progress by status",
    descriptionKey: "dashboard.descOperationalActivity",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 10,
  },
  {
    id: "chart-repairs-status",
    name: "Repairs by Status",
    nameKey: "dashboard.widgetRepairsByStatus",
    description: "Bar chart repairs by status",
    descriptionKey: "dashboard.descRepairsByStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 11,
  },
  {
    id: "chart-work-status",
    name: "Work Status",
    nameKey: "dashboard.widgetWorkStatus",
    description: "Pie chart work status",
    descriptionKey: "dashboard.descWorkStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 12,
  },
  {
    id: "activity-recent-repairs",
    name: "Recent Repairs",
    nameKey: "dashboard.widgetRecentRepairs",
    description: "Recent repairs list",
    descriptionKey: "dashboard.descRecentRepairs",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 13,
  },
];

export function getDefaultLayout(role: "reseller" | "repair_center"): DashboardLayoutConfig {
  const widgets = role === "reseller" ? RESELLER_WIDGETS : REPAIR_CENTER_WIDGETS;
  return {
    widgets: widgets.map((w) => ({
      id: w.id,
      visible: w.defaultVisible,
      order: w.defaultOrder,
    })),
  };
}

export function getWidgetRegistry(role: "reseller" | "repair_center"): WidgetConfig[] {
  return role === "reseller" ? RESELLER_WIDGETS : REPAIR_CENTER_WIDGETS;
}

export function mergeLayoutWithDefaults(
  savedLayout: DashboardLayoutConfig | null,
  role: "reseller" | "repair_center"
): DashboardLayoutConfig {
  const defaults = getDefaultLayout(role);
  
  if (!savedLayout || !savedLayout.widgets) {
    return defaults;
  }

  const savedWidgetMap = new Map(savedLayout.widgets.map((w) => [w.id, w]));
  const mergedWidgets: WidgetPreference[] = [];

  for (const defaultWidget of defaults.widgets) {
    const saved = savedWidgetMap.get(defaultWidget.id);
    if (saved) {
      mergedWidgets.push(saved);
    } else {
      mergedWidgets.push(defaultWidget);
    }
  }

  mergedWidgets.sort((a, b) => a.order - b.order);

  return { widgets: mergedWidgets };
}

export const CATEGORY_LABEL_KEYS: Record<WidgetConfig["category"], string> = {
  stats: "dashboard.catStats",
  activity: "dashboard.catActivity",
  management: "dashboard.catManagement",
  integrations: "dashboard.catIntegrations",
  communications: "dashboard.catCommunications",
};

export function getCategoryLabel(category: WidgetConfig["category"]): string {
  const labels: Record<WidgetConfig["category"], string> = {
    stats: "Statistics",
    activity: "Recent Activity",
    management: "Management",
    integrations: "Integrations",
    communications: "Communications",
  };
  return labels[category];
}
