import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, Banknote, QrCode, Trash2, Plus, Minus, 
  ShoppingCart, Receipt, X, Check, DollarSign, 
  RotateCcw, Clock, ChevronRight, Loader2, Search,
  Calculator, LayoutGrid, History, AlertCircle, Wallet,
  Package, Smartphone
} from "lucide-react";
import bwipjs from "bwip-js";

function BarcodeDisplay({ code, width = 80, height = 30 }: { code: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && code) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "code128",
          text: code,
          scale: 1,
          height: 8,
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
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };
  
  const iconSize = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

type PosSession = {
  id: string;
  repairCenterId: string;
  operatorId: string;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  closingCash: number | null;
  expectedCash: number | null;
  cashDifference: number | null;
  totalSales: number;
  totalTransactions: number;
  totalCashSales: number;
  totalCardSales: number;
  totalRefunds: number;
  openingNotes: string | null;
  closingNotes: string | null;
};

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
  createdAt: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sellingPrice: number | null;
  unitPrice: number | null;
  category: string | null;
  availableQuantity?: number;
};

type CartItem = {
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
};

type DailyStats = {
  date: string;
  totalSales: number;
  transactionCount: number;
  cashSales: number;
  cardSales: number;
  refunds: number;
  topProducts: { productId: string; productName: string; quantity: number; total: number }[];
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

export default function PosPage() {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<"cash" | "card" | "pos_terminal" | "satispay" | "mixed">("cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [transactionNotes, setTransactionNotes] = useState("");
  
  const [openSessionDialog, setOpenSessionDialog] = useState(false);
  const [closeSessionDialog, setCloseSessionDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState<string>("");
  const [closingCash, setClosingCash] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState("");
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const { data: currentSession, isLoading: sessionLoading } = useQuery<PosSession | null>({
    queryKey: ["/api/repair-center/pos/session/current"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<PosTransaction[]>({
    queryKey: ["/api/repair-center/pos/transactions"],
    enabled: !!currentSession,
  });

  const { data: dailyStats } = useQuery<DailyStats>({
    queryKey: ["/api/repair-center/pos/stats/daily"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/repair-center/pos/products"],
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20);

  const openSessionMutation = useMutation({
    mutationFn: async (data: { openingCash: number; openingNotes?: string }) => {
      return apiRequest("POST", "/api/repair-center/pos/session/open", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/session/current"] });
      setOpenSessionDialog(false);
      setOpeningCash("");
      setSessionNotes("");
      toast({ title: "Cassa aperta", description: "Puoi iniziare a registrare vendite" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const closeSessionMutation = useMutation({
    mutationFn: async (data: { closingCash: number; closingNotes?: string }) => {
      return apiRequest("POST", `/api/repair-center/pos/session/${currentSession?.id}/close`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/session/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/transactions"] });
      setCloseSessionDialog(false);
      setClosingCash("");
      setSessionNotes("");
      toast({ title: "Cassa chiusa", description: "Sessione terminata con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/repair-center/pos/transaction", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/session/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/stats/daily"] });
      setCart([]);
      setCashReceived("");
      setDiscountAmount("");
      setTransactionNotes("");
      setPaymentDialog(false);
      toast({ title: "Vendita registrata", description: "Transazione completata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discount = Math.round(parseFloat(discountAmount || "0") * 100);
  const cartTotal = Math.max(0, cartSubtotal - discount);
  const changeAmount = selectedPayment === "cash" && cashReceived 
    ? (parseFloat(cashReceived) * 100) - cartTotal 
    : 0;

  const addToCart = (product: Product) => {
    const price = product.sellingPrice || product.unitPrice || 0;
    const existing = cart.find(item => item.productId === product.id);
    
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        totalPrice: price,
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return;
    
    const found = products.find(p => p.barcode === barcodeInput || p.sku === barcodeInput);
    if (found) {
      addToCart(found);
      setBarcodeInput("");
    } else {
      toast({ title: "Non trovato", description: `Prodotto con codice ${barcodeInput} non trovato`, variant: "destructive" });
    }
    barcodeInputRef.current?.focus();
  };

  const handlePayment = () => {
    if (cart.length === 0) return;
    
    createTransactionMutation.mutate({
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
      paymentMethod: selectedPayment,
      discountAmount: discount,
      cashReceived: selectedPayment === "cash" ? Math.round(parseFloat(cashReceived || "0") * 100) : undefined,
      notes: transactionNotes || undefined,
    });
  };

  useEffect(() => {
    if (currentSession && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [currentSession]);

  if (sessionLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Cassa POS</CardTitle>
            <CardDescription>
              Apri la cassa per iniziare a registrare le vendite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dailyStats && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground">Vendite Oggi</div>
                  <div className="font-semibold">{formatCurrency(dailyStats.totalSales)}</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground">Transazioni</div>
                  <div className="font-semibold">{dailyStats.transactionCount}</div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              onClick={() => setOpenSessionDialog(true)}
              data-testid="button-open-session"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Apri Cassa
            </Button>
          </CardFooter>
        </Card>

        <Dialog open={openSessionDialog} onOpenChange={setOpenSessionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apertura Cassa</DialogTitle>
              <DialogDescription>Inserisci il fondo cassa iniziale</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Fondo Cassa (EUR)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="text-lg h-12"
                  data-testid="input-opening-cash"
                />
              </div>
              <div>
                <Label>Note (opzionale)</Label>
                <Textarea
                  placeholder="Note apertura..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  data-testid="input-session-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenSessionDialog(false)}>
                Annulla
              </Button>
              <Button
                onClick={() => openSessionMutation.mutate({
                  openingCash: Math.round(parseFloat(openingCash || "0") * 100),
                  openingNotes: sessionNotes || undefined,
                })}
                disabled={openSessionMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-cyan-500"
                data-testid="button-confirm-open"
              >
                {openSessionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Apri Cassa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-4">
      <div className="flex-1 flex flex-col min-w-0 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse" />
              Cassa Aperta
            </Badge>
            <span className="text-sm text-muted-foreground">
              dalle {format(new Date(currentSession.openedAt), "HH:mm", { locale: it })}
            </span>
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCloseSessionDialog(true)}
            className="text-destructive hover:text-destructive"
            data-testid="button-close-session"
          >
            <X className="w-4 h-4 mr-1" />
            Chiudi Cassa
          </Button>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scansiona barcode o digita SKU..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBarcodeSearch()}
                  className="pl-10 h-12 text-lg"
                  data-testid="input-barcode"
                />
              </div>
              <Button
                size="lg"
                onClick={handleBarcodeSearch}
                className="h-12 px-6"
                data-testid="button-barcode-search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <Tabs defaultValue="search" className="h-full flex flex-col">
              <TabsList className="mb-2">
                <TabsTrigger value="search" data-testid="tab-search">
                  <LayoutGrid className="w-4 h-4 mr-1" />
                  Prodotti
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">
                  <History className="w-4 h-4 mr-1" />
                  Storico
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="search" className="flex-1 overflow-hidden m-0">
                <div className="mb-2">
                  <Input
                    placeholder="Cerca prodotto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10"
                    data-testid="input-product-search"
                  />
                </div>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  {productsLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <span>Nessun prodotto in magazzino</span>
                      <span className="text-sm">Aggiungi prodotti dal gestionale</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {filteredProducts.map((product) => {
                        const isOutOfStock = product.availableQuantity !== undefined && product.availableQuantity <= 0;
                        const price = product.sellingPrice || product.unitPrice || 0;
                        return (
                          <button
                            key={product.id}
                            onClick={() => !isOutOfStock && addToCart(product)}
                            disabled={isOutOfStock}
                            className={`p-3 rounded-lg border bg-card text-left transition-colors min-h-[120px] ${
                              isOutOfStock 
                                ? "opacity-50 cursor-not-allowed" 
                                : "hover-elevate active-elevate-2"
                            }`}
                            data-testid={`button-product-${product.id}`}
                          >
                            <div className="flex gap-2 mb-2">
                              <ProductImage category={product.category} size="md" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm line-clamp-2">{product.name}</div>
                                {product.sku && (
                                  <div className="text-xs text-muted-foreground mt-0.5">{product.sku}</div>
                                )}
                              </div>
                            </div>
                            {product.barcode && (
                              <div className="mb-2">
                                <BarcodeDisplay code={product.barcode} width={100} height={25} />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-primary">
                                {formatCurrency(price)}
                              </div>
                              {product.availableQuantity !== undefined && (
                                <Badge 
                                  variant={isOutOfStock ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {isOutOfStock ? "Esaurito" : `${product.availableQuantity} disp.`}
                                </Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  {transactionsLoading ? (
                    <div className="space-y-2">
                      {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Nessuna transazione in questa sessione
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((tx) => (
                        <a
                          key={tx.id}
                          href={`/repair-center/pos/transaction/${tx.id}`}
                          className="p-3 rounded-lg border bg-card flex items-center gap-3 hover-elevate active-elevate-2 cursor-pointer block"
                          data-testid={`transaction-${tx.id}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            {(() => {
                              const IconComponent = paymentMethodLabels[tx.paymentMethod]?.icon;
                              return IconComponent ? <IconComponent className="w-5 h-5 text-muted-foreground" /> : null;
                            })()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{tx.transactionNumber}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(tx.createdAt), "HH:mm", { locale: it })} - {paymentMethodLabels[tx.paymentMethod]?.label}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(tx.total)}</div>
                            {tx.status === "refunded" && (
                              <Badge variant="destructive" className="text-xs">Rimborsato</Badge>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full lg:w-96 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Carrello
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{cart.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                <span>Carrello vuoto</span>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3 rounded border bg-muted/30"
                    data-testid={`cart-item-${item.productId}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <ProductImage category={item.category} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm line-clamp-1">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.unitPrice)} x {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">{formatCurrency(item.totalPrice)}</div>
                      </div>
                    </div>
                    {item.barcode && (
                      <div className="mb-2 flex justify-center">
                        <BarcodeDisplay code={item.barcode} width={120} height={28} />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, -1)}
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.productId, 1)}
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.productId)}
                        data-testid={`button-remove-${item.productId}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        <Separator />
        
        <div className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotale</span>
            <span>{formatCurrency(cartSubtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Sconto</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg">
            <span>Totale</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>

        <CardFooter className="flex-col gap-2 pt-0">
          <div className="w-full">
            <Input
              placeholder="Sconto (EUR)"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="h-10"
              data-testid="input-discount"
            />
          </div>
          <Button
            className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            disabled={cart.length === 0}
            onClick={() => setPaymentDialog(true)}
            data-testid="button-checkout"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Procedi al Pagamento
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento</DialogTitle>
            <DialogDescription>Totale: {formatCurrency(cartTotal)}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(["cash", "card", "pos_terminal", "satispay"] as const).map((method) => {
                const { label, icon: Icon } = paymentMethodLabels[method];
                return (
                  <button
                    key={method}
                    onClick={() => setSelectedPayment(method)}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                      selectedPayment === method
                        ? "border-primary bg-primary/10"
                        : "border-muted hover-elevate"
                    }`}
                    data-testid={`button-payment-${method}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-medium text-sm">{label}</span>
                  </button>
                );
              })}
            </div>

            {selectedPayment === "cash" && (
              <div className="space-y-3">
                <div>
                  <Label>Contanti Ricevuti (EUR)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-lg h-12 text-center font-bold"
                    data-testid="input-cash-received"
                  />
                </div>
                
                {/* Tastierino Numerico */}
                <div className="grid grid-cols-4 gap-1">
                  {["7", "8", "9", "C"].map((key) => (
                    <Button
                      key={key}
                      variant={key === "C" ? "destructive" : "outline"}
                      className="h-12 text-lg font-bold"
                      onClick={() => {
                        if (key === "C") {
                          setCashReceived("");
                        } else {
                          setCashReceived(prev => prev + key);
                        }
                      }}
                      data-testid={`keypad-${key}`}
                    >
                      {key}
                    </Button>
                  ))}
                  {["4", "5", "6", "←"].map((key) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="h-12 text-lg font-bold"
                      onClick={() => {
                        if (key === "←") {
                          setCashReceived(prev => prev.slice(0, -1));
                        } else {
                          setCashReceived(prev => prev + key);
                        }
                      }}
                      data-testid={`keypad-${key}`}
                    >
                      {key}
                    </Button>
                  ))}
                  {["1", "2", "3", "."].map((key) => (
                    <Button
                      key={key}
                      variant="outline"
                      className="h-12 text-lg font-bold"
                      onClick={() => {
                        if (key === ".") {
                          if (cashReceived.includes(".")) return;
                          setCashReceived(prev => prev === "" ? "0." : prev + ".");
                        } else {
                          setCashReceived(prev => prev + key);
                        }
                      }}
                      data-testid={`keypad-${key}`}
                    >
                      {key}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    className="h-12 text-lg font-bold col-span-2"
                    onClick={() => setCashReceived(prev => prev + "0")}
                    data-testid="keypad-0"
                  >
                    0
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 text-lg font-bold"
                    onClick={() => setCashReceived(prev => prev + "00")}
                    data-testid="keypad-00"
                  >
                    00
                  </Button>
                  <Button
                    className="h-12 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500"
                    onClick={() => setCashReceived((cartTotal / 100).toFixed(2))}
                    data-testid="keypad-exact"
                  >
                    Esatto
                  </Button>
                </div>

                {/* Quick amount buttons */}
                <div className="grid grid-cols-4 gap-1">
                  {[5, 10, 20, 50].map((amount) => (
                    <Button
                      key={amount}
                      variant="secondary"
                      className="h-10"
                      onClick={() => setCashReceived(amount.toString())}
                      data-testid={`quick-${amount}`}
                    >
                      {amount}€
                    </Button>
                  ))}
                </div>

                {parseFloat(cashReceived || "0") * 100 >= cartTotal && (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-center">
                    <div className="text-sm text-muted-foreground">Resto da dare</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(changeAmount)}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Note (opzionale)</Label>
              <Textarea
                placeholder="Note transazione..."
                value={transactionNotes}
                onChange={(e) => setTransactionNotes(e.target.value)}
                data-testid="input-transaction-notes"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPaymentDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handlePayment}
              disabled={createTransactionMutation.isPending || (selectedPayment === "cash" && (!cashReceived || parseFloat(cashReceived) * 100 < cartTotal))}
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
              data-testid="button-confirm-payment"
            >
              {createTransactionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Check className="w-4 h-4 mr-2" />
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeSessionDialog} onOpenChange={setCloseSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chiusura Cassa</DialogTitle>
            <DialogDescription>Verifica il conteggio e chiudi la sessione</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded bg-muted/50">
                <div className="text-muted-foreground">Fondo Iniziale</div>
                <div className="font-semibold">{formatCurrency(currentSession?.openingCash || 0)}</div>
              </div>
              <div className="p-3 rounded bg-muted/50">
                <div className="text-muted-foreground">Vendite Contanti</div>
                <div className="font-semibold">{formatCurrency(currentSession?.totalCashSales || 0)}</div>
              </div>
              <div className="p-3 rounded bg-muted/50">
                <div className="text-muted-foreground">Vendite Carta</div>
                <div className="font-semibold">{formatCurrency(currentSession?.totalCardSales || 0)}</div>
              </div>
              <div className="p-3 rounded bg-muted/50">
                <div className="text-muted-foreground">Transazioni</div>
                <div className="font-semibold">{currentSession?.totalTransactions || 0}</div>
              </div>
            </div>

            <div className="p-4 rounded bg-primary/10 text-center">
              <div className="text-sm text-muted-foreground">Contanti Attesi</div>
              <div className="text-2xl font-bold">
                {formatCurrency((currentSession?.openingCash || 0) + (currentSession?.totalCashSales || 0) - (currentSession?.totalRefunds || 0))}
              </div>
            </div>

            <div>
              <Label>Contanti Contati (EUR)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                className="text-lg h-12"
                data-testid="input-closing-cash"
              />
            </div>

            <div>
              <Label>Note Chiusura (opzionale)</Label>
              <Textarea
                placeholder="Note chiusura..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                data-testid="input-closing-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseSessionDialog(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => closeSessionMutation.mutate({
                closingCash: Math.round(parseFloat(closingCash || "0") * 100),
                closingNotes: sessionNotes || undefined,
              })}
              disabled={closeSessionMutation.isPending}
              data-testid="button-confirm-close"
            >
              {closeSessionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Chiudi Cassa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
