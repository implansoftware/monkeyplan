import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FileText, CalendarIcon, Filter } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Invoice } from "@shared/schema";
import type { DateRange } from "react-day-picker";

export default function CustomerInvoices() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = statusFilter === "all" || invoice.paymentStatus === statusFilter;
    const matchesDateRange = !dateRange?.from || 
      (new Date(invoice.createdAt) >= dateRange.from && 
       (!dateRange.to || new Date(invoice.createdAt) <= dateRange.to));
    return matchesStatus && matchesDateRange;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "pending": return "secondary";
      case "overdue": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Pagato";
      case "pending": return "In Sospeso";
      case "overdue": return "Scaduto";
      default: return status;
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Le Mie Fatture</h1>
        <p className="text-muted-foreground">Visualizza lo storico delle tue fatture</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <CardTitle>Fatture</CardTitle>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli Stati</SelectItem>
                  <SelectItem value="pending">In Sospeso</SelectItem>
                  <SelectItem value="paid">Pagato</SelectItem>
                  <SelectItem value="overdue">Scaduto</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" data-testid="button-date-filter">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd MMM", { locale: it })} -{" "}
                          {format(dateRange.to, "dd MMM yyyy", { locale: it })}
                        </>
                      ) : (
                        format(dateRange.from, "dd MMM yyyy", { locale: it })
                      )
                    ) : (
                      "Seleziona date"
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Caricamento...</div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nessuna fattura trovata</h3>
              <p className="text-muted-foreground max-w-md">
                {invoices.length === 0 
                  ? "Non hai ancora ricevuto fatture. Le fatture verranno visualizzate qui una volta emesse."
                  : "Nessuna fattura corrisponde ai filtri selezionati. Prova a modificare i criteri di ricerca."
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N. Fattura</TableHead>
                  <TableHead>Data Emissione</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: it })}</TableCell>
                    <TableCell>{formatCurrency(invoice.total)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.paymentStatus)}>
                        {getStatusLabel(invoice.paymentStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.paidDate 
                        ? format(new Date(invoice.paidDate), "dd MMM yyyy", { locale: it })
                        : "-"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {filteredInvoices.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Totale fatture: {filteredInvoices.length}
        </div>
      )}
    </div>
  );
}
