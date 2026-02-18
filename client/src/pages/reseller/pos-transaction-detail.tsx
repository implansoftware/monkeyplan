import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Receipt, 
  ArrowLeft,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  RotateCcw,
  Building2,
  User,
  Calendar,
  Package,
  Printer,
  Ban,
  Server,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface TransactionDetail {
  transaction: {
    id: string;
    transactionNumber: string;
    repairCenterId: string;
    status: string;
    paymentMethod: string;
    total: number;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    taxRate: number;
    cashReceived: number | null;
    changeGiven: number | null;
    notes: string | null;
    createdAt: string;
    voidedAt: string | null;
    voidReason: string | null;
    rtStatus: string | null;
    rtSubmissionId: string | null;
    rtSubmittedAt: string | null;
    rtErrorMessage: string | null;
    rtDocumentUrl: string | null;
    rtProvider: string | null;
    rtRetryCount: number | null;
  };
  items: Array<{
    id: string;
    productName: string;
    productSku: string | null;
    productImage?: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
  }>;
  repairCenterName: string;
  customer?: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  };
}

export default function ResellerPosTransactionDetail() {
  const { t } = useTranslation();
  const [, params] = useRoute("/reseller/pos/transaction/:id");
  const transactionId = params?.id;
  const { toast } = useToast();
  
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  const { data: detail, isLoading } = useQuery<TransactionDetail>({
    queryKey: ["/api/reseller/pos/transaction", transactionId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/pos/transaction/${transactionId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch transaction");
      return res.json();
    },
    enabled: !!transactionId,
  });

  const voidMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest("POST", `/api/reseller/pos/transaction/${transactionId}/void`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/transactions"] });
      setVoidDialogOpen(false);
      setVoidReason("");
      toast({
        title: t("pos.saleVoided"),
        description: t("pos.saleVoidedDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pos.cannotVoidTransaction"),
        variant: "destructive",
      });
    },
  });

  const refundMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      const res = await apiRequest("POST", `/api/reseller/pos/transaction/${transactionId}/refund`, { amount, reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/transaction", transactionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/pos/transactions"] });
      setRefundDialogOpen(false);
      setRefundReason("");
      setRefundAmount("");
      toast({
        title: t("pos.refundCompleted"),
        description: t("pos.refundSuccess"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message || t("pos.refundError"),
        variant: "destructive",
      });
    },
  });

  const handlePrintReceipt = async () => {
    try {
      const res = await fetch(`/api/reseller/pos/transaction/${transactionId}/receipt`, { credentials: "include" });
      if (!res.ok) throw new Error(t("pos.receiptError"));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) win.print();
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("pos.printReceiptError"),
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount / 100);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t("pos.cash"),
      card: t("pos.card"),
      pos_terminal: t("sidebar.sections.posSection"),
      mixed: "Misto",
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    if (method === "cash") return <Banknote className="w-5 h-5" />;
    return <CreditCard className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-600 text-lg px-3 py-1"><CheckCircle className="w-4 h-4 mr-1" />Completata</Badge>;
      case "voided":
        return <Badge variant="destructive" className="text-lg px-3 py-1"><XCircle className="w-4 h-4 mr-1" />{t("common.cancelled")}</Badge>;
      case "refunded":
        return <Badge variant="secondary" className="text-lg px-3 py-1"><RotateCcw className="w-4 h-4 mr-1" />Rimborsata</Badge>;
      default:
        return <Badge variant="outline" className="text-lg px-3 py-1">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t("pos.transactionNotFound")}</p>
            <Link href="/reseller/pos/sales-history">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna allo storico
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { transaction, items, repairCenterName, customer } = detail;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/reseller/pos/sales-history">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />{t("common.back")}</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              {transaction.transactionNumber}
            </h1>
            <p className="text-muted-foreground">{t("pos.posTransactionDetail")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-wrap">
          {getStatusBadge(transaction.status)}
          {transaction.status === "completed" && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrintReceipt}
                data-testid="button-print-receipt"
              >
                <Printer className="w-4 h-4 mr-2" />{t("common.print")}</Button>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-refund"
                onClick={() => {
                  setRefundAmount((transaction.total / 100).toFixed(2));
                  setRefundDialogOpen(true);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />{t("b2b.status.returned")}</Button>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-void"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setVoidDialogOpen(true)}
              >
                <Ban className="w-4 h-4 mr-2" />{t("common.cancel")}</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Package className="w-5 h-5" />{t("b2b.items")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>{t("common.product")}</TableHead>
                  <TableHead>{t("products.sku")}</TableHead>
                  <TableHead className="text-right">{t("common.quantity")}</TableHead>
                  <TableHead className="text-right">{t("products.unitPrice")}</TableHead>
                  <TableHead className="text-right">{t("common.discount")}</TableHead>
                  <TableHead className="text-right">{t("common.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.productImage ? (
                        <img 
                          src={item.productImage} 
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="font-mono text-sm">{item.productSku || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{item.discount > 0 ? formatCurrency(item.discount) : "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotale:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Sconto:</span>
                  <span>-{formatCurrency(transaction.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>IVA ({transaction.taxRate}%):</span>
                <span>{formatCurrency(transaction.taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-bold">
                <span>Totale:</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("common.information")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">{t("roles.repairCenter")}</p>
                  <p className="font-medium">{repairCenterName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Data e Ora</p>
                  <p className="font-medium">{format(new Date(transaction.createdAt), "dd MMMM yyyy HH:mm", { locale: it })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {getPaymentMethodIcon(transaction.paymentMethod)}
                <div>
                  <p className="text-sm text-muted-foreground">{t("pos.paymentMethod")}</p>
                  <p className="font-medium">{getPaymentMethodLabel(transaction.paymentMethod)}</p>
                </div>
              </div>
              {transaction.paymentMethod === "cash" && transaction.cashReceived && (
                <>
                  <div className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contante Ricevuto</p>
                      <p className="font-medium">{formatCurrency(transaction.cashReceived)}</p>
                    </div>
                  </div>
                  {transaction.changeGiven !== null && transaction.changeGiven > 0 && (
                    <div className="flex items-start gap-3">
                      <Banknote className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">{t("pos.change")}</p>
                        <p className="font-medium">{formatCurrency(transaction.changeGiven)}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {customer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />{t("common.customer")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{customer.fullName}</p>
                {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
              </CardContent>
            </Card>
          )}

          {transaction.status === "voided" && transaction.voidReason && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  {t("pos.voidReasonLabel")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{transaction.voidReason}</p>
                {transaction.voidedAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("pos.voidedOn")} {format(new Date(transaction.voidedAt), "dd/MM/yyyy HH:mm", { locale: it })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {transaction.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("common.notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{transaction.notes}</p>
              </CardContent>
            </Card>
          )}

          {transaction.rtStatus && transaction.rtStatus !== "not_required" && (
            <Card className={transaction.rtStatus === "error" ? "border-destructive" : transaction.rtStatus === "confirmed" ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  {t("fiscal.fiscalTransmission")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{t("common.status")}</span>
                  <Badge
                    variant={
                      transaction.rtStatus === "confirmed" ? "default" :
                      transaction.rtStatus === "submitted" ? "outline" :
                      transaction.rtStatus === "error" ? "destructive" :
                      "secondary"
                    }
                    data-testid="badge-rt-status"
                  >
                    {transaction.rtStatus === "confirmed" && <CheckCircle className="w-3 h-3 mr-1" />}
                    {transaction.rtStatus === "submitted" && <Server className="w-3 h-3 mr-1" />}
                    {transaction.rtStatus === "error" && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {transaction.rtStatus === "confirmed" ? t("fiscal.confirmed") :
                     transaction.rtStatus === "submitted" ? t("fiscal.submitted") :
                     transaction.rtStatus === "error" ? t("common.error") :
                     transaction.rtStatus === "pending" ? t("fiscal.pending") :
                     transaction.rtStatus}
                  </Badge>
                </div>

                {transaction.rtProvider && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{t("fiscal.rtProvider")}</span>
                    <span className="text-sm font-medium" data-testid="text-rt-provider">{transaction.rtProvider}</span>
                  </div>
                )}

                {transaction.rtSubmissionId && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{t("fiscal.submissionId")}</span>
                    <span className="text-sm font-mono truncate max-w-[200px]" data-testid="text-rt-submission-id">{transaction.rtSubmissionId}</span>
                  </div>
                )}

                {transaction.rtSubmittedAt && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{t("fiscal.submittedAt")}</span>
                    <span className="text-sm" data-testid="text-rt-submitted-at">
                      {format(new Date(transaction.rtSubmittedAt), "dd/MM/yyyy HH:mm:ss", { locale: it })}
                    </span>
                  </div>
                )}

                {transaction.rtRetryCount != null && transaction.rtRetryCount > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{t("fiscal.retryCount")}</span>
                    <span className="text-sm" data-testid="text-rt-retry-count">{transaction.rtRetryCount}</span>
                  </div>
                )}

                {transaction.rtDocumentUrl && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{t("fiscal.fiscalDocument")}</span>
                    <a href={transaction.rtDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1" data-testid="link-rt-document">
                      {t("common.view")} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {transaction.rtStatus === "error" && transaction.rtErrorMessage && (
                  <div className="mt-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-rt-error">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{transaction.rtErrorMessage}</span>
                    </div>
                  </div>
                )}

                {(transaction.rtStatus === "submitted" || transaction.rtStatus === "confirmed") && (
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      data-testid="button-download-fiscal-receipt"
                      onClick={() => {
                        window.open(`/api/reseller/pos/transaction/${transaction.id}/receipt`, '_blank');
                      }}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      {t("fiscal.downloadFiscalReceipt")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pos.voidTransactionBtn")}</DialogTitle>
            <DialogDescription>
              Stai per annullare la transazione {transaction.transactionNumber}. Questa azione ripristinerà lo stock dei prodotti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="void-reason">{t("pos.voidReasonRequired")}</Label>
              <Textarea
                id="void-reason"
                placeholder={t("pos.enterVoidReason")}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                data-testid="input-void-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)} data-testid="button-cancel-void">{t("common.cancel")}</Button>
            <Button
              variant="destructive"
              onClick={() => voidMutation.mutate(voidReason)}
              disabled={!voidReason.trim() || voidMutation.isPending}
              data-testid="button-confirm-void"
            >
              {voidMutation.isPending ? t("pos.voiding") : t("pos.confirmVoid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("pos.refundTransaction")}</DialogTitle>
            <DialogDescription>
              {t("pos.refundAmountDesc")} ({formatCurrency(transaction.total)}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">{t("pos.amountEur")}</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={(transaction.total / 100).toFixed(2)}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                data-testid="input-refund-amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">{t("pos.refundReason")}</Label>
              <Textarea
                id="refund-reason"
                placeholder={t("pos.enterRefundReason")}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                data-testid="input-refund-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} data-testid="button-cancel-refund">{t("common.cancel")}</Button>
            <Button
              onClick={() => refundMutation.mutate({ 
                amount: Math.round(parseFloat(refundAmount) * 100), 
                reason: refundReason 
              })}
              disabled={!refundAmount || isNaN(parseFloat(refundAmount)) || parseFloat(refundAmount) <= 0 || refundMutation.isPending}
              data-testid="button-confirm-refund"
            >
              {refundMutation.isPending ? t("pos.refunding") : t("pos.confirmRefund")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
