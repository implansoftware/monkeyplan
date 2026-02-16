import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileText,
  Smartphone,
  Wrench,
  User,
  Euro,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Package,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { StandaloneQuote, StandaloneQuoteItem } from "@shared/schema";
import { useTranslation } from "react-i18next";

type QuoteWithItems = StandaloneQuote & { items: StandaloneQuoteItem[] };

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    draft: t("invoices.draft"),
    sent: "Inviato",
    accepted: t("standalone.accepted"),
    rejected: t("b2b.status.cancelled"),
    expired: t("standalone.expired"),
  };
}

const statusVariants: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export default function StandaloneQuoteDetail() {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [matchReseller, paramsReseller] = useRoute("/reseller/standalone-quotes/:id");
  const [matchRC, paramsRC] = useRoute("/repair-center/standalone-quotes/:id");
  const quoteId = paramsReseller?.id || paramsRC?.id;
  const basePath = user?.role === "repair_center" ? "/repair-center" : "/reseller";

  const { data: quote, isLoading } = useQuery<QuoteWithItems>({
    queryKey: ["/api/standalone-quotes", quoteId],
    enabled: !!quoteId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/standalone-quotes/${quoteId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/standalone-quotes", quoteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/standalone-quotes"] });
      toast({ title: t("tickets.statusUpdated") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const downloadPdf = async () => {
    try {
      const res = await fetch(`/api/standalone-quotes/${quoteId}/pdf`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore generazione PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${quote?.quoteNumber || "preventivo"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "PDF scaricato" });
    } catch (error: any) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/standalone-quotes`)} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Preventivo non trovato</h1>
        </div>
      </div>
    );
  }

  const serviceItems = quote.items.filter(i => (i as any).itemType === "service" || !(i as any).itemType);
  const productItems = quote.items.filter(i => (i as any).itemType === "product");
  const customItems = quote.items.filter(i => (i as any).itemType === "custom");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/standalone-quotes`)} data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold" data-testid="text-quote-number">{quote.quoteNumber}</h1>
          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${statusVariants[quote.status] || ""}`} data-testid="text-quote-status">
            {statusLabels[quote.status] || quote.status}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={downloadPdf} data-testid="button-download-pdf">
            <Download className="h-4 w-4 mr-1.5" />{t("invoices.downloadPdf")}</Button>
          {quote.status === "draft" && (
            <Button
              onClick={() => updateStatusMutation.mutate("sent")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-send-quote"
            >
              {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
              Invia
            </Button>
          )}
          {(quote.status === "draft" || quote.status === "sent") && (
            <>
              <Button
                variant="outline"
                onClick={() => updateStatusMutation.mutate("accepted")}
                disabled={updateStatusMutation.isPending}
                data-testid="button-accept-quote"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Accetta
              </Button>
              <Button
                variant="outline"
                onClick={() => updateStatusMutation.mutate("rejected")}
                disabled={updateStatusMutation.isPending}
                data-testid="button-reject-quote"
              >
                <XCircle className="h-4 w-4 mr-1.5" />{t("common.reject")}</Button>
            </>
          )}
          {quote.status === "sent" && (
            <Button
              variant="outline"
              onClick={() => updateStatusMutation.mutate("expired")}
              disabled={updateStatusMutation.isPending}
              data-testid="button-expire-quote"
            >
              <Clock className="h-4 w-4 mr-1.5" />{t("standalone.expired")}</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />{t("common.information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Data creazione</span>
              <span data-testid="text-created-at">{format(new Date(quote.createdAt), "dd MMM yyyy, HH:mm", { locale: it })}</span>
            </div>
            {quote.validUntil && (
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{t("standalone.validUntil")}</span>
                <span data-testid="text-valid-until">{format(new Date(quote.validUntil), "dd MMM yyyy", { locale: it })}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Voci totali</span>
              <span>{quote.items.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />{t("common.customer")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {quote.customerName ? (
              <>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">{t("common.name")}</span>
                  <span data-testid="text-customer-name">{quote.customerName}</span>
                </div>
                {quote.customerEmail && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t("common.email")}</span>
                    <span data-testid="text-customer-email">{quote.customerEmail}</span>
                  </div>
                )}
                {quote.customerPhone && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t("common.phone")}</span>
                    <span data-testid="text-customer-phone">{quote.customerPhone}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">{t("admin.resellerDetail.noCustomersFound")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {quote.deviceDescription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Smartphone className="h-4 w-4" />{t("repairs.device")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm" data-testid="text-device-description">{quote.deviceDescription}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dettaglio Voci</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Wrench className="h-4 w-4" /> Servizi ({serviceItems.length})</h3>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2.5 font-medium">{t("common.description")}</th>
                      <th className="text-center p-2.5 font-medium w-16">{t("common.qty")}</th>
                      <th className="text-right p-2.5 font-medium w-28">{t("products.unitPrice")}</th>
                      <th className="text-right p-2.5 font-medium w-24">{t("common.vat")}</th>
                      <th className="text-right p-2.5 font-medium w-28">{t("common.total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceItems.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? "" : "bg-muted/20"} data-testid={`row-service-${item.id}`}>
                        <td className="p-2.5">
                          <div className="font-medium">{item.name}</div>
                          {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                        </td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPriceCents)}</td>
                        <td className="p-2.5 text-right">{item.vatRate}%</td>
                        <td className="p-2.5 text-right font-medium">{formatCurrency(item.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {productItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Prodotti ({productItems.length})</h3>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2.5 font-medium">{t("common.description")}</th>
                      <th className="text-center p-2.5 font-medium w-16">{t("common.qty")}</th>
                      <th className="text-right p-2.5 font-medium w-28">{t("products.unitPrice")}</th>
                      <th className="text-right p-2.5 font-medium w-24">{t("common.vat")}</th>
                      <th className="text-right p-2.5 font-medium w-28">{t("common.total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productItems.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? "" : "bg-muted/20"} data-testid={`row-product-${item.id}`}>
                        <td className="p-2.5">
                          <div className="font-medium">{item.name}</div>
                          {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                        </td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPriceCents)}</td>
                        <td className="p-2.5 text-right">{item.vatRate}%</td>
                        <td className="p-2.5 text-right font-medium">{formatCurrency(item.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {customItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Voci Personalizzate ({customItems.length})</h3>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-2.5 font-medium">{t("common.description")}</th>
                      <th className="text-center p-2.5 font-medium w-16">{t("common.qty")}</th>
                      <th className="text-right p-2.5 font-medium w-28">{t("products.unitPrice")}</th>
                      <th className="text-right p-2.5 font-medium w-24">{t("common.vat")}</th>
                      <th className="text-right p-2.5 font-medium w-28">{t("common.total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customItems.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 0 ? "" : "bg-muted/20"} data-testid={`row-custom-${item.id}`}>
                        <td className="p-2.5">
                          <div className="font-medium">{item.name}</div>
                          {item.description && <div className="text-xs text-muted-foreground">{item.description}</div>}
                        </td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right">{formatCurrency(item.unitPriceCents)}</td>
                        <td className="p-2.5 text-right">{item.vatRate}%</td>
                        <td className="p-2.5 text-right font-medium">{formatCurrency(item.totalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-end">
            <div className="text-right space-y-1.5">
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-muted-foreground">Imponibile</span>
                <span className="font-medium" data-testid="text-subtotal">{formatCurrency(quote.subtotalCents)}</span>
              </div>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-muted-foreground">{t("common.vat")}</span>
                <span className="font-medium" data-testid="text-vat">{formatCurrency(quote.vatAmountCents)}</span>
              </div>
              <Separator />
              <div className="flex justify-between gap-8 items-center">
                <span className="font-semibold">{t("common.total")}</span>
                <span className="text-xl font-bold flex items-center gap-1" data-testid="text-total">
                  <Euro className="h-5 w-5" />
                  {formatCurrency(quote.totalAmountCents)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("common.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">{quote.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
