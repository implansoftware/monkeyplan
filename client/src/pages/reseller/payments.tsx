import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Eye, CreditCard, DollarSign, Banknote, Receipt,
  CheckCircle, XCircle, AlertCircle, TrendingUp, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrderPayment } from "@shared/schema";
import { useTranslation } from "react-i18next";

function getStatusLabels(t: (key: string) => string): Record<string, string> {
  return {
    pending: t("hr.pending"),
    processing: "In elaborazione",
    completed: t("common.completed"),
    failed: "Fallito",
    refunded: "Rimborsato",
    partially_refunded: "Rimborsato parzialmente"
  };
}

const statusColors: Record<string, string> = {
  pending: "secondary",
  processing: "default",
  completed: "default",
  failed: "destructive",
  refunded: "destructive",
  partially_refunded: "secondary"
};

function getMethodLabels(t: (key: string) => string): Record<string, string> {
  return {
    cash: t("pos.cash"),
    card: t("pos.card"),
    bank_transfer: "Bonifico",
    paypal: "PayPal",
    stripe: "Stripe",
    pos: t("sidebar.sections.posSection"),
    credit: "Credito"
  };
}

const methodIcons: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  bank_transfer: Receipt,
  paypal: DollarSign,
  stripe: CreditCard,
  pos: CreditCard,
  credit: Receipt
};

export default function ResellerPayments() {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const methodLabels = getMethodLabels(t);
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<SalesOrderPayment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const { data: payments, isLoading } = useQuery<SalesOrderPayment[]>({
    queryKey: ['/api/reseller/payments', { status: statusFilter, method: methodFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      if (methodFilter && methodFilter !== "all") params.set('method', methodFilter);
      const res = await fetch(`/api/reseller/payments?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento pagamenti');
      return res.json();
    }
  });
  
  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await apiRequest('PUT', `/api/payments/${paymentId}`, {
        status: 'completed',
        paidAt: new Date().toISOString(),
        notes: 'Confermato manualmente'
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("license.paymentConfirmed"), description: "Il pagamento è stato confermato con successo" });
      queryClient.invalidateQueries({ queryKey: ['/api/reseller/payments'] });
      setShowDetailDialog(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });
  
  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    setIsConfirming(true);
    try {
      await confirmPaymentMutation.mutateAsync(selectedPayment.id);
    } finally {
      setIsConfirming(false);
    }
  };
  
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
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      payment.transactionId?.toLowerCase().includes(searchLower) ||
      payment.method?.toLowerCase().includes(searchLower)
    );
  }) || [];
  
  const stats = {
    total: payments?.length || 0,
    pending: payments?.filter(p => p.status === 'pending').length || 0,
    completed: payments?.filter(p => p.status === 'completed').length || 0,
    totalAmount: payments?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  };
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="page-title">{t("sidebar.items.payments")}</h1>
              <p className="text-white/80 text-sm">Gestione pagamenti e transazioni</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.total")}</p>
                <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.pending")}</p>
                <p className="text-2xl font-bold" data-testid="stat-pending">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.completed")}</p>
                <p className="text-2xl font-bold" data-testid="stat-completed">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Incassato</p>
                <p className="text-2xl font-bold" data-testid="stat-amount">{formatPrice(stats.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca per ID transazione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search"
          />
        </div>
        
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-method-filter">
            <CreditCard className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t("common.allMethods")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allMethods")}</SelectItem>
            {Object.entries(methodLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder={t("common.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Card className="rounded-2xl">
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t("common.noPaymentsFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Transazione</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead>{t("common.method")}</TableHead>
                  <TableHead>{t("common.amount")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const MethodIcon = methodIcons[payment.method || ''] || CreditCard;
                  return (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="font-mono text-sm" data-testid={`text-transaction-${payment.id}`}>
                        {payment.transactionId || payment.id.slice(0, 12)}
                      </TableCell>
                      <TableCell>{formatDate(payment.paidAt || payment.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          {methodLabels[payment.method || ''] || payment.method}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(payment.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[payment.status] as any}>
                          {statusLabels[payment.status] || payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setShowDetailDialog(true);
                          }}
                          data-testid={`button-view-${payment.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>Dettaglio Pagamento</DialogTitle>
            <DialogDescription>
              {selectedPayment?.transactionId || selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("common.amount")}</Label>
                  <p className="text-2xl font-bold">{formatPrice(selectedPayment?.amount || 0)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("common.status")}</Label>
                  <Badge variant={statusColors[selectedPayment?.status || ''] as any} className="mt-1">
                    {statusLabels[selectedPayment?.status || ''] || selectedPayment?.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("common.method")}</Label>
                  <p className="font-medium">
                    {methodLabels[selectedPayment?.method || ''] || selectedPayment?.method}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("b2b.orderStatus")}</Label>
                  <p className="font-medium">{(selectedPayment as any)?.orderStatus || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("common.order")}</Label>
                  <p>
                    <Link 
                      href={`/reseller/sales-orders/${selectedPayment?.orderId}`}
                      className="font-medium text-primary hover:underline cursor-pointer"
                      onClick={() => setShowDetailDialog(false)}
                      data-testid="link-order-detail"
                    >
                      {(selectedPayment as any)?.orderNumber || selectedPayment?.orderId?.slice(0, 12)}
                    </Link>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("b2b.orderTotal")}</Label>
                  <p className="font-medium">{formatPrice((selectedPayment as any)?.orderTotal || 0)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("common.customer")}</Label>
                  <p className="font-medium">{(selectedPayment as any)?.customerName || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email Cliente</Label>
                  <p className="font-medium text-sm">{(selectedPayment as any)?.customerEmail || '-'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t("common.createdAt")}</Label>
                  <p className="font-medium">{formatDate(selectedPayment?.createdAt || null)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t("utility.paymentDate")}</Label>
                  <p className="font-medium">{formatDate(selectedPayment?.paidAt || null)}</p>
                </div>
              </div>
              
              {selectedPayment?.notes && (
                <div>
                  <Label className="text-muted-foreground">{t("common.notes")}</Label>
                  <p className="mt-1">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>{t("common.close")}</Button>
            {selectedPayment?.status === 'pending' && (
              <Button 
                onClick={handleConfirmPayment}
                disabled={isConfirming}
                data-testid="button-confirm-payment"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isConfirming ? "Confermo..." : "Conferma Pagamento"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
