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
import { Search, FileText, Download, CalendarIcon, Euro } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";

export default function ResellerInvoices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.paymentStatus === statusFilter;
    let matchesDate = true;
    if (dateRange?.from) {
      const invoiceDate = new Date(invoice.createdAt);
      matchesDate = invoiceDate >= dateRange.from;
      if (dateRange.to) {
        matchesDate = matchesDate && invoiceDate <= dateRange.to;
      }
    }
    return matchesSearch && matchesStatus && matchesDate;
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
        ['Numero', 'Data', 'Importo', 'Metodo Pagamento', 'Scadenza', 'Stato'].join(','),
        ...filteredInvoices.map(inv => [
          inv.invoiceNumber,
          format(new Date(inv.createdAt), "dd/MM/yyyy"),
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
    <div className="space-y-6" data-testid="page-reseller-invoices">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Le Mie Fatture</h1>
        <p className="text-muted-foreground">
          Visualizza e gestisci le fatture associate ai tuoi ordini
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
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
            <div className="flex items-center gap-3">
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-filter-status">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Scadenza</TableHead>
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
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {invoice.paymentMethod?.replace("_", " ") || "N/D"}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), "dd MMM yyyy", { locale: it })
                        : "N/D"}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.paymentStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
