import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Clock, User, FileText, RefreshCw, Download } from "lucide-react";
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

interface SickLeave {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
  certificateUrl?: string;
  protocolNumber?: string;
  notes?: string;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  };
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "In Attesa",
  approved: "Verificata",
  rejected: "Non Valida",
};

export default function AdminSickLeavePage() {
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");

  const queryParams = new URLSearchParams();
  if (entityType !== "all" && selectedEntityId) {
    queryParams.set("entityType", entityType);
    queryParams.set("entityId", selectedEntityId);
  }
  const queryString = queryParams.toString();

  const { data: sickLeaves = [], isLoading, refetch } = useQuery<SickLeave[]>({
    queryKey: ["/api/admin/hr/sick-leaves", queryString],
    queryFn: async () => {
      const url = queryString 
        ? `/api/admin/hr/sick-leaves?${queryString}` 
        : "/api/admin/hr/sick-leaves";
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
            <Stethoscope className="h-6 w-6" />
            Malattie (Admin)
          </h1>
          <p className="text-muted-foreground">
            Visualizzazione globale di tutte le malattie registrate
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
          ) : sickLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna malattia registrata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Protocollo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Certificato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sickLeaves.map((sl) => (
                  <TableRow key={sl.id} data-testid={`row-sick-leave-${sl.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{sl.user?.fullName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{sl.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(sl.startDate), "dd/MM/yyyy", { locale: it })}
                        {" - "}
                        {format(new Date(sl.endDate), "dd/MM/yyyy", { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {sl.protocolNumber || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[sl.status]}>
                        {statusLabels[sl.status] || sl.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sl.certificateUrl ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={sl.certificateUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            Scarica
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
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
