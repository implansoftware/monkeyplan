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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, Eye, RotateCcw, Package, CheckCircle, XCircle, AlertCircle, 
  Clock, Truck, Receipt, DollarSign, PackageX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SalesOrderReturn } from "@shared/schema";
import { useTranslation } from "react-i18next";

const statusLabels: Record<string, string> = {
  requested: "Richiesto",
  approved: t("repairs.status.approved"),
  rejected: t("b2b.status.cancelled"),
  shipped: t("b2b.status.shipped"),
  received: t("repairs.status.received"),
  refunded: "Rimborsato",
  partially_refunded: "Rimborsato parzialmente",
  cancelled: t("repairs.status.cancelled")
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  requested: "secondary",
  approved: "default",
  rejected: "destructive",
  shipped: "default",
  received: "default",
  refunded: "default",
  partially_refunded: "secondary",
  cancelled: "destructive"
};

const reasonLabels: Record<string, string> = {
  defective: "Difettoso",
  wrong_item: "Articolo errato",
  not_as_described: "Non conforme alla descrizione",
  changed_mind: "Ripensamento",
  damaged_in_transit: "Danneggiato in trasporto",
  other: t("common.other")
};

const refundMethodLabels: Record<string, string> = {
  original_method: "Metodo originale",
  bank_transfer: "Bonifico",
  store_credit: "Credito negozio",
  cash: t("pos.cash")
};

export default function ResellerSalesReturns() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReturn, setSelectedReturn] = useState<SalesOrderReturn | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updateData, setUpdateData] = useState<{
    status: string;
    internalNotes: string;
    refundMethod: string;
    refundAmount: string;
  }>({
    status: "",
    internalNotes: "",
    refundMethod: "",
    refundAmount: ""
  });
  
  const { data: returns, isLoading } = useQuery<SalesOrderReturn[]>({
    queryKey: ['/api/sales-returns', { status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set('status', statusFilter);
      const res = await fetch(`/api/sales-returns?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Errore nel caricamento resi');
      return res.json();
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      const res = await fetch(`/api/sales-returns/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Errore aggiornamento reso');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Reso aggiornato con successo" });
      queryClient.invalidateQueries({ queryKey: ['/api/sales-returns'] });
      setShowUpdateDialog(false);
      setSelectedReturn(null);
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const filteredReturns = returns?.filter(ret => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      ret.returnNumber?.toLowerCase().includes(searchLower) ||
      ret.reason?.toLowerCase().includes(searchLower)
    );
  }) || [];
  
  const stats = {
    total: returns?.length || 0,
    requested: returns?.filter(r => r.status === 'requested').length || 0,
    approved: returns?.filter(r => r.status === 'approved').length || 0,
    refunded: returns?.filter(r => ['refunded', 'partially_refunded'].includes(r.status!)).length || 0
  };
  
  const handleOpenUpdate = (ret: SalesOrderReturn) => {
    setSelectedReturn(ret);
    setUpdateData({
      status: ret.status || "",
      internalNotes: ret.internalNotes || "",
      refundMethod: ret.refundMethod || "",
      refundAmount: ret.refundAmount ? String(ret.refundAmount) : ""
    });
    setShowUpdateDialog(true);
  };
  
  const handleUpdate = () => {
    if (!selectedReturn) return;
    
    const updates: any = {
      status: updateData.status,
      internalNotes: updateData.internalNotes
    };
    
    if (updateData.refundMethod) {
      updates.refundMethod = updateData.refundMethod;
    }
    if (updateData.refundAmount) {
      updates.refundAmount = parseFloat(updateData.refundAmount);
    }
    if (['refunded', 'partially_refunded'].includes(updateData.status)) {
      updates.refundedAt = new Date().toISOString();
    }
    
    updateMutation.mutate({ id: selectedReturn.id, updates });
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
              <PackageX className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" data-testid="page-title">Resi Vendita</h1>
              <p className="text-white/80 text-sm">Gestione resi clienti</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <RotateCcw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totale Resi</p>
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
                <p className="text-sm text-muted-foreground">Da Gestire</p>
                <p className="text-2xl font-bold" data-testid="stat-requested">{stats.requested}</p>
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
                <p className="text-sm text-muted-foreground">Approvati</p>
                <p className="text-2xl font-bold" data-testid="stat-approved">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rimborsati</p>
                <p className="text-2xl font-bold" data-testid="stat-refunded">{stats.refunded}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cerca per numero reso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-status">
                <SelectValue placeholder={t("common.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                <SelectItem value="requested">Richiesto</SelectItem>
                <SelectItem value="approved">{t("repairs.status.approved")}</SelectItem>
                <SelectItem value="rejected">{t("b2b.status.cancelled")}</SelectItem>
                <SelectItem value="shipped">{t("b2b.status.shipped")}</SelectItem>
                <SelectItem value="received">{t("repairs.status.received")}</SelectItem>
                <SelectItem value="refunded">Rimborsato</SelectItem>
                <SelectItem value="partially_refunded">Rimborsato parzialmente</SelectItem>
                <SelectItem value="cancelled">{t("repairs.status.cancelled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("b2b.returnNumber")}</TableHead>
                  <TableHead>{t("warehouse.requestDate")}</TableHead>
                  <TableHead>{t("common.reason")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("hr.reimbursement")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("b2b.noReturnsFound")}</TableCell>
                  </TableRow>
                ) : (
                  filteredReturns.map(ret => (
                    <TableRow key={ret.id} data-testid={`row-return-${ret.id}`}>
                      <TableCell className="font-medium">{ret.returnNumber}</TableCell>
                      <TableCell>{formatDate(ret.createdAt)}</TableCell>
                      <TableCell>{reasonLabels[ret.reason || ''] || ret.reason}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[ret.status || 'requested']}>
                          {statusLabels[ret.status || 'requested']}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(ret.refundAmount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => { setSelectedReturn(ret); setShowDetailDialog(true); }}
                            data-testid={`button-view-${ret.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleOpenUpdate(ret)}
                            data-testid={`button-update-${ret.id}`}
                          >
                            Gestisci
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
      
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">{t("common.status")}</Label>
                  <p className="font-medium">{statusLabels[selectedReturn.status || '']}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">{t("common.reason")}</Label>
                  <p className="font-medium">{reasonLabels[selectedReturn.reason || ''] || selectedReturn.reason}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">{t("warehouse.requestDate")}</Label>
                  <p className="font-medium">{formatDate(selectedReturn.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">{t("hr.reimbursement")}</Label>
                  <p className="font-medium">{formatPrice(selectedReturn.refundAmount)}</p>
                </div>
              </div>
              {selectedReturn.customerNotes && (
                <div>
                  <Label className="text-muted-foreground text-sm">Note Cliente</Label>
                  <p className="mt-1 p-2 bg-muted rounded">{selectedReturn.customerNotes}</p>
                </div>
              )}
              {selectedReturn.internalNotes && (
                <div>
                  <Label className="text-muted-foreground text-sm">{t("common.internalNotes")}</Label>
                  <p className="mt-1 p-2 bg-muted rounded">{selectedReturn.internalNotes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>{t("common.close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestisci Reso</DialogTitle>
            <DialogDescription>
              {selectedReturn?.returnNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("common.status")}</Label>
              <Select value={updateData.status} onValueChange={(v) => setUpdateData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger data-testid="select-update-status">
                  <SelectValue placeholder={t("common.selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested">Richiesto</SelectItem>
                  <SelectItem value="approved">{t("repairs.status.approved")}</SelectItem>
                  <SelectItem value="rejected">{t("b2b.status.cancelled")}</SelectItem>
                  <SelectItem value="shipped">{t("b2b.status.shipped")}</SelectItem>
                  <SelectItem value="received">{t("repairs.status.received")}</SelectItem>
                  <SelectItem value="refunded">Rimborsato</SelectItem>
                  <SelectItem value="partially_refunded">Rimborsato parzialmente</SelectItem>
                  <SelectItem value="cancelled">{t("repairs.status.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {['refunded', 'partially_refunded'].includes(updateData.status) && (
              <>
                <div>
                  <Label>Metodo Rimborso</Label>
                  <Select value={updateData.refundMethod} onValueChange={(v) => setUpdateData(prev => ({ ...prev, refundMethod: v }))}>
                    <SelectTrigger data-testid="select-refund-method">
                      <SelectValue placeholder="Seleziona metodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="original_method">Metodo originale</SelectItem>
                      <SelectItem value="bank_transfer">Bonifico</SelectItem>
                      <SelectItem value="store_credit">Credito negozio</SelectItem>
                      <SelectItem value="cash">{t("pos.cash")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Importo Rimborso (EUR)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={updateData.refundAmount}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, refundAmount: e.target.value }))}
                    placeholder="0.00"
                    data-testid="input-refund-amount"
                  />
                </div>
              </>
            )}
            
            <div>
              <Label>{t("common.internalNotes")}</Label>
              <Textarea 
                value={updateData.internalNotes}
                onChange={(e) => setUpdateData(prev => ({ ...prev, internalNotes: e.target.value }))}
                placeholder="Aggiungi note interne..."
                data-testid="textarea-internal-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-update"
            >
              {updateMutation.isPending ? t("profile.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
