import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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
  Eye,
  Package,
  PlayCircle,
  StopCircle,
  Store
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
  topRepairCenters: Array<{
    id: number;
    name: string;
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
  }>;
}

interface TransactionDetail {
  transaction: {
    id: string;
    transactionNumber: string;
    status: string;
    paymentMethod: string;
    total: number;
    subtotal: number;
    discount: number;
    createdAt: string;
  };
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  repairCenterName: string;
}

interface RepairCenter {
  id: string;
  name: string;
}

interface PosSession {
  id: string;
  repairCenterName: string;
  registerName: string | null;
  operatorName: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  totalSales: number;
  totalTransactions: number;
}

interface RegisterStats {
  id: string;
  name: string;
  repairCenterId: string;
  repairCenterName: string;
  transactionCount: number;
  totalRevenue: number;
  avgTicket: number;
  paymentBreakdown: {
    cash: number;
    card: number;
    pos: number;
    satispay: number;
  };
  isDefault: boolean;
  isActive: boolean;
}

export default function ResellerPosOverview() {
  const [period, setPeriod] = useState("today");
  const [repairCenterFilter, setRepairCenterFilter] = useState("all");
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const { data: repairCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const { data: stats, isLoading } = useQuery<PosStats>({
    queryKey: ["/api/reseller/pos/stats", period, repairCenterFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (repairCenterFilter !== "all") {
        params.set("repairCenterId", repairCenterFilter);
      }
      const res = await fetch(`/api/reseller/pos/stats?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: txDetail, isLoading: txLoading } = useQuery<TransactionDetail>({
    queryKey: ["/api/reseller/pos/transaction", selectedTxId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/pos/transaction/${selectedTxId}`);
      if (!res.ok) throw new Error("Failed to fetch transaction");
      return res.json();
    },
    enabled: !!selectedTxId,
  });

  const { data: sessions } = useQuery<PosSession[]>({
    queryKey: ["/api/reseller/pos/sessions/feed", repairCenterFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20" });
      if (repairCenterFilter !== "all") {
        params.set("repairCenterId", repairCenterFilter);
      }
      const res = await fetch(`/api/reseller/pos/sessions/feed?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  const { data: registerStats, isLoading: registerStatsLoading } = useQuery<RegisterStats[]>({
    queryKey: ["/api/reseller/pos/register-stats", period, repairCenterFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (repairCenterFilter !== "all") {
        params.set("repairCenterId", repairCenterFilter);
      }
      const res = await fetch(`/api/reseller/pos/register-stats?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch register stats");
      return res.json();
    },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Panoramica POS
              </h1>
              <p className="text-sm text-white/80">
                Monitoraggio casse dei tuoi centri riparazione
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={repairCenterFilter} onValueChange={setRepairCenterFilter}>
              <SelectTrigger className="w-48 bg-white/20 backdrop-blur-sm border-white/30 text-white" data-testid="select-repair-center">
                <SelectValue placeholder="Tutti i centri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i centri</SelectItem>
                {repairCenters?.map((rc) => (
                  <SelectItem key={rc.id} value={rc.id}>
                    {rc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-white/20 backdrop-blur-sm border-white/30 text-white" data-testid="select-period">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Oggi</SelectItem>
                <SelectItem value="week">Settimana</SelectItem>
                <SelectItem value="month">Mese</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Sessioni Attive</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              su {stats?.totalSessions || 0} totali
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border-teal-200/50 dark:border-teal-800/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Transazioni</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              nel periodo selezionato
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-cyan-50 to-emerald-50 dark:from-cyan-950/40 dark:to-emerald-950/40 border-cyan-200/50 dark:border-cyan-800/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Fatturato</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.todayRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              incasso lordo
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-950/40 dark:to-cyan-950/40 border-emerald-200/50 dark:border-emerald-800/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Resi/Rimborsi</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <RotateCcw className="h-4 w-4 text-white" />
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              Metodi di Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
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

        <Card className="rounded-2xl">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-t-2xl">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Top Centri Riparazione
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {stats?.topRepairCenters?.map((center, index) => (
                <div key={center.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium">{center.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(center.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{center.transactionCount} transazioni</div>
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

      <Card className="rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 rounded-t-2xl">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            Performance Casse
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {registerStatsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ) : registerStats && registerStats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registerStats.map((reg) => (
                <div key={reg.id} className="p-4 rounded-lg border bg-card" data-testid={`card-register-${reg.id}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-teal-500" />
                      <span className="font-medium">{reg.name}</span>
                      {reg.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{reg.repairCenterName}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Transazioni</p>
                      <p className="font-bold">{reg.transactionCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Fatturato</p>
                      <p className="font-bold text-emerald-600">{formatCurrency(reg.totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Scontrino medio</p>
                      <p className="font-medium">{formatCurrency(reg.avgTicket)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pagamenti</p>
                      <div className="flex gap-1 flex-wrap">
                        {reg.paymentBreakdown.cash > 0 && <Badge variant="outline" className="text-xs"><Banknote className="w-3 h-3 mr-1" />{reg.paymentBreakdown.cash}</Badge>}
                        {reg.paymentBreakdown.card > 0 && <Badge variant="outline" className="text-xs"><CreditCard className="w-3 h-3 mr-1" />{reg.paymentBreakdown.card}</Badge>}
                        {reg.paymentBreakdown.pos > 0 && <Badge variant="outline" className="text-xs"><Receipt className="w-3 h-3 mr-1" />{reg.paymentBreakdown.pos}</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nessuna cassa con transazioni nel periodo selezionato
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-t-2xl">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-white" />
            </div>
            Ultime Transazioni
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {stats?.recentTransactions?.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer" onClick={() => setSelectedTxId(tx.id.toString())} data-testid={`row-transaction-${tx.id}`}>
                <div className="flex items-center gap-3">
                  {tx.type === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-teal-500" />
                  )}
                  <div>
                    <div className="font-medium">{tx.transactionNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {tx.repairCenterName} - {format(new Date(tx.createdAt), "dd/MM HH:mm", { locale: it })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`font-bold ${tx.type === "refunded" ? "text-teal-600" : ""}`}>
                      {tx.type === "refunded" ? "-" : ""}{formatCurrency(tx.totalAmount)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getPaymentMethodLabel(tx.paymentMethod)}
                    </Badge>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
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

      <Card className="rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 rounded-t-2xl">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            Timeline Sessioni Cassa
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {sessions?.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`row-session-${session.id}`}>
                <div className="flex items-center gap-3">
                  {session.status === "open" ? (
                    <PlayCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <StopCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">
                      {session.repairCenterName}
                      {session.registerName && <span className="text-muted-foreground font-normal"> · {session.registerName}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Operatore: {session.operatorName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    {session.status === "open" ? (
                      <Badge variant="default" className="bg-green-500">Aperta</Badge>
                    ) : (
                      <Badge variant="secondary">Chiusa</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(session.openedAt), "dd/MM HH:mm", { locale: it })}
                    {session.closedAt && ` - ${format(new Date(session.closedAt), "HH:mm", { locale: it })}`}
                  </div>
                  {session.totalTransactions > 0 && (
                    <div className="text-xs mt-1">
                      <span className="font-medium">{session.totalTransactions}</span> vendite · <span className="font-medium">{formatCurrency(session.totalSales)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!sessions || sessions.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nessuna sessione recente
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTxId} onOpenChange={(open) => !open && setSelectedTxId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              Dettaglio Transazione
            </DialogTitle>
          </DialogHeader>
          {txLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : txDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Numero</p>
                  <p className="font-medium">{txDetail.transaction.transactionNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Centro</p>
                  <p className="font-medium">{txDetail.repairCenterName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium">{format(new Date(txDetail.transaction.createdAt), "dd/MM/yyyy HH:mm", { locale: it })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagamento</p>
                  <Badge variant="outline">{getPaymentMethodLabel(txDetail.transaction.paymentMethod)}</Badge>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" /> Articoli
                </p>
                <div className="space-y-2">
                  {txDetail.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                      <div>
                        <span className="font-medium">{item.productName}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotale</span>
                  <span>{formatCurrency(txDetail.transaction.subtotal)}</span>
                </div>
                {txDetail.transaction.discount > 0 && (
                  <div className="flex justify-between text-sm text-teal-600">
                    <span>Sconto</span>
                    <span>-{formatCurrency(txDetail.transaction.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Totale</span>
                  <span>{formatCurrency(txDetail.transaction.total)}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
