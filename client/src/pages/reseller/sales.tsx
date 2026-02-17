import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Search, 
  TrendingUp, 
  Download, 
  CalendarIcon, 
  Euro, 
  ShoppingCart, 
  Store, 
  Zap,
  Briefcase,
  Filter,
  RefreshCw
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface UnifiedSale {
  id: string;
  source: string;
  sourceLabel: string;
  amount: number;
  date: string;
  entityType: string;
  entityId: string;
  entityName: string;
  status: string;
  statusLabel: string;
  customerName: string | null;
  invoiceId: string | null;
  reference: string | null;
}

interface SalesSummary {
  totalSales: number;
  totalAmount: number;
  bySource: {
    ecommerce: number;
    pos: number;
    utility: number;
    b2b: number;
  };
  countBySource: {
    ecommerce: number;
    pos: number;
    utility: number;
    b2b: number;
  };
}

interface RepairCenter {
  id: string;
  name: string;
}

interface SubReseller {
  id: string;
  fullName: string;
}

interface SalesResponse {
  sales: UnifiedSale[];
  summary: SalesSummary;
  repairCenters: RepairCenter[];
  subResellers: SubReseller[];
}

export default function ResellerSales() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [repairCenterFilter, setRepairCenterFilter] = useState<string>("all");
  const [subResellerFilter, setSubResellerFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (sourceFilter !== "all") params.append("source", sourceFilter);
    if (repairCenterFilter !== "all") params.append("repairCenterId", repairCenterFilter);
    if (subResellerFilter !== "all") params.append("subResellerId", subResellerFilter);
    if (dateRange?.from) params.append("dateFrom", dateRange.from.toISOString());
    if (dateRange?.to) params.append("dateTo", dateRange.to.toISOString());
    return params.toString();
  };

  const { data, isLoading, refetch } = useQuery<SalesResponse>({
    queryKey: ["/api/reseller/sales", sourceFilter, repairCenterFilter, subResellerFilter, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/reseller/sales?${queryString}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sales");
      return response.json();
    },
  });

  const sales = data?.sales || [];
  const summary = data?.summary;
  const repairCenters = data?.repairCenters || [];
  const subResellers = data?.subResellers || [];

  const filteredSales = sales.filter((sale) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sale.reference?.toLowerCase().includes(query) ||
      sale.customerName?.toLowerCase().includes(query) ||
      sale.entityName.toLowerCase().includes(query)
    );
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "ecommerce": return <ShoppingCart className="h-3 w-3" />;
      case "pos": return <Store className="h-3 w-3" />;
      case "utility": return <Zap className="h-3 w-3" />;
      case "b2b": return <Briefcase className="h-3 w-3" />;
      default: return null;
    }
  };

  const getSourceBadge = (source: string, label: string) => {
    const colorMap: Record<string, string> = {
      ecommerce: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      pos: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      utility: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      b2b: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return (
      <Badge variant="outline" className={`gap-1 ${colorMap[source] || ''}`}>
        {getSourceIcon(source)}
        {label}
      </Badge>
    );
  };

  const getEntityBadge = (entityType: string) => {
    switch (entityType) {
      case "reseller": return <Badge variant="secondary">{t("roles.reseller")}</Badge>;
      case "sub_reseller": return <Badge variant="outline">{t("roles.subReseller")}</Badge>;
      case "repair_center": return <Badge variant="outline">Centro Rip.</Badge>;
      default: return <Badge variant="outline">{entityType}</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const csv = [
        ['Riferimento', 'Data', 'Fonte', 'Entità', 'Cliente', 'Importo', 'Stato'].join(','),
        ...filteredSales.map(sale => [
          sale.reference || sale.id.slice(0, 8),
          format(new Date(sale.date), "dd/MM/yyyy HH:mm"),
          sale.sourceLabel,
          sale.entityName,
          sale.customerName || 'N/D',
          (sale.amount / 100).toFixed(2),
          sale.statusLabel
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vendite_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t("reports.exportCompleted"),
        description: t("sales.csvDownloadedSuccess"),
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("reports.exportFailed"),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/reseller/sales"] });
    refetch();
    toast({ title: t("sales.dataRefreshed") });
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="page-reseller-sales-loading">
        <Skeleton className="h-32 w-full" />
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
    <div className="space-y-6" data-testid="page-reseller-sales">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">{t("sidebar.items.salesOverview")}</h1>
              <p className="text-white/80">
                {t("sales.allSalesDesc")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              data-testid="button-refresh-sales"
            >
              <RefreshCw className="h-4 w-4 mr-2" />{t("common.update")}</Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={isExporting || filteredSales.length === 0}
              data-testid="button-export-sales"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? t("sales.exporting") : t("sales.exportCsv")}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("pos.salesTotal")}</p>
                <p className="text-xl font-bold" data-testid="text-total-amount">
                  {formatCurrency(summary?.totalAmount || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{summary?.totalSales || 0} {t("sales.transactions")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("sidebar.sections.ecommerce")}</p>
                <p className="text-xl font-bold text-blue-600" data-testid="text-ecommerce-amount">
                  {formatCurrency(summary?.bySource.ecommerce || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{summary?.countBySource.ecommerce || 0} {t("common.orders")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Store className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("sidebar.sections.posSection")}</p>
                <p className="text-xl font-bold text-green-600" data-testid="text-pos-amount">
                  {formatCurrency(summary?.bySource.pos || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{summary?.countBySource.pos || 0} {t("sales.salesCount")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("utility.title")}</p>
                <p className="text-xl font-bold text-yellow-600" data-testid="text-utility-amount">
                  {formatCurrency(summary?.bySource.utility || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{summary?.countBySource.utility || 0} {t("sales.practices")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("sidebar.sections.b2b")}</p>
                <p className="text-xl font-bold text-purple-600" data-testid="text-b2b-amount">
                  {formatCurrency(summary?.bySource.b2b || 0)}
                </p>
                <p className="text-xs text-muted-foreground">{summary?.countBySource.b2b || 0} {t("common.orders")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("sales.filtersLabel")}</span>
            </div>
            
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("sales.searchByRefClient")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-sales"
              />
            </div>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-source-filter">
                <SelectValue placeholder={t("sales.sourcePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("sales.allSources")}</SelectItem>
                <SelectItem value="ecommerce">{t("sidebar.sections.ecommerce")}</SelectItem>
                <SelectItem value="pos">{t("sidebar.sections.posSection")}</SelectItem>
                <SelectItem value="utility">{t("utility.title")}</SelectItem>
                <SelectItem value="b2b">{t("sidebar.sections.b2b")}</SelectItem>
              </SelectContent>
            </Select>
            
            {repairCenters.length > 0 && (
              <Select value={repairCenterFilter} onValueChange={setRepairCenterFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-repair-center-filter">
                  <SelectValue placeholder={t("roles.repairCenter")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allCenters")}</SelectItem>
                  {repairCenters.map((rc) => (
                    <SelectItem key={rc.id} value={rc.id}>{rc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {subResellers.length > 0 && (
              <Select value={subResellerFilter} onValueChange={setSubResellerFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sub-reseller-filter">
                  <SelectValue placeholder={t("roles.subReseller")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i sub-reseller</SelectItem>
                  {subResellers.map((sr) => (
                    <SelectItem key={sr.id} value={sr.id}>{sr.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-date-filter">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd/MM", { locale: it })} - ${format(dateRange.to, "dd/MM", { locale: it })}`
                    ) : format(dateRange.from, "dd/MM/yyyy", { locale: it })
                  ) : t("common.period")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={it}
                  numberOfMonths={2}
                />
                {dateRange && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setDateRange(undefined)}
                    >
                      Cancella filtro date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {filteredSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Nessuna vendita trovata</p>
              <p className="text-sm">Modifica i filtri per visualizzare i risultati</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("common.reference")}</TableHead>
                    <TableHead>{t("common.date")}</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>{t("common.entity")}</TableHead>
                    <TableHead>{t("common.customer")}</TableHead>
                    <TableHead className="text-right">{t("common.amount")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={`${sale.source}-${sale.id}`} data-testid={`row-sale-${sale.id}`}>
                      <TableCell className="font-medium">
                        {sale.reference || sale.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(sale.date), "dd/MM/yyyy HH:mm", { locale: it })}
                      </TableCell>
                      <TableCell>
                        {getSourceBadge(sale.source, sale.sourceLabel)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{sale.entityName}</span>
                          {getEntityBadge(sale.entityType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.customerName || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(sale.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.statusLabel}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {filteredSales.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground text-right">
              {filteredSales.length} vendite visualizzate
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
