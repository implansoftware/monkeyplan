import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepairOrder } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CalendarIcon, FileSpreadsheet, BarChart3, Wrench, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

export default function ResellerReports() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: repairs = [], isLoading } = useQuery<RepairOrder[]>({
    queryKey: ["/api/reseller/repairs"],
  });

  const filteredRepairs = repairs.filter((repair) => {
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    let matchesDate = true;
    if (dateRange?.from) {
      const repairDate = new Date(repair.createdAt);
      matchesDate = repairDate >= dateRange.from;
      if (dateRange.to) {
        matchesDate = matchesDate && repairDate <= dateRange.to;
      }
    }
    return matchesStatus && matchesDate;
  });

  const handleExportRepairs = async () => {
    try {
      setIsExporting(true);
      
      const csv = [
        [t("reseller.csvOrderNumber"), t("common.date"), t("reseller.csvDevice"), t("reseller.csvModel"), t("common.status"), t("reseller.csvProblem")].join(','),
        ...filteredRepairs.map(r => [
          r.orderNumber,
          format(new Date(r.createdAt), "dd/MM/yyyy"),
          r.deviceType,
          r.deviceModel || t("common.nd"),
          r.status,
          `"${(r.issueDescription || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `riparazioni_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: t("reports.exportCompleted"),
        description: t("reseller.csvDownloaded"),
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

  const totalRepairs = filteredRepairs.length;
  const completedRepairs = filteredRepairs.filter(r => r.status === 'consegnato').length;
  const inProgressRepairs = filteredRepairs.filter(r => ['in_riparazione', 'in_diagnosi', 'in_test'].includes(r.status)).length;
  const pendingRepairs = filteredRepairs.filter(r => ['ingressato', 'attesa_ricambi', 'preventivo_emesso', 'pending'].includes(r.status)).length;

  const statusOptions = [
    { value: "all", label: t("common.allStatuses") },
    { value: "pending", label: t("common.pending") },
    { value: "ingressato", label: t("repairs.status.received") },
    { value: "in_diagnosi", label: t("repairs.status.inDiagnosis") },
    { value: "preventivo_emesso", label: t("repairs.status.quoted") },
    { value: "preventivo_accettato", label: t("repairs.status.approved") },
    { value: "preventivo_rifiutato", label: t("repairs.status.quoteRejected") },
    { value: "attesa_ricambi", label: t("repairs.status.waitingParts") },
    { value: "in_riparazione", label: t("repairs.status.inRepair") },
    { value: "in_test", label: t("repairs.status.inTest") },
    { value: "pronto_ritiro", label: t("repairs.status.readyForDelivery") },
    { value: "consegnato", label: t("repairs.status.delivered") },
  ];

  return (
    <div className="space-y-6" data-testid="page-reseller-reports">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">{t("reports.title")}</h1>
              <p className="text-white/80">
                {t("reseller.businessStats")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.total")}</p>
                <p className="text-2xl font-bold" data-testid="text-total-repairs">{totalRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.completed")}</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-completed-repairs">{completedRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("repairs.inProgress")}</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-inprogress-repairs">{inProgressRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.pending")}</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-repairs">{pendingRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>{t("reseller.exportRepairs")}</CardTitle>
          <CardDescription>
            {t("reseller.filterAndExportCsv")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-56" data-testid="select-filter-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-64" data-testid="button-date-range">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd MMM yyyy", { locale: it })} - ${format(dateRange.to, "dd MMM yyyy", { locale: it })}`
                    ) : (
                      format(dateRange.from, "dd MMM yyyy", { locale: it })
                    )
                  ) : (
                    t("reseller.selectPeriod")
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  locale={it}
                />
              </PopoverContent>
            </Popover>
            <Button
              onClick={handleExportRepairs}
              disabled={isExporting || filteredRepairs.length === 0}
              data-testid="button-export-repairs"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? t("pages.exporting") : t("reseller.exportNRepairs", { count: filteredRepairs.length })}
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-6 text-center text-muted-foreground">{t("table.loading")}</div>
          ) : filteredRepairs.length === 0 ? (
            <div className="mt-6 text-center text-muted-foreground py-8">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>{t("reseller.noRepairsWithFilters")}</p>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                {t("reseller.repairsReadyForExport", { count: filteredRepairs.length })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
