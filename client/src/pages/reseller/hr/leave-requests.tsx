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
  CalendarDays,
  Plus,
  Search,
  ArrowLeft,
  Check,
  X,
  Clock,
  Filter,
  User,
  Calendar,
  Eye,
  Pencil
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { EntityFilterSelector, EntityType, useEntityFilter } from "@/components/hr/entity-filter-selector";
import { useTranslation } from "react-i18next";

interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: 'vacation' | 'permit' | 'rol' | 'parental' | 'other';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewedBy?: string;
  reviewedAt?: string;
  user?: { fullName: string };
  reviewer?: { fullName: string };
}

interface StaffMember {
  id: string;
  fullName: string;
}

const leaveTypeLabels: Record<string, { label: string; color: string }> = {
  ferie: { label: t("hr.vacation"), color: "bg-emerald-500" },
  permesso_rol: { label: "Permesso ROL", color: "bg-purple-500" },
  permesso_studio: { label: t("hr.studyLeave"), color: "bg-blue-500" },
  permesso_medico: { label: t("hr.medicalLeave"), color: "bg-cyan-500" },
  permesso_lutto: { label: t("hr.bereavementLeave"), color: "bg-gray-600" },
  permesso_matrimonio: { label: t("hr.weddingLeave"), color: "bg-pink-500" },
  congedo_parentale: { label: t("hr.parentalLeave"), color: "bg-amber-500" },
  altro: { label: t("common.other"), color: "bg-gray-500" },
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: t("common.pending"), variant: "secondary" },
  approved: { label: t("common.approved"), variant: "default" },
  rejected: { label: t("common.rejected"), variant: "destructive" },
  cancelled: { label: t("common.cancelled"), variant: "outline" },
};

export default function HrLeaveRequests() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [entityType, setEntityType] = useState<EntityType>("own");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const { buildQueryParams, isReadOnly } = useEntityFilter();
  const [newRequest, setNewRequest] = useState({
    leaveType: "ferie",
    startDate: "",
    endDate: "",
    reason: "",
    userId: ""
  });
  const [editForm, setEditForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    status: ""
  });
  const { toast } = useToast();

  const readOnly = isReadOnly(entityType, selectedEntityId);
  const queryParams = buildQueryParams(entityType, selectedEntityId);

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/reseller/hr/leave-requests", entityType, selectedEntityId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/hr/leave-requests${queryParams}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      return res.json();
    },
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/reseller/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const totalDays = differenceInDays(endDate, startDate) + 1;
      const totalHours = totalDays * 8;
      return apiRequest("POST", "/api/reseller/hr/leave-requests", {
        ...data,
        totalDays,
        totalHours,
        isFullDay: true,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/leave-requests"] });
      setDialogOpen(false);
      setNewRequest({ leaveType: "ferie", startDate: "", endDate: "", reason: "", userId: "" });
      toast({ title: "Richiesta inviata", description: "La richiesta ferie è stata inviata con successo." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/reseller/hr/leave-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/leave-requests"] });
      toast({ title: "Richiesta aggiornata", description: "Lo stato della richiesta è stato aggiornato." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/reseller/hr/leave-requests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/leave-requests"] });
      setEditDialogOpen(false);
      setEditingRequest(null);
      toast({ title: "Richiesta modificata", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const openEditDialog = (request: LeaveRequest) => {
    setEditingRequest(request);
    setEditForm({
      leaveType: request.leaveType,
      startDate: request.startDate.split("T")[0],
      endDate: request.endDate.split("T")[0],
      reason: request.reason || "",
      status: request.status
    });
    setEditDialogOpen(true);
  };

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6" data-testid="page-hr-leave-requests">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-leave-title">{t("sidebar.items.leaveRequests")}</h1>
                <p className="text-white/80">Gestione richieste ferie, permessi e ROL</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/hr">
              <Button variant="secondary" data-testid="button-back-to-hr">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna a HR
              </Button>
            </Link>
            {!readOnly && (
              <Button variant="secondary" onClick={() => setDialogOpen(true)} data-testid="button-new-request">
                <Plus className="h-4 w-4 mr-2" />{t("auth.newRequest")}</Button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <EntityFilterSelector
            entityType={entityType}
            setEntityType={setEntityType}
            selectedEntityId={selectedEntityId}
            setSelectedEntityId={setSelectedEntityId}
          />
        </div>
        {readOnly && (
          <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
            <Eye className="h-4 w-4" />
            <span>Modalità sola lettura - Visualizzazione dati esterni</span>
          </div>
        )}
      </div>

      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-900/10 rounded-2xl" data-testid="card-pending-alert">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium">Richieste in attesa di approvazione</p>
              <p className="text-sm text-muted-foreground">{pendingCount} richieste da valutare</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl" data-testid="card-leave-requests-list">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Richieste Ferie e Permessi
              </CardTitle>
              <CardDescription>Elenco di tutte le richieste</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t("common.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allMasc")}</SelectItem>
                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                  <SelectItem value="approved">Approvate</SelectItem>
                  <SelectItem value="rejected">Rifiutate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("hr.noLeaveFound")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.employee")}</TableHead>
                  <TableHead>{t("common.type")}</TableHead>
                  <TableHead>{t("common.period")}</TableHead>
                  <TableHead>Giorni</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => {
                  const typeInfo = leaveTypeLabels[request.leaveType] || leaveTypeLabels.other;
                  const statusInfo = statusLabels[request.status] || statusLabels.pending;
                  return (
                    <TableRow key={request.id} data-testid={`row-leave-request-${request.id}`}>
                      <TableCell className="font-medium">{request.user?.fullName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.startDate), "dd/MM/yyyy")} - {format(new Date(request.endDate), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{request.totalDays}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!readOnly && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => openEditDialog(request)}
                              data-testid={`button-edit-${request.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {request.status === 'pending' && !readOnly && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'approved' })}
                                data-testid={`button-approve-${request.id}`}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'rejected' })}
                                data-testid={`button-reject-${request.id}`}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
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
            <DialogTitle>Nuova Richiesta Ferie/Permessi</DialogTitle>
            <DialogDescription>Compila il modulo per richiedere ferie o permessi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("hr.employee")}</Label>
              <Select value={newRequest.userId} onValueChange={(v) => setNewRequest({ ...newRequest, userId: v })}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder={t("hr.selectEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.type")}</Label>
              <Select value={newRequest.leaveType} onValueChange={(v) => setNewRequest({ ...newRequest, leaveType: v })}>
                <SelectTrigger data-testid="select-leave-type">
                  <SelectValue />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.startDate")}</Label>
                <Input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.endDate")}</Label>
                <Input
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivazione (opzionale)</Label>
              <Textarea
                value={newRequest.reason}
                onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                placeholder="Descrivi il motivo della richiesta..."
                data-testid="input-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => createMutation.mutate(newRequest)}
              disabled={!newRequest.userId || !newRequest.startDate || !newRequest.endDate || createMutation.isPending}
              data-testid="button-submit-request"
            >
              {createMutation.isPending ? t("pages.sending") : "Invia Richiesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Richiesta</DialogTitle>
            <DialogDescription>Modifica i dati della richiesta di {editingRequest?.user?.fullName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("common.type")}</Label>
              <Select value={editForm.leaveType} onValueChange={(v) => setEditForm({ ...editForm, leaveType: v })}>
                <SelectTrigger>
                  <SelectValue />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.startDate")}</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("common.endDate")}</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motivazione (opzionale)</Label>
              <Textarea
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                placeholder="Descrivi il motivo della richiesta..."
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.status")}</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("common.pending")}</SelectItem>
                  <SelectItem value="approved">{t("common.approved")}</SelectItem>
                  <SelectItem value="rejected">{t("common.rejected")}</SelectItem>
                  <SelectItem value="cancelled">{t("common.cancelled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => editingRequest && editMutation.mutate({ id: editingRequest.id, data: editForm })}
              disabled={!editForm.startDate || !editForm.endDate || editMutation.isPending}
              data-testid="button-save-edit"
            >
              {editMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
