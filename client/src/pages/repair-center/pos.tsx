import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateVatSummary, DEFAULT_VAT_RATE } from "@/lib/utils";
import { 
  CreditCard, Banknote, QrCode, Trash2, Plus, Minus, 
  ShoppingCart, Receipt, X, Check, DollarSign, 
  RotateCcw, Clock, ChevronRight, Loader2, Search,
  Calculator, LayoutGrid, History, AlertCircle, Wallet,
  Package, Smartphone, Wrench
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

function ProductImage({ category, imageUrl, size = "md" }: { category?: string | null; imageUrl?: string | null; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  
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
  
  useEffect(() => {
    if (imageUrl && !imgError) {
      if (imageUrl.startsWith('http')) {
        setSignedUrl(imageUrl);
      } else if (imageUrl.startsWith('/objects/')) {
        // Use the /objects/* endpoint directly (already handles auth and serving)
        setSignedUrl(imageUrl);
      } else {
        fetch(`/api/object-storage/sign-url?path=${encodeURIComponent(imageUrl)}&method=GET`)
          .then(res => res.json())
          .then(data => {
            if (data.signedUrl) setSignedUrl(data.signedUrl);
          })
          .catch(() => setImgError(true));
      }
    }
  }, [imageUrl, imgError]);
  
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
  
  if (signedUrl && !imgError) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-muted`}>
        <img 
          src={signedUrl} 
          alt="Prodotto" 
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { FileText, User, UserPlus, Store, Settings, List } from "lucide-react";
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
  invoiceRequested: boolean;
  invoiceId: string | null;
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
  imageUrl: string | null;
  availableQuantity?: number;
  listPrice?: number | null;
  priceListName?: string | null;
  productType?: string;
};

type CartItem = {
  serviceItemId?: string | null;
  productId: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number; // Prezzo unitario IVA esclusa
  vatRate: number; // Aliquota IVA %
  discount: number;
  totalPrice: number; // Totale riga IVA esclusa
  isTemporary?: boolean;
  isService?: boolean;
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

type PosRegister = {
  id: string;
  repairCenterId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
};

type ServiceItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  priceCents: number;
  laborMinutes: number;
};

// formatCurrency importato da @/lib/utils

const paymentMethodLabels: Record<string, { label: string; icon: typeof CreditCard }> = {
  cash: { label: "Contanti", icon: Banknote },
  card: { label: "Carta", icon: CreditCard },
  pos_terminal: { label: "POS", icon: CreditCard },
  satispay: { label: "Satispay", icon: Wallet },
  mixed: { label: "Misto", icon: Calculator },
};

export default function PosPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
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
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerType, setCustomerType] = useState<"guest" | "existing" | "new">("guest");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>("");
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>("");
  
  // Stato per prodotto temporaneo
  const [tempProductDialog, setTempProductDialog] = useState(false);
  const [tempProductName, setTempProductName] = useState("");
  const [tempProductPrice, setTempProductPrice] = useState("");
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // POS Registers
  const { data: registers = [], isLoading: registersLoading } = useQuery<PosRegister[]>({
    queryKey: ["/api/repair-center/pos/registers"],
  });

  // Set default register when loaded
  useEffect(() => {
    if (registers.length > 0 && !selectedRegisterId) {
      const defaultReg = registers.find(r => r.isDefault) || registers[0];
      if (defaultReg) setSelectedRegisterId(defaultReg.id);
    }
  }, [registers, selectedRegisterId]);

  const selectedRegister = registers.find(r => r.id === selectedRegisterId);
  

  // Query per lo stato delle sessioni di tutte le casse
  const { data: registerSessions = {} } = useQuery<Record<string, boolean>>({
    queryKey: ["/api/repair-center/pos/registers/sessions"],
    refetchInterval: 10000, // Aggiorna ogni 10 secondi
  });
  const { data: currentSession, isLoading: sessionLoading } = useQuery<PosSession | null>({
    queryKey: ["/api/repair-center/pos/session/current", selectedRegisterId],
    queryFn: async () => {
      if (!selectedRegisterId) return null;
      const res = await fetch(`/api/repair-center/pos/session/current?registerId=${selectedRegisterId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedRegisterId,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<PosTransaction[]>({
    queryKey: ["/api/repair-center/pos/transactions", selectedRegisterId],
    queryFn: async () => {
      const res = await fetch(`/api/repair-center/pos/transactions?registerId=${selectedRegisterId}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentSession && !!selectedRegisterId,
  });

  const { data: dailyStats } = useQuery<DailyStats>({
    queryKey: ["/api/repair-center/pos/stats/daily", selectedRegisterId],
    queryFn: async () => {
      const url = selectedRegisterId
        ? `/api/repair-center/pos/stats/daily?registerId=${selectedRegisterId}`
        : "/api/repair-center/pos/stats/daily";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch daily stats");
      return res.json();
    },
    enabled: !!selectedRegisterId,
  });

  const { data: lastClosedSession } = useQuery<PosSession | null>({
    queryKey: ["/api/repair-center/pos/session/last-closed", selectedRegisterId],
    queryFn: async () => {
      if (!selectedRegisterId) return null;
      const res = await fetch(`/api/repair-center/pos/session/last-closed?registerId=${selectedRegisterId}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !currentSession && !!selectedRegisterId,
  });

  useEffect(() => {
    if (openSessionDialog && lastClosedSession?.closingCash) {
      setOpeningCash((lastClosedSession.closingCash / 100).toFixed(2));
    }
  }, [openSessionDialog, lastClosedSession]);

  // Listini prezzi ereditati dal reseller
  type PriceList = { id: string; name: string; isDefault: boolean; defaultVatRate?: number; targetCustomerType?: string | null };
  const { data: priceLists = [] } = useQuery<PriceList[]>({
    queryKey: ["/api/repair-center/price-lists"],
    queryFn: async () => {
      const res = await fetch("/api/repair-center/price-lists", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Seleziona listino default
  useEffect(() => {
    if (priceLists.length > 0 && !selectedPriceListId) {
      const defaultList = priceLists.find(l => l.isDefault) || priceLists[0];
      if (defaultList) setSelectedPriceListId(defaultList.id);
    }
  }, [priceLists, selectedPriceListId]);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/repair-center/pos/products", selectedPriceListId],
    queryFn: async () => {
      const url = selectedPriceListId 
        ? `/api/repair-center/pos/products?priceListId=${selectedPriceListId}`
        : "/api/repair-center/pos/products";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<ServiceItem[]>({
    queryKey: ["/api/repair-center/pos/services", selectedPriceListId],
    queryFn: async () => {
      const url = selectedPriceListId 
        ? `/api/repair-center/pos/services?priceListId=${selectedPriceListId}`
        : "/api/repair-center/pos/services";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(serviceSearchQuery.toLowerCase())
  ).slice(0, 20);

  type PosCustomer = { id: string; fullName: string; email: string; phone: string | null };

  const { data: customers = [] } = useQuery<PosCustomer[]>({
    queryFn: async () => {
      const res = await fetch(`/api/repair-center/pos/customers?search=${encodeURIComponent(customerSearch)}`, { credentials: "include" });
      if (!res.ok) throw new Error("Errore caricamento clienti");
      return res.json();
    },
    queryKey: ["/api/repair-center/pos/customers", customerSearch],
    enabled: customerType === "existing",
  });

  const filteredCustomers = customers.filter(c =>
    c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  ).slice(0, 10);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 20);

  const openSessionMutation = useMutation({
    mutationFn: async (data: { openingCash: number; openingNotes?: string; registerId?: string }) => {
      return apiRequest("POST", "/api/repair-center/pos/session/open", { ...data, registerId: selectedRegisterId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/session/current", selectedRegisterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/registers/sessions"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/session/current", selectedRegisterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/registers/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/transactions", selectedRegisterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/session/last-closed", selectedRegisterId] });
      setCloseSessionDialog(false);
      setClosingCash("");
      setSessionNotes("");
      toast({ title: "Cassa chiusa", description: "Sessione terminata con successo" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: { fullName: string; email?: string; phone?: string }) => {
      const res = await apiRequest("POST", "/api/repair-center/pos/customers", data);
      return res.json();
    },
    onSuccess: (customer: PosCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/customers"] });
      setSelectedCustomerId(customer.id);
      setCustomerType("existing");
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      toast({ title: "Cliente creato", description: `${customer.fullName} aggiunto con successo` });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/repair-center/pos/transaction", { ...data, registerId: selectedRegisterId });
      return res.json();
    },
    onSuccess: (data: { transaction: any; items: any[]; invoice?: any }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/transactions", selectedRegisterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/session/current", selectedRegisterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/registers/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/pos/stats/daily", selectedRegisterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/invoices"] });
      setCart([]);
      setCashReceived("");
      setDiscountAmount("");
      setTransactionNotes("");
      setInvoiceRequested(false);
      setSelectedCustomerId("");
      setCustomerSearch("");
      setCustomerType("guest");
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setPaymentDialog(false);
      
      if (data.invoice) {
        toast({ 
          title: "Vendita con fattura", 
          description: `Transazione e fattura ${data.invoice.invoiceNumber} create con successo` 
        });
      } else {
        toast({ title: "Vendita registrata", description: "Transazione completata" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Calcoli IVA separata
  const cartVatSummary = useMemo(() => {
    const items = cart.map(item => ({
      priceCents: item.totalPrice,
      quantity: 1,
      vatRate: item.vatRate,
    }));
    return calculateVatSummary(items);
  }, [cart]);
  
  const discount = Math.round(parseFloat(discountAmount || "0") * 100);
  const discountedSubtotal = Math.max(0, cartVatSummary.subtotal - discount);
  const discountedVat = Math.round(discountedSubtotal * (cartVatSummary.vatAmount / (cartVatSummary.subtotal || 1)));
  const cartTotal = discountedSubtotal + discountedVat;
  const changeAmount = selectedPayment === "cash" && cashReceived 
    ? (parseFloat(cashReceived) * 100) - cartTotal 
    : 0;

  const addToCart = (product: Product) => {
    const price = product.listPrice ?? product.sellingPrice ?? product.unitPrice ?? 0;
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
        imageUrl: product.imageUrl || null,
        quantity: 1,
        unitPrice: price,
        vatRate: (product as any).vatRate ?? DEFAULT_VAT_RATE,
        discount: 0,
        totalPrice: price,
      }]);
    }
  };


  const addServiceToCart = (service: ServiceItem) => {
    const existing = cart.find(item => item.serviceItemId === service.id && item.isService);
    
    if (existing) {
      setCart(cart.map(item => 
        item.serviceItemId === service.id && item.isService
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        serviceItemId: service.id,
        productId: null,
        name: service.name,
        sku: service.code,
        barcode: null,
        category: service.category,
        imageUrl: null,
        quantity: 1,
        unitPrice: service.priceCents,
        vatRate: (service as any).vatRate ?? DEFAULT_VAT_RATE,
        discount: 0,
        totalPrice: service.priceCents,
        isService: true,
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

  const updateServiceQuantity = (serviceItemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.serviceItemId === serviceItemId && item.isService) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeServiceFromCart = (serviceItemId: string) => {
    setCart(cart.filter(item => !(item.serviceItemId === serviceItemId && item.isService)));
  };

  const updateTempQuantity = (index: number, delta: number) => {
    setCart(cart.map((item, idx) => {
      if (idx === index && item.isTemporary) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeTempFromCart = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
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

  const addTemporaryProduct = () => {
    const name = tempProductName.trim();
    const parsed = parseFloat(tempProductPrice || "");
    const price = Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
    
    if (!name) {
      toast({ title: "Errore", description: "Inserisci un nome per il prodotto", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast({ title: "Errore", description: "Inserisci un prezzo valido", variant: "destructive" });
      return;
    }
    
    setCart([...cart, {
      productId: null,
      name,
      sku: null,
      barcode: null,
      category: "Temporaneo",
      imageUrl: null,
      quantity: 1,
      unitPrice: price,
      vatRate: DEFAULT_VAT_RATE,
      discount: 0,
      totalPrice: price,
      isTemporary: true,
    }]);
    
    setTempProductName("");
    setTempProductPrice("");
    setTempProductDialog(false);
    toast({ title: "Aggiunto", description: `Prodotto temporaneo "${name}" aggiunto al carrello` });
  };

  const handlePayment = () => {
    if (cart.length === 0) return;
    if (invoiceRequested && (customerType === "guest" || !selectedCustomerId)) {
      toast({ title: "Errore", description: "Seleziona un cliente per la fattura", variant: "destructive" });
      return;
    }
    
    createTransactionMutation.mutate({
      items: cart.map(item => ({
        serviceItemId: item.serviceItemId,
        isService: item.isService || false,
        productId: item.productId,
        productName: item.isTemporary ? item.name : undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        isTemporary: item.isTemporary || false,
      })),
      paymentMethod: selectedPayment,
      discountAmount: discount,
      cashReceived: selectedPayment === "cash" ? Math.round(parseFloat(cashReceived || "0") * 100) : undefined,
      notes: transactionNotes || undefined,
      customerId: selectedCustomerId || undefined,
      invoiceRequested,
    });
  };

  useEffect(() => {
    if (currentSession && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [currentSession]);

  // Aggiorna vatRate/prezzi prodotti nel carrello quando cambia il listino
  useEffect(() => {
    if (products.length === 0 || !selectedPriceListId) return;
    setCart(prevCart => prevCart.map(item => {
      if (item.isService || item.isTemporary || !item.productId) return item;
      const product = products.find(p => p.id === item.productId);
      if (!product) return item;
      const newVatRate = (product as any).vatRate ?? DEFAULT_VAT_RATE;
      const newUnitPrice = (product as any).listPrice ?? (product as any).unitPrice ?? item.unitPrice;
      return {
        ...item,
        vatRate: newVatRate,
        unitPrice: newUnitPrice,
        totalPrice: newUnitPrice * item.quantity * (1 - item.discount / 100),
      };
    }));
  }, [products, selectedPriceListId]);

  // Aggiorna vatRate/prezzi servizi nel carrello quando cambia il listino
  useEffect(() => {
    if (services.length === 0 || !selectedPriceListId) return;
    setCart(prevCart => prevCart.map(item => {
      if (!item.isService || !item.serviceItemId) return item;
      const service = services.find(s => s.id === item.serviceItemId);
      if (!service) return item;
      const newVatRate = (service as any).vatRate ?? DEFAULT_VAT_RATE;
      const newUnitPrice = (service as any).priceCents ?? item.unitPrice;
      return {
        ...item,
        vatRate: newVatRate,
        unitPrice: newUnitPrice,
        totalPrice: newUnitPrice * item.quantity * (1 - item.discount / 100),
      };
    }));
  }, [services, selectedPriceListId]);

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
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 gap-4">
        {/* Selettore Cassa */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Select value={selectedRegisterId} onValueChange={setSelectedRegisterId}>
            <SelectTrigger className="w-full sm:w-[220px] h-10" data-testid="select-register-closed">
              <Store className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Seleziona cassa" />
            </SelectTrigger>
            <SelectContent>
              {registers.filter(r => r.isActive).map(reg => (
                <SelectItem key={reg.id} value={reg.id} data-testid={`select-register-closed-${reg.id}`}>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${registerSessions[reg.id] ? "bg-green-500" : "bg-gray-300"}`} />
                    {reg.name} {reg.isDefault && "(Default)"}
                    {registerSessions[reg.id] && <span className="text-xs text-green-600 ml-1">Aperta</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href="/repair-center/pos/registers">
            <Button variant="ghost" size="icon" className="h-10 w-10" data-testid="button-manage-registers-closed">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
                {lastClosedSession && lastClosedSession.closingCash != null && lastClosedSession.closingCash > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Saldo dalla chiusura precedente: {formatCurrency(lastClosedSession.closingCash)}
                  </p>
                )}
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">POS</h1>
                <div className="flex flex-wrap items-center gap-2 text-emerald-100 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                  {selectedRegister?.name || "Cassa"} • dalle {format(new Date(currentSession.openedAt), "HH:mm", { locale: it })}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedRegisterId} onValueChange={setSelectedRegisterId}>
                <SelectTrigger className="w-auto max-w-[140px] sm:max-w-[180px] h-8 bg-white/20 backdrop-blur-sm text-white border-white/30 truncate" data-testid="select-register">
                  <Store className="w-4 h-4 mr-1 flex-shrink-0" />
                  <SelectValue placeholder="Cassa" className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  {registers.filter(r => r.isActive).map(reg => (
                    <SelectItem key={reg.id} value={reg.id} data-testid={`select-register-${reg.id}`}>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${registerSessions[reg.id] ? "bg-green-500" : "bg-gray-300"}`} />
                        {reg.name} {reg.isDefault && "(Default)"}
                        {registerSessions[reg.id] && <span className="text-xs text-green-600 ml-1">Aperta</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {priceLists.length > 0 && (
                <Select value={selectedPriceListId} onValueChange={setSelectedPriceListId}>
                  <SelectTrigger className="w-auto max-w-[140px] sm:max-w-[180px] h-8 bg-white/20 backdrop-blur-sm text-white border-white/30 truncate" data-testid="select-price-list">
                    <List className="w-4 h-4 mr-1 flex-shrink-0" />
                    <SelectValue placeholder="Listino" className="truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceLists.map(pl => (
                      <SelectItem key={pl.id} value={pl.id} data-testid={`select-price-list-${pl.id}`}>
                        {pl.name} {pl.defaultVatRate !== undefined && `(${pl.defaultVatRate}% IVA)`} {pl.isDefault && " - Default"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Link href="/repair-center/pos/registers">
                <Button variant="outline" size="icon" className="h-8 w-8 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30" data-testid="button-manage-registers">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/repair-center/pos/sessions">
                <Button variant="outline" size="icon" className="h-8 w-8 sm:w-auto sm:px-3 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30" data-testid="button-session-history">
                  <History className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Storico</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCloseSessionDialog(true)}
                className="h-8 w-8 sm:w-auto sm:px-3 bg-red-500/30 backdrop-blur-sm text-white border-red-300/50 hover:bg-red-500/50"
                data-testid="button-close-session"
              >
                <X className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Chiudi</span>
              </Button>
            </div>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
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
              <Button
                size="lg"
                variant="outline"
                onClick={() => setTempProductDialog(true)}
                className="h-12 px-4"
                data-testid="button-add-temp-product"
                title="Aggiungi prodotto temporaneo"
              >
                <Plus className="w-5 h-5 mr-1" />
                Altro
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <Tabs defaultValue="ricambi" className="h-full flex flex-col">
              <TabsList className="mb-2 flex-wrap">
                <TabsTrigger value="ricambi" data-testid="tab-ricambi">
                  <Wrench className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Ricambi</span>
                </TabsTrigger>
                <TabsTrigger value="accessori" data-testid="tab-accessori">
                  <Package className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Accessori</span>
                </TabsTrigger>
                <TabsTrigger value="dispositivi" data-testid="tab-dispositivi">
                  <Smartphone className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Dispositivi</span>
                </TabsTrigger>
                <TabsTrigger value="services" data-testid="tab-services">
                  <FileText className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Interventi</span>
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">
                  <History className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">Storico</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Selezione Cliente */}
              <div className="space-y-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cliente:</span>
                  {(["guest", "existing", "new"] as const).map((type) => {
                    const labels = { guest: "Ospite", existing: "Esistente", new: "Nuovo" };
                    return (
                      <Button
                        key={type}
                        size="sm"
                        variant={customerType === type ? "default" : "outline"}
                        onClick={() => {
                          setCustomerType(type);
                          if (type === "guest") {
                            setSelectedCustomerId("");
                            setCustomerSearch("");
                          }
                        }}
                        data-testid={`button-customer-${type}`}
                      >
                        {labels[type]}
                      </Button>
                    );
                  })}
                </div>
                
                {customerType === "existing" && (
                  <div className="space-y-1 p-2 rounded-md bg-muted/50">
                    {!selectedCustomer ? (
                      <>
                        <Input
                          placeholder="Cerca cliente..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="h-8 text-sm"
                          data-testid="input-customer-search-main"
                        />
                        {customers.length > 0 && (
                          <div className="max-h-24 overflow-y-auto border rounded bg-background">
                            {customers.map(customer => (
                              <button
                                key={customer.id}
                                onClick={() => {
                                  setSelectedCustomerId(customer.id);
                                  setCustomerSearch("");
                                }}
                                className="w-full p-1.5 text-left hover-elevate text-sm"
                                data-testid={`customer-option-main-${customer.id}`}
                              >
                                <span className="font-medium">{customer.fullName}</span>
                                <span className="text-muted-foreground ml-2 text-xs">{customer.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm"><User className="w-3 h-3 inline mr-1" />{selectedCustomer.fullName}</span>
                        <Button size="icon" variant="ghost" onClick={() => setSelectedCustomerId("")} data-testid="button-remove-customer-main">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {customerType === "new" && (
                  <div className="grid grid-cols-1 gap-1 p-2 rounded-md bg-muted/50">
                    <Input placeholder="Nome *" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} className="h-8 text-sm" data-testid="input-new-customer-name-main" />
                    <Input placeholder="Email" type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="h-8 text-sm" data-testid="input-new-customer-email-main" />
                    <Input placeholder="Telefono" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="h-8 text-sm" data-testid="input-new-customer-phone-main" />
                    <Button size="sm" variant="outline" disabled={!newCustomerName.trim() || createCustomerMutation.isPending} onClick={() => createCustomerMutation.mutate({ fullName: newCustomerName.trim(), email: newCustomerEmail.trim() || undefined, phone: newCustomerPhone.trim() || undefined })} data-testid="button-create-customer-main">
                      {createCustomerMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <UserPlus className="w-3 h-3 mr-1" />}
                      Crea Cliente
                    </Button>
                  </div>
                )}
                
                {invoiceRequested && customerType === "guest" && (
                  <p className="text-xs text-amber-600">Fattura richiede cliente</p>
                )}
                {invoiceRequested && customerType === "existing" && !selectedCustomerId && (
                  <p className="text-xs text-amber-600">Seleziona cliente per fattura</p>
                )}
                {invoiceRequested && customerType === "new" && !selectedCustomerId && (
                  <p className="text-xs text-amber-600">Crea cliente per fattura</p>
                )}
              </div>
              
              {/* Tab Ricambi */}
              <TabsContent value="ricambi" className="flex-1 overflow-hidden m-0">
                <div className="mb-2">
                  <Input
                    placeholder="Cerca ricambio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10"
                    data-testid="input-ricambi-search"
                  />
                </div>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  {productsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : (() => {
                    const filtered = filteredProducts.filter(p => (p.productType || "ricambio") === "ricambio");
                    return filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Wrench className="w-12 h-12 mb-2 opacity-50" />
                        <span>Nessun ricambio disponibile</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filtered.map((product) => {
                          const isOutOfStock = product.availableQuantity !== undefined && product.availableQuantity <= 0;
                          const price = product.listPrice ?? product.sellingPrice ?? product.unitPrice ?? 0;
                          return (
                            <button
                              key={product.id}
                              onClick={() => !isOutOfStock && addToCart(product)}
                              disabled={isOutOfStock}
                              className={`p-3 rounded-lg border bg-card text-left transition-colors min-h-[120px] ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover-elevate active-elevate-2"}`}
                              data-testid={`button-ricambio-${product.id}`}
                            >
                              <div className="flex gap-2 mb-2">
                                <ProductImage category={product.category} imageUrl={product.imageUrl} size="md" />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="font-medium text-sm line-clamp-2 break-words">{product.name}</div>
                                  {product.sku && <div className="text-xs text-muted-foreground mt-0.5 truncate">{product.sku}</div>}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-primary">{formatCurrency(price)}</div>
                                {product.availableQuantity !== undefined && (
                                  <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="text-xs">
                                    {isOutOfStock ? "Esaurito" : `${product.availableQuantity} disp.`}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </ScrollArea>
              </TabsContent>

              {/* Tab Accessori */}
              <TabsContent value="accessori" className="flex-1 overflow-hidden m-0">
                <div className="mb-2">
                  <Input
                    placeholder="Cerca accessorio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10"
                    data-testid="input-accessori-search"
                  />
                </div>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  {productsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : (() => {
                    const filtered = filteredProducts.filter(p => p.productType === "accessorio");
                    return filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Package className="w-12 h-12 mb-2 opacity-50" />
                        <span>Nessun accessorio disponibile</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filtered.map((product) => {
                          const isOutOfStock = product.availableQuantity !== undefined && product.availableQuantity <= 0;
                          const price = product.listPrice ?? product.sellingPrice ?? product.unitPrice ?? 0;
                          return (
                            <button
                              key={product.id}
                              onClick={() => !isOutOfStock && addToCart(product)}
                              disabled={isOutOfStock}
                              className={`p-3 rounded-lg border bg-card text-left transition-colors min-h-[120px] ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover-elevate active-elevate-2"}`}
                              data-testid={`button-accessorio-${product.id}`}
                            >
                              <div className="flex gap-2 mb-2">
                                <ProductImage category={product.category} imageUrl={product.imageUrl} size="md" />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="font-medium text-sm line-clamp-2 break-words">{product.name}</div>
                                  {product.sku && <div className="text-xs text-muted-foreground mt-0.5 truncate">{product.sku}</div>}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-primary">{formatCurrency(price)}</div>
                                {product.availableQuantity !== undefined && (
                                  <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="text-xs">
                                    {isOutOfStock ? "Esaurito" : `${product.availableQuantity} disp.`}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </ScrollArea>
              </TabsContent>

              {/* Tab Dispositivi */}
              <TabsContent value="dispositivi" className="flex-1 overflow-hidden m-0">
                <div className="mb-2">
                  <Input
                    placeholder="Cerca dispositivo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10"
                    data-testid="input-dispositivi-search"
                  />
                </div>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  {productsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : (() => {
                    const filtered = filteredProducts.filter(p => p.productType === "dispositivo");
                    return filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Smartphone className="w-12 h-12 mb-2 opacity-50" />
                        <span>Nessun dispositivo disponibile</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {filtered.map((product) => {
                          const isOutOfStock = product.availableQuantity !== undefined && product.availableQuantity <= 0;
                          const price = product.listPrice ?? product.sellingPrice ?? product.unitPrice ?? 0;
                          return (
                            <button
                              key={product.id}
                              onClick={() => !isOutOfStock && addToCart(product)}
                              disabled={isOutOfStock}
                              className={`p-3 rounded-lg border bg-card text-left transition-colors min-h-[120px] ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover-elevate active-elevate-2"}`}
                              data-testid={`button-dispositivo-${product.id}`}
                            >
                              <div className="flex gap-2 mb-2">
                                <ProductImage category={product.category} imageUrl={product.imageUrl} size="md" />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="font-medium text-sm line-clamp-2 break-words">{product.name}</div>
                                  {product.sku && <div className="text-xs text-muted-foreground mt-0.5 truncate">{product.sku}</div>}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="font-semibold text-primary">{formatCurrency(price)}</div>
                                {product.availableQuantity !== undefined && (
                                  <Badge variant={isOutOfStock ? "destructive" : "secondary"} className="text-xs">
                                    {isOutOfStock ? "Esaurito" : `${product.availableQuantity} disp.`}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </ScrollArea>
              </TabsContent>


              <TabsContent value="services" className="flex-1 overflow-hidden m-0">
                <div className="mb-2">
                  <Input
                    placeholder="Cerca intervento..."
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    className="h-10"
                    data-testid="input-service-search"
                  />
                </div>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  {servicesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                    </div>
                  ) : filteredServices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                      <span>Nessun intervento disponibile</span>
                      <span className="text-sm">Configura il catalogo interventi</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {filteredServices.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => addServiceToCart(service)}
                          className="p-3 rounded-lg border bg-card text-left transition-colors min-h-[120px] hover-elevate active-elevate-2"
                          data-testid={`button-service-${service.id}`}
                        >
                          <div className="flex gap-2 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-800 dark:to-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm line-clamp-2">{service.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{service.code}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="mb-2 text-xs">{service.category}</Badge>
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-primary">
                              {formatCurrency(service.priceCents)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {service.laborMinutes} min
                            </div>
                          </div>
                        </button>
                      ))}
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
                        <button
                          key={tx.id}
                          onClick={() => navigate(`/repair-center/pos/transaction/${tx.id}`)}
                          className="w-full p-3 rounded-lg border bg-card flex items-center gap-3 text-left hover-elevate active-elevate-2"
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
                          <div className="text-right flex flex-col items-end gap-1">
                            <div className="font-semibold">{formatCurrency(tx.total)}</div>
                            <div className="flex gap-1">
                              {tx.invoiceRequested && (
                                <Badge variant={tx.invoiceId ? "default" : "secondary"} className="text-xs">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {tx.invoiceId ? "Fattura" : "Da fatturare"}
                                </Badge>
                              )}
                              {tx.status === "refunded" && (
                                <Badge variant="destructive" className="text-xs">Rimborsato</Badge>
                              )}
                              {tx.status === "partial_refund" && (
                                <Badge variant="secondary" className="text-xs">Rimborso parziale</Badge>
                              )}
                              {tx.status === "voided" && (
                                <Badge variant="destructive" className="text-xs">Annullata</Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
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
          <CardTitle className="flex flex-wrap items-center gap-2">
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
                {cart.map((item, idx) => {
                  const itemKey = item.serviceItemId ? `service-${item.serviceItemId}` : (item.productId || `temp-${idx}`);
                  return (
                  <div
                    key={itemKey}
                    className={`p-3 rounded border ${item.isTemporary ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/30'}`}
                    data-testid={`cart-item-${itemKey}`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <ProductImage category={item.category} imageUrl={item.imageUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-sm line-clamp-1">{item.name}</div>
                          {item.isService && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-indigo-500 text-indigo-600 dark:text-indigo-400">
                              Servizio
                            </Badge>
                          )}
                          {item.isTemporary && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500 text-amber-600 dark:text-amber-400">
                              Temp
                            </Badge>
                          )}
                        </div>
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
                      <div className="flex flex-wrap items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => item.isTemporary ? updateTempQuantity(idx, -1) : (item.isService ? updateServiceQuantity(item.serviceItemId!, -1) : updateQuantity(item.productId!, -1))}
                          data-testid={`button-decrease-${itemKey}`}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => item.isTemporary ? updateTempQuantity(idx, 1) : (item.isService ? updateServiceQuantity(item.serviceItemId!, 1) : updateQuantity(item.productId!, 1))}
                          data-testid={`button-increase-${itemKey}`}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => item.isTemporary ? removeTempFromCart(idx) : (item.isService ? removeServiceFromCart(item.serviceItemId!) : removeFromCart(item.productId!))}
                        data-testid={`button-remove-${itemKey}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        
        <Separator />
        
        <div className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Imponibile</span>
            <span>{formatCurrency(cartVatSummary.subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-destructive">
              <span>Sconto</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA</span>
            <span>{formatCurrency(discountedVat)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-semibold text-lg">
            <span>Totale</span>
            <span>{formatCurrency(cartTotal)}</span>
          </div>
        </div>

        <CardFooter className="flex-col gap-3 pt-0">
          <div className="w-full">
            <Input
              placeholder="Sconto (EUR)"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              className="h-9"
              data-testid="input-discount"
            />
          </div>
          
          {/* Metodi di pagamento */}
          <div className="grid grid-cols-4 gap-1 w-full">
            {(["cash", "card", "pos_terminal", "satispay"] as const).map((method) => {
              const { label, icon: Icon } = paymentMethodLabels[method];
              return (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={`p-2 rounded-md border-2 flex flex-col items-center gap-1 transition-colors ${
                    selectedPayment === method
                      ? "border-primary bg-primary/10"
                      : "border-muted hover-elevate"
                  }`}
                  data-testid={`button-payment-inline-${method}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-[10px]">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Tastierino numerico per contante */}
          {selectedPayment === "cash" && (
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Contante ricevuto"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="h-9 text-center font-bold"
                  data-testid="input-cash-inline"
                />
                {parseFloat(cashReceived || "0") * 100 >= cartTotal && cartTotal > 0 && (
                  <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30">
                    <span className="text-xs font-bold text-blue-600">Resto: {formatCurrency(changeAmount)}</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-1">
                {["7", "8", "9", "C", "4", "5", "6", "←", "1", "2", "3", "."].map((key) => (
                  <Button
                    key={key}
                    variant={key === "C" ? "destructive" : "outline"}
                    size="sm"
                    className="h-8 text-sm font-bold"
                    onClick={() => {
                      if (key === "C") setCashReceived("");
                      else if (key === "←") setCashReceived(prev => prev.slice(0, -1));
                      else if (key === ".") {
                        if (!cashReceived.includes(".")) setCashReceived(prev => prev === "" ? "0." : prev + ".");
                      } else setCashReceived(prev => prev + key);
                    }}
                    data-testid={`keypad-inline-${key}`}
                  >
                    {key}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-8 font-bold col-span-2" onClick={() => setCashReceived(prev => prev + "0")} data-testid="keypad-inline-0">0</Button>
                <Button variant="outline" size="sm" className="h-8 font-bold" onClick={() => setCashReceived(prev => prev + "00")} data-testid="keypad-inline-00">00</Button>
                <Button size="sm" className="h-8 font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-[10px]" onClick={() => setCashReceived((cartTotal / 100).toFixed(2))} data-testid="keypad-inline-exact">Esatto</Button>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 text-base bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            disabled={cart.length === 0 || (selectedPayment === "cash" && (!cashReceived || parseFloat(cashReceived) * 100 < cartTotal))}
            onClick={handlePayment}
            data-testid="button-checkout"
          >
            {createTransactionMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Conferma Pagamento
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>Pagamento</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(cartTotal)}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-1">
              {(["cash", "card", "pos_terminal", "satispay"] as const).map((method) => {
                const { label, icon: Icon } = paymentMethodLabels[method];
                return (
                  <button
                    key={method}
                    onClick={() => setSelectedPayment(method)}
                    className={`p-2 rounded-md border-2 flex flex-col items-center gap-1 transition-colors ${
                      selectedPayment === method
                        ? "border-primary bg-primary/10"
                        : "border-muted hover-elevate"
                    }`}
                    data-testid={`button-payment-${method}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-xs">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="invoice-switch"
                  checked={invoiceRequested}
                  onCheckedChange={setInvoiceRequested}
                  data-testid="switch-invoice-requested"
                />
                <Label htmlFor="invoice-switch" className="text-xs">Richiedi Fattura</Label>
              </div>
            </div>

            {selectedPayment === "cash" && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="text-base h-10 text-center font-bold flex-1"
                    data-testid="input-cash-received"
                  />
                  {[5, 10, 20, 50].map((amount) => (
                    <Button key={amount} size="sm" variant="secondary" onClick={() => setCashReceived(amount.toString())} data-testid={`quick-${amount}`}>
                      {amount}€
                    </Button>
                  ))}
                </div>
                
                <div className="grid grid-cols-4 gap-1">
                  {["7", "8", "9", "C", "4", "5", "6", "←", "1", "2", "3", "."].map((key) => (
                    <Button
                      key={key}
                      variant={key === "C" ? "destructive" : "outline"}
                      size="sm"
                      className="h-9 text-sm font-bold"
                      onClick={() => {
                        if (key === "C") setCashReceived("");
                        else if (key === "←") setCashReceived(prev => prev.slice(0, -1));
                        else if (key === ".") {
                          if (!cashReceived.includes(".")) setCashReceived(prev => prev === "" ? "0." : prev + ".");
                        } else setCashReceived(prev => prev + key);
                      }}
                      data-testid={`keypad-${key}`}
                    >
                      {key}
                    </Button>
                  ))}
                  <Button variant="outline" size="sm" className="h-9 font-bold col-span-2" onClick={() => setCashReceived(prev => prev + "0")} data-testid="keypad-0">0</Button>
                  <Button variant="outline" size="sm" className="h-9 font-bold" onClick={() => setCashReceived(prev => prev + "00")} data-testid="keypad-00">00</Button>
                  <Button size="sm" className="h-9 font-bold bg-gradient-to-r from-blue-500 to-cyan-500" onClick={() => setCashReceived((cartTotal / 100).toFixed(2))} data-testid="keypad-exact">Esatto</Button>
                </div>

                {parseFloat(cashReceived || "0") * 100 >= cartTotal && (
                  <div className="p-2 rounded-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-center">
                    <span className="text-xs text-muted-foreground mr-2">Resto:</span>
                    <span className="text-lg font-bold text-blue-600">{formatCurrency(changeAmount)}</span>
                  </div>
                )}
              </div>
            )}

            <Input
              placeholder="Note (opzionale)"
              value={transactionNotes}
              onChange={(e) => setTransactionNotes(e.target.value)}
              className="h-9"
              data-testid="input-transaction-notes"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" onClick={() => setPaymentDialog(false)}>
              Annulla
            </Button>
            <Button
              size="sm"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
              <p className="text-xs text-muted-foreground mt-2">
                Inserisci l'importo che lasci in cassa. La differenza rispetto ai contanti attesi verrà registrata come prelievo.
              </p>
              {closingCash && parseFloat(closingCash) < ((currentSession?.openingCash || 0) + (currentSession?.totalCashSales || 0) - (currentSession?.totalRefunds || 0)) / 100 && (
                <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Banknote className="h-3 w-3" />
                    Prelievo: {formatCurrency(
                      ((currentSession?.openingCash || 0) + (currentSession?.totalCashSales || 0) - (currentSession?.totalRefunds || 0)) - 
                      Math.round(parseFloat(closingCash) * 100)
                    )}
                  </p>
                </div>
              )}
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

      {/* Dialog per prodotto temporaneo */}
      <Dialog open={tempProductDialog} onOpenChange={setTempProductDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              <Package className="w-5 h-5" />
              Aggiungi Prodotto Temporaneo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="temp-name">Nome Prodotto</Label>
              <Input
                id="temp-name"
                placeholder="Es: Riparazione vetro, Servizio..."
                value={tempProductName}
                onChange={(e) => setTempProductName(e.target.value)}
                data-testid="input-temp-product-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-price">Prezzo (EUR)</Label>
              <Input
                id="temp-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={tempProductPrice}
                onChange={(e) => setTempProductPrice(e.target.value)}
                data-testid="input-temp-product-price"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTempProductName("");
              setTempProductPrice("");
              setTempProductDialog(false);
            }}>
              Annulla
            </Button>
            <Button onClick={addTemporaryProduct} data-testid="button-confirm-temp-product">
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi al Carrello
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
