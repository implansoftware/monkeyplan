import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, Clock, User, RefreshCw, Download, Pencil } from "lucide-react";
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
import { useTranslation } from "react-i18next";

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
  certificate?: {
    id: string;
    fileName: string;
    fileUrl: string;
  } | null;
}

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
  const { t } = useTranslation();
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSickLeave, setEditingSickLeave] = useState<SickLeave | null>(null);
  const [editForm, setEditForm] = useState({
    startDate: "",
    endDate: "",
    protocolNumber: "",
    notes: ""
  });
  const { toast } = useToast();

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

  const editMutation = useMutation({
    mutationFn: async (data: { id: string; startDate: string; endDate: string; protocolNumber: string; notes: string }) => {
      return apiRequest("PATCH", `/api/admin/hr/sick-leaves/${data.id}`, {
        startDate: data.startDate,
        endDate: data.endDate || null,
        protocolNumber: data.protocolNumber || null,
        notes: data.notes || null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hr/sick-leaves", queryString] });
      setEditDialogOpen(false);
      setEditingSickLeave(null);
      toast({ title: t("hr.sickLeaveUpdated") });
    },
    onError: () => {
      toast({ title: t("hr.updateError"), variant: "destructive" });
    }
  });

  const openEditDialog = (sickLeave: SickLeave) => {
    setEditingSickLeave(sickLeave);
    setEditForm({
      startDate: sickLeave.startDate.split("T")[0],
      endDate: sickLeave.endDate ? sickLeave.endDate.split("T")[0] : "",
      protocolNumber: sickLeave.protocolNumber || "",
      notes: sickLeave.notes || ""
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingSickLeave) return;
    editMutation.mutate({
      id: editingSickLeave.id,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      protocolNumber: editForm.protocolNumber,
      notes: editForm.notes
    });
  };

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
              <p>{t("hr.noSickLeave")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.employee")}</TableHead>
                  <TableHead>{t("common.dates")}</TableHead>
                  <TableHead>{t("hr.protocol")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("hr.certificate")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sickLeaves.map((sl) => {
                  const status = getStatus(sl);
                  return (
                    <TableRow key={sl.id} data-testid={`row-sick-leave-${sl.id}`}>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{sl.user?.fullName || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1 text-sm">
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
                        <Badge className={statusColors[status]}>
                          {statusLabels[status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sl.certificate ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={sl.certificate.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-1" />
                              Scarica
                            </a>
                          </Button>
                        ) : sl.certificateUploaded ? (
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                            Caricato
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non caricato</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(sl)}
                            data-testid={`button-edit-sick-leave-${sl.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hr.editSickLeave")}</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della malattia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("common.startDate")}</Label>
              <Input
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                data-testid="input-edit-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.endDate")}</Label>
              <Input
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                data-testid="input-edit-end-date"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hr.protocolNumber")}</Label>
              <Input
                value={editForm.protocolNumber}
                onChange={(e) => setEditForm({ ...editForm, protocolNumber: e.target.value })}
                placeholder={t("hr.inpsProtocol")}
                data-testid="input-edit-protocol"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.notes")}</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder={t("utility.additionalNotes")}
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending} data-testid="button-save-edit">
              {editMutation.isPending ? t("settings.savingRate") : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
