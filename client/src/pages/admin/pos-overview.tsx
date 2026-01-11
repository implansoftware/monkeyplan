import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Receipt, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CreditCard,
  Banknote,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Building2
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface PosStats {
  totalSessions: number;
  activeSessions: number;
  todayTransactions: number;
  todayRevenue: number;
  todayRefunds: number;
  paymentBreakdown: {
    cash: number;
    card: number;
    pos_terminal: number;
    satispay: number;
    mixed: number;
  };
  topResellers: Array<{
    id: number;
    name: string;
    transactionCount: number;
    revenue: number;
    repairCenterCount: number;
  }>;
  topRepairCenters: Array<{
    id: number;
    name: string;
    resellerName: string;
    transactionCount: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: number;
    transactionNumber: string;
    type: string;
    paymentMethod: string;
    totalAmount: number;
    createdAt: string;
    repairCenterName: string;
    resellerName: string;
  }>;
}

export default function AdminPosOverview() {
  const [period, setPeriod] = useState("today");

  const { data: stats, isLoading } = useQuery<PosStats>({
    queryKey: ["/api/admin/pos/stats", period],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Contanti",
      card: "Carta",
      pos_terminal: "POS",
      satispay: "Satispay",
      mixed: "Misto",
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "card":
      case "pos_terminal":
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Panoramica POS Globale
          </h1>
          <p className="text-muted-foreground">
            Monitoraggio casse di tutti i centri riparazione
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40" data-testid="select-period">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Oggi</SelectItem>
            <SelectItem value="week">Settimana</SelectItem>
            <SelectItem value="month">Mese</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Sessioni Attive</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              su {stats?.totalSessions || 0} totali
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Rivenditori</CardTitle>
            <Building2 className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.topResellers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              con attività POS
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/5 to-cyan-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Transazioni</CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              nel periodo selezionato
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-600/5 to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Fatturato</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.todayRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              incasso lordo globale
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Resi/Rimborsi</CardTitle>
            <RotateCcw className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.todayRefunds || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              importo rimborsato
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              Metodi di Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.paymentBreakdown && Object.entries(stats.paymentBreakdown).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(method)}
                    <span className="text-sm font-medium">{getPaymentMethodLabel(method)}</span>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(amount)}</span>
                </div>
              ))}
              {!stats?.paymentBreakdown && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun dato disponibile
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-500" />
              Top Rivenditori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topResellers?.map((reseller, index) => (
                <div key={reseller.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <span className="text-sm font-medium">{reseller.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {reseller.repairCenterCount} centri
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(reseller.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{reseller.transactionCount} tx</div>
                  </div>
                </div>
              ))}
              {(!stats?.topResellers || stats.topResellers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun dato disponibile
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-500" />
              Top Centri Riparazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topRepairCenters?.map((center, index) => (
                <div key={center.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <span className="text-sm font-medium">{center.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {center.resellerName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(center.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{center.transactionCount} tx</div>
                  </div>
                </div>
              ))}
              {(!stats?.topRepairCenters || stats.topRepairCenters.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun dato disponibile
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-500" />
            Ultime Transazioni Globali
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentTransactions?.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {tx.type === "sale" ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{tx.transactionNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {tx.repairCenterName} ({tx.resellerName})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(tx.createdAt), "dd/MM HH:mm", { locale: it })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${tx.type === "refund" ? "text-red-500" : ""}`}>
                    {tx.type === "refund" ? "-" : ""}{formatCurrency(tx.totalAmount)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getPaymentMethodLabel(tx.paymentMethod)}
                  </Badge>
                </div>
              </div>
            ))}
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nessuna transazione recente
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
