import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, CreditCard, DollarSign, CheckCircle, XCircle, 
  Clock, AlertCircle, Download, RefreshCw, TrendingUp,
  Banknote, Receipt, ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrderPayment } from "@shared/schema";

const statusLabels: Record<string, string> = {
  pending: "In attesa",
  processing: "In elaborazione",
  completed: "Completato",
  paid: "Pagato",
  failed: "Fallito",
  refunded: "Rimborsato",
  partially_refunded: "Rimborso parziale"
};

const orderTypeLabels: Record<string, string> = {
  b2c: "B2C",
  b2b: "B2B"
};

const orderTypeColors: Record<string, string> = {
  b2c: "outline",
  b2b: "secondary"
};

const statusColors: Record<string, string> = {
  pending: "secondary",
  processing: "default",
  completed: "default",
  failed: "destructive",
  refunded: "destructive",
  partially_refunded: "secondary"
};

const methodLabels: Record<string, string> = {
  cash: "Contanti",
  card: "Carta",
  bank_transfer: "Bonifico",
  paypal: "PayPal",
  stripe: "Stripe",
  satispay: "Satispay",
  pos: "POS",
  credit: "Credito"
};

const methodIcons: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  bank_transfer: Receipt,
  paypal: DollarSign,
  stripe: CreditCard,
  satispay: DollarSign,
  pos: CreditCard,
  credit: Receipt
};

export default function AdminPayments() {
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<SalesOrderPayment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  
  const { data: payments, isLoading } = useQuery<SalesOrderPayment[]>({
    queryKey: ['/api/admin/payments', { status: statusFilter, method: methodFilter, orderType: orderTypeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      if (methodFilter && methodFilter !== "all") params.set('method', methodFilter);
      if (orderTypeFilter && orderTypeFilter !== "all") params.set('orderType', orderTypeFilter);
      const res = await fetch(`/api/payments?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento pagamenti');
      return res.json();
    }
  });
  
  const updatePayment = useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: string; status: string }) => {
      return await apiRequest('PUT', `/api/payments/${paymentId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
      toast({ title: "Pagamento aggiornato" });
      setShowDetailDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredPayments = payments?.filter(payment => {
    const paymentAny = payment as any;
    const orderType = paymentAny.orderType || 'b2c';
    
    if (orderTypeFilter && orderTypeFilter !== "all" && orderType !== orderTypeFilter) {
      return false;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesTransaction = payment.transactionId?.toLowerCase().includes(searchLower);
      const matchesOrderNumber = paymentAny.orderNumber?.toLowerCase().includes(searchLower);
      const matchesReseller = paymentAny.resellerName?.toLowerCase().includes(searchLower);
      if (!matchesTransaction && !matchesOrderNumber && !matchesReseller) {
        return false;
      }
    }
    return true;
  }) || [];
  
  const openDetailDialog = (payment: SalesOrderPayment) => {
    setSelectedPayment(payment);
    setShowDetailDialog(true);
  };
  
  const openRefundDialog = (payment: SalesOrderPayment) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount.toString());
    setRefundReason("");
    setShowRefundDialog(true);
  };
  
  const handleRefund = () => {
    if (!selectedPayment) return;
    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > selectedPayment.amount) {
      toast({ title: "Errore", description: "Importo non valido", variant: "destructive" });
      return;
    }
    
    const newStatus = amount === selectedPayment.amount ? 'refunded' : 'partially_refunded';
    updatePayment.mutate({ paymentId: selectedPayment.id, status: newStatus });
    setShowRefundDialog(false);
  };
  
  const handleExport = () => {
    toast({ title: "Export", description: "Funzionalità in arrivo" });
  };
  
  const stats = {
    total: payments?.length || 0,
    pending: payments?.filter(p => p.status === 'pending').length || 0,
    completed: payments?.filter(p => p.status === 'completed').length || 0,
    totalAmount: payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0,
    refunded: payments?.filter(p => ['refunded', 'partially_refunded'].includes(p.status)).length || 0
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-admin-payments-title">Pagamenti</h1>
              <p className="text-sm text-muted-foreground">Gestione di tutti i pagamenti</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleExport} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="text-2xl font-bold" data-testid="stat-total-payments">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In attesa</p>
                <p className="text-2xl font-bold" data-testid="stat-pending-payments">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati</p>
                <p className="text-2xl font-bold" data-testid="stat-completed-payments">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Incassato</p>
                <p className="text-2xl font-bold" data-testid="stat-total-amount">{formatPrice(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per n. ordine, reseller..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-[140px]" data-testid="select-order-type-filter">
            <SelectValue placeholder="Tutti i tipi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="b2c">B2C</SelectItem>
            <SelectItem value="b2b">B2B</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-method-filter">
            <CreditCard className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Tutti i metodi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i metodi</SelectItem>
            {Object.entries(methodLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
            <SelectValue placeholder="Tutti gli stati" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nessun pagamento trovato</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>N. Ordine</TableHead>
                  <TableHead>Reseller</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const MethodIcon = methodIcons[payment.method] || CreditCard;
                  const paymentAny = payment as any;
                  const orderType = paymentAny.orderType || 'b2c';
                  return (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell>
                        <Badge variant={orderTypeColors[orderType] as any || "secondary"}>
                          {orderTypeLabels[orderType] || orderType.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`text-order-number-${payment.id}`}>
                        {orderType === 'b2b' ? (
                          <Link href={`/admin/b2b-orders?order=${payment.orderId}`}>
                            <span className="flex items-center gap-1 text-primary hover:underline cursor-pointer">
                              {paymentAny.orderNumber || payment.orderId?.slice(0, 8) || '-'}
                              <ExternalLink className="h-3 w-3" />
                            </span>
                          </Link>
                        ) : (
                          paymentAny.orderNumber || payment.orderId?.slice(0, 8) || '-'
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-reseller-${payment.id}`}>
                        {paymentAny.resellerName || (orderType === 'b2b' ? 'N/A' : '-')}
                      </TableCell>
                      <TableCell>{formatDate(payment.paidAt || payment.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MethodIcon className="h-4 w-4" />
                          {methodLabels[payment.method] || payment.method}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-amount-${payment.id}`}>
                        {formatPrice(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[payment.status] as any || "secondary"}>
                          {statusLabels[payment.status] || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailDialog(payment)}
                            data-testid={`button-view-payment-${payment.id}`}
                          >
                            Dettagli
                          </Button>
                          {(payment.status === 'completed' || payment.status === 'paid') && orderType === 'b2c' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRefundDialog(payment)}
                              data-testid={`button-refund-${payment.id}`}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Rimborsa
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dettaglio pagamento</DialogTitle>
            <DialogDescription>
              {selectedPayment?.transactionId || selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (() => {
            const paymentAny = selectedPayment as any;
            const orderType = paymentAny.orderType || 'b2c';
            return (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo Ordine</Label>
                  <div className="mt-1">
                    <Badge variant={orderTypeColors[orderType] as any}>
                      {orderTypeLabels[orderType] || orderType.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">N. Ordine</Label>
                  <p className="font-mono">{paymentAny.orderNumber || selectedPayment.orderId?.slice(0, 8) || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Importo</Label>
                  <p className="text-lg font-semibold">{formatPrice(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stato</Label>
                  <div className="mt-1">
                    <Badge variant={statusColors[selectedPayment.status] as any}>
                      {statusLabels[selectedPayment.status]}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Metodo</Label>
                  <p>{methodLabels[selectedPayment.method]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data</Label>
                  <p>{formatDate(selectedPayment.paidAt || selectedPayment.createdAt)}</p>
                </div>
                {orderType === 'b2b' && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Reseller</Label>
                      <p>{paymentAny.resellerName || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Riferimento Bonifico</Label>
                      <p>{selectedPayment.gatewayReference || '-'}</p>
                    </div>
                  </>
                )}
              </div>
              
              {selectedPayment.notes && (
                <div>
                  <Label className="text-muted-foreground">Note</Label>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}
              
              {selectedPayment.status === 'pending' && orderType === 'b2c' && (
                <div className="space-y-2">
                  <Label>Aggiorna stato</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => updatePayment.mutate({ paymentId: selectedPayment.id, status: 'completed' })}
                      disabled={updatePayment.isPending}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Conferma
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updatePayment.mutate({ paymentId: selectedPayment.id, status: 'failed' })}
                      disabled={updatePayment.isPending}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Fallito
                    </Button>
                  </div>
                </div>
              )}
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rimborsa pagamento</DialogTitle>
            <DialogDescription>
              Importo originale: {selectedPayment && formatPrice(selectedPayment.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Importo rimborso</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={selectedPayment?.amount}
              />
            </div>
            <div className="space-y-2">
              <Label>Motivo (opzionale)</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Motivo del rimborso..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleRefund}
              disabled={updatePayment.isPending}
              variant="destructive"
            >
              Conferma rimborso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
