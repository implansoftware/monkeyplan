import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Invoice, User, MarketplaceOrderItem, RepairCenter } from "@shared/schema";
import { Download, FileText, Calendar, CreditCard, Euro, Building2, Package, Wrench } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface InvoiceDetailDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function InvoiceDetailDialog({ invoice, open, onOpenChange }: InvoiceDetailDialogProps) {
  const { t } = useTranslation();
  const { data: customer } = useQuery<User>({
    queryKey: ["/api/users", invoice?.customerId],
    enabled: !!invoice?.customerId && open,
  });

  const { data: repairCenter } = useQuery<RepairCenter>({
    queryKey: ["/api/repair-centers", invoice?.repairCenterId],
    enabled: !!invoice?.repairCenterId && !invoice?.customerId && open,
  });

  const { data: orderItems = [] } = useQuery<MarketplaceOrderItem[]>({
    queryKey: ["/api/invoices", invoice?.id, "items"],
    enabled: !!invoice?.id && invoice?.source === 'b2b' && open,
  });

  if (!invoice) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge>{t("invoices.statusPaid")}</Badge>;
      case "pending": return <Badge variant="secondary">{t("invoices.statusPending")}</Badge>;
      case "overdue": return <Badge variant="destructive">{t("invoices.statusOverdue")}</Badge>;
      case "cancelled": return <Badge variant="outline">{t("invoices.statusCancelled")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceLabel = (source: string | null) => {
    switch (source) {
      case "repair": return t("invoices.sourceRepair");
      case "pos": return "POS";
      case "ecommerce": return "E-commerce";
      case "b2b": return "B2B";
      case "warranty": return t("invoices.sourceWarranty");
      case "other": return t("invoices.sourceOther");
      default: return source || t("common.na");
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  };

  const buyerName = customer?.ragioneSociale || customer?.fullName || customer?.username || repairCenter?.ragioneSociale || repairCenter?.name;
  const buyerEmail = customer?.email || repairCenter?.email;
  const buyerAddress = customer?.indirizzo || repairCenter?.address;
  const buyerCity = customer?.citta || repairCenter?.city;
  const buyerVat = customer?.partitaIva || repairCenter?.partitaIva;
  const isRepairCenter = !customer && !!repairCenter;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("invoices.invoice")} {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            {t("invoices.invoiceDetailDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{t("invoices.issueDate")}:</span>
              <span className="font-medium">
                {format(new Date(invoice.createdAt), "dd MMMM yyyy", { locale: it })}
              </span>
            </div>
            {getStatusBadge(invoice.paymentStatus)}
          </div>

          <Separator />

          {(customer || repairCenter) && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                {isRepairCenter ? <Wrench className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                {isRepairCenter ? t("invoices.repairCenter") : t("customers.customer")}
              </h4>
              <div className="bg-muted/50 p-3 rounded-md text-sm space-y-1">
                <p className="font-medium">{buyerName}</p>
                {buyerEmail && <p className="text-muted-foreground">{buyerEmail}</p>}
                {buyerAddress && (
                  <p className="text-muted-foreground">
                    {buyerAddress}
                    {buyerCity && `, ${buyerCity}`}
                  </p>
                )}
                {buyerVat && <p className="text-muted-foreground">{t("fiscal.vatNumber")}: {buyerVat}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("invoices.source")}</p>
              <Badge variant="outline">{getSourceLabel(invoice.source)}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("invoices.paymentMethod")}</p>
              <div className="flex flex-wrap items-center gap-1">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{invoice.paymentMethod?.replace("_", " ") || t("common.na")}</span>
              </div>
            </div>
          </div>

          {invoice.dueDate && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("invoices.dueDate")}</p>
              <p className="font-medium">
                {format(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: it })}
              </p>
            </div>
          )}

          {orderItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t("products.title")}
                </h4>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("products.product")}</TableHead>
                        <TableHead className="text-center">{t("common.qty")}</TableHead>
                        <TableHead className="text-right">{t("common.price")}</TableHead>
                        <TableHead className="text-right">{t("common.total")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.productName}
                            {item.productSku && (
                              <span className="text-xs text-muted-foreground ml-1">({item.productSku})</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              {t("invoices.amounts")}
            </h4>
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("invoices.taxableAmount")}</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("common.vat")} (22%)</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{t("common.total")}</span>
                <span className="text-primary">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="space-y-2">
              <h4 className="font-medium">{t("common.notes")}</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {invoice.notes}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-invoice-detail">
              {t("common.close")}
            </Button>
            <Button onClick={handleDownloadPdf} data-testid="button-download-invoice-pdf">
              <Download className="h-4 w-4 mr-2" />
              {t("invoices.downloadPdf")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
