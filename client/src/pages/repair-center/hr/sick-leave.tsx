import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { HeartPulse, Plus, ArrowLeft, FileUp, Download, Pencil } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface SickLeave {
  id: string;
  userId: string;
  startDate: string;
  endDate?: string;
  protocolNumber?: string;
  certificateUploaded?: boolean;
  notes?: string;
  user?: { fullName: string };
  certificate?: { id: string; fileName: string; fileUrl: string };
}

interface StaffMember {
  id: string;
  fullName: string;
}

export default function RepairCenterHrSickLeave() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSickLeave, setEditingSickLeave] = useState<SickLeave | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedSickLeaveId, setSelectedSickLeaveId] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [newSickLeave, setNewSickLeave] = useState({ userId: "", startDate: "", endDate: "", protocolNumber: "", notes: "" });
  const [editForm, setEditForm] = useState({ startDate: "", endDate: "", protocolNumber: "", notes: "" });
  const { toast } = useToast();

  const { data: sickLeaves = [], isLoading } = useQuery<SickLeave[]>({
    queryKey: ["/api/repair-center/hr/sick-leaves"],
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/repair-center/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/repair-center/hr/sick-leaves", data);
      const sickLeave = await response.json();
      
      // If there's a certificate file, upload it
      if (certificateFile && sickLeave.id) {
        const formData = new FormData();
        formData.append("certificate", certificateFile);
        const uploadResponse = await fetch(`/api/repair-center/hr/sick-leaves/${sickLeave.id}/certificate`, {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        if (!uploadResponse.ok) {
          console.error("Failed to upload certificate");
        }
      }
      
      return sickLeave;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/sick-leaves"] });
      setDialogOpen(false);
      setNewSickLeave({ userId: "", startDate: "", endDate: "", protocolNumber: "", notes: "" });
      setCertificateFile(null);
      toast({ title: "Malattia registrata", description: t("hr.laRegistrazioneStataCompletataConSuccesso") });
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append("certificate", file);
      const response = await fetch(`/api/repair-center/hr/sick-leaves/${id}/certificate`, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("common.uploadError"));
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/sick-leaves"] });
      setUploadDialogOpen(false);
      setCertificateFile(null);
      setSelectedSickLeaveId(null);
      toast({ title: "Certificato caricato", description: t("hr.ilCertificatoStatoCaricatoConSuccesso") });
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/repair-center/hr/sick-leaves/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/sick-leaves"] });
      setEditDialogOpen(false);
      setEditingSickLeave(null);
      toast({ title: "Malattia modificata", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-rc-hr-sick-leave">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <HeartPulse className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">{t("hr.sickLeaveTitle")}</h1>
              <p className="text-emerald-100">{t("hr.sickLeaveSubtitle")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline" className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard HR
              </Button>
            </Link>
            <Button onClick={() => setDialogOpen(true)} className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Registra Malattia
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro Malattie</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : sickLeaves.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna malattia registrata
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hr.employee")}</TableHead>
                  <TableHead>{t("common.startDate")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("common.endDate")}</TableHead>
                  <TableHead className="hidden md:table-cell">N. Certificato</TableHead>
                  <TableHead>{t("hr.certificate")}</TableHead>
                  <TableHead className="hidden md:table-cell">{t("common.note")}</TableHead>
                  <TableHead>{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sickLeaves.map((sickLeave) => (
                  <TableRow key={sickLeave.id}>
                    <TableCell className="font-medium">{sickLeave.user?.fullName || "N/A"}</TableCell>
                    <TableCell>{format(new Date(sickLeave.startDate), "dd/MM/yyyy", { locale: it })}</TableCell>
                    <TableCell className="hidden sm:table-cell">{sickLeave.endDate ? format(new Date(sickLeave.endDate), "dd/MM/yyyy", { locale: it }) : "-"}</TableCell>
                    <TableCell className="hidden md:table-cell">{sickLeave.protocolNumber || "-"}</TableCell>
                    <TableCell>
                      {sickLeave.certificate ? (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={sickLeave.certificate.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setSelectedSickLeaveId(sickLeave.id); setUploadDialogOpen(true); }}>
                          <FileUp className="h-4 w-4 mr-1" />
                          Carica
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">{sickLeave.notes || "-"}</TableCell>
                    <TableCell>
                      {sickLeave.status === 'pending' && (
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(sickLeave)} data-testid={`button-edit-sick-${sickLeave.id}`}>
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Malattia</DialogTitle>
            <DialogDescription>Inserisci i dati della malattia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("hr.employee")}</label>
              <Select value={newSickLeave.userId} onValueChange={(v) => setNewSickLeave({ ...newSickLeave, userId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("hr.selezionaDipendente")} />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t("common.startDate")}</label>
                <Input type="date" value={newSickLeave.startDate} onChange={(e) => setNewSickLeave({ ...newSickLeave, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fine (opzionale)</label>
                <Input type="date" value={newSickLeave.endDate} onChange={(e) => setNewSickLeave({ ...newSickLeave, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Numero Certificato</label>
              <Input value={newSickLeave.protocolNumber} onChange={(e) => setNewSickLeave({ ...newSickLeave, protocolNumber: e.target.value })} placeholder="Es. ABC123456" />
            </div>
            <div>
              <label className="text-sm font-medium">Certificato Medico</label>
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} 
              />
              <p className="text-xs text-muted-foreground mt-1">Formati accettati: PDF, JPG, PNG</p>
            </div>
            <div>
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea value={newSickLeave.notes} onChange={(e) => setNewSickLeave({ ...newSickLeave, notes: e.target.value })} placeholder={t("utility.additionalNotes")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("profile.cancel")}</Button>
            <Button onClick={() => createMutation.mutate(newSickLeave)} disabled={createMutation.isPending || !newSickLeave.userId || !newSickLeave.startDate}>
              Registra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carica Certificato Medico</DialogTitle>
            <DialogDescription>{t("hr.selezionaIlFileDelCertificatoDaCaricare")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">File Certificato</label>
              <Input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png" 
                onChange={(e) => setCertificateFile(e.target.files?.[0] || null)} 
              />
              <p className="text-xs text-muted-foreground mt-1">Formati accettati: PDF, JPG, PNG</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setCertificateFile(null); }}>{t("profile.cancel")}</Button>
            <Button 
              onClick={() => selectedSickLeaveId && certificateFile && uploadMutation.mutate({ id: selectedSickLeaveId, file: certificateFile })} 
              disabled={uploadMutation.isPending || !certificateFile}
            >
              <FileUp className="h-4 w-4 mr-2" />
              Carica Certificato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hr.editSickLeave")}</DialogTitle>
            <DialogDescription>Modifica i dati della malattia di {editingSickLeave?.user?.fullName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t("common.startDate")}</label>
                <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fine (opzionale)</label>
                <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Numero Certificato</label>
              <Input value={editForm.protocolNumber} onChange={(e) => setEditForm({ ...editForm, protocolNumber: e.target.value })} placeholder="Es. ABC123456" />
            </div>
            <div>
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder={t("utility.additionalNotes")} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>{t("profile.cancel")}</Button>
            <Button 
              onClick={() => editingSickLeave && editMutation.mutate({ id: editingSickLeave.id, data: editForm })} 
              disabled={editMutation.isPending || !editForm.startDate}
              data-testid="button-save-sick-edit"
            >
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
