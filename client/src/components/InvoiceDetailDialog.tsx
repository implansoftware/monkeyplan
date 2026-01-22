import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Invoice, User } from "@shared/schema";
import { Download, FileText, Calendar, CreditCard, Euro, Building2 } from "lucide-react";
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
  const { data: customer } = useQuery<User>({
    queryKey: ["/api/users", invoice?.customerId],
    enabled: !!invoice?.customerId && open,
  });

  if (!invoice) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge>Pagata</Badge>;
      case "pending": return <Badge variant="secondary">In sospeso</Badge>;
      case "overdue": return <Badge variant="destructive">Scaduta</Badge>;
      case "cancelled": return <Badge variant="outline">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceLabel = (source: string | null) => {
    switch (source) {
      case "repair": return "Riparazione";
      case "pos": return "POS";
      case "ecommerce": return "E-commerce";
      case "b2b": return "B2B";
      case "warranty": return "Garanzia";
      case "other": return "Altro";
      default: return source || "N/D";
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/invoices/${invoice.id}/pdf`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fattura {invoice.invoiceNumber}
          </DialogTitle>
          <DialogDescription>
            Dettagli della fattura emessa
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Data emissione:</span>
              <span className="font-medium">
                {format(new Date(invoice.createdAt), "dd MMMM yyyy", { locale: it })}
              </span>
            </div>
            {getStatusBadge(invoice.paymentStatus)}
          </div>

          <Separator />

          {customer && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cliente
              </h4>
              <div className="bg-muted/50 p-3 rounded-md text-sm">
                <p className="font-medium">{customer.fullName || customer.username}</p>
                {customer.email && <p className="text-muted-foreground">{customer.email}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fonte</p>
              <Badge variant="outline">{getSourceLabel(invoice.source)}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Metodo Pagamento</p>
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{invoice.paymentMethod?.replace("_", " ") || "N/D"}</span>
              </div>
            </div>
          </div>

          {invoice.dueDate && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Scadenza</p>
              <p className="font-medium">
                {format(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: it })}
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Importi
            </h4>
            <div className="bg-muted/50 p-3 rounded-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>Imponibile</span>
                <span>{formatCurrency(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>IVA (22%)</span>
                <span>{formatCurrency(invoice.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Totale</span>
                <span className="text-primary">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="space-y-2">
              <h4 className="font-medium">Note</h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {invoice.notes}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-invoice-detail">
              Chiudi
            </Button>
            <Button onClick={handleDownloadPdf} data-testid="button-download-invoice-pdf">
              <Download className="h-4 w-4 mr-2" />
              Scarica PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
