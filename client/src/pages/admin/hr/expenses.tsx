import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Clock, User, RefreshCw, Euro } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { AdminEntityFilterSelector, AdminEntityType } from "@/components/hr/admin-entity-filter-selector";
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
