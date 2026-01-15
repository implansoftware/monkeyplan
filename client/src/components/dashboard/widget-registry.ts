import { ComponentType } from "react";

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
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
    id: "stats-repairs",
    name: "Riparazioni Attive",
    description: "Card KPI riparazioni attive e totali",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: "stats-users",
    name: "Clienti",
    description: "Card KPI numero clienti gestiti",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: "stats-invoices",
    name: "Fatturato",
    description: "Card KPI fatturato da riparazioni",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: "stats-inventory",
    name: "Stock Magazzino",
    description: "Card KPI articoli in magazzino",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: "stats-tickets",
    name: "Interscambio",
    description: "Card richieste interscambio in sospeso",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: "stats-b2b-orders",
    name: "Ordini B2B",
    description: "Card ordini B2B in attesa",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: "stats-pos",
    name: "Pratiche Utility",
    description: "Card pratiche utility attive",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    id: "stats-network",
    name: "Centri Riparazione",
    description: "Card numero centri nella rete",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    id: "activity-sales",
    name: "Panoramica Vendite",
    description: "Riepilogo vendite da tutte le fonti",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    id: "management-quick-actions",
    name: "Azioni Rapide",
    description: "Accesso veloce alle funzionalità principali",
    category: "management",
    defaultVisible: true,
    defaultOrder: 10,
  },
  {
    id: "activity-repairs",
    name: "Attività Operativa",
    description: "Riparazioni in corso per stato",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 11,
  },
  {
    id: "activity-recent-repairs",
    name: "Ultime Riparazioni",
    description: "Lista riparazioni recenti",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 12,
  },
  {
    id: "chart-repairs-status",
    name: "Riparazioni per Stato",
    description: "Grafico a barre riparazioni per stato",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 13,
  },
  {
    id: "chart-work-status",
    name: "Stato Lavori",
    description: "Grafico a torta stato lavori",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 14,
  },
];

export const REPAIR_CENTER_WIDGETS: WidgetConfig[] = [
  {
    id: "stats-repairs",
    name: "Riparazioni",
    description: "Conteggio riparazioni attive e completate",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: "stats-queue",
    name: "Coda Lavoro",
    description: "Riparazioni in attesa di essere prese in carico",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: "stats-parts",
    name: "Ricambi",
    description: "Stato ricambi e ordini in corso",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: "stats-revenue",
    name: "Incassi",
    description: "Fatturato giornaliero e mensile",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: "stats-pos",
    name: "POS Cassa",
    description: "Statistiche punto vendita",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: "activity-repairs",
    name: "Riparazioni Attive",
    description: "Lista riparazioni in lavorazione",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: "activity-queue",
    name: "Coda Riparazioni",
    description: "Riparazioni pronte per essere assegnate",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    id: "activity-tickets",
    name: "Ticket Supporto",
    description: "Richieste di supporto dal reseller",
    category: "communications",
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    id: "management-quick-actions",
    name: "Azioni Rapide",
    description: "Accesso veloce alle funzionalità principali",
    category: "management",
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    id: "stats-b2b-orders",
    name: "Ordini Ricambi",
    description: "Ordini ricambi dal reseller",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 10,
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
