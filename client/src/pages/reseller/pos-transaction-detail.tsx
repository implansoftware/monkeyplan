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
  Ban
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";

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
        title: "Vendita annullata",
        description: "La transazione è stata annullata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile annullare la transazione",
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
        title: "Rimborso effettuato",
        description: "Il rimborso è stato registrato con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile effettuare il rimborso",
        variant: "destructive",
      });
    },
  });

  const handlePrintReceipt = async () => {
    try {
      const res = await fetch(`/api/reseller/pos/transaction/${transactionId}/receipt`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore generazione scontrino");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) win.print();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile stampare lo scontrino",
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
      cash: "Contanti",
      card: "Carta",
      pos_terminal: "POS",
      satispay: "Satispay",
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
        return <Badge variant="destructive" className="text-lg px-3 py-1"><XCircle className="w-4 h-4 mr-1" />Annullata</Badge>;
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
            <p className="text-muted-foreground">Transazione non trovata</p>
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              {transaction.transactionNumber}
            </h1>
            <p className="text-muted-foreground">Dettaglio transazione POS</p>
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
                <Printer className="w-4 h-4 mr-2" />
                Stampa
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-refund"
                onClick={() => {
                  setRefundAmount((transaction.total / 100).toFixed(2));
                  setRefundDialogOpen(true);
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reso
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-void"
                className="text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => setVoidDialogOpen(true)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Annulla
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Package className="w-5 h-5" />
              Articoli
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead>Prodotto</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantità</TableHead>
                  <TableHead className="text-right">Prezzo Unit.</TableHead>
                  <TableHead className="text-right">Sconto</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
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
              <CardTitle className="text-lg">Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Centro Riparazione</p>
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
                  <p className="text-sm text-muted-foreground">Metodo Pagamento</p>
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
                        <p className="text-sm text-muted-foreground">Resto</p>
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
                  <User className="w-5 h-5" />
                  Cliente
                </CardTitle>
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
                  Motivo Annullamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{transaction.voidReason}</p>
                {transaction.voidedAt && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Annullata il {format(new Date(transaction.voidedAt), "dd/MM/yyyy HH:mm", { locale: it })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {transaction.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{transaction.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annulla Transazione</DialogTitle>
            <DialogDescription>
              Stai per annullare la transazione {transaction.transactionNumber}. Questa azione ripristinerà lo stock dei prodotti.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="void-reason">Motivo dell'annullamento *</Label>
              <Textarea
                id="void-reason"
                placeholder="Inserisci il motivo dell'annullamento..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                data-testid="input-void-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)} data-testid="button-cancel-void">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => voidMutation.mutate(voidReason)}
              disabled={!voidReason.trim() || voidMutation.isPending}
              data-testid="button-confirm-void"
            >
              {voidMutation.isPending ? "Annullamento..." : "Conferma Annullamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rimborso Transazione</DialogTitle>
            <DialogDescription>
              Inserisci l'importo da rimborsare. Per un rimborso totale, lascia l'importo completo ({formatCurrency(transaction.total)}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Importo (EUR)</Label>
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
              <Label htmlFor="refund-reason">Motivo del rimborso</Label>
              <Textarea
                id="refund-reason"
                placeholder="Inserisci il motivo del rimborso..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                data-testid="input-refund-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)} data-testid="button-cancel-refund">
              Annulla
            </Button>
            <Button
              onClick={() => refundMutation.mutate({ 
                amount: Math.round(parseFloat(refundAmount) * 100), 
                reason: refundReason 
              })}
              disabled={!refundAmount || isNaN(parseFloat(refundAmount)) || parseFloat(refundAmount) <= 0 || refundMutation.isPending}
              data-testid="button-confirm-refund"
            >
              {refundMutation.isPending ? "Rimborso..." : "Conferma Rimborso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
