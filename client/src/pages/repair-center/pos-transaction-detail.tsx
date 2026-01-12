import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Receipt, CreditCard, Banknote, Clock, User, 
  Package, Smartphone, Printer, CheckCircle, XCircle, RotateCcw,
  Wallet, Calculator
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useRef, useEffect, useMemo } from "react";
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
    paymentMethod: "cash" | "card" | "pos_terminal" | "satispay" | "mixed";
    cashReceived: number | null;
    changeGiven: number | null;
    status: "completed" | "refunded" | "partial_refund" | "voided";
    refundedAmount: number | null;
    refundReason: string | null;
    notes: string | null;
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
    total: number;
  }[];
  operator?: { id: string; fullName: string };
  session?: { id: string; openedAt: string; status: string };
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
  satispay: { label: "Satispay", icon: Wallet },
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

  const { data, isLoading, error } = useQuery<TransactionDetail>({
    queryKey: ["/api/repair-center/pos/transaction", id],
    enabled: !!id,
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

  const { transaction, items, operator, session } = data;
  const PaymentIcon = paymentMethodLabels[transaction.paymentMethod]?.icon || CreditCard;
  const statusInfo = statusLabels[transaction.status] || statusLabels.completed;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/repair-center/pos")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              {transaction.transactionNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(transaction.createdAt), "EEEE d MMMM yyyy, HH:mm", { locale: it })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <Button variant="outline" size="sm" data-testid="button-print">
            <Printer className="w-4 h-4 mr-2" />
            Stampa
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
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
            <div className="flex items-center gap-2 text-lg font-semibold">
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
            <div className="flex items-center gap-2 text-lg font-semibold">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
                      <div className="font-semibold text-lg">{formatCurrency(item.total)}</div>
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
            <CardTitle className="flex items-center gap-2 text-destructive">
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
    </div>
  );
}
