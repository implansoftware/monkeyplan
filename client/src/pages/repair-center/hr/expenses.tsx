import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Receipt, Plus, ArrowLeft, Check, X, Eye, Pencil, Upload, Download, Loader2, Euro } from "lucide-react";
import { Label } from "@/components/ui/label";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TeamMember {
  id: string;
  fullName: string;
  role: string;
}

interface ExpenseReport {
  id: string;
  userId: string;
  title: string;
  description?: string;
  totalAmount: number;
  status: string;
  submittedAt?: string;
  user?: { fullName: string };
  receiptUrl?: string | null;
  receiptFileName?: string | null;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Bozza", variant: "outline" },
  pending: { label: "In Attesa", variant: "secondary" },
  approved: { label: "Approvata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" },
  paid: { label: "Pagata", variant: "default" }
};

export default function RepairCenterHrExpenses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ExpenseReport | null>(null);
  const [newReport, setNewReport] = useState({ title: "", description: "", totalAmount: "", userId: "" });
  const [newReportFile, setNewReportFile] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", totalAmount: "" });
  const { toast } = useToast();

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/repair-center/team"],
  });

  const { data: expenseReports = [], isLoading } = useQuery<ExpenseReport[]>({
    queryKey: ["/api/repair-center/hr/expense-reports"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/repair-center/hr/expense-reports", {
        title: data.title,
        description: data.description,
        userId: data.userId,
        status: 'draft',
        totalAmount: parseInt(data.totalAmount) || 0
      });
      const report = await res.json();
      if (data.file && report.id) {
        const formData = new FormData();
        formData.append('file', data.file);
        await fetch(`/api/repair-center/hr/expense-reports/${report.id}/receipt`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
      }
      return report;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/expense-reports"] });
      setDialogOpen(false);
      setNewReport({ title: "", description: "", totalAmount: "", userId: "" });
      setNewReportFile(null);
      toast({ title: "Nota spese creata", description: "La nota spese è stata creata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/repair-center/hr/expense-reports/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/expense-reports"] });
      toast({ title: "Stato aggiornato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/repair-center/hr/expense-reports/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/expense-reports"] });
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
      totalAmount: report.totalAmount.toString()
    });
    setEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
  };

  const [uploadingReportId, setUploadingReportId] = useState<string | null>(null);

  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ reportId, file }: { reportId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/repair-center/hr/expense-reports/${reportId}/receipt`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/expense-reports"] });
      setUploadingReportId(null);
      toast({ title: "Allegato caricato" });
    },
    onError: (error: any) => {
      setUploadingReportId(null);
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const downloadReceiptMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`/api/repair-center/hr/expense-reports/${reportId}/receipt`, {
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
      return apiRequest("DELETE", `/api/repair-center/hr/expense-reports/${reportId}/receipt`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/expense-reports"] });
      toast({ title: "Allegato rimosso" });
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

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-rc-hr-expenses">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <Receipt className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">Note Spese</h1>
              <p className="text-emerald-100">Gestione note spese e trasferte</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard HR
              </Button>
            </Link>
            <Button onClick={() => setDialogOpen(true)} className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Nota Spese
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Note Spese</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : expenseReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna nota spese presente
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="hidden md:table-cell">Allegato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.user?.fullName || "N/A"}</TableCell>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{report.submittedAt ? format(new Date(report.submittedAt), "dd/MM/yyyy", { locale: it }) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[report.status]?.variant || "secondary"}>
                        {statusLabels[report.status]?.label || report.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap items-center gap-1">
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
                            {(report.status === "draft" || report.status === "pending") && (
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
                        ) : (report.status === "draft" || report.status === "pending") ? (
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
                        {(report.status === "draft" || report.status === "pending") && (
                          <Button size="sm" variant="ghost" onClick={() => openEditDialog(report)} title="Modifica" data-testid={`button-edit-${report.id}`}>
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {report.status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: report.id, status: "pending" })}>
                            Invia
                          </Button>
                        )}
                        {report.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate({ id: report.id, status: "approved" })} title="Approva">
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate({ id: report.id, status: "rejected" })} title="Rifiuta">
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {report.status === "approved" && (
                          <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: report.id, status: "paid" })}>
                            Segna Pagata
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
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
            <div>
              <label className="text-sm font-medium">Dipendente</label>
              <Select value={newReport.userId} onValueChange={(value) => setNewReport({ ...newReport, userId: value })}>
                <SelectTrigger data-testid="select-expense-employee">
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Titolo</label>
              <Input value={newReport.title} onChange={(e) => setNewReport({ ...newReport, title: e.target.value })} placeholder="Es. Trasferta Milano" />
            </div>
            <div>
              <label className="text-sm font-medium">Importo Totale</label>
              <Input type="number" step="0.01" value={newReport.totalAmount} onChange={(e) => setNewReport({ ...newReport, totalAmount: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrizione (opzionale)</label>
              <Textarea value={newReport.description} onChange={(e) => setNewReport({ ...newReport, description: e.target.value })} placeholder="Dettagli della spesa..." />
            </div>
            <div className="space-y-2">
              <Label>Allegato (opzionale)</Label>
              <div className="flex flex-wrap items-center gap-2">
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
            <Button onClick={() => createMutation.mutate({ ...newReport, totalAmount: parseFloat(newReport.totalAmount) || 0, file: newReportFile })} disabled={createMutation.isPending || !newReport.title || !newReport.userId}>
              {createMutation.isPending ? "Creazione..." : "Crea Nota Spese"}
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
            <div>
              <label className="text-sm font-medium">Titolo</label>
              <Input 
                value={editForm.title} 
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                placeholder="Es. Trasferta Milano" 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Importo Totale (EUR)</label>
              <Input 
                type="number" 
                step="0.01" 
                value={editForm.totalAmount} 
                onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })} 
                placeholder="0.00" 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrizione (opzionale)</label>
              <Textarea 
                value={editForm.description} 
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                placeholder="Dettagli della spesa..." 
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
                  totalAmount: parseFloat(editForm.totalAmount) || 0 
                } 
              })} 
              disabled={editMutation.isPending || !editForm.title}
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
