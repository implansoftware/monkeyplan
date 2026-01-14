import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import {
  Receipt,
  Plus,
  ArrowLeft,
  Check,
  X,
  Clock,
  Filter,
  Euro,
  FileText,
  User,
  Send,
  Trash2,
  Eye,
  Pencil,
  Upload,
  Download,
  Paperclip,
  Loader2
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { EntityFilterSelector, EntityType, useEntityFilter } from "@/components/hr/entity-filter-selector";

interface ExpenseReport {
  id: string;
  userId: string;
  title: string;
  description?: string;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  user?: { fullName: string };
  receiptUrl?: string | null;
  receiptFileName?: string | null;
}

interface TeamMember {
  id: string;
  fullName: string;
  role: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Bozza", variant: "outline" },
  pending: { label: "In Attesa", variant: "secondary" },
  approved: { label: "Approvata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" },
  paid: { label: "Pagata", variant: "default" },
};

export default function HrExpenses() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ExpenseReport | null>(null);
  const [entityType, setEntityType] = useState<EntityType>("own");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const { buildQueryParams, isReadOnly } = useEntityFilter();
  const [newReport, setNewReport] = useState({
    title: "",
    description: "",
    userId: "",
    amountEuro: ""
  });
  const [newReportFile, setNewReportFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    amountEuro: ""
  });
  const { toast } = useToast();

  const readOnly = isReadOnly(entityType, selectedEntityId);
  const queryParams = buildQueryParams(entityType, selectedEntityId);

  const { data: reports = [], isLoading } = useQuery<ExpenseReport[]>({
    queryKey: ["/api/reseller/hr/expense-reports", entityType, selectedEntityId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/hr/expense-reports${queryParams}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  const { data: employees = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/reseller/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const amountCents = Math.round(parseFloat(data.amountEuro || "0") * 100);
      const res = await apiRequest("POST", "/api/reseller/hr/expense-reports", {
        title: data.title,
        description: data.description,
        userId: data.userId,
        status: 'draft',
        totalAmount: amountCents
      });
      const report = await res.json();
      if (data.file && report.id) {
        const formData = new FormData();
        formData.append('file', data.file);
        await fetch(`/api/reseller/hr/expense-reports/${report.id}/receipt`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
      }
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports", entityType, selectedEntityId] });
      setDialogOpen(false);
      setNewReport({ title: "", description: "", userId: "", amountEuro: "" });
      setNewReportFile(null);
      toast({ title: "Nota spese creata", description: "La nota spese è stata creata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/reseller/hr/expense-reports/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports", entityType, selectedEntityId] });
      toast({ title: "Stato aggiornato", description: "Lo stato della nota spese è stato aggiornato." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/reseller/hr/expense-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports", entityType, selectedEntityId] });
      setEditDialogOpen(false);
      setEditingReport(null);
      toast({ title: "Nota spese modificata", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const openEditDialog = (report: ExpenseReport) => {
    setEditingReport(report);
    setEditForm({
      title: report.title,
      description: report.description || "",
      amountEuro: ((report.totalAmount || 0) / 100).toFixed(2)
    });
    setEditDialogOpen(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/reseller/hr/expense-reports/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports", entityType, selectedEntityId] });
      toast({ title: "Nota eliminata", description: "La nota spese è stata eliminata." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const [uploadingReportId, setUploadingReportId] = useState<string | null>(null);

  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ reportId, file }: { reportId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/reseller/hr/expense-reports/${reportId}/receipt`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Errore upload');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports", entityType, selectedEntityId] });
      setUploadingReportId(null);
      toast({ title: "Allegato caricato", description: "Il giustificativo è stato caricato con successo." });
    },
    onError: (error: any) => {
      setUploadingReportId(null);
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const downloadReceiptMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`/api/reseller/hr/expense-reports/${reportId}/receipt`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Errore download');
      return res.json();
    },
    onSuccess: (data) => {
      window.open(data.signedUrl, '_blank');
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: async (reportId: string) => {
      return apiRequest("DELETE", `/api/reseller/hr/expense-reports/${reportId}/receipt`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports", entityType, selectedEntityId] });
      toast({ title: "Allegato rimosso", description: "Il giustificativo è stato rimosso." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const handleFileUpload = (reportId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingReportId(reportId);
      uploadReceiptMutation.mutate({ reportId, file });
    }
    event.target.value = '';
  };

  const filteredReports = reports.filter(rep => {
    if (statusFilter !== "all" && rep.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const totalPending = reports
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  return (
    <div className="space-y-6" data-testid="page-hr-expenses">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-slate-100 dark:from-amber-500/10 dark:via-amber-500/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-expenses-title">Rimborsi Spese</h1>
                <p className="text-muted-foreground">Gestione note spese e trasferte</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/hr">
              <Button variant="outline" data-testid="button-back-to-hr">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna a HR
              </Button>
            </Link>
            {!readOnly && (
              <Button onClick={() => setDialogOpen(true)} data-testid="button-new-expense">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Nota Spese
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <EntityFilterSelector
            entityType={entityType}
            setEntityType={setEntityType}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
        </div>
        {readOnly && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <Eye className="h-4 w-4" />
            <span>Modalità sola lettura - Visualizzazione dati esterni</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card data-testid="card-pending-count">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Note spese in attesa</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-pending-total">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Euro className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(totalPending / 100).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Totale da approvare</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-expenses-list">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Note Spese
              </CardTitle>
              <CardDescription>Elenco di tutte le note spese</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="draft">Bozze</SelectItem>
                <SelectItem value="pending">In Attesa</SelectItem>
                <SelectItem value="approved">Approvate</SelectItem>
                <SelectItem value="rejected">Rifiutate</SelectItem>
                <SelectItem value="paid">Pagate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nessuna nota spese trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Allegato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => {
                  const statusInfo = statusLabels[report.status] || statusLabels.draft;
                  return (
                    <TableRow key={report.id} data-testid={`row-expense-${report.id}`}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>{report.user?.fullName || '-'}</TableCell>
                      <TableCell>{((report.totalAmount || 0) / 100).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {report.status === 'draft' 
                          ? (report.createdAt ? format(new Date(report.createdAt), "dd/MM/yyyy") : '-')
                          : (report.submittedAt ? format(new Date(report.submittedAt), "dd/MM/yyyy") : (report.createdAt ? format(new Date(report.createdAt), "dd/MM/yyyy") : '-'))
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {report.receiptUrl ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => downloadReceiptMutation.mutate(report.id)}
                                title={`Scarica: ${report.receiptFileName}`}
                                data-testid={`button-download-receipt-${report.id}`}
                              >
                                <Download className="h-4 w-4 text-emerald-600" />
                              </Button>
                              {!readOnly && (report.status === 'draft' || report.status === 'pending') && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteReceiptMutation.mutate(report.id)}
                                  title="Rimuovi allegato"
                                  data-testid={`button-delete-receipt-${report.id}`}
                                >
                                  <X className="h-4 w-4 text-orange-600" />
                                </Button>
                              )}
                              <span className="text-xs text-muted-foreground max-w-[100px] truncate" title={report.receiptFileName || ''}>
                                {report.receiptFileName}
                              </span>
                            </>
                          ) : !readOnly && (report.status === 'draft' || report.status === 'pending') ? (
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                className="hidden"
                                onChange={(e) => handleFileUpload(report.id, e)}
                                data-testid={`input-upload-receipt-${report.id}`}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                asChild
                                disabled={uploadingReportId === report.id}
                                title="Carica giustificativo"
                              >
                                <span>
                                  {uploadingReportId === report.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4 text-blue-600" />
                                  )}
                                </span>
                              </Button>
                            </label>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(report.status === 'draft' || report.status === 'pending') && !readOnly && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(report)}
                              title="Modifica"
                              data-testid={`button-edit-${report.id}`}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          {report.status === 'draft' && !readOnly && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'pending' })}
                                title="Invia per approvazione"
                                data-testid={`button-submit-${report.id}`}
                              >
                                <Send className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(report.id)}
                                title="Elimina"
                                data-testid={`button-delete-${report.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {report.status === 'pending' && !readOnly && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'approved' })}
                                title="Approva"
                                data-testid={`button-approve-${report.id}`}
                              >
                                <Check className="h-4 w-4 text-emerald-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'rejected' })}
                                title="Rifiuta"
                                data-testid={`button-reject-${report.id}`}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Nota Spese</DialogTitle>
            <DialogDescription>Crea una nuova nota spese</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dipendente Richiedente *</Label>
              <Select 
                value={newReport.userId} 
                onValueChange={(v) => setNewReport({ ...newReport, userId: v })}
              >
                <SelectTrigger data-testid="select-employee">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id} data-testid={`option-employee-${emp.id}`}>
                      {emp.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Titolo *</Label>
              <Input
                value={newReport.title}
                onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                placeholder="es. Trasferta Milano"
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Importo Totale (EUR) *</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newReport.amountEuro}
                  onChange={(e) => setNewReport({ ...newReport, amountEuro: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-amount"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrizione (opzionale)</Label>
              <Textarea
                value={newReport.description}
                onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                placeholder="Descrizione della nota spese..."
                data-testid="input-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Allegato (opzionale)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setNewReportFile(e.target.files?.[0] || null)}
                  data-testid="input-receipt-file"
                  className="flex-1"
                />
                {newReportFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setNewReportFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {newReportFile && (
                <p className="text-xs text-muted-foreground">
                  File selezionato: {newReportFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => createMutation.mutate({ ...newReport, file: newReportFile })}
              disabled={!newReport.title || !newReport.userId || !newReport.amountEuro || parseFloat(newReport.amountEuro) <= 0 || createMutation.isPending}
              data-testid="button-create-expense"
            >
              {createMutation.isPending ? "Creazione..." : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Nota Spese</DialogTitle>
            <DialogDescription>Modifica i dati della nota spese di {editingReport?.user?.fullName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titolo *</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="es. Trasferta Milano"
                data-testid="input-edit-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Importo Totale (EUR) *</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.amountEuro}
                  onChange={(e) => setEditForm({ ...editForm, amountEuro: e.target.value })}
                  placeholder="0.00"
                  className="pl-9"
                  data-testid="input-edit-amount"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrizione (opzionale)</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descrizione della nota spese..."
                data-testid="input-edit-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => editingReport && editMutation.mutate({ 
                id: editingReport.id, 
                data: { 
                  title: editForm.title, 
                  description: editForm.description, 
                  totalAmount: Math.round(parseFloat(editForm.amountEuro || "0") * 100)
                } 
              })}
              disabled={!editForm.title || !editForm.amountEuro || parseFloat(editForm.amountEuro) <= 0 || editMutation.isPending}
              data-testid="button-save-expense-edit"
            >
              {editMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
