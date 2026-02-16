import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, FileText, Download, CalendarIcon, Euro, Wrench, ShoppingCart, Store } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";

export default function RepairCenterInvoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/repair-center/invoices", statusFilter, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);
      const response = await fetch(`/api/repair-center/invoices?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesDate = true;
    if (dateRange?.from) {
      const invoiceDate = new Date(invoice.createdAt);
      matchesDate = invoiceDate >= dateRange.from;
      if (dateRange.to) {
        matchesDate = matchesDate && invoiceDate <= dateRange.to;
      }
    }
    return matchesSearch && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge>Pagata</Badge>;
      case "pending": return <Badge variant="secondary">In sospeso</Badge>;
      case "overdue": return <Badge variant="destructive">Scaduta</Badge>;
      case "cancelled": return <Badge variant="outline">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string | null) => {
    switch (source) {
      case "repair": return <Badge variant="outline" className="gap-1"><Wrench className="h-3 w-3" />Riparazione</Badge>;
      case "pos": return <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />POS</Badge>;
      case "marketplace": return <Badge variant="outline" className="gap-1"><Store className="h-3 w-3" />Marketplace</Badge>;
      case "b2b": return <Badge variant="outline" className="gap-1">B2B</Badge>;
      default: return <Badge variant="outline">Altro</Badge>;
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + inv.total, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.paymentStatus === 'pending').reduce((sum, inv) => sum + inv.total, 0);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      const csv = [
        ['Numero', 'Data', 'Fonte', 'Importo', 'Metodo Pagamento', 'Scadenza', 'Stato'].join(','),
        ...filteredInvoices.map(inv => [
          inv.invoiceNumber,
          format(new Date(inv.createdAt), "dd/MM/yyyy"),
          inv.source || 'altro',
          (inv.total / 100).toFixed(2),
          inv.paymentMethod || 'N/D',
          inv.dueDate ? format(new Date(inv.dueDate), "dd/MM/yyyy") : 'N/D',
          inv.paymentStatus
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fatture_${new Date().toISOString().split('T')[0]}.csv`;
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

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-repair-center-invoices">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">Fatture</h1>
              <p className="text-emerald-100">
                Visualizza le fatture da riparazioni, POS e marketplace
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="text-xl font-bold" data-testid="text-total-amount">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagate</p>
                <p className="text-xl font-bold text-green-600" data-testid="text-paid-amount">{formatCurrency(paidAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Euro className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Sospeso</p>
                <p className="text-xl font-bold text-yellow-600" data-testid="text-pending-amount">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <div className="flex-1 relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca fattura..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-invoices"
                />
              </div>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le fonti</SelectItem>
                  <SelectItem value="repair">Riparazioni</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="b2b">B2B</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="paid">Pagate</SelectItem>
                  <SelectItem value="pending">In sospeso</SelectItem>
                  <SelectItem value="overdue">Scadute</SelectItem>
                  <SelectItem value="cancelled">Annullate</SelectItem>
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
                <PopoverContent className="w-auto p-0" align="end">
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
                onClick={handleExport}
                disabled={isExporting || filteredInvoices.length === 0}
                variant="outline"
                data-testid="button-export-invoices"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Esportazione..." : "Esporta CSV"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nessuna fattura trovata</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="hidden md:table-cell">Fonte</TableHead>
                    <TableHead className="text-right">Imponibile</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">IVA%</TableHead>
                    <TableHead className="hidden lg:table-cell text-right">IVA</TableHead>
                    <TableHead className="text-right">Totale</TableHead>
                    <TableHead className="hidden md:table-cell">Metodo</TableHead>
                    <TableHead className="hidden lg:table-cell">Scadenza</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium font-mono">{invoice.invoiceNumber}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: it })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{getSourceBadge(invoice.source)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(invoice.amount)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right">
                        <Badge variant="outline" className="font-mono">{invoice.vatRate ?? 22}%</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-muted-foreground">
                        {formatCurrency(invoice.tax)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(invoice.total)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize">
                        {invoice.paymentMethod?.replace("_", " ") || "N/D"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {invoice.dueDate
                          ? format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: it })
                          : "N/D"}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.paymentStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
