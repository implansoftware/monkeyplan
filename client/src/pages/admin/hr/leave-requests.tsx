import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, FileText, RefreshCw, Building2, Pencil } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { AdminEntityFilterSelector, AdminEntityType } from "@/components/hr/admin-entity-filter-selector";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  totalDays: number;
  totalHours: number;
  isFullDay: boolean;
  createdAt: string;
  user?: {
    fullName: string;
    email?: string;
  };
}

const leaveTypeLabels: Record<string, string> = {
  vacation: "vacation",
  sick: "sick",
  personal: "personal",
  maternity: "maternity",
  paternity: "paternity",
  bereavement: "bereavement",
  other: "other",
  ferie: "ferie",
  permesso_rol: "Permesso ROL",
  permesso_studio: "permesso_studio",
  permesso_medico: "permesso_medico",
  permesso_lutto: "permesso_lutto",
  permesso_matrimonio: "permesso_matrimonio",
  congedo_parentale: "congedo_parentale",
  altro: "altro",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "common.pending",
  approved: "common.approved",
  rejected: "common.rejected",
};

export default function AdminLeaveRequestsPage() {
  const { t } = useTranslation();
  const [entityType, setEntityType] = useState<AdminEntityType>("all");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [editForm, setEditForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: ""
  });
  const { toast } = useToast();

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

  const editMutation = useMutation({
    mutationFn: async (data: { id: string; leaveType: string; startDate: string; endDate: string; reason: string }) => {
      return apiRequest("PATCH", `/api/admin/hr/leave-requests/${data.id}`, {
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hr/leave-requests", queryString] });
      setEditDialogOpen(false);
      setEditingRequest(null);
      toast({ title: t("hr.leaveUpdated") });
    },
    onError: () => {
      toast({ title: t("hr.updateError"), variant: "destructive" });
    }
  });

  const openEditDialog = (request: LeaveRequest) => {
    setEditingRequest(request);
    setEditForm({
      leaveType: request.leaveType,
      startDate: request.startDate.split("T")[0],
      endDate: request.endDate.split("T")[0],
      reason: request.reason || ""
    });
    setEditDialogOpen(true);
  };

  const handleEdit = () => {
    if (!editingRequest) return;
    editMutation.mutate({
      id: editingRequest.id,
      leaveType: editForm.leaveType,
      startDate: editForm.startDate,
      endDate: editForm.endDate,
      reason: editForm.reason
    });
  };

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
              <p>{t("hr.noRequestsFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.employee")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("common.dates")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.notes")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} data-testid={`row-leave-request-${req.id}`}>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{req.user?.fullName || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{req.user?.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {leaveTypeLabels[req.leaveType] || req.leaveType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1 text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(req.startDate), "dd/MM/yyyy", { locale: it })}
                        {" - "}
                        {format(new Date(req.endDate), "dd/MM/yyyy", { locale: it })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[req.status]}>
                        {t(statusLabels[req.status]) || req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {req.reason || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {req.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(req)}
                          data-testid={`button-edit-leave-${req.id}`}
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
            <DialogTitle>{t("hr.editLeaveRequest")}</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della richiesta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("common.type")}</Label>
              <Select
                value={editForm.leaveType}
                onValueChange={(value) => setEditForm({ ...editForm, leaveType: value })}
              >
                <SelectTrigger data-testid="select-edit-leave-type">
                  <SelectValue placeholder={t("utility.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferie">{t("hr.vacation")}</SelectItem>
                  <SelectItem value="permesso_rol">Permesso ROL</SelectItem>
                  <SelectItem value="permesso_studio">{t("hr.studyLeave")}</SelectItem>
                  <SelectItem value="permesso_medico">{t("hr.medicalLeave")}</SelectItem>
                  <SelectItem value="permesso_lutto">{t("hr.bereavementLeave")}</SelectItem>
                  <SelectItem value="permesso_matrimonio">{t("hr.weddingLeave")}</SelectItem>
                  <SelectItem value="congedo_parentale">{t("hr.parentalLeave")}</SelectItem>
                  <SelectItem value="altro">{t("common.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label>{t("common.notes")}</Label>
              <Textarea
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                placeholder={t("utility.additionalNotes")}
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleEdit} disabled={editMutation.isPending} data-testid="button-save-edit">
              {editMutation.isPending ? t("settings.savingRate") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
