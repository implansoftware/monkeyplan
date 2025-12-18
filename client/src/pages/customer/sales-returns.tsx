import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  RotateCcw, Package, CheckCircle, XCircle, Clock, Plus, Eye,
  AlertTriangle, Truck, DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrderReturn, SalesOrder } from "@shared/schema";

const statusLabels: Record<string, string> = {
  requested: "Richiesto",
  approved: "Approvato",
  rejected: "Rifiutato",
  shipped: "Spedito",
  received: "Ricevuto",
  refunded: "Rimborsato",
  partially_refunded: "Rimborsato parzialmente",
  cancelled: "Annullato",
  awaiting_shipment: "In attesa di spedizione",
  inspecting: "In ispezione"
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  requested: "secondary",
  approved: "default",
  rejected: "destructive",
  shipped: "default",
  received: "default",
  refunded: "default",
  partially_refunded: "secondary",
  cancelled: "destructive",
  awaiting_shipment: "secondary",
  inspecting: "secondary"
};

const reasonLabels: Record<string, string> = {
  defective: "Prodotto difettoso",
  wrong_item: "Articolo errato",
  not_as_described: "Non conforme alla descrizione",
  changed_mind: "Ripensamento",
  damaged_in_transit: "Danneggiato durante il trasporto",
  other: "Altro motivo"
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'requested':
      return <Clock className="h-4 w-4" />;
    case 'approved':
    case 'refunded':
      return <CheckCircle className="h-4 w-4" />;
    case 'rejected':
    case 'cancelled':
      return <XCircle className="h-4 w-4" />;
    case 'shipped':
      return <Truck className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export default function CustomerSalesReturns() {
  const { toast } = useToast();
  
  const [selectedReturn, setSelectedReturn] = useState<SalesOrderReturn | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showNewReturnDialog, setShowNewReturnDialog] = useState(false);
  const [newReturnData, setNewReturnData] = useState({
    orderId: "",
    reason: "",
    customerNotes: ""
  });
  
  const { data: returns, isLoading } = useQuery<SalesOrderReturn[]>({
    queryKey: ['/api/sales-returns']
  });
  
  const { data: orders } = useQuery<SalesOrder[]>({
    queryKey: ['/api/my-orders']
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: { orderId: string; reason: string; customerNotes: string }) => {
      const res = await apiRequest("POST", '/api/sales-returns', {
        orderId: data.orderId,
        reason: data.reason,
        customerNotes: data.customerNotes,
        status: 'requested'
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Richiesta di reso inviata", description: "Riceverai una risposta a breve" });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-orders'] });
      setShowNewReturnDialog(false);
      setNewReturnData({ orderId: "", reason: "", customerNotes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PUT", `/api/sales-returns/${id}`, { status: 'cancelled' });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reso annullato" });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-returns'] });
      setShowDetailDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });
  
  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const eligibleOrders = orders?.filter(o => 
    ['delivered', 'completed'].includes(o.status) &&
    !returns?.some(r => r.orderId === o.id && !['cancelled', 'rejected'].includes(r.status!))
  ) || [];
  
  const stats = {
    total: returns?.length || 0,
    pending: returns?.filter(r => ['requested', 'awaiting_shipment', 'inspecting'].includes(r.status!)).length || 0,
    approved: returns?.filter(r => ['approved', 'shipped', 'received'].includes(r.status!)).length || 0,
    completed: returns?.filter(r => ['refunded', 'partially_refunded'].includes(r.status!)).length || 0
  };
  
  const handleCreateReturn = () => {
    if (!newReturnData.orderId || !newReturnData.reason) {
      toast({ title: "Compila tutti i campi obbligatori", variant: "destructive" });
      return;
    }
    createMutation.mutate(newReturnData);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-returns-title">I miei resi</h1>
          <p className="text-muted-foreground">Gestisci le tue richieste di reso</p>
        </div>
        <Button onClick={() => setShowNewReturnDialog(true)} data-testid="button-new-return">
          <Plus className="h-4 w-4 mr-2" />
          Richiedi reso
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <RotateCcw className="h-5 w-5 text-blue-600" />
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
                <p className="text-sm text-muted-foreground">In corso</p>
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
                <p className="text-sm text-muted-foreground">Approvati</p>
                <p className="text-2xl font-bold" data-testid="stat-approved">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completati</p>
                <p className="text-2xl font-bold" data-testid="stat-completed">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {!returns || returns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nessun reso</h3>
            <p className="text-muted-foreground mb-4">Non hai ancora richiesto resi</p>
            {eligibleOrders.length > 0 && (
              <Button onClick={() => setShowNewReturnDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Richiedi il tuo primo reso
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {returns.map((ret) => (
            <Card 
              key={ret.id} 
              className="hover-elevate cursor-pointer"
              onClick={() => { setSelectedReturn(ret); setShowDetailDialog(true); }}
              data-testid={`card-return-${ret.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg" data-testid={`text-return-number-${ret.id}`}>
                        {ret.returnNumber}
                      </h3>
                      <Badge variant={statusColors[ret.status || 'requested']}>
                        <StatusIcon status={ret.status || 'requested'} />
                        <span className="ml-1">{statusLabels[ret.status || 'requested']}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>{reasonLabels[ret.reason || ''] || ret.reason}</span>
                      <span>Richiesto il {formatDate(ret.createdAt)}</span>
                    </div>
                    
                    {ret.refundAmount && (
                      <p className="text-sm font-medium text-green-600">
                        Rimborso: {formatPrice(ret.refundAmount)}
                      </p>
                    )}
                  </div>
                  
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettagli Reso</DialogTitle>
            <DialogDescription>
              {selectedReturn?.returnNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Stato</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusColors[selectedReturn.status || 'requested']}>
                      {statusLabels[selectedReturn.status || '']}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Motivo</Label>
                  <p className="font-medium">{reasonLabels[selectedReturn.reason || ''] || selectedReturn.reason}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Data Richiesta</Label>
                  <p className="font-medium">{formatDate(selectedReturn.createdAt)}</p>
                </div>
                {selectedReturn.refundAmount && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Rimborso</Label>
                    <p className="font-medium text-green-600">{formatPrice(selectedReturn.refundAmount)}</p>
                  </div>
                )}
              </div>
              
              {selectedReturn.customerNotes && (
                <div>
                  <Label className="text-muted-foreground text-sm">Le tue note</Label>
                  <p className="mt-1 p-2 bg-muted rounded text-sm">{selectedReturn.customerNotes}</p>
                </div>
              )}
              
                            
              {selectedReturn.status === 'approved' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Reso approvato</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Spedisci il prodotto all'indirizzo indicato dal venditore.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedReturn.status === 'refunded' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">Rimborso completato</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Il rimborso di {formatPrice(selectedReturn.refundAmount)} è stato effettuato.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedReturn?.status === 'requested' && (
              <Button 
                variant="destructive"
                onClick={() => cancelMutation.mutate(selectedReturn.id)}
                disabled={cancelMutation.isPending}
                data-testid="button-cancel-return"
              >
                {cancelMutation.isPending ? "Annullamento..." : "Annulla richiesta"}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showNewReturnDialog} onOpenChange={setShowNewReturnDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Richiedi un reso</DialogTitle>
            <DialogDescription>
              Compila il modulo per richiedere il reso di un ordine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ordine *</Label>
              {eligibleOrders.length === 0 ? (
                <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  Non hai ordini idonei per il reso
                </div>
              ) : (
                <Select 
                  value={newReturnData.orderId} 
                  onValueChange={(v) => setNewReturnData(prev => ({ ...prev, orderId: v }))}
                >
                  <SelectTrigger data-testid="select-order">
                    <SelectValue placeholder="Seleziona un ordine" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleOrders.map(order => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.orderNumber} - {formatPrice(order.total)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div>
              <Label>Motivo del reso *</Label>
              <Select 
                value={newReturnData.reason} 
                onValueChange={(v) => setNewReturnData(prev => ({ ...prev, reason: v }))}
              >
                <SelectTrigger data-testid="select-reason">
                  <SelectValue placeholder="Seleziona un motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="defective">Prodotto difettoso</SelectItem>
                  <SelectItem value="wrong_item">Articolo errato</SelectItem>
                  <SelectItem value="not_as_described">Non conforme alla descrizione</SelectItem>
                  <SelectItem value="changed_mind">Ripensamento</SelectItem>
                  <SelectItem value="damaged_in_transit">Danneggiato durante il trasporto</SelectItem>
                  <SelectItem value="other">Altro motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Descrivi il problema</Label>
              <Textarea 
                value={newReturnData.customerNotes}
                onChange={(e) => setNewReturnData(prev => ({ ...prev, customerNotes: e.target.value }))}
                placeholder="Fornisci dettagli sul motivo del reso..."
                rows={4}
                data-testid="textarea-customer-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewReturnDialog(false)}>
              Annulla
            </Button>
            <Button 
              onClick={handleCreateReturn}
              disabled={createMutation.isPending || eligibleOrders.length === 0}
              data-testid="button-submit-return"
            >
              {createMutation.isPending ? "Invio..." : "Invia richiesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
