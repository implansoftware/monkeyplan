import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  PlayCircle, 
  StopCircle,
  User,
  Banknote,
  TrendingUp,
  ArrowLeft,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Store,
  Download,
  FileSpreadsheet,
  FileText,
  File
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format, isToday, isThisWeek, isThisMonth, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";

interface PosSession {
  id: string;
  repairCenterId: string;
  operatorId: string;
  registerId: string | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  cashDifference: number | null;
  totalSales: number | null;
  totalTransactions: number | null;
  totalCashSales: number | null;
  totalCardSales: number | null;
  totalRefunds: number | null;
  closingNotes: string | null;
  totalsByVatRate?: Record<string, { imponibile: number; iva: number; totale: number; count: number }> | null;
  dailyReportGenerated?: boolean | null;
}

interface PosRegister {
  id: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
}

export default function PosSessionsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("all");
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: registers = [] } = useQuery<PosRegister[]>({
    queryKey: ["/api/repair-center/pos/registers"],
  });

  const { data: sessions, isLoading } = useQuery<PosSession[]>({
    queryKey: ["/api/repair-center/pos/sessions", selectedRegisterId],
    queryFn: async () => {
      const url = selectedRegisterId && selectedRegisterId !== "all" 
        ? `/api/repair-center/pos/sessions?registerId=${selectedRegisterId}`
        : "/api/repair-center/pos/sessions";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  const formatCurrency = (cents: number | null) => {
    if (cents === null || cents === undefined) return "€ 0,00";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const filterByPeriod = (session: PosSession) => {
    const date = new Date(session.openedAt);
    switch (period) {
      case "today":
        return isToday(date);
      case "week":
        return isThisWeek(date, { locale: it });
      case "month":
        return isThisMonth(date);
      default:
        return true;
    }
  };

  const filteredSessions = sessions?.filter(filterByPeriod) || [];

  const stats = {
    totalSessions: filteredSessions.length,
    openSessions: filteredSessions.filter(s => s.status === "open").length,
    totalRevenue: filteredSessions.reduce((sum, s) => sum + (s.totalSales ?? 0), 0),
    totalTransactions: filteredSessions.reduce((sum, s) => sum + (s.totalTransactions ?? 0), 0),
  };

  const avgPerSession = stats.totalSessions > 0 ? Math.round(stats.totalRevenue / stats.totalSessions) : 0;

  const getRegisterName = (registerId: string | null) => {
    if (!registerId) return t("pos.mainRegister");
    const register = registers.find(r => r.id === registerId);
    return register?.name || t("pos.register");
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams({ format });
      if (selectedRegisterId && selectedRegisterId !== "all") {
        params.append('registerId', selectedRegisterId);
      }
      if (period && period !== "all") {
        params.append('period', period);
      }
      
      const response = await fetch(`/api/repair-center/pos/sessions/export?${params}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'export');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] 
        || `sessioni_cassa.${format}`;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t("reports.exportCompleted"),
        description: t("pos.formatDownloaded", { format: format.toUpperCase() }),
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("auth.error"),
        description: t("reports.exportFailed"),
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 sm:space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/repair-center/pos">
              <Button variant="outline" size="icon" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Clock className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{t("sidebar.items.posSessions")}</h1>
              <p className="text-emerald-100">Cronologia aperture e chiusure cassa</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {registers.length > 1 && (
              <Select value={selectedRegisterId} onValueChange={setSelectedRegisterId}>
                <SelectTrigger className="w-full sm:w-48 bg-white/20 backdrop-blur-sm text-white border-white/30" data-testid="select-register-filter">
                  <Store className="w-4 h-4 mr-1" />
                  <SelectValue placeholder={t("pos.tutteLeCasse")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("pos.tutteLeCasse")}</SelectItem>
                  {registers.map(reg => (
                    <SelectItem key={reg.id} value={reg.id}>
                      {reg.name} {reg.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-40 bg-white/20 backdrop-blur-sm text-white border-white/30" data-testid="select-period">
                <SelectValue placeholder={t("common.period")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="today">{t("common.today")}</SelectItem>
                <SelectItem value="week">{t("reports.week")}</SelectItem>
                <SelectItem value="month">{t("reports.month")}</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" disabled={isExporting || filteredSessions.length === 0} data-testid="button-export">
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Export..." : t("common.export")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('csv')} data-testid="menu-export-csv">
                  <FileText className="h-4 w-4 mr-2" />
                  Esporta CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')} data-testid="menu-export-xlsx">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Esporta Excel (XLSX)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')} data-testid="menu-export-pdf">
                  <File className="h-4 w-4 mr-2" />
                  Esporta PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Sessioni Totali</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            {stats.openSessions > 0 && (
              <p className="text-xs text-green-600">{stats.openSessions} attiva</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Incasso Totale</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Transazioni</CardTitle>
            <Receipt className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Media per Sessione</CardTitle>
            <Banknote className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgPerSession)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-500" />
            Timeline Sessioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div 
                key={session.id} 
                className="p-4 rounded-lg border bg-muted/30"
                data-testid={`row-session-${session.id}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    {session.status === "open" ? (
                      <div className="mt-1">
                        <PlayCircle className="h-6 w-6 text-green-500" />
                      </div>
                    ) : (
                      <div className="mt-1">
                        <StopCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {session.status === "open" ? (
                          <Badge variant="default" className="bg-green-500">Aperta</Badge>
                        ) : (
                          <Badge variant="secondary">{t("pos.closed")}</Badge>
                        )}
                        <Badge variant="outline" className="flex flex-wrap items-center gap-1">
                          <Store className="w-3 h-3" />
                          {getRegisterName(session.registerId)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {format(new Date(session.openedAt), "EEEE dd MMMM yyyy", { locale: it })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Apertura:</span> {format(new Date(session.openedAt), "HH:mm", { locale: it })}
                        {session.closedAt && (
                          <>
                            <span className="mx-2">→</span>
                            <span className="font-medium">Chiusura:</span> {format(new Date(session.closedAt), "HH:mm", { locale: it })}
                          </>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Banknote className="h-3 w-3" />
                        Fondo cassa iniziale: {formatCurrency(session.openingCash)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right min-w-0 sm:min-w-[180px]">
                    {session.status === "closed" && (
                      <>
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(session.totalSales)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {session.totalTransactions || 0} transazioni
                        </div>
                        {session.cashDifference !== null && session.cashDifference !== 0 && (
                          <div className={`text-sm flex items-center justify-end gap-1 mt-1 ${
                            session.cashDifference > 0 ? "text-green-600" : "text-destructive"
                          }`}>
                            {session.cashDifference > 0 ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            Differenza: {formatCurrency(session.cashDifference)}
                          </div>
                        )}
                      </>
                    )}
                    {session.status === "open" && (
                      <div className="text-sm text-green-600 font-medium">
                        In corso...
                      </div>
                    )}
                  </div>
                </div>

                {session.status === "closed" && (session.totalCashSales || session.totalCardSales || session.totalRefunds) && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-4 flex-wrap text-sm">
                    {session.totalCashSales !== null && session.totalCashSales > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <Banknote className="h-4 w-4 text-green-600" />
                        <span>{t("pos.contanti")}: {formatCurrency(session.totalCashSales)}</span>
                      </div>
                    )}
                    {session.totalCardSales !== null && session.totalCardSales > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <Receipt className="h-4 w-4 text-blue-600" />
                        <span>{t("pos.carta")}: {formatCurrency(session.totalCardSales)}</span>
                      </div>
                    )}
                    {session.totalRefunds !== null && session.totalRefunds > 0 && (
                      <div className="flex flex-wrap items-center gap-1 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{t("pos.rimborsi")}: {formatCurrency(session.totalRefunds)}</span>
                      </div>
                    )}
                  </div>
                )}

                {session.closingNotes && (
                  <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                    <span className="font-medium">Note:</span> {session.closingNotes}
                  </div>
                )}

                {session.totalsByVatRate && Object.keys(session.totalsByVatRate).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm font-medium mb-2">Riepilogo IVA (Corrispettivi)</div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">Aliquota</span>
                      <span className="font-medium text-right">Imponibile</span>
                      <span className="font-medium text-right">IVA</span>
                      <span className="font-medium text-right">{t("common.total")}</span>
                    </div>
                    {Object.entries(session.totalsByVatRate).map(([rate, data]) => (
                      <div key={rate} className="grid grid-cols-4 gap-2 text-xs">
                        <span>{rate}%</span>
                        <span className="text-right">{formatCurrency(data.imponibile)}</span>
                        <span className="text-right">{formatCurrency(data.iva)}</span>
                        <span className="text-right font-medium">{formatCurrency(data.totale)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {filteredSessions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t("pos.nessunaSessioneTrovata")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
