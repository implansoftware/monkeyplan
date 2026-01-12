import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, Receipt, User, Calendar, CreditCard, Banknote, 
  Package, Smartphone, Calculator, Wallet, Clock
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useRef, useEffect, useMemo } from "react";
import bwipjs from "bwip-js";

type PosTransaction = {
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
  notes: string | null;
  customerNotes: string | null;
  createdAt: string;
};

type PosTransactionItem = {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  productSku: string | null;
  productBarcode: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  inventoryDeducted: boolean;
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
  completed: { label: "Completato", variant: "default" },
  refunded: { label: "Rimborsato", variant: "destructive" },
  partial_refund: { label: "Rimborso parziale", variant: "secondary" },
  voided: { label: "Annullato", variant: "destructive" },
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
      <span className="text-xs text-muted-foreground font-mono mt-1">{code}</span>
    </div>
  );
}

function ProductImage({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
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
    const colors = [
      "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-900",
      "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800 dark:to-green-900",
      "bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900",
      "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900",
      "bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-800 dark:to-pink-900",
    ];
    return colors[name.length % colors.length];
  }, [name]);
  
  const isPhone = name.toLowerCase().includes("phone") || name.toLowerCase().includes("iphone");
  
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
  const params = useParams<{ id: string }>();
  
  const { data, isLoading, error } = useQuery<{ transaction: PosTransaction; items: PosTransactionItem[] }>({
    queryKey: ["/api/repair-center/pos/transaction", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/repair-center/pos/transaction/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento della transazione");
      return res.json();
    },
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Transazione non trovata</h2>
            <p className="text-muted-foreground mb-4">Impossibile caricare i dettagli della transazione.</p>
            <Link href="/repair-center/pos">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Cassa
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { transaction, items } = data;
  const PaymentIcon = paymentMethodLabels[transaction.paymentMethod]?.icon || CreditCard;
  const statusInfo = statusLabels[transaction.status] || statusLabels.completed;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/repair-center/pos">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            {transaction.transactionNumber}
          </h1>
          <p className="text-muted-foreground">Dettaglio transazione POS</p>
        </div>
        <Badge variant={statusInfo.variant} className="ml-auto">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Data e Ora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {format(new Date(transaction.createdAt), "dd MMMM yyyy", { locale: it })}
            </div>
            <div className="text-muted-foreground flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(new Date(transaction.createdAt), "HH:mm:ss", { locale: it })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PaymentIcon className="w-4 h-4" />
              Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {paymentMethodLabels[transaction.paymentMethod]?.label || transaction.paymentMethod}
            </div>
            {transaction.paymentMethod === "cash" && transaction.cashReceived && (
              <div className="text-muted-foreground text-sm">
                Ricevuto: {formatCurrency(transaction.cashReceived)} - Resto: {formatCurrency(transaction.changeGiven || 0)}
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
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border bg-muted/30"
                data-testid={`item-${item.id}`}
              >
                <div className="flex items-start gap-4">
                  <ProductImage name={item.productName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{item.productName}</div>
                    {item.productSku && (
                      <div className="text-sm text-muted-foreground">SKU: {item.productSku}</div>
                    )}
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                      {item.discount > 0 && (
                        <span className="text-destructive ml-2">
                          (Sconto: -{formatCurrency(item.discount)})
                        </span>
                      )}
                    </div>
                    {item.productBarcode && (
                      <div className="mt-3">
                        <BarcodeDisplay code={item.productBarcode} width={150} height={40} />
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">{formatCurrency(item.totalPrice)}</div>
                    {item.inventoryDeducted && (
                      <Badge variant="outline" className="text-xs mt-1">
                        Magazzino aggiornato
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Riepilogo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotale</span>
            <span>{formatCurrency(transaction.subtotal)}</span>
          </div>
          {transaction.discountAmount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Sconto {transaction.discountPercent ? `(${transaction.discountPercent}%)` : ""}</span>
              <span>-{formatCurrency(transaction.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA ({transaction.taxRate}%)</span>
            <span>{formatCurrency(transaction.taxAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-xl font-bold">
            <span>Totale</span>
            <span>{formatCurrency(transaction.total)}</span>
          </div>
          {transaction.refundedAmount && transaction.refundedAmount > 0 && (
            <div className="flex justify-between text-destructive font-semibold">
              <span>Rimborsato</span>
              <span>-{formatCurrency(transaction.refundedAmount)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {(transaction.notes || transaction.customerNotes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {transaction.notes && (
              <div>
                <span className="text-sm text-muted-foreground">Note interne:</span>
                <p>{transaction.notes}</p>
              </div>
            )}
            {transaction.customerNotes && (
              <div>
                <span className="text-sm text-muted-foreground">Note cliente:</span>
                <p>{transaction.customerNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
