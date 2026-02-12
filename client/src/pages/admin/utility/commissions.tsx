import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UtilityCommission, InsertUtilityCommission, UtilityPractice } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, Coins, Pencil, Trash2, 
  ArrowLeft, CheckCircle2, Clock, XCircle, Calendar,
  Check, X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type CommissionStatus = "pending" | "accrued" | "invoiced" | "paid" | "cancelled";

const statusLabels: Record<CommissionStatus, string> = {
  pending: "In Attesa",
  accrued: "Maturata",
  invoiced: "Fatturata",
  paid: "Pagata",
  cancelled: "Annullata",
};

const statusColors: Record<CommissionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  accrued: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  invoiced: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusIcons: Record<CommissionStatus, typeof Clock> = {
  pending: Clock,
  accrued: CheckCircle2,
  invoiced: CheckCircle2,
  paid: CheckCircle2,
  cancelled: XCircle,
};

const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export default function AdminUtilityCommissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<UtilityCommission | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<CommissionStatus>("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingCommission, setRejectingCommission] = useState<UtilityCommission | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: commissions = [], isLoading } = useQuery<UtilityCommission[]>({
    queryKey: ["/api/utility/commissions", yearFilter],
    queryFn: async () => {
      const res = await fetch(`/api/utility/commissions?periodYear=${yearFilter}`);
      if (!res.ok) throw new Error("Failed to fetch commissions");
      return res.json();
    },
  });

  const { data: practices = [] } = useQuery<UtilityPractice[]>({
    queryKey: ["/api/utility/practices"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertUtilityCommission) => {
      const res = await apiRequest("POST", "/api/utility/commissions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      setDialogOpen(false);
      setEditingCommission(null);
      toast({ title: "Commissione creata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertUtilityCommission> }) => {
      const res = await apiRequest("PATCH", `/api/utility/commissions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      setDialogOpen(false);
      setEditingCommission(null);
      toast({ title: "Commissione aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/commissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      toast({ title: "Commissione eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/utility/commissions/${id}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      toast({ title: "Commissione approvata", description: "La commissione è stata approvata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/utility/commissions/${id}/reject`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      setRejectDialogOpen(false);
      setRejectingCommission(null);
      setRejectReason("");
      toast({ title: "Commissione rifiutata", description: "La commissione è stata rifiutata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleApprove = (commission: UtilityCommission) => {
    if (confirm("Sei sicuro di voler approvare questa commissione?")) {
      approveMutation.mutate(commission.id);
    }
  };

  const handleReject = (commission: UtilityCommission) => {
    setRejectingCommission(commission);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectingCommission || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: rejectingCommission.id, reason: rejectReason });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertUtilityCommission = {
      practiceId: formData.get("practiceId") as string,
      periodMonth: parseInt(formData.get("periodMonth") as string),
      periodYear: parseInt(formData.get("periodYear") as string),
      amountCents: Math.round(parseFloat(formData.get("amountCents") as string) * 100),
      status: selectedStatus,
      notes: formData.get("notes") as string || undefined,
    };

    if (editingCommission) {
      updateMutation.mutate({ id: editingCommission.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (commission: UtilityCommission) => {
    setEditingCommission(commission);
    setSelectedStatus(commission.status);
    setDialogOpen(true);
  };

  const handleNewCommission = () => {
    setEditingCommission(null);
    setSelectedStatus("pending");
    setDialogOpen(true);
  };

  const filteredCommissions = commissions.filter((commission) => {
    const practice = practices.find(p => p.id === commission.practiceId);
    const matchesSearch = practice?.practiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ?? true;
    const matchesStatus = statusFilter === "all" || commission.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPending = filteredCommissions
    .filter(c => c.status === "pending")
    .reduce((sum, c) => sum + c.amountCents, 0);
  const totalPaid = filteredCommissions
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + c.amountCents, 0);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: "Gennaio" },
    { value: 2, label: "Febbraio" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Aprile" },
    { value: 5, label: "Maggio" },
    { value: 6, label: "Giugno" },
    { value: 7, label: "Luglio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Settembre" },
    { value: 10, label: "Ottobre" },
    { value: 11, label: "Novembre" },
    { value: 12, label: "Dicembre" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/utility">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Compensi Utility</h1>
              <p className="text-sm text-muted-foreground">Gestisci commissioni e pagamenti</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-total-pending">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Attesa</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredCommissions.filter(c => c.status === "pending").length} commissioni
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-paid">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredCommissions.filter(c => c.status === "paid").length} commissioni
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Anno</CardTitle>
            <Coins className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredCommissions.reduce((sum, c) => sum + c.amountCents, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredCommissions.length} commissioni nel {yearFilter}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap items-center gap-2 flex-wrap">
            <div className="flex flex-wrap items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per pratica..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
                data-testid="input-search-commissions"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={yearFilter.toString()} 
              onValueChange={(v) => setYearFilter(parseInt(v))}
            >
              <SelectTrigger className="w-24" data-testid="select-year-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleNewCommission} data-testid="button-new-commission">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Commissione
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCommissions.length === 0 ? (
            <div className="text-center py-8">
              <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nessuna commissione trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pratica</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => {
                  const practice = practices.find(p => p.id === commission.practiceId);
                  const StatusIcon = statusIcons[commission.status];
                  return (
                    <TableRow 
                      key={commission.id} 
                      data-testid={`row-commission-${commission.id}`}
                      className="cursor-pointer"
                      onClick={() => setLocation(`/admin/utility/commissions/${commission.id}`)}
                    >
                      <TableCell className="font-medium text-primary">
                        {practice?.practiceNumber || commission.practiceId.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {months.find(m => m.value === commission.periodMonth)?.label} {commission.periodYear}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(commission.amountCents)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[commission.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[commission.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {commission.paidAt 
                          ? format(new Date(commission.paidAt), "dd/MM/yyyy", { locale: it })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {commission.status === "pending" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleApprove(commission)}
                                disabled={approveMutation.isPending}
                                className="text-green-600"
                                data-testid={`button-approve-${commission.id}`}
                                title="Approva"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleReject(commission)}
                                disabled={rejectMutation.isPending}
                                className="text-red-600"
                                data-testid={`button-reject-${commission.id}`}
                                title="Rifiuta"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEdit(commission)}
                            data-testid={`button-edit-${commission.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (confirm("Sei sicuro di voler eliminare questa commissione?")) {
                                deleteMutation.mutate(commission.id);
                              }
                            }}
                            data-testid={`button-delete-${commission.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCommission ? "Modifica Commissione" : "Nuova Commissione"}
            </DialogTitle>
            <DialogDescription>
              {editingCommission 
                ? "Modifica i dati della commissione."
                : "Registra una nuova commissione per una pratica utility."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="practiceId">Pratica *</Label>
              <Select 
                name="practiceId" 
                defaultValue={editingCommission?.practiceId}
                required
              >
                <SelectTrigger data-testid="select-practice">
                  <SelectValue placeholder="Seleziona pratica" />
                </SelectTrigger>
                <SelectContent>
                  {practices.filter(p => p.status === "completata").map((practice) => (
                    <SelectItem key={practice.id} value={practice.id}>
                      {practice.practiceNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodMonth">Mese *</Label>
                <Select 
                  name="periodMonth" 
                  defaultValue={editingCommission?.periodMonth?.toString() || (new Date().getMonth() + 1).toString()}
                  required
                >
                  <SelectTrigger data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodYear">Anno *</Label>
                <Select 
                  name="periodYear" 
                  defaultValue={editingCommission?.periodYear?.toString() || currentYear.toString()}
                  required
                >
                  <SelectTrigger data-testid="select-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountCents">Importo (EUR) *</Label>
                <Input
                  id="amountCents"
                  name="amountCents"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingCommission?.amountCents 
                    ? (editingCommission.amountCents / 100).toFixed(2) 
                    : ""}
                  data-testid="input-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select 
                  value={selectedStatus}
                  onValueChange={(v) => setSelectedStatus(v as CommissionStatus)}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                defaultValue={editingCommission?.notes || ""}
                data-testid="input-notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                data-testid="button-cancel"
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save"
              >
                {editingCommission ? "Salva Modifiche" : "Crea Commissione"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rifiuta Commissione</DialogTitle>
            <DialogDescription>
              Inserisci la motivazione del rifiuto per la commissione di{" "}
              {rejectingCommission && formatCurrency(rejectingCommission.amountCents)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Motivazione *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Inserisci il motivo del rifiuto..."
                rows={3}
                data-testid="input-reject-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setRejectDialogOpen(false)}
                data-testid="button-cancel-reject"
              >
                Annulla
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                data-testid="button-confirm-reject"
              >
                Rifiuta Commissione
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
