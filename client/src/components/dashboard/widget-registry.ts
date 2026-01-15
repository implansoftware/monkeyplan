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
    id: "stats-users",
    name: "Utenti Attivi",
    description: "Statistiche utenti e centri di riparazione",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 1,
  },
  {
    id: "stats-repairs",
    name: "Riparazioni",
    description: "Conteggio riparazioni in corso, completate e in attesa",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 2,
  },
  {
    id: "stats-inventory",
    name: "Inventario",
    description: "Stato magazzino e prodotti a basso stock",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 3,
  },
  {
    id: "stats-tickets",
    name: "Ticket Supporto",
    description: "Conteggio ticket aperti e in sospeso",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 4,
  },
  {
    id: "stats-invoices",
    name: "Fatturazione",
    description: "Fatture emesse e da incassare",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 5,
  },
  {
    id: "stats-b2b-orders",
    name: "Ordini B2B",
    description: "Ordini in attesa di elaborazione",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 6,
  },
  {
    id: "stats-pos",
    name: "POS Cassa",
    description: "Statistiche punto vendita",
    category: "stats",
    defaultVisible: true,
    defaultOrder: 7,
  },
  {
    id: "activity-repairs",
    name: "Riparazioni Recenti",
    description: "Lista ultime riparazioni",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 8,
  },
  {
    id: "activity-tickets",
    name: "Ticket Recenti",
    description: "Lista ultimi ticket di supporto",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 9,
  },
  {
    id: "activity-b2b",
    name: "Ordini B2B Recenti",
    description: "Lista ultimi ordini B2B",
    category: "activity",
    defaultVisible: true,
    defaultOrder: 10,
  },
  {
    id: "activity-internal-tickets",
    name: "Ticket Interni",
    description: "Comunicazioni interne con centri di riparazione",
    category: "communications",
    defaultVisible: true,
    defaultOrder: 11,
  },
  {
    id: "management-quick-actions",
    name: "Azioni Rapide",
    description: "Accesso veloce alle funzionalità principali",
    category: "management",
    defaultVisible: true,
    defaultOrder: 12,
  },
  {
    id: "integrations-status",
    name: "Stato Integrazioni",
    description: "Panoramica connessioni API esterne",
    category: "integrations",
    defaultVisible: false,
    defaultOrder: 13,
  },
  {
    id: "stats-pos-sessions",
    name: "Sessioni POS",
    description: "Sessioni cassa dei centri di riparazione",
    category: "stats",
    defaultVisible: false,
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
