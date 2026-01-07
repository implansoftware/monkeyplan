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

export default function ResellerReports() {
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
        ['Numero Ordine', 'Data', 'Dispositivo', 'Modello', 'Stato', 'Problema'].join(','),
        ...filteredRepairs.map(r => [
          r.orderNumber,
          format(new Date(r.createdAt), "dd/MM/yyyy"),
          r.deviceType,
          r.deviceModel || 'N/D',
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
        title: "Export completato",
        description: "Il file CSV è stato scaricato con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile esportare i dati",
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
    { value: "all", label: "Tutti gli stati" },
    { value: "pending", label: "In Attesa" },
    { value: "ingressato", label: "Ingressato" },
    { value: "in_diagnosi", label: "In Diagnosi" },
    { value: "preventivo_emesso", label: "Preventivo Emesso" },
    { value: "preventivo_accettato", label: "Preventivo Accettato" },
    { value: "preventivo_rifiutato", label: "Preventivo Rifiutato" },
    { value: "attesa_ricambi", label: "Attesa Ricambi" },
    { value: "in_riparazione", label: "In Riparazione" },
    { value: "in_test", label: "In Test" },
    { value: "pronto_ritiro", label: "Pronto Ritiro" },
    { value: "consegnato", label: "Consegnato" },
  ];

  return (
    <div className="space-y-6" data-testid="page-reseller-reports">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Report</h1>
              <p className="text-muted-foreground">
                Statistiche e analisi del business
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="text-2xl font-bold" data-testid="text-total-repairs">{totalRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completate</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-completed-repairs">{completedRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Corso</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="text-inprogress-repairs">{inProgressRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Attesa</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-repairs">{pendingRepairs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Esporta Riparazioni</CardTitle>
          <CardDescription>
            Filtra e esporta i dati delle riparazioni in formato CSV
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
                    "Seleziona periodo"
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
              {isExporting ? "Esportazione..." : `Esporta ${filteredRepairs.length} riparazioni`}
            </Button>
          </div>

          {isLoading ? (
            <div className="mt-6 text-center text-muted-foreground">
              Caricamento dati...
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="mt-6 text-center text-muted-foreground py-8">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessuna riparazione trovata con i filtri selezionati</p>
            </div>
          ) : (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                {filteredRepairs.length} riparazioni pronte per l'export
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
