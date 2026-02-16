import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, AlertCircle, AlertTriangle } from "lucide-react";
import { differenceInMinutes } from "date-fns";
import { useQuery } from "@tanstack/react-query";

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

type SLASeverity = "in_time" | "late" | "urgent" | "completed" | "unknown";

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

interface SLABadgeProps {
  repairId: string;
  status: string;
  fallbackDate?: Date | string | null;
  slaConfig?: SLAConfig;
  showLabel?: boolean;
}

interface SLAStateResponse {
  status: string;
  stateEnteredAt: string;
  currentState: any;
}

export function computeSLASeverity(
  status: string,
  statusEnteredAt: Date | string | null,
  slaConfig: SLAConfig = defaultSLAConfig
): { severity: SLASeverity; minutesInState: number | null; phase: string | null } {
  if (!statusEnteredAt) {
    return { severity: "unknown", minutesInState: null, phase: null };
  }

  if (status === "consegnato" || status === "cancelled") {
    return { severity: "completed", minutesInState: null, phase: null };
  }

  const phase = statusToPhaseMap[status];
  if (!phase) {
    return { severity: "in_time", minutesInState: null, phase: null };
  }

  const thresholds = slaConfig[phase];
  if (!thresholds) {
    return { severity: "in_time", minutesInState: null, phase };
  }

  const enteredDate = typeof statusEnteredAt === "string" ? new Date(statusEnteredAt) : statusEnteredAt;
  const minutesInState = differenceInMinutes(new Date(), enteredDate);

  if (minutesInState >= thresholds.urgentMinutes) {
    return { severity: "urgent", minutesInState, phase };
  }
  if (minutesInState >= thresholds.lateMinutes) {
    return { severity: "late", minutesInState, phase };
  }

  return { severity: "in_time", minutesInState, phase };
}

export function SLABadge({ repairId, status, fallbackDate, slaConfig = defaultSLAConfig, showLabel = false }: SLABadgeProps) {
  const { t } = useTranslation();
  const { data: slaState } = useQuery<SLAStateResponse>({
    queryKey: ["/api/repairs", repairId, "sla-state"],
    enabled: !!repairId,
    staleTime: 60000,
  });

  const statusEnteredAt = slaState?.stateEnteredAt || fallbackDate || null;
  const { severity, minutesInState, phase } = computeSLASeverity(status, statusEnteredAt, slaConfig);

  if (severity === "completed" || severity === "unknown") {
    return null;
  }

  const phaseLabels: Record<string, string> = {
    diagnosis: t("sla.diagnosis"),
    quote: t("sla.quote"),
    parts: t("sla.parts"),
    test: t("sla.test"),
    delivery: t("sla.delivery"),
  };

  const formatMinutes = (mins: number) => {
    if (mins >= 1440) {
      const days = Math.floor(mins / 1440);
      const hours = Math.floor((mins % 1440) / 60);
      return days === 1 ? `${days} ${t("time.day")} ${hours}h` : `${days} ${t("time.days")} ${hours}h`;
    }
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const minutes = mins % 60;
      return `${hours}h ${minutes}m`;
    }
    return `${mins} min`;
  };

  const tooltipContent = minutesInState !== null && phase
    ? `${phaseLabels[phase]}: ${formatMinutes(minutesInState)} ${t("sla.inThisState")}`
    : t("sla.currentStateTime");

  if (severity === "in_time") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 gap-1"
            data-testid="badge-sla-in-time"
          >
            <Clock className="h-3 w-3" />
            {showLabel && <span>{t("sla.inTime")}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (severity === "late") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 gap-1"
            data-testid="badge-sla-late"
          >
            <AlertTriangle className="h-3 w-3" />
            {showLabel && <span>{t("sla.late")}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (severity === "urgent") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 gap-1 animate-pulse"
            data-testid="badge-sla-urgent"
          >
            <AlertCircle className="h-3 w-3" />
            {showLabel && <span>{t("sla.urgent")}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return null;
}
