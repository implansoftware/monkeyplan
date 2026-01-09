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
import { Receipt, Plus, ArrowLeft, Check, X, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ExpenseReport {
  id: string;
  userId: string;
  title: string;
  description?: string;
  totalAmount: number;
  status: string;
  submittedAt?: string;
  user?: { fullName: string };
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Bozza", variant: "outline" },
  submitted: { label: "Inviata", variant: "secondary" },
  approved: { label: "Approvata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" },
  paid: { label: "Pagata", variant: "default" }
};

export default function RepairCenterHrExpenses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newReport, setNewReport] = useState({ title: "", description: "", totalAmount: "" });
  const { toast } = useToast();

  const { data: expenseReports = [], isLoading } = useQuery<ExpenseReport[]>({
    queryKey: ["/api/repair-center/hr/expense-reports"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/repair-center/hr/expense-reports", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/expense-reports"] });
      setDialogOpen(false);
      setNewReport({ title: "", description: "", totalAmount: "" });
      toast({ title: "Nota spese creata", description: "La nota spese è stata creata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
  };

  return (
    <div className="space-y-6" data-testid="page-rc-hr-expenses">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/5 via-amber-500/10 to-slate-100 dark:from-amber-500/10 dark:via-amber-500/5 dark:to-slate-900 p-6 border">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Rimborsi Spese</h1>
                <p className="text-muted-foreground">Gestione note spese e trasferte</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard HR
              </Button>
            </Link>
            <Button onClick={() => setDialogOpen(true)}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.user?.fullName || "N/A"}</TableCell>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>{formatCurrency(report.totalAmount)}</TableCell>
                    <TableCell>{report.submittedAt ? format(new Date(report.submittedAt), "dd/MM/yyyy", { locale: it }) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[report.status]?.variant || "secondary"}>
                        {statusLabels[report.status]?.label || report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {report.status === "submitted" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: report.id, status: "approved" })}>
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: report.id, status: "rejected" })}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => createMutation.mutate({ ...newReport, totalAmount: parseFloat(newReport.totalAmount) || 0 })} disabled={createMutation.isPending || !newReport.title}>
              Crea Nota Spese
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
