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
  FileText
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ExpenseReport {
  id: string;
  userId: string;
  title: string;
  description?: string;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  user?: { fullName: string };
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
  const [newReport, setNewReport] = useState({
    title: "",
    description: ""
  });
  const { toast } = useToast();

  const { data: reports = [], isLoading } = useQuery<ExpenseReport[]>({
    queryKey: ["/api/reseller/hr/expense-reports"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/reseller/hr/expense-reports", {
        ...data,
        status: 'draft',
        totalAmount: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports"] });
      setDialogOpen(false);
      setNewReport({ title: "", description: "" });
      toast({ title: "Nota spese creata", description: "La nota spese è stata creata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/reseller/hr/expense-reports/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/expense-reports"] });
      toast({ title: "Stato aggiornato", description: "Lo stato della nota spese è stato aggiornato." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

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
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-expense">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Nota Spese
            </Button>
          </div>
        </div>
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
                        {report.submittedAt ? format(new Date(report.submittedAt), "dd/MM/yyyy") : '-'}
                      </TableCell>
                      <TableCell>
                        {report.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-600"
                              onClick={() => updateMutation.mutate({ id: report.id, status: 'approved' })}
                              data-testid={`button-approve-${report.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => updateMutation.mutate({ id: report.id, status: 'rejected' })}
                              data-testid={`button-reject-${report.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
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
              <Label>Titolo</Label>
              <Input
                value={newReport.title}
                onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                placeholder="es. Trasferta Milano"
                data-testid="input-title"
              />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => createMutation.mutate(newReport)}
              disabled={!newReport.title || createMutation.isPending}
              data-testid="button-create-expense"
            >
              {createMutation.isPending ? "Creazione..." : "Crea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
