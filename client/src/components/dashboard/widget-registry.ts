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
    name: "Richiede Attenzione",
    nameKey: "dashboard.widgetUrgentActions",
    description: "Elementi urgenti che richiedono azione immediata",
    descriptionKey: "dashboard.descUrgent",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 0,
  },
  {
    id: "stats-repairs",
    name: "Riparazioni Attive",
    nameKey: "dashboard.widgetActiveRepairs",
    description: "Card KPI riparazioni attive e totali",
    descriptionKey: "dashboard.descActiveRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: "stats-users",
    name: "Clienti",
    nameKey: "dashboard.widgetCustomers",
    description: "Card KPI numero clienti gestiti",
    descriptionKey: "dashboard.descCustomers",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: "stats-invoices",
    name: "Fatturato",
    nameKey: "dashboard.widgetRevenue",
    description: "Card KPI fatturato da riparazioni",
    descriptionKey: "dashboard.descRevenue",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: "stats-inventory",
    name: "Stock Magazzino",
    nameKey: "dashboard.widgetStock",
    description: "Card KPI articoli in magazzino",
    descriptionKey: "dashboard.descStock",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: "stats-tickets",
    name: "Interscambio",
    nameKey: "dashboard.widgetExchange",
    description: "Card richieste interscambio in sospeso",
    descriptionKey: "dashboard.descExchange",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: "stats-b2b-orders",
    name: "Ordini B2B",
    nameKey: "dashboard.widgetB2BOrders",
    description: "Card ordini B2B in attesa",
    descriptionKey: "dashboard.descB2BOrders",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: "stats-pos",
    name: "Pratiche Utility",
    nameKey: "dashboard.widgetUtilityPractices",
    description: "Card pratiche utility attive",
    descriptionKey: "dashboard.descUtilityPractices",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    id: "stats-network",
    name: "Centri Riparazione",
    nameKey: "dashboard.widgetRepairCenters",
    description: "Card numero centri nella rete",
    descriptionKey: "dashboard.descRepairCenters",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    id: "activity-sales",
    name: "Panoramica Vendite",
    nameKey: "dashboard.widgetSalesOverview",
    description: "Riepilogo vendite da tutte le fonti",
    descriptionKey: "dashboard.descSalesOverview",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    id: "management-quick-actions",
    name: "Azioni Rapide",
    nameKey: "dashboard.widgetQuickActions",
    description: "Accesso veloce alle funzionalità principali",
    descriptionKey: "dashboard.descQuickActions",
    category: "management",
    defaultVisible: true,
    defaultOrder: 10,
  },
  {
    id: "activity-repairs",
    name: "Attività Operativa",
    nameKey: "dashboard.widgetOperationalActivity",
    description: "Riparazioni in corso per stato",
    descriptionKey: "dashboard.descOperationalActivity",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 11,
  },
  {
    id: "activity-recent-repairs",
    name: "Ultime Riparazioni",
    nameKey: "dashboard.widgetRecentRepairs",
    description: "Lista riparazioni recenti",
    descriptionKey: "dashboard.descRecentRepairs",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 12,
  },
  {
    id: "chart-repairs-status",
    name: "Riparazioni per Stato",
    nameKey: "dashboard.widgetRepairsByStatus",
    description: "Grafico a barre riparazioni per stato",
    descriptionKey: "dashboard.descRepairsByStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 13,
  },
  {
    id: "chart-work-status",
    name: "Stato Lavori",
    nameKey: "dashboard.widgetWorkStatus",
    description: "Grafico a torta stato lavori",
    descriptionKey: "dashboard.descWorkStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 14,
  },
];

export const REPAIR_CENTER_WIDGETS: WidgetConfig[] = [
  {
    id: "stats-repairs",
    name: "Riparazioni Attive",
    nameKey: "dashboard.widgetActiveRepairs",
    description: "Card KPI riparazioni attive e totali",
    descriptionKey: "dashboard.descActiveRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: "stats-customers",
    name: "Clienti",
    nameKey: "dashboard.widgetCustomers",
    description: "Card KPI numero clienti assegnati",
    descriptionKey: "dashboard.descCustomersAssigned",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: "stats-revenue",
    name: "Fatturato",
    nameKey: "dashboard.widgetRevenue",
    description: "Card KPI fatturato da riparazioni",
    descriptionKey: "dashboard.descRevenueRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: "stats-stock",
    name: "Stock Magazzino",
    nameKey: "dashboard.widgetStock",
    description: "Card KPI articoli in magazzino",
    descriptionKey: "dashboard.descStockItems",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: "stats-completed",
    name: "Completate",
    nameKey: "dashboard.widgetCompleted",
    description: "Riparazioni completate",
    descriptionKey: "dashboard.descCompletedRepairs",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: "stats-b2b-orders",
    name: "Ordini B2B",
    nameKey: "dashboard.widgetB2BOrders",
    description: "Ordini B2B in attesa",
    descriptionKey: "dashboard.descB2BOrdersPending",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: "stats-tickets",
    name: "Ticket",
    nameKey: "dashboard.widgetTickets",
    description: "Ticket di supporto assegnati",
    descriptionKey: "dashboard.descTicketsAssigned",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    id: "stats-customers-list",
    name: "Lista Clienti",
    nameKey: "dashboard.widgetCustomersList",
    description: "Accesso rapido alla lista clienti",
    descriptionKey: "dashboard.descCustomersList",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    id: "management-quick-actions",
    name: "Azioni Rapide",
    nameKey: "dashboard.widgetQuickActions",
    description: "Accesso veloce alle funzionalità principali",
    descriptionKey: "dashboard.descQuickActions",
    category: "management",
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    id: "activity-repairs",
    name: "Attività Operativa",
    nameKey: "dashboard.widgetOperationalActivity",
    description: "Riparazioni in corso per stato",
    descriptionKey: "dashboard.descOperationalActivity",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 10,
  },
  {
    id: "chart-repairs-status",
    name: "Riparazioni per Stato",
    nameKey: "dashboard.widgetRepairsByStatus",
    description: "Grafico a barre riparazioni per stato",
    descriptionKey: "dashboard.descRepairsByStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 11,
  },
  {
    id: "chart-work-status",
    name: "Stato Lavori",
    nameKey: "dashboard.widgetWorkStatus",
    description: "Grafico a torta stato lavori",
    descriptionKey: "dashboard.descWorkStatus",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 12,
  },
  {
    id: "activity-recent-repairs",
    name: "Ultime Riparazioni",
    nameKey: "dashboard.widgetRecentRepairs",
    description: "Lista riparazioni recenti",
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
    stats: "Statistiche",
    activity: "Attività Recente",
    management: "Gestione",
    integrations: "Integrazioni",
    communications: "Comunicazioni",
  };
  return labels[category];
}
