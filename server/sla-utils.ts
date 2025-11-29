import { storage } from "./storage";
import { differenceInMinutes } from "date-fns";

export interface SLAThresholds {
  lateMinutes: number;
  urgentMinutes: number;
}

export interface SLAConfig {
  diagnosis: SLAThresholds;
  quote: SLAThresholds;
  parts: SLAThresholds;
  test: SLAThresholds;
  delivery: SLAThresholds;
}

export const defaultSLAConfig: SLAConfig = {
  diagnosis: { lateMinutes: 1440, urgentMinutes: 2880 },
  quote: { lateMinutes: 720, urgentMinutes: 1440 },
  parts: { lateMinutes: 4320, urgentMinutes: 10080 },
  test: { lateMinutes: 480, urgentMinutes: 1440 },
  delivery: { lateMinutes: 1440, urgentMinutes: 4320 },
};

export type SLASeverity = "in_time" | "late" | "urgent";

export const statusToPhaseMap: Record<string, keyof SLAConfig | null> = {
  ingressato: "diagnosis",
  in_diagnosi: "diagnosis",
  preventivo_emesso: "quote",
  preventivo_accettato: "parts",
  attesa_ricambi: "parts",
  in_riparazione: null,
  in_test: "test",
  pronto_ritiro: "delivery",
  consegnato: null,
  cancelled: null,
  annullato: null,
};

export const phaseLabels: Record<string, string> = {
  diagnosis: "Diagnosi",
  quote: "Preventivo",
  parts: "Ricambi",
  test: "Test",
  delivery: "Consegna",
};

export function computeSLASeverity(
  status: string,
  stateEnteredAt: Date,
  slaConfig: SLAConfig = defaultSLAConfig
): { severity: SLASeverity | null; minutesInState: number; phase: string | null } {
  const phase = statusToPhaseMap[status];
  if (!phase) {
    return { severity: null, minutesInState: 0, phase: null };
  }

  const thresholds = slaConfig[phase];
  if (!thresholds) {
    return { severity: "in_time", minutesInState: 0, phase };
  }

  const minutesInState = differenceInMinutes(new Date(), stateEnteredAt);

  if (minutesInState >= thresholds.urgentMinutes) {
    return { severity: "urgent", minutesInState, phase };
  }
  if (minutesInState >= thresholds.lateMinutes) {
    return { severity: "late", minutesInState, phase };
  }

  return { severity: "in_time", minutesInState, phase };
}

export async function loadSLAConfig(): Promise<SLAConfig> {
  try {
    const setting = await storage.getAdminSetting("sla_thresholds");
    if (setting) {
      return JSON.parse(setting.settingValue) as SLAConfig;
    }
  } catch (error) {
    console.error("Error loading SLA config, using defaults:", error);
  }
  return defaultSLAConfig;
}

export interface RepairWithSLA {
  id: string;
  slaSeverity: SLASeverity | null;
  slaMinutesInState: number;
  slaPhase: string | null;
  slaEnteredAt: string | null;
}

export async function computeRepairSLA(
  repairId: string,
  status: string,
  createdAt: Date
): Promise<RepairWithSLA> {
  const slaConfig = await loadSLAConfig();
  const currentState = await storage.getCurrentRepairOrderState(repairId);
  const stateEnteredAt = currentState?.enteredAt || createdAt;
  
  const { severity, minutesInState, phase } = computeSLASeverity(status, stateEnteredAt, slaConfig);
  
  return {
    id: repairId,
    slaSeverity: severity,
    slaMinutesInState: minutesInState,
    slaPhase: phase,
    slaEnteredAt: stateEnteredAt.toISOString(),
  };
}
