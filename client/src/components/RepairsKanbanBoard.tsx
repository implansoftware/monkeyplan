import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Smartphone, Calendar, Euro, Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { KANBAN_COLUMNS, getStatusConfig } from "@/lib/repair-status-config";
import type { RepairOrder } from "@shared/schema";

interface RepairOrderWithSLA extends RepairOrder {
  slaSeverity?: "in_time" | "late" | "urgent" | null;
  slaMinutesInState?: number;
  slaPhase?: string | null;
  slaEnteredAt?: string | null;
  customerName?: string | null;
  totalQuoteCents?: number | null;
}

interface RepairsKanbanBoardProps {
  repairs: RepairOrderWithSLA[];
  isLoading: boolean;
  onCardClick: (repairId: string) => void;
}

export function RepairsKanbanBoard({
  repairs,
  isLoading,
  onCardClick,
}: RepairsKanbanBoardProps) {
  const groupedRepairs = useMemo(() => {
    const groups: Record<string, RepairOrderWithSLA[]> = {};
    KANBAN_COLUMNS.forEach((col) => {
      groups[col.key] = [];
    });
    repairs.forEach((repair) => {
      if (groups[repair.status]) {
        groups[repair.status].push(repair);
      }
    });
    return groups;
  }, [repairs]);

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return null;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col.key} className="flex-shrink-0 w-72">
            <div className={`p-3 rounded-t-lg ${col.bgColor} ${col.borderColor} border-b-2`}>
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="bg-muted/30 min-h-[400px] rounded-b-lg p-2 space-y-2">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const columnRepairs = groupedRepairs[col.key] || [];
          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-72"
              data-testid={`kanban-column-${col.key}`}
            >
              <div
                className={`p-3 rounded-t-lg ${col.bgColor} ${col.borderColor} border-b-2 flex items-center justify-between`}
              >
                <span className={`font-medium text-sm ${col.color}`}>{col.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {columnRepairs.length}
                </Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-280px)] min-h-[400px]">
                <div className="bg-muted/20 rounded-b-lg p-2 space-y-2 min-h-full">
                  {columnRepairs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Nessuna lavorazione
                    </div>
                  ) : (
                    columnRepairs.map((repair) => (
                      <KanbanCard
                        key={repair.id}
                        repair={repair}
                        onClick={() => onCardClick(repair.id)}
                        formatCurrency={formatCurrency}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface KanbanCardProps {
  repair: RepairOrderWithSLA;
  onClick: () => void;
  formatCurrency: (cents: number | null | undefined) => string | null;
}

function KanbanCard({ repair, onClick, formatCurrency }: KanbanCardProps) {
  const statusConfig = getStatusConfig(repair.status);
  const price = formatCurrency(repair.totalQuoteCents || repair.estimatedCost || repair.finalCost);

  return (
    <Card
      className="cursor-pointer hover-elevate transition-all"
      onClick={onClick}
      data-testid={`kanban-card-${repair.id}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm">{repair.orderNumber}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-1 -mt-1"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            data-testid={`button-view-${repair.id}`}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </div>

        {repair.slaSeverity && repair.slaSeverity !== "in_time" && (
          <Badge
            variant={repair.slaSeverity === "urgent" ? "destructive" : "outline"}
            className="text-xs"
          >
            {repair.slaSeverity === "urgent" ? "Urgente" : "In ritardo"}
          </Badge>
        )}

        {repair.customerName && (
          <div className="text-xs text-muted-foreground truncate">
            {repair.customerName}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Smartphone className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {repair.brand || repair.deviceType} {repair.deviceModel}
          </span>
        </div>

        {repair.issueDescription && (
          <div className="text-xs text-muted-foreground line-clamp-2 pl-0.5">
            {repair.issueDescription}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          {price ? (
            <span className="text-sm font-medium">{price}</span>
          ) : (
            <span className="text-xs text-muted-foreground">N/D</span>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {repair.createdAt && format(new Date(repair.createdAt), "d MMM yyyy", { locale: it })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
