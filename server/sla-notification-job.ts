import { storage } from "./storage";
import { db } from "./db";
import { repairOrders, users, notifications } from "@shared/schema";
import { eq, and, not, inArray, isNull } from "drizzle-orm";
import { differenceInMinutes } from "date-fns";

interface SLAThresholds {
  lateMinutes: number;
  urgentMinutes: number;
}

interface SLAConfig {
  diagnosis: SLAThresholds;
  quote: SLAThresholds;
  parts: SLAThresholds;
  test: SLAThresholds;
  delivery: SLAThresholds;
}

const defaultSLAConfig: SLAConfig = {
  diagnosis: { lateMinutes: 1440, urgentMinutes: 2880 },
  quote: { lateMinutes: 720, urgentMinutes: 1440 },
  parts: { lateMinutes: 4320, urgentMinutes: 10080 },
  test: { lateMinutes: 480, urgentMinutes: 1440 },
  delivery: { lateMinutes: 1440, urgentMinutes: 4320 },
};

type SLASeverity = "in_time" | "late" | "urgent";

const statusToPhaseMap: Record<string, keyof SLAConfig | null> = {
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
};

const phaseLabels: Record<string, string> = {
  diagnosis: "Diagnosi",
  quote: "Preventivo",
  parts: "Ricambi",
  test: "Test",
  delivery: "Consegna",
};

function computeSLASeverity(
  status: string,
  updatedAt: Date,
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

  const minutesInState = differenceInMinutes(new Date(), updatedAt);

  if (minutesInState >= thresholds.urgentMinutes) {
    return { severity: "urgent", minutesInState, phase };
  }
  if (minutesInState >= thresholds.lateMinutes) {
    return { severity: "late", minutesInState, phase };
  }

  return { severity: "in_time", minutesInState, phase };
}

const sentNotifications = new Map<string, { severity: SLASeverity; timestamp: Date }>();

async function loadSLAConfig(): Promise<SLAConfig> {
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

export async function runSLANotificationCheck(): Promise<{ notified: number; checked: number }> {
  const slaConfig = await loadSLAConfig();
  
  const activeStatuses = [
    "ingressato",
    "in_diagnosi",
    "preventivo_emesso",
    "preventivo_accettato",
    "attesa_ricambi",
    "in_test",
    "pronto_ritiro",
  ];

  const activeRepairs = await db
    .select()
    .from(repairOrders)
    .where(inArray(repairOrders.status, activeStatuses as any));

  const admins = await db
    .select()
    .from(users)
    .where(eq(users.role, "admin" as any));

  let notifiedCount = 0;
  const checked = activeRepairs.length;

  for (const repair of activeRepairs) {
    const currentState = await storage.getCurrentRepairOrderState(repair.id);
    const stateEnteredAt = currentState?.enteredAt || repair.updatedAt;
    
    const { severity, minutesInState, phase } = computeSLASeverity(
      repair.status,
      stateEnteredAt,
      slaConfig
    );

    if (!severity || severity === "in_time" || !phase) {
      sentNotifications.delete(repair.id);
      continue;
    }

    const cacheKey = repair.id;
    const cached = sentNotifications.get(cacheKey);
    
    if (cached && cached.severity === severity) {
      const hoursSinceLastNotification = differenceInMinutes(new Date(), cached.timestamp) / 60;
      if (hoursSinceLastNotification < 4) {
        continue;
      }
    }

    const severityLabel = severity === "urgent" ? "URGENTE" : "IN RITARDO";
    const days = Math.floor(minutesInState / 1440);
    const hours = Math.floor((minutesInState % 1440) / 60);
    const timeStr = days > 0 ? `${days}g ${hours}h` : `${hours}h`;

    const notificationData = {
      title: `SLA ${severityLabel}: ${repair.orderNumber}`,
      message: `La riparazione ${repair.orderNumber} è ${severity === "urgent" ? "URGENTE" : "in ritardo"} nella fase "${phaseLabels[phase]}". Tempo in stato: ${timeStr}`,
      type: "sla_warning" as const,
      link: `/admin/repairs/${repair.id}`,
    };

    for (const admin of admins) {
      try {
        await storage.createNotification({
          userId: admin.id,
          ...notificationData,
        });
      } catch (error) {
        console.error(`Failed to create SLA notification for admin ${admin.id}:`, error);
      }
    }

    if (repair.repairCenterId) {
      const repairCenterUsers = await db
        .select()
        .from(users)
        .where(eq(users.repairCenterId, repair.repairCenterId));

      for (const user of repairCenterUsers) {
        try {
          await storage.createNotification({
            userId: user.id,
            ...notificationData,
          });
        } catch (error) {
          console.error(`Failed to create SLA notification for user ${user.id}:`, error);
        }
      }
    }

    sentNotifications.set(cacheKey, { severity, timestamp: new Date() });
    notifiedCount++;
  }

  return { notified: notifiedCount, checked };
}

let intervalId: NodeJS.Timeout | null = null;

export function startSLANotificationJob(intervalMinutes: number = 30): void {
  if (intervalId) {
    console.log("SLA notification job already running");
    return;
  }

  console.log(`Starting SLA notification job (interval: ${intervalMinutes} minutes)`);
  
  runSLANotificationCheck()
    .then((result) => {
      console.log(`Initial SLA check: ${result.checked} repairs checked, ${result.notified} notifications sent`);
    })
    .catch((error) => {
      console.error("Initial SLA check failed:", error);
    });

  intervalId = setInterval(async () => {
    try {
      const result = await runSLANotificationCheck();
      if (result.notified > 0) {
        console.log(`SLA check: ${result.checked} repairs checked, ${result.notified} notifications sent`);
      }
    } catch (error) {
      console.error("SLA notification check failed:", error);
    }
  }, intervalMinutes * 60 * 1000);
}

export function stopSLANotificationJob(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("SLA notification job stopped");
  }
}
