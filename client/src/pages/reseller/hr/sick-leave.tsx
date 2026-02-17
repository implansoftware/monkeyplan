import { useState, useRef } from "react";
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
  Thermometer,
  Plus,
  ArrowLeft,
  FileText,
  Filter,
  Upload,
  Calendar,
  Check,
  X,
  Paperclip,
  Download,
  Loader2,
  Eye,
  Pencil,
  CheckCircle,
  XCircle
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { EntityFilterSelector, EntityType, useEntityFilter } from "@/components/hr/entity-filter-selector";
import { useTranslation } from "react-i18next";

interface SickLeave {
  id: string;
  userId: string;
  startDate: string;
  endDate?: string;
  certificateNumber?: string;
  inpsProtocol?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'closed';
  certificateUploaded?: boolean;
  user?: { fullName: string };
}

interface TeamMember {
  id: string;
  fullName: string;
}

function getStatusLabels(t: (key: string) => string): Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> {
  return {
    pending: { label: t("hr.inProgress"), variant: "secondary" },
    confirmed: { label: t("hr.confirmed"), variant: "default" },
    closed: { label: t("hr.closed"), variant: "outline" },
  };
}

export default function HrSickLeave() {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSickLeave, setEditingSickLeave] = useState<SickLeave | null>(null);
  const [entityType, setEntityType] = useState<EntityType>("own");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const { buildQueryParams, isReadOnly } = useEntityFilter();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSickLeave, setNewSickLeave] = useState({
    userId: "",
    startDate: "",
    endDate: "",
    certificateNumber: "",
    inpsProtocol: "",
    notes: ""
  });
  const [editForm, setEditForm] = useState({
    startDate: "",
    endDate: "",
    certificateNumber: "",
    inpsProtocol: "",
    notes: "",
    status: ""
  });
  const { toast } = useToast();

  const readOnly = isReadOnly(entityType, selectedEntityId);
  const queryParams = buildQueryParams(entityType, selectedEntityId);

  const { data: sickLeaves = [], isLoading } = useQuery<SickLeave[]>({
    queryKey: ["/api/reseller/hr/sick-leaves", entityType, selectedEntityId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/hr/sick-leaves${queryParams}`);
      if (!res.ok) throw new Error(t("common.loadingError"));
      return res.json();
    },
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/reseller/team"],
  });

  const uploadCertificate = async (sickLeaveId: string, file: File) => {
    const formData = new FormData();
    formData.append("certificate", file);
    const response = await fetch(`/api/reseller/hr/sick-leaves/${sickLeaveId}/certificate`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || t("hr.certificateUploadError"));
    }
    return response.json();
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reseller/hr/sick-leaves", {
        ...data,
        status: 'pending'
      });
      return response.json();
    },
    onSuccess: async (result: any) => {
      if (certificateFile && result.id) {
        setUploadingCertificate(true);
        try {
          await uploadCertificate(result.id, certificateFile);
          toast({ title: t("hr.sickLeaveAndCertificateRegistered"), description: t("hr.sickLeaveAndCertificateRegisteredDesc") });
        } catch (error: any) {
          toast({ title: t("hr.sickLeaveRegistered"), description: t("hr.sickLeaveCertificateError"), variant: "destructive" });
        } finally {
          setUploadingCertificate(false);
        }
      } else {
        toast({ title: t("hr.sickLeaveRegistered"), description: t("hr.sickLeaveRegisteredDesc") });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/sick-leaves"] });
      setDialogOpen(false);
      setCertificateFile(null);
      setNewSickLeave({ userId: "", startDate: "", endDate: "", certificateNumber: "", inpsProtocol: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/reseller/hr/sick-leaves/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/sick-leaves"] });
      setEditDialogOpen(false);
      setEditingSickLeave(null);
      toast({ title: t("hr.sickLeaveModified"), description: t("products.changesSaved") });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/reseller/hr/sick-leaves/${id}`, { status });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/sick-leaves"] });
      const statusLabel = variables.status === 'confirmed' ? t('hr.confirmed') : t('hr.closed');
      toast({ title: t("tickets.statusUpdated"), description: `${t("hr.sickLeaveTitle")} ${statusLabel}` });
    },
    onError: (error: any) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    }
  });

  const openEditDialog = (sickLeave: SickLeave) => {
    setEditingSickLeave(sickLeave);
    setEditForm({
      startDate: sickLeave.startDate.split("T")[0],
      endDate: sickLeave.endDate ? sickLeave.endDate.split("T")[0] : "",
      certificateNumber: sickLeave.certificateNumber || "",
      inpsProtocol: sickLeave.inpsProtocol || "",
      notes: sickLeave.notes || "",
      status: sickLeave.status
    });
    setEditDialogOpen(true);
  };

  const filteredSickLeaves = sickLeaves.filter(sl => {
    if (statusFilter !== "all" && sl.status !== statusFilter) return false;
    return true;
  });

  const activeSickLeaves = sickLeaves.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6" data-testid="page-hr-sick-leave">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Thermometer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-sick-leave-title">{t("hr.sickLeaveManagement")}</h1>
                <p className="text-white/80">{t("hr.sickLeaveCertificatesDesc")}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/hr">
              <Button variant="secondary" data-testid="button-back-to-hr">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("hr.backToHr")}
              </Button>
            </Link>
            {!readOnly && (
              <Button variant="secondary" onClick={() => setDialogOpen(true)} data-testid="button-new-sick-leave">
                <Plus className="h-4 w-4 mr-2" />
                {t("hr.registerSickLeave")}
              </Button>
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
            <span>{t("hr.readOnlyMode")}</span>
          </div>
        )}
      </div>

      {activeSickLeaves > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10 rounded-2xl" data-testid="card-active-alert">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Thermometer className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium">{t("hr.activeSickLeaves")}</p>
              <p className="text-sm text-muted-foreground">{t("hr.employeesCurrentlySick", { count: activeSickLeaves })}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl" data-testid="card-sick-leave-list">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                {t("hr.sickLeaveRegistry")}
              </CardTitle>
              <CardDescription>{t("hr.sickLeaveRegistryDesc")}</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allMasc")}</SelectItem>
                <SelectItem value="pending">{t("hr.inProgress")}</SelectItem>
                <SelectItem value="confirmed">{t("hr.confirmedPlural")}</SelectItem>
                <SelectItem value="closed">{t("hr.closedPlural")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredSickLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Thermometer className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("hr.noSickLeave")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.employee")}</TableHead>
                  <TableHead>{t("common.startDate")}</TableHead>
                  <TableHead>{t("common.endDate")}</TableHead>
                  <TableHead>{t("hr.days")}</TableHead>
                  <TableHead>{t("hr.certificateNumber")}</TableHead>
                  <TableHead>{t("hr.inpsProtocol")}</TableHead>
                  <TableHead>{t("hr.certificate")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSickLeaves.map((sl) => {
                  const statusInfo = statusLabels[sl.status] || statusLabels.pending;
                  const days = sl.endDate 
                    ? differenceInDays(new Date(sl.endDate), new Date(sl.startDate)) + 1
                    : differenceInDays(new Date(), new Date(sl.startDate)) + 1;
                  return (
                    <TableRow key={sl.id} data-testid={`row-sick-leave-${sl.id}`}>
                      <TableCell className="font-medium">{sl.user?.fullName || '-'}</TableCell>
                      <TableCell>{format(new Date(sl.startDate), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{sl.endDate ? format(new Date(sl.endDate), "dd/MM/yyyy") : t('hr.inProgress')}</TableCell>
                      <TableCell>{days}</TableCell>
                      <TableCell>{sl.certificateNumber || '-'}</TableCell>
                      <TableCell>{sl.inpsProtocol || '-'}</TableCell>
                      <TableCell>
                        {sl.certificateUploaded ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="default" className="bg-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              {t("hr.uploaded")}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/reseller/hr/sick-leaves/${sl.id}/certificate`, {
                                    credentials: "include"
                                  });
                                  if (!response.ok) {
                                    const error = await response.json();
                                    throw new Error(error.error || t("hr.downloadError"));
                                  }
                                  const data = await response.json();
                                  window.open(data.downloadUrl, '_blank');
                                } catch (error: any) {
                                  toast({ title: t("common.error"), description: error.message, variant: "destructive" });
                                }
                              }}
                              data-testid={`button-download-certificate-${sl.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <X className="h-3 w-3 mr-1" />
                            {t("hr.missing")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {!readOnly && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => openEditDialog(sl)}
                              title={t("common.edit")}
                              data-testid={`button-edit-${sl.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {sl.status === 'pending' && !readOnly && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => statusMutation.mutate({ id: sl.id, status: 'confirmed' })}
                                disabled={statusMutation.isPending}
                                title={t("hr.confirmSickLeave")}
                                data-testid={`button-confirm-${sl.id}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                onClick={() => statusMutation.mutate({ id: sl.id, status: 'closed' })}
                                disabled={statusMutation.isPending}
                                title={t("hr.closeSickLeave")}
                                data-testid={`button-close-${sl.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {sl.status === 'confirmed' && !readOnly && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => statusMutation.mutate({ id: sl.id, status: 'closed' })}
                              disabled={statusMutation.isPending}
                              title={t("hr.closeSickLeave")}
                              data-testid={`button-close-${sl.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
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
            <DialogTitle>{t("hr.registerSickLeave")}</DialogTitle>
            <DialogDescription>{t("hr.insertSickLeaveData")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("hr.employee")}</Label>
              <Select
                value={newSickLeave.userId}
                onValueChange={(value) => setNewSickLeave({ ...newSickLeave, userId: value })}
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder={t("hr.selectEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("common.startDate")}</Label>
                <Input
                  type="date"
                  value={newSickLeave.startDate}
                  onChange={(e) => setNewSickLeave({ ...newSickLeave, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("hr.endDateIfKnown")}</Label>
                <Input
                  type="date"
                  value={newSickLeave.endDate}
                  onChange={(e) => setNewSickLeave({ ...newSickLeave, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("hr.certificateNumber")}</Label>
              <Input
                value={newSickLeave.certificateNumber}
                onChange={(e) => setNewSickLeave({ ...newSickLeave, certificateNumber: e.target.value })}
                placeholder={t("hr.placeholderCertificateNumber")}
                data-testid="input-certificate"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hr.inpsProtocol")}</Label>
              <Input
                value={newSickLeave.inpsProtocol}
                onChange={(e) => setNewSickLeave({ ...newSickLeave, inpsProtocol: e.target.value })}
                placeholder={t("hr.placeholderInpsProtocol")}
                data-testid="input-protocol"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.notes")} ({t("utility.optional")})</Label>
              <Textarea
                value={newSickLeave.notes}
                onChange={(e) => setNewSickLeave({ ...newSickLeave, notes: e.target.value })}
                placeholder={t("utility.additionalNotes")}
                data-testid="input-notes"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hr.medicalCertificate")} ({t("utility.optional")})</Label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  data-testid="input-certificate-file"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                  data-testid="button-select-file"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {certificateFile ? certificateFile.name : t("hr.selectFile")}
                </Button>
                {certificateFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCertificateFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    data-testid="button-remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{t("hr.supportedFormats")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => createMutation.mutate(newSickLeave)}
              disabled={!newSickLeave.userId || !newSickLeave.startDate || createMutation.isPending || uploadingCertificate}
              data-testid="button-submit-sick-leave"
            >
              {uploadingCertificate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("hr.uploadingCertificate")}
                </>
              ) : createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("hr.registering")}
                </>
              ) : (
                t("hr.register")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hr.editSickLeave")}</DialogTitle>
            <DialogDescription>{t("hr.editSickLeaveDesc", { name: editingSickLeave?.user?.fullName })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                <Label>{t("hr.endDateIfKnown")}</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("hr.certificateNumber")}</Label>
              <Input
                value={editForm.certificateNumber}
                onChange={(e) => setEditForm({ ...editForm, certificateNumber: e.target.value })}
                placeholder={t("hr.placeholderCertificateNumber")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("hr.inpsProtocol")}</Label>
              <Input
                value={editForm.inpsProtocol}
                onChange={(e) => setEditForm({ ...editForm, inpsProtocol: e.target.value })}
                placeholder={t("hr.placeholderInpsProtocol")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.notes")} ({t("utility.optional")})</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder={t("utility.additionalNotes")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("common.status")}</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t("hr.inProgress")}</SelectItem>
                  <SelectItem value="confirmed">{t("hr.confirmed")}</SelectItem>
                  <SelectItem value="closed">{t("hr.closed")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => editingSickLeave && editMutation.mutate({ id: editingSickLeave.id, data: editForm })}
              disabled={!editForm.startDate || editMutation.isPending}
              data-testid="button-save-sick-edit"
            >
              {editMutation.isPending ? t("profile.saving") : t("profile.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
