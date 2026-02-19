import { useQuery } from "@tanstack/react-query";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { CornerDownRight, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import type { RepairOrder } from "@shared/schema";

interface ReturnSubRowsProps {
  parentId: string;
  rolePrefix: string;
  getStatusBadge: (status: string) => JSX.Element;
  totalColumns?: number;
}

interface ReturnRepair extends RepairOrder {
  customerName?: string | null;
}

export function ReturnSubRows({ parentId, rolePrefix, getStatusBadge, totalColumns = 8 }: ReturnSubRowsProps) {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: returns = [], isLoading } = useQuery<ReturnRepair[]>({
    queryKey: ["/api/repair-orders", parentId, "returns"],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/${parentId}/returns`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch returns");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={totalColumns}>
          <div className="flex items-center gap-2 pl-8 py-2">
            <Skeleton className="h-4 w-full max-w-[300px]" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (returns.length === 0) return null;

  const middleCols = totalColumns - 4;

  return (
    <>
      {returns.map((ret) => (
        <TableRow
          key={ret.id}
          data-testid={`row-return-${ret.id}`}
          className="hover-elevate cursor-pointer bg-muted/30"
          onClick={() => setLocation(`${rolePrefix}/repairs/${ret.id}`)}
        >
          <TableCell className="font-mono text-sm">
            <div className="flex items-center gap-1.5 pl-4">
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <Badge variant="outline" className="text-xs gap-1 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700">
                {t("repairs.return.badge", "Rientro")}
              </Badge>
              <span className="text-muted-foreground">{ret.orderNumber}</span>
            </div>
          </TableCell>
          <TableCell className="max-w-[150px]">
            <span className="truncate block text-sm text-muted-foreground" title={ret.customerName || "—"}>
              {ret.customerName || "—"}
            </span>
          </TableCell>
          {Array.from({ length: middleCols }).map((_, i) => {
            if (i === 0) {
              return (
                <TableCell key={i}>
                  <div className="text-sm text-muted-foreground">
                    <div className="capitalize">{ret.deviceType}</div>
                    <div className="text-xs">{ret.deviceModel}</div>
                  </div>
                </TableCell>
              );
            }
            if (i === 1) {
              return <TableCell key={i}>{getStatusBadge(ret.status)}</TableCell>;
            }
            return <TableCell key={i} />;
          })}
          <TableCell className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(ret.createdAt), { addSuffix: true, locale: it })}
          </TableCell>
          <TableCell>
            <div className="flex items-center justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`${rolePrefix}/repairs/${ret.id}`);
                    }}
                    data-testid={`button-view-return-${ret.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("common.details")}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
