import { useTranslation } from "react-i18next";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Euro,
  Percent,
  TrendingUp,
  Calculator,
  Package,
  Phone,
  Lightbulb,
  Flame,
  Radio,
  MoreHorizontal,
  Calendar,
  FileCheck,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import type { UtilityService, UtilitySupplier } from "@shared/schema";

type ServiceCategory = "fisso" | "mobile" | "centralino" | "luce" | "gas" | "altro";

function getCategoryLabels(t: (key: string) => string): Record<ServiceCategory, string> {
  return {
    fisso: "Fisso",
    mobile: "Mobile",
    centralino: "Centralino",
    luce: "Luce",
    gas: "Gas",
    altro: t("common.other"),
  };
}

const categoryColors: Record<string, string> = {
  fisso: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  mobile: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  centralino: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  luce: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  gas: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  altro: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
};

const categoryIcons: Record<string, any> = {
  fisso: Phone,
  mobile: Phone,
  centralino: Phone,
  luce: Lightbulb,
  gas: Flame,
  altro: Radio,
};

const formatCurrency = (cents: number | null | undefined) => {
  if (!cents) return "—";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

interface UtilityServiceDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: UtilityService | null;
  supplier?: UtilitySupplier | null;
  onCreatePractice?: (serviceId: string) => void;
}

export function calculateServiceCommission(service: UtilityService): number {
  let commission = 0;
  if (service.commissionFixed) {
    commission += service.commissionFixed / 100;
  }
  if (service.commissionOneTime) {
    commission += service.commissionOneTime / 100;
  }
  if (service.commissionPercent) {
    const baseCents = service.monthlyPriceCents || service.activationFeeCents;
    if (baseCents) {
      commission += (baseCents / 100) * (service.commissionPercent / 100);
    }
  }
  return commission;
}

export function inferServicePriceType(service: UtilityService, t?: (key: string) => string): string {
  if (service.monthlyPriceCents && service.monthlyPriceCents > 0) return "Mensile";
  if (service.flatPriceCents && service.flatPriceCents > 0) return "Forfait";
  if (service.activationFeeCents && service.activationFeeCents > 0) return t ? t("utility.activation") : "Attivazione";
  return "Non definito";
}

export function UtilityServiceDetailSheet({
  open,
  onOpenChange,
  service,
  supplier,
  onCreatePractice,
}: UtilityServiceDetailSheetProps) {
  const { t } = useTranslation();
  const categoryLabels = getCategoryLabels(t);
  if (!service) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg" data-testid="sheet-service-detail">
          <SheetHeader>
            <SheetTitle>Dettaglio Servizio</SheetTitle>
            <SheetDescription>{t("services.noServiceSelected")}</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const CategoryIcon = categoryIcons[service.category] || Package;
  const commission = calculateServiceCommission(service);
  const potential10 = commission * 10;
  const potential50 = commission * 50;
  const inferredPriceType = inferServicePriceType(service, t);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto" data-testid="sheet-service-detail">
        <SheetHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className={`p-3 rounded-xl ${categoryColors[service.category]}`}>
              <CategoryIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg" data-testid="text-service-name">
                {service.name}
              </SheetTitle>
              <SheetDescription className="font-mono text-xs" data-testid="text-service-code">
                {service.code}
              </SheetDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge className={categoryColors[service.category]} data-testid="badge-service-category">
              {categoryLabels[service.category as ServiceCategory] || service.category}
            </Badge>
            {service.isActive ? (
              <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-700" data-testid="badge-service-status">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {t("common.active")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-300 dark:text-red-400 dark:border-red-700" data-testid="badge-service-status">
                <XCircle className="h-3 w-3 mr-1" />
                {t("common.inactive")}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-5 pt-2">
          {supplier && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>Fornitore: <span className="font-medium text-foreground">{supplier.name}</span></span>
            </div>
          )}

          {service.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">{t("common.description")}</h4>
              <p className="text-sm text-muted-foreground" data-testid="text-service-description">
                {service.description}
              </p>
            </div>
          )}

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Dettagli Prezzo
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Tipo prezzo</span>
                <Badge variant="secondary" data-testid="badge-price-type">{inferredPriceType}</Badge>
              </div>

              {service.monthlyPriceCents != null && service.monthlyPriceCents > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Canone mensile</span>
                  <span className="text-sm font-semibold" data-testid="text-monthly-price">
                    {formatCurrency(service.monthlyPriceCents)}
                  </span>
                </div>
              )}

              {service.flatPriceCents != null && service.flatPriceCents > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Prezzo forfait</span>
                  <span className="text-sm font-semibold" data-testid="text-flat-price">
                    {formatCurrency(service.flatPriceCents)}
                  </span>
                </div>
              )}

              {service.activationFeeCents != null && service.activationFeeCents > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Costo attivazione</span>
                  <span className="text-sm font-semibold" data-testid="text-activation-price">
                    {formatCurrency(service.activationFeeCents)}
                  </span>
                </div>
              )}

              {service.contractMonths != null && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Durata contratto
                  </span>
                  <span className="text-sm font-semibold" data-testid="text-contract-months">
                    {service.contractMonths} mesi
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              Commissioni
            </h4>
            <Card className="border-green-200 dark:border-green-800 bg-green-500/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-green-700 dark:text-green-300">Per attivazione</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-commission-amount">
                    {formatCurrency(commission * 100)}
                  </span>
                </div>

                {service.commissionPercent != null && service.commissionPercent > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Percent className="h-3 w-3" />
                    {service.commissionPercent}%{" "}
                    {service.monthlyPriceCents ? "del canone mensile" : "del costo attivazione"}
                  </div>
                )}

                {service.commissionFixed != null && service.commissionFixed > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Euro className="h-3 w-3" />
                    Commissione fissa: {formatCurrency(service.commissionFixed)}
                  </div>
                )}

                {service.commissionOneTime != null && service.commissionOneTime > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Zap className="h-3 w-3" />
                    Una tantum: {formatCurrency(service.commissionOneTime)}
                  </div>
                )}

                <Separator className="bg-green-200 dark:bg-green-800" />

                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calculator className="h-3 w-3" />
                      10 attivazioni
                    </span>
                    <span className="font-semibold text-foreground" data-testid="text-potential-10">
                      {formatCurrency(potential10 * 100)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calculator className="h-3 w-3" />
                      50 attivazioni
                    </span>
                    <span className="font-semibold text-foreground" data-testid="text-potential-50">
                      {formatCurrency(potential50 * 100)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {onCreatePractice && (
            <>
              <Separator />
              <Button
                className="w-full gap-2"
                onClick={() => {
                  onCreatePractice(service.id);
                  onOpenChange(false);
                }}
                data-testid="button-create-practice-detail"
              >
                <FileCheck className="h-4 w-4" />
                Crea Pratica
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
