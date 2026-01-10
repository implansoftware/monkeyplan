import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Clock, User, RefreshCw, Euro, Pencil } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { AdminEntityFilterSelector, AdminEntityType } from "@/components/hr/admin-entity-filter-selector";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpenseReport {
  id: string;
  userId: string;
  reportNumber?: string | null;
  title: string;
  description?: string | null;
  totalAmount: number;
  status: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
  };
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  submitted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const statusLabels: Record<string, string> = {
  draft: "Bozza",
  submitted: "Inviata",
  approved: "Approvata",
  rejected: "Rifiutata",
  paid: "Pagata",
};

export default function AdminExpensesPage() {
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ExpenseReport | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    totalAmount: ""
  });
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  if (entityType !== "all" && selectedEntityId) {
    queryParams.set("entityType", entityType);
    queryParams.set("entityId", selectedEntityId);
  }
  const queryString = queryParams.toString();

  const { data: reports = [], isLoading, refetch } = useQuery<ExpenseReport[]>({
    queryKey: ["/api/admin/hr/expense-reports", queryString],
    queryFn: async () => {
      const url = queryString 
        ? `/api/admin/hr/expense-reports?${queryString}` 
        : "/api/admin/hr/expense-reports";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  const totalAmount = reports.reduce((sum, r) => sum + Number(r.totalAmount), 0);

  const editMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string; totalAmount: number }) => {
      return apiRequest("PATCH", `/api/admin/hr/expense-reports/${data.id}`, {
        title: data.title,
        description: data.description || null,
        totalAmount: data.totalAmount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hr/expense-reports", queryString] });
      setEditDialogOpen(false);
      setEditingReport(null);
      toast({ title: "Nota spese aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore durante l'aggiornamento", variant: "destructive" });
    }
  });

  const openEditDialog = (report: ExpenseReport) => {
    setEditingReport(report);
    setEditForm({
      title: report.title,
      description: report.description || "",
      totalAmount: String(report.totalAmount)
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingReport) return;
    const amount = parseFloat(editForm.totalAmount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Importo non valido", variant: "destructive" });
      return;
    }
    editMutation.mutate({
      id: editingReport.id,
      title: editForm.title,
      description: editForm.description,
      totalAmount: amount
    });
  };

  const canEdit = (status: string) => status === "draft" || status === "submitted";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Note Spese (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizzazione globale di tutte le note spese
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Totale</p>
            <p className="text-xl font-bold flex items-center gap-1">
              <Euro className="h-5 w-5" />
              {totalAmount.toFixed(2)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <AdminEntityFilterSelector
            entityType={entityType}
            setEntityType={setEntityType}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna nota spese trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Titolo</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Data Creazione</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Descrizione</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((rep) => (
                  <TableRow key={rep.id} data-testid={`row-expense-${rep.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{rep.user?.fullName || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{rep.title}</span>
                      {rep.reportNumber && (
                        <p className="text-xs text-muted-foreground">#{rep.reportNumber}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium flex items-center gap-1">
                        <Euro className="h-3 w-3" />
                        {Number(rep.totalAmount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(rep.createdAt), "dd/MM/yyyy", { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[rep.status]}>
                        {statusLabels[rep.status] || rep.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {rep.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {canEdit(rep.status) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(rep)}
                          data-testid={`button-edit-expense-${rep.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Nota Spese</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della nota spese
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titolo</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Titolo della nota spese..."
                data-testid="input-edit-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Importo Totale (€)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={editForm.totalAmount}
                onChange={(e) => setEditForm({ ...editForm, totalAmount: e.target.value })}
                placeholder="0.00"
                data-testid="input-edit-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrizione</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Descrizione della spesa..."
                data-testid="textarea-edit-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending} data-testid="button-save-edit">
              {editMutation.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
