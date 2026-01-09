import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, FileText, RefreshCw, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { AdminEntityFilterSelector, AdminEntityType } from "@/components/hr/admin-entity-filter-selector";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaveRequest {
  id: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

const leaveTypeLabels: Record<string, string> = {
  vacation: "Ferie",
  sick: "Malattia",
  personal: "Permesso Personale",
  maternity: "Maternità",
  paternity: "Paternità",
  bereavement: "Lutto",
  other: "Altro",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "In Attesa",
  approved: "Approvata",
  rejected: "Rifiutata",
};

export default function AdminLeaveRequestsPage() {
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");

  const queryParams = new URLSearchParams();
  if (entityType !== "all" && selectedEntityId) {
    queryParams.set("entityType", entityType);
    queryParams.set("entityId", selectedEntityId);
  }
  const queryString = queryParams.toString();

  const { data: requests = [], isLoading, refetch } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/admin/hr/leave-requests", queryString],
    queryFn: async () => {
      const url = queryString 
        ? `/api/admin/hr/leave-requests?${queryString}` 
        : "/api/admin/hr/leave-requests";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Richieste Ferie/Permessi (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizzazione globale di tutte le richieste
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Aggiorna
        </Button>
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
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna richiesta trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} data-testid={`row-leave-request-${req.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{req.user?.fullName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{req.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {leaveTypeLabels[req.type] || req.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(req.startDate), "dd/MM/yyyy", { locale: it })}
                        {" - "}
                        {format(new Date(req.endDate), "dd/MM/yyyy", { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[req.status]}>
                        {statusLabels[req.status] || req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {req.notes || "-"}
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
