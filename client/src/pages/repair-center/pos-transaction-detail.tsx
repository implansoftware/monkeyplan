import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Receipt, CreditCard, Banknote, Clock, User, 
  Package, Smartphone, Printer, CheckCircle, XCircle, RotateCcw,
  Wallet, Calculator, FileText, Ban
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useRef, useEffect, useMemo, useState } from "react";
import bwipjs from "bwip-js";

type TransactionDetail = {
  transaction: {
    id: string;
    transactionNumber: string;
    repairCenterId: string;
    sessionId: string | null;
    customerId: string | null;
    operatorId: string;
    subtotal: number;
    discountAmount: number;
    discountPercent: number | null;
    taxRate: number;
    taxAmount: number;
    total: number;
    paymentMethod: "cash" | "card" | "pos_terminal" | "mixed";
    cashReceived: number | null;
    changeGiven: number | null;
    status: "completed" | "refunded" | "partial_refund" | "voided";
    refundedAmount: number | null;
    refundReason: string | null;
    notes: string | null;
    invoiceRequested: boolean;
    invoiceId: string | null;
    createdAt: string;
  };
  items: {
    id: string;
    productId: string | null;
    productName: string;
    productSku?: string;
    productBarcode?: string;
    productCategory?: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    totalPrice: number;
  }[];
  operator?: { id: string; fullName: string };
  session?: { id: string; openedAt: string; status: string };
  customer?: { id: string; fullName: string; email: string; phone: string | null };
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Contanti", icon: Banknote },
  card: { label: "Carta", icon: CreditCard },
  pos_terminal: { label: "POS", icon: CreditCard },
  mixed: { label: "Misto", icon: Calculator },
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  completed: { label: "Completata", variant: "default" },
  refunded: { label: "Rimborsata", variant: "destructive" },
  partial_refund: { label: "Rimborso parziale", variant: "secondary" },
  voided: { label: "Annullata", variant: "destructive" },
};

function BarcodeDisplay({ code, width = 120, height = 35 }: { code: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && code) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128",
          text: code,
          scale: 1,
          height: 10,
          includetext: false,
          textxalign: "center",
        });
      } catch (e) {
        console.error("Barcode generation error:", e);
      }
    }
  }, [code]);

  if (!code) return null;
  
  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="max-w-full" style={{ width, height }} />
      <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{code}</span>
    </div>
  );
}

function ProductImage({ category, size = "md" }: { category?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20"
  };
  
  const iconSize = {
    sm: "w-5 h-5",
    md: "w-7 h-7",
    lg: "w-10 h-10"
  };
  
  const bgColor = useMemo(() => {
    if (!category) return "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800";
    const colors = [
      "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900",
      "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900",
      "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900",
      "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900",
      "bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-800 dark:to-pink-900",
    ];
    return colors[category.length % colors.length];
  }, [category]);
  
  const isPhone = category?.toLowerCase().includes("phone") || category?.toLowerCase().includes("iphone");
  
  return (
    <div className={`${sizeClasses[size]} ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
      {isPhone ? (
        <Smartphone className={`${iconSize[size]} text-muted-foreground`} />
      ) : (
        <Package className={`${iconSize[size]} text-muted-foreground`} />
      )}
    </div>
  );
}

export default function PosTransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { toast } = useToast();
  
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  
  const { data, isLoading, error } = useQuery<TransactionDetail>({
    queryKey: ["/api/repair-center/pos/transaction", id],
    enabled: !!id,
  });

  const voidMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await apiRequest("POST", `/api/repair-center/pos/transaction/${id}/void`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/sales-history"] });
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
      const res = await apiRequest("POST", `/api/repair-center/pos/transaction/${id}/refund`, { amount, reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/sales-history"] });
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

  const generateInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/repair-center/pos/transaction/${id}/generate-invoice`, {
        customerId: data?.transaction.customerId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/transaction", id] });
      toast({
        title: "Fattura generata",
        description: "La fattura di vendita è stata creata con successo",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare la fattura",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="w-12 h-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Transazione non trovata</h2>
            <p className="text-muted-foreground mb-4">
              La transazione richiesta non esiste o non hai i permessi per visualizzarla.
            </p>
            <Button onClick={() => navigate("/repair-center/pos")} data-testid="button-back-to-pos">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al POS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { transaction, items, operator, session, customer } = data;
  const PaymentIcon = paymentMethodLabels[transaction.paymentMethod]?.icon || CreditCard;
  const statusInfo = statusLabels[transaction.status] || statusLabels.completed;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" size="icon" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" onClick={() => navigate("/repair-center/pos")} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Receipt className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{transaction.transactionNumber}</h1>
              <p className="text-emerald-100">
                {format(new Date(transaction.createdAt), "EEEE d MMMM yyyy, HH:mm", { locale: it })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 flex-wrap">
            <Badge className={`${statusInfo.variant === 'destructive' ? 'bg-red-500/80' : statusInfo.variant === 'secondary' ? 'bg-white/30' : 'bg-white/20'} backdrop-blur-sm text-white border-white/30`}>{statusInfo.label}</Badge>
            {transaction.status === "completed" && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg"
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
                  className="bg-red-500/30 backdrop-blur-sm text-white border-red-300/50 hover:bg-red-500/50 shadow-lg"
                  onClick={() => setVoidDialogOpen(true)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Annulla
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg"
              data-testid="button-print"
              onClick={() => {
                window.open(`/api/repair-center/pos/transaction/${transaction.id}/receipt`, '_blank');
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              Stampa
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(transaction.total)}</div>
            {transaction.discountAmount > 0 && (
              <div className="text-sm text-destructive">
                Sconto: -{formatCurrency(transaction.discountAmount)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-lg font-semibold">
              <PaymentIcon className="w-5 h-5" />
              {paymentMethodLabels[transaction.paymentMethod]?.label}
            </div>
            {transaction.cashReceived && (
              <div className="text-sm text-muted-foreground mt-1">
                Ricevuto: {formatCurrency(transaction.cashReceived)}
                {transaction.changeGiven && ` • Resto: ${formatCurrency(transaction.changeGiven)}`}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Operatore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 text-lg font-semibold">
              <User className="w-5 h-5" />
              {operator?.fullName || "N/D"}
            </div>
            {session && (
              <div className="text-sm text-muted-foreground mt-1">
                Sessione: {format(new Date(session.openedAt), "HH:mm", { locale: it })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {customer ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                  <User className="w-5 h-5" />
                  {customer.fullName}
                </div>
                <div className="text-sm text-muted-foreground mt-1 break-all">
                  {customer.email}
                  {customer.phone && <span className="whitespace-nowrap"> • {customer.phone}</span>}
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">Ospite</div>
            )}
          </CardContent>
        </Card>
      </div>

      {transaction.invoiceRequested && (
        <Card className={transaction.invoiceId ? "border-primary" : "border-amber-500"}>
          <CardHeader className="pb-2">
            <CardTitle className="flex flex-wrap items-center gap-2">
              <FileText className="w-5 h-5" />
              Fattura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transaction.invoiceId ? (
              <div className="flex flex-wrap items-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Fattura emessa</span>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex flex-wrap items-center gap-2 text-amber-600">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Fattura richiesta - In attesa di emissione</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => generateInvoiceMutation.mutate()}
                  disabled={generateInvoiceMutation.isPending || !transaction.customerId}
                  data-testid="button-generate-invoice"
                >
                  {generateInvoiceMutation.isPending ? "Generazione..." : "Genera Fattura"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Package className="w-5 h-5" />
            Prodotti ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border bg-muted/30"
                  data-testid={`item-${item.id}`}
                >
                  <div className="flex gap-4">
                    <ProductImage category={item.productCategory} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-base">{item.productName}</div>
                      {item.productSku && (
                        <div className="text-sm text-muted-foreground">SKU: {item.productSku}</div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(item.unitPrice)} × {item.quantity}
                        {item.discount > 0 && (
                          <span className="text-destructive ml-2">(-{formatCurrency(item.discount)})</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatCurrency(item.totalPrice)}</div>
                    </div>
                  </div>
                  {item.productBarcode && (
                    <div className="mt-3 flex justify-center">
                      <BarcodeDisplay code={item.productBarcode} width={150} height={40} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <Separator />
        <CardFooter className="flex justify-between pt-4">
          <div className="text-muted-foreground">
            Subtotale: {formatCurrency(transaction.subtotal)}
          </div>
          <div className="text-xl font-bold">
            Totale: {formatCurrency(transaction.total)}
          </div>
        </CardFooter>
      </Card>

      {transaction.status === "refunded" && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-destructive">
              <RotateCcw className="w-5 h-5" />
              Rimborso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              Importo rimborsato: {formatCurrency(transaction.refundedAmount || 0)}
            </div>
            {transaction.refundReason && (
              <div className="text-muted-foreground mt-2">
                Motivo: {transaction.refundReason}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {transaction.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Note</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{transaction.notes}</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Ban className="w-5 h-5 text-destructive" />
              Annulla vendita
            </DialogTitle>
            <DialogDescription>
              Stai per annullare la vendita {transaction.transactionNumber}. 
              Questa azione ripristinerà lo stock dei prodotti venduti.
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
            <Button 
              variant="outline" 
              onClick={() => setVoidDialogOpen(false)}
              data-testid="button-cancel-void"
            >
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => voidMutation.mutate(voidReason)}
              disabled={!voidReason.trim() || voidMutation.isPending}
              data-testid="button-confirm-void"
            >
              {voidMutation.isPending ? "Annullamento..." : "Conferma annullamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Effettua reso
            </DialogTitle>
            <DialogDescription>
              Inserisci l'importo da rimborsare e il motivo del reso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Importo da rimborsare (€)</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={(transaction.total / 100).toFixed(2)}
                placeholder="0.00"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                data-testid="input-refund-amount"
              />
              <p className="text-sm text-muted-foreground">
                Totale originale: {formatCurrency(transaction.total)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-reason">Motivo del reso</Label>
              <Textarea
                id="refund-reason"
                placeholder="Inserisci il motivo del reso (opzionale)..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                data-testid="input-refund-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRefundDialogOpen(false)}
              data-testid="button-cancel-refund"
            >
              Annulla
            </Button>
            <Button
              onClick={() => refundMutation.mutate({ 
                amount: Math.round(parseFloat(refundAmount) * 100), 
                reason: refundReason 
              })}
              disabled={!refundAmount || parseFloat(refundAmount) <= 0 || refundMutation.isPending}
              data-testid="button-confirm-refund"
            >
              {refundMutation.isPending ? "Elaborazione..." : "Conferma reso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
