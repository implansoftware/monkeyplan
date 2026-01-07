import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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

const statusLabels: Record<string, string> = {
  pending: "In attesa",
  processing: "In elaborazione",
  completed: "Completato",
  failed: "Fallito",
  refunded: "Rimborsato",
  partially_refunded: "Rimborsato parzialmente"
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

export default function ResellerPayments() {
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<SalesOrderPayment | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const { data: payments, isLoading } = useQuery<SalesOrderPayment[]>({
    queryKey: ['/api/reseller/payments', { status: statusFilter, method: methodFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      if (methodFilter && methodFilter !== "all") params.set('method', methodFilter);
      const res = await fetch(`/api/payments?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento pagamenti');
      return res.json();
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold" data-testid="page-title">Pagamenti</h1>
              <p className="text-muted-foreground">Gestione pagamenti e transazioni</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale</p>
                <p className="text-2xl font-bold" data-testid="stat-total">{stats.total}</p>
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
                <p className="text-sm text-muted-foreground">In Attesa</p>
                <p className="text-2xl font-bold" data-testid="stat-pending">{stats.pending}</p>
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
                <p className="text-2xl font-bold" data-testid="stat-completed">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
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
          <SelectTrigger className="w-[180px]" data-testid="select-method-filter">
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
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
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
                  <TableHead>ID Transazione</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
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
                        <div className="flex items-center gap-2">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Importo</Label>
                  <p className="text-2xl font-bold">{formatPrice(selectedPayment?.amount || 0)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Stato</Label>
                  <Badge variant={statusColors[selectedPayment?.status || ''] as any} className="mt-1">
                    {statusLabels[selectedPayment?.status || ''] || selectedPayment?.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Metodo</Label>
                  <p className="font-medium">
                    {methodLabels[selectedPayment?.method || ''] || selectedPayment?.method}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data Pagamento</Label>
                  <p className="font-medium">{formatDate(selectedPayment?.paidAt || null)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID Ordine</Label>
                  <p className="font-mono text-sm">{selectedPayment?.orderId?.slice(0, 12)}...</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Creato il</Label>
                  <p className="font-medium">{formatDate(selectedPayment?.createdAt || null)}</p>
                </div>
              </div>
              
              {selectedPayment?.notes && (
                <div>
                  <Label className="text-muted-foreground">Note</Label>
                  <p className="mt-1">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
