export interface RepairStatusConfig {
  key: string;
  label: string;
  labelKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  showInKanban: boolean;
  order: number;
}

export const REPAIR_STATUS_CONFIG: Record<string, RepairStatusConfig> = {
  pending: {
    key: "pending",
    label: "In Attesa",
    labelKey: "repairs.status.pending",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    showInKanban: true,
    order: 0,
  },
  in_progress: {
    key: "in_progress",
    label: "In Lavorazione",
    labelKey: "repairs.status.inProgress",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    showInKanban: true,
    order: 0.5,
  },
  ingressato: {
    key: "ingressato",
    label: "Ingressato",
    labelKey: "repairs.status.received",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    showInKanban: true,
    order: 1,
  },
  in_diagnosi: {
    key: "in_diagnosi",
    label: "In Diagnosi",
    labelKey: "repairs.status.inDiagnosis",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    showInKanban: true,
    order: 2,
  },
  preventivo_emesso: {
    key: "preventivo_emesso",
    label: "Preventivo Emesso",
    labelKey: "repairs.status.quoteIssued",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-800",
    showInKanban: true,
    order: 3,
  },
  preventivo_accettato: {
    key: "preventivo_accettato",
    label: "Preventivo Accettato",
    labelKey: "repairs.status.quoteAccepted",
    color: "text-green-700 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    showInKanban: true,
    order: 4,
  },
  preventivo_rifiutato: {
    key: "preventivo_rifiutato",
    label: "Preventivo Rifiutato",
    labelKey: "repairs.status.quoteRejected",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    showInKanban: true,
    order: 5,
  },
  attesa_ricambi: {
    key: "attesa_ricambi",
    label: "Ordina Parti",
    labelKey: "repairs.status.orderParts",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    showInKanban: true,
    order: 6,
  },
  in_riparazione: {
    key: "in_riparazione",
    label: "In Riparazione",
    labelKey: "repairs.status.inRepair",
    color: "text-cyan-700 dark:text-cyan-400",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/30",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    showInKanban: true,
    order: 7,
  },
  in_test: {
    key: "in_test",
    label: "In Test",
    labelKey: "repairs.status.inTest",
    color: "text-indigo-700 dark:text-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    showInKanban: true,
    order: 8,
  },
  pronto_ritiro: {
    key: "pronto_ritiro",
    label: "Pronto Ritiro",
    labelKey: "repairs.status.readyForPickup",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    showInKanban: true,
    order: 9,
  },
  consegnato: {
    key: "consegnato",
    label: "Consegnato",
    labelKey: "repairs.status.delivered",
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    showInKanban: false,
    order: 10,
  },
  waiting_parts: {
    key: "waiting_parts",
    label: "Attesa Ricambi",
    labelKey: "repairs.status.waitingParts",
    color: "text-yellow-700 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    showInKanban: true,
    order: 6.5,
  },
  completed: {
    key: "completed",
    label: "Completato",
    labelKey: "repairs.status.completed",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    showInKanban: true,
    order: 9.5,
  },
  delivered: {
    key: "delivered",
    label: "Consegnato",
    labelKey: "repairs.status.delivered",
    color: "text-gray-700 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-950/30",
    borderColor: "border-gray-200 dark:border-gray-800",
    showInKanban: false,
    order: 10.5,
  },
  cancelled: {
    key: "cancelled",
    label: "Annullato",
    labelKey: "repairs.status.cancelled",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    showInKanban: false,
    order: 11,
  },
  annullato: {
    key: "annullato",
    label: "Annullato",
    labelKey: "repairs.status.cancelled",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    showInKanban: false,
    order: 12,
  },
};

export const KANBAN_COLUMNS = Object.values(REPAIR_STATUS_CONFIG)
  .filter(s => s.showInKanban)
  .sort((a, b) => a.order - b.order);

export function getStatusConfig(status: string): RepairStatusConfig | undefined {
  return REPAIR_STATUS_CONFIG[status];
}
