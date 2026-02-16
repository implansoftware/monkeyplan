import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, Calendar, Euro, User, Building2, Package } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { UtilityPractice, UtilityService, UtilitySupplier, User as UserType, Product } from "@shared/schema";

type PracticeStatus = "bozza" | "inviata" | "in_lavorazione" | "attesa_documenti" | "completata" | "rifiutata" | "annullata";

interface KanbanColumn {
  key: PracticeStatus;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PRACTICE_COLUMNS: KanbanColumn[] = [
  {
    key: "bozza",
    label: t("common.draft"),
    color: "text-gray-700 dark:text-gray-300",
    bgColor: "bg-gray-50 dark:bg-gray-900/30",
    borderColor: "border-gray-300 dark:border-gray-700",
  },
  {
    key: "inviata",
    label: t("common.sent"),
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
  {
    key: "in_lavorazione",
    label: "In Lavorazione",
    color: "text-yellow-700 dark:text-yellow-300",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  {
    key: "attesa_documenti",
    label: "Attesa Documenti",
    color: "text-orange-700 dark:text-orange-300",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-300 dark:border-orange-700",
  },
  {
    key: "completata",
    label: t("common.completed"),
    color: "text-green-700 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-300 dark:border-green-700",
  },
  {
    key: "rifiutata",
    label: t("common.rejected"),
    color: "text-red-700 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-300 dark:border-red-700",
  },
  {
    key: "annullata",
    label: t("common.cancelled"),
    color: "text-red-800 dark:text-red-400",
    bgColor: "bg-red-50/50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
];

const formatCurrency = (cents: number | null | undefined) => {
  if (!cents) return null;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

interface PracticesKanbanBoardProps {
  practices: UtilityPractice[];
  services: UtilityService[];
  suppliers: UtilitySupplier[];
  customers: UserType[];
  products: Product[];
  isLoading: boolean;
  onCardClick: (practiceId: string) => void;
}

export function PracticesKanbanBoard({
  practices,
  services,
  suppliers,
  customers,
  products,
  isLoading,
  onCardClick,
}: PracticesKanbanBoardProps) {
  const { t } = useTranslation();
  const grouped = useMemo(() => {
    const groups: Record<string, UtilityPractice[]> = {};
    PRACTICE_COLUMNS.forEach((col) => {
      groups[col.key] = [];
    });
    practices.forEach((p) => {
      if (groups[p.status]) {
        groups[p.status].push(p);
      }
    });
    return groups;
  }, [practices]);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PRACTICE_COLUMNS.map((col) => (
          <div key={col.key} className="flex-shrink-0 w-72">
            <div className={`p-3 rounded-md ${col.bgColor} ${col.borderColor} border-b-2`}>
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="bg-muted/30 min-h-[400px] rounded-md p-2 space-y-2">
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
        {PRACTICE_COLUMNS.map((col) => {
          const columnPractices = grouped[col.key] || [];
          return (
            <div
              key={col.key}
              className="flex-shrink-0 w-72"
              data-testid={`kanban-column-${col.key}`}
            >
              <div
                className={`p-3 rounded-md ${col.bgColor} ${col.borderColor} border-b-2 flex items-center justify-between gap-2`}
              >
                <span className={`font-medium text-sm ${col.color}`}>{col.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {columnPractices.length}
                </Badge>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                <div className="bg-muted/20 rounded-md p-2 space-y-2 min-h-[400px]">
                  {columnPractices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {t("practice.noPractice")}
                    </div>
                  ) : (
                    columnPractices.map((practice) => (
                      <PracticeKanbanCard
                        key={practice.id}
                        practice={practice}
                        services={services}
                        suppliers={suppliers}
                        customers={customers}
                        products={products}
                        onClick={() => onCardClick(practice.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface PracticeKanbanCardProps {
  practice: UtilityPractice;
  services: UtilityService[];
  suppliers: UtilitySupplier[];
  customers: UserType[];
  products: Product[];
  onClick: () => void;
}

function PracticeKanbanCard({ practice, services, suppliers, customers, products, onClick }: PracticeKanbanCardProps) {
  const service = services.find(s => s.id === practice.serviceId);
  const supplier = suppliers.find(s => s.id === practice.supplierId);
  const customer = customers.find(c => c.id === practice.customerId);
  const itemType = practice.itemType || "service";

  const customerName = customer?.fullName || (practice as any).temporaryCustomerName;
  const serviceName = (practice as any).customServiceName || service?.name;

  const price = (() => {
    if (practice.activationFeeCents && practice.activationFeeCents > 0) {
      return formatCurrency(practice.activationFeeCents);
    }
    if (practice.priceType === "forfait" && practice.flatPriceCents) {
      return formatCurrency(practice.flatPriceCents);
    }
    if (practice.monthlyPriceCents) {
      return `${formatCurrency(practice.monthlyPriceCents)}/mese`;
    }
    return null;
  })();

  return (
    <Card
      className="cursor-pointer transition-all"
      onClick={onClick}
      data-testid={`kanban-card-${practice.id}`}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm">{practice.practiceNumber}</span>
          {practice.priority === "urgente" && (
            <Badge variant="destructive" className="text-xs">{t("dataRecovery.urgent")}</Badge>
          )}
        </div>

        {customerName && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{customerName}</span>
          </div>
        )}

        {(itemType === "service" || itemType === "service_with_products") && serviceName && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <FileCheck className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{serviceName}</span>
          </div>
        )}

        {itemType === "product" && (practice as any).practiceProducts?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {(practice as any).practiceProducts.length} prodott{(practice as any).practiceProducts.length === 1 ? "o" : "i"}
            </span>
          </div>
        )}

        {supplier && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground opacity-70">
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{supplier.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          {price ? (
            <span className="text-sm font-medium">{price}</span>
          ) : (
            <span className="text-xs text-muted-foreground">N/D</span>
          )}
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {practice.createdAt && format(new Date(practice.createdAt), "d MMM", { locale: it })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
