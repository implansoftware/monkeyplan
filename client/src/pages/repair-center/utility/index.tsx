import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Zap,
  FileCheck,
  Coins,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

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

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function RepairCenterUtility() {
  const { data: summary, isLoading } = useQuery<UtilitySummary>({
    queryKey: ["/api/utility/reports/summary"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Utility</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Zap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Utility</h1>
              <p className="text-emerald-100">Gestione servizi telefonici ed energetici</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-practices">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Le Mie Pratiche</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalPractices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.activePractices || 0} completate
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-commissions">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compensi Pending</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
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
            <TrendingUp className="h-4 w-4 text-green-500" />
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
                  <div className="flex items-center gap-2">
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

        <div className="grid gap-4">
          <Card className="hover-elevate">
            <Link href="/repair-center/utility/practices">
              <CardContent className="p-6 flex items-center gap-4 cursor-pointer">
                <FileCheck className="h-10 w-10 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">Le Mie Pratiche</h3>
                  <p className="text-xs text-muted-foreground">
                    Gestisci contratti e pratiche
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>

          <Card className="hover-elevate">
            <Link href="/repair-center/utility/commissions">
              <CardContent className="p-6 flex items-center gap-4 cursor-pointer">
                <Coins className="h-10 w-10 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">I Miei Compensi</h3>
                  <p className="text-xs text-muted-foreground">
                    Traccia commissioni e pagamenti
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
