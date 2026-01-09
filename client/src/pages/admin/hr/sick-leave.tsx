import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Clock, User, RefreshCw } from "lucide-react";
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
  endDate: string | null;
  protocolNumber?: string | null;
  certificateRequired: boolean;
  certificateUploaded: boolean;
  certificateDeadline?: string | null;
  validatedBy?: string | null;
  validatedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: {
    fullName: string;
  } | null;
}

// Derive status from certificateUploaded and validatedAt
function getStatus(sl: SickLeave): "pending" | "uploaded" | "validated" {
  if (sl.validatedAt) return "validated";
  if (sl.certificateUploaded) return "uploaded";
  return "pending";
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  uploaded: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  validated: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const statusLabels: Record<string, string> = {
  pending: "In Attesa Certificato",
  uploaded: "Certificato Caricato",
  validated: "Verificata",
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
                        <p className="font-medium">{sl.user?.fullName || "N/A"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(sl.startDate), "dd/MM/yyyy", { locale: it })}
                        {sl.endDate && (
                          <>
                            {" - "}
                            {format(new Date(sl.endDate), "dd/MM/yyyy", { locale: it })}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {sl.protocolNumber || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getStatus(sl);
                        return (
                          <Badge className={statusColors[status]}>
                            {statusLabels[status]}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      {sl.certificateUploaded ? (
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                          Caricato
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Non caricato</span>
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
