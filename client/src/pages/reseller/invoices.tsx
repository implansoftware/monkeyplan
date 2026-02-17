import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Invoice, SibillDocument } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, FileText, Download, CalendarIcon, Euro, Wrench, ShoppingCart, Store, RefreshCw, Building2, Eye, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DateRange } from "react-day-picker";
import { InvoiceDetailDialog } from "@/components/InvoiceDetailDialog";
import { useTranslation } from "react-i18next";

export default function ResellerInvoices() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("monkeyplan");
  const [selectedSibillDoc, setSelectedSibillDoc] = useState<SibillDocument | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/reseller/invoices", statusFilter, sourceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);
      const response = await fetch(`/api/reseller/invoices?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
  });

  // Check if Sibill is configured
  const { data: sibillCredentials } = useQuery<{ id: string } | null>({
    queryKey: ["/api/sibill/credentials"],
  });

  // Get Sibill documents
  const { data: sibillDocuments = [], isLoading: isLoadingSibill } = useQuery<SibillDocument[]>({
    queryKey: ["/api/sibill/documents"],
    enabled: !!sibillCredentials,
  });

  // Sync Sibill documents mutation
  const syncSibillMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sibill/documents/sync");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sibill/documents"] });
      toast({
        title: t("invoices.syncCompleted"),
        description: `Importati ${data.syncedCount} documenti da ${data.companiesProcessed} aziende`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("invoices.syncError"),
        description: error.message,
        variant: "destructive",
      });
    },
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
      case "paid": return <Badge>{t("invoices.paid")}</Badge>;
      case "pending": return <Badge variant="secondary">In sospeso</Badge>;
      case "overdue": return <Badge variant="destructive">{t("invoices.overdue")}</Badge>;
      case "cancelled": return <Badge variant="outline">{t("common.cancelled")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string | null) => {
    switch (source) {
      case "repair": return <Badge variant="outline" className="gap-1"><Wrench className="h-3 w-3" />{t("common.repair")}</Badge>;
      case "pos": return <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />{t("sidebar.sections.posSection")}</Badge>;
      case "marketplace": return <Badge variant="outline" className="gap-1"><Store className="h-3 w-3" />{t("marketplace.title")}</Badge>;
      case "b2b": return <Badge variant="outline" className="gap-1">{t("sidebar.sections.b2b")}</Badge>;
      default: return <Badge variant="outline">{t("common.other")}</Badge>;
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
        title: t("reports.exportCompleted"),
        description: t("invoices.csvDownloaded"),
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

  return (
    <div className="space-y-6" data-testid="page-reseller-invoices">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Le Mie Fatture</h1>
              <p className="text-white/80">
                {t("invoices.viewAndManageDesc")}
              </p>
            </div>
          </div>
          {sibillCredentials && (
            <Button
              variant="outline"
              onClick={() => syncSibillMutation.mutate()}
              disabled={syncSibillMutation.isPending}
              data-testid="button-sync-sibill"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncSibillMutation.isPending ? 'animate-spin' : ''}`} />
              {syncSibillMutation.isPending ? t("invoices.syncingLabel") : t("invoices.importFromSibill")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Euro className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.total")}</p>
                <p className="text-xl font-bold" data-testid="text-total-amount">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
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
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Euro className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.pendingPayments")}</p>
                <p className="text-xl font-bold text-yellow-600" data-testid="text-pending-amount">{formatCurrency(pendingAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="monkeyplan" data-testid="tab-monkeyplan">
            <FileText className="h-4 w-4 mr-2" />
            MonkeyPlan ({invoices.length})
          </TabsTrigger>
          {sibillCredentials && (
            <TabsTrigger value="sibill" data-testid="tab-sibill">
              <Building2 className="h-4 w-4 mr-2" />
              Sibill ({sibillDocuments.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="monkeyplan">
          <Card className="rounded-2xl">
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
                  <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("invoices.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-invoice"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
                      <SelectValue placeholder={t("common.status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                      <SelectItem value="paid">Pagate</SelectItem>
                      <SelectItem value="pending">In sospeso</SelectItem>
                      <SelectItem value="overdue">Scadute</SelectItem>
                      <SelectItem value="cancelled">Annullate</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-source-filter">
                      <SelectValue placeholder="{t("invoices.source")}" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("invoices.allSources")}</SelectItem>
                      <SelectItem value="repair">{t("common.repair")}</SelectItem>
                      <SelectItem value="pos">{t("sidebar.sections.posSection")}</SelectItem>
                      <SelectItem value="marketplace">{t("marketplace.title")}</SelectItem>
                      <SelectItem value="b2b">{t("sidebar.sections.b2b")}</SelectItem>
                      <SelectItem value="other">{t("common.other")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="gap-2" data-testid="button-date-range">
                        <CalendarIcon className="h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          t("common.period")
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        locale={it}
                      />
                    </PopoverContent>
                  </Popover>
                  <Button variant="outline" onClick={handleExport} disabled={isExporting} data-testid="button-export-csv">
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? t("pages.exporting") : "Esporta CSV"}
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
                  <p>{t("invoices.noInvoicesFound")}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.number")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead className="text-right">Imponibile</TableHead>
                      <TableHead className="text-right">IVA%</TableHead>
                      <TableHead className="text-right">{t("common.vat")}</TableHead>
                      <TableHead className="text-right">{t("common.total")}</TableHead>
                      <TableHead>{t("common.method")}</TableHead>
                      <TableHead>{t("license.expiry")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                        <TableCell className="font-medium font-mono">{invoice.invoiceNumber}</TableCell>
                        <TableCell>
                          {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: it })}
                        </TableCell>
                        <TableCell>{getSourceBadge(invoice.source)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(invoice.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono">{invoice.vatRate ?? 22}%</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(invoice.tax)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setSelectedInvoice(invoice)} data-testid={`button-view-invoice-${invoice.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, "_blank")} data-testid={`button-download-invoice-${invoice.id}`}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {sibillCredentials && (
          <TabsContent value="sibill">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Documenti Sibill
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSibill ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : sibillDocuments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nessun documento Sibill importato</p>
                    <p className="text-sm mt-2">{t("invoices.clickImportSibillHint")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.number")}</TableHead>
                        <TableHead>{t("common.type")}</TableHead>
                        <TableHead>{t("common.date")}</TableHead>
                        <TableHead>{t("invoices.counterparty")}</TableHead>
                        <TableHead>{t("common.amount")}</TableHead>
                        <TableHead>{t("common.status")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sibillDocuments.map((doc) => (
                        <TableRow 
                          key={doc.id} 
                          data-testid={`row-sibill-doc-${doc.id}`}
                          className="cursor-pointer hover-elevate"
                          onClick={() => setSelectedSibillDoc(doc)}
                        >
                          <TableCell className="font-medium font-mono">{doc.documentNumber || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.documentType || "N/D"}</Badge>
                          </TableCell>
                          <TableCell>
                            {doc.issueDate
                              ? format(new Date(doc.issueDate), "dd MMM yyyy", { locale: it })
                              : "N/D"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{doc.counterpartyName || "-"}</p>
                              {doc.counterpartyVat && (
                                <p className="text-xs text-muted-foreground">P.IVA: {doc.counterpartyVat}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {doc.totalAmount ? formatCurrency(doc.totalAmount) : "N/D"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={doc.status === "paid" ? "default" : "secondary"}>
                              {doc.status || "N/D"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(open) => !open && setSelectedInvoice(null)}
      />

      <Dialog open={!!selectedSibillDoc} onOpenChange={(open) => !open && setSelectedSibillDoc(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <FileText className="h-5 w-5" />
              Dettagli Documento Sibill
            </DialogTitle>
            <DialogDescription>
              {selectedSibillDoc?.documentNumber || t("invoices.document")}
            </DialogDescription>
          </DialogHeader>
          

          {selectedSibillDoc && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Numero Documento</p>
                  <p className="font-mono font-medium">{selectedSibillDoc.documentNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.type")}</p>
                  <Badge variant="outline">{selectedSibillDoc.documentType || "N/D"}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Emissione</p>
                  <p className="font-medium">
                    {selectedSibillDoc.issueDate
                      ? format(new Date(selectedSibillDoc.issueDate), "dd MMMM yyyy", { locale: it })
                      : "N/D"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data Scadenza</p>
                  <p className="font-medium">
                    {selectedSibillDoc.dueDate
                      ? format(new Date(selectedSibillDoc.dueDate), "dd MMMM yyyy", { locale: it })
                      : "N/D"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Controparte</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome / Ragione Sociale</p>
                    <p className="font-medium">{selectedSibillDoc.counterpartyName || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("auth.vatNumber")}</p>
                    <p className="font-mono">{selectedSibillDoc.counterpartyVat || "-"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("invoices.totalAmount")}</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedSibillDoc.totalAmount ? formatCurrency(selectedSibillDoc.totalAmount) : "N/D"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("invoices.currency")}</p>
                  <p className="font-medium">{selectedSibillDoc.currency || "EUR"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.status")}</p>
                  <Badge variant={selectedSibillDoc.status === "paid" ? "default" : "secondary"}>
                    {selectedSibillDoc.status || "N/D"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("invoices.externalId")}</p>
                  <p className="font-mono text-xs">{selectedSibillDoc.externalId || "-"}</p>
                </div>
              </div>

              <Separator />
              
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Mostra dati grezzi API
                </summary>
                <pre className="bg-muted rounded-lg p-4 mt-2 overflow-auto max-h-48">
                  {JSON.stringify(selectedSibillDoc.rawData as Record<string, unknown>, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
