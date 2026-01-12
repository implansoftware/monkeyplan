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
  StopCircle
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
  operatorName: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  totalSales: number;
  totalTransactions: number;
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            Panoramica POS
          </h1>
          <p className="text-muted-foreground">
            Monitoraggio casse dei tuoi centri riparazione
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={repairCenterFilter} onValueChange={setRepairCenterFilter}>
            <SelectTrigger className="w-48" data-testid="select-repair-center">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Transazioni</CardTitle>
            <Receipt className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              nel periodo selezionato
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-600/5 to-cyan-600/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Fatturato</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
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

        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-600/5 to-blue-600/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Resi/Rimborsi</CardTitle>
            <RotateCcw className="h-4 w-4 text-cyan-500" />
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-500" />
            Ultime Transazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentTransactions?.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer" onClick={() => setSelectedTxId(tx.id.toString())} data-testid={`row-transaction-${tx.id}`}>
                <div className="flex items-center gap-3">
                  {tx.type === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-cyan-500" />
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
                    <div className={`font-bold ${tx.type === "refunded" ? "text-cyan-600" : ""}`}>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-500" />
            Timeline Sessioni Cassa
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                    <div className="font-medium">{session.repairCenterName}</div>
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
              <Receipt className="h-5 w-5 text-blue-500" />
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
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="flex justify-between text-sm text-cyan-600">
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
