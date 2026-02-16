import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Zap,
  Phone,
  FileCheck,
  Coins,
  PieChart,
  ArrowRight,
  TrendingUp,
  Building2,
  Package,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface UtilitySummary {
  year: number;
  totalPractices: number;
  activePractices: number;
  byCategory: Record<string, { count: number; revenue: number; commissions: number }>;
  byStatus: Record<string, number>;
  commissions: {
    total: number;
    pending: number;
    paid: number;
  };
  supplierCount: number;
}

const categoryLabels: Record<string, string> = {
  fisso: "Fisso",
  mobile: "Mobile",
  centralino: "Centralino",
  luce: "Luce",
  gas: "Gas",
  altro: "Altro",
};

const statusLabels: Record<string, string> = {
  bozza: "Bozza",
  inviata: "Inviata",
  in_lavorazione: "In Lavorazione",
  completata: "Completata",
  annullata: "Annullata",
  rifiutata: "Rifiutata",
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function AdminUtility() {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useQuery<UtilitySummary>({
    queryKey: ["/api/utility/reports/summary"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Modulo Utility</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Modulo Utility</h1>
            <p className="text-muted-foreground">
              Gestione servizi telefonici, energetici e altro
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-practices">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Pratiche</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPractices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.activePractices || 0} attive
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-suppliers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("sidebar.items.suppliers")}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.supplierCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Provider attivi
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-commissions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compensi Pending</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.commissions?.pending || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Da liquidare
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-commissions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compensi Totali</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.commissions?.total || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Anno {summary?.year || new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-by-category">
          <CardHeader>
            <CardTitle className="text-lg">Per Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary?.byCategory || {}).map(([cat, data]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{categoryLabels[cat] || cat}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {data.count} pratiche
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(data.commissions)}
                  </span>
                </div>
              ))}
              {Object.keys(summary?.byCategory || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-by-status">
          <CardHeader>
            <CardTitle className="text-lg">Per Stato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(summary?.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant="secondary">{statusLabels[status] || status}</Badge>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(summary?.byStatus || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="hover-elevate">
          <Link href="/admin/utility/suppliers">
            <CardContent className="p-6 flex flex-col items-center text-center cursor-pointer">
              <Phone className="h-10 w-10 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{t("sidebar.items.suppliers")}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Provider di servizi
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover-elevate">
          <Link href="/admin/utility/services">
            <CardContent className="p-6 flex flex-col items-center text-center cursor-pointer">
              <Package className="h-10 w-10 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Listino Servizi</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Catalogo e prezzi
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover-elevate">
          <Link href="/admin/utility/practices">
            <CardContent className="p-6 flex flex-col items-center text-center cursor-pointer">
              <FileCheck className="h-10 w-10 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{t("sidebar.items.practices")}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Contratti attivi
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover-elevate">
          <Link href="/admin/utility/commissions">
            <CardContent className="p-6 flex flex-col items-center text-center cursor-pointer">
              <Coins className="h-10 w-10 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{t("sidebar.items.commissions")}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Commissioni e pagamenti
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="hover-elevate">
          <Link href="/admin/utility/reports">
            <CardContent className="p-6 flex flex-col items-center text-center cursor-pointer">
              <PieChart className="h-10 w-10 text-primary mb-3" />
              <h3 className="font-semibold mb-1">{t("sidebar.items.reports")}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Analisi e statistiche
              </p>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
