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
import { Thermometer, Plus, ArrowLeft, FileUp, Download } from "lucide-react";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedSickLeaveId, setSelectedSickLeaveId] = useState<string | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [newSickLeave, setNewSickLeave] = useState({ userId: "", startDate: "", endDate: "", protocolNumber: "", notes: "" });
  const { toast } = useToast();

  const { data: sickLeaves = [], isLoading } = useQuery<SickLeave[]>({
    queryKey: ["/api/repair-center/hr/sick-leaves"],
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/repair-center/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/repair-center/hr/sick-leaves", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/sick-leaves"] });
      setDialogOpen(false);
      setNewSickLeave({ userId: "", startDate: "", endDate: "", protocolNumber: "", notes: "" });
      toast({ title: "Malattia registrata", description: "La registrazione è stata completata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
        throw new Error(error.error || "Errore upload");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/sick-leaves"] });
      setUploadDialogOpen(false);
      setCertificateFile(null);
      setSelectedSickLeaveId(null);
      toast({ title: "Certificato caricato", description: "Il certificato è stato caricato con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6" data-testid="page-rc-hr-sick-leave">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500/5 via-red-500/10 to-slate-100 dark:from-red-500/10 dark:via-red-500/5 dark:to-slate-900 p-6 border">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Thermometer className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Gestione Malattie</h1>
                <p className="text-muted-foreground">Certificati e assenze per malattia</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/repair-center/hr">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard HR
              </Button>
            </Link>
            <Button onClick={() => setDialogOpen(true)}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Data Inizio</TableHead>
                  <TableHead>Data Fine</TableHead>
                  <TableHead>N. Certificato</TableHead>
                  <TableHead>Certificato</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sickLeaves.map((sickLeave) => (
                  <TableRow key={sickLeave.id}>
                    <TableCell className="font-medium">{sickLeave.user?.fullName || "N/A"}</TableCell>
                    <TableCell>{format(new Date(sickLeave.startDate), "dd/MM/yyyy", { locale: it })}</TableCell>
                    <TableCell>{sickLeave.endDate ? format(new Date(sickLeave.endDate), "dd/MM/yyyy", { locale: it }) : "-"}</TableCell>
                    <TableCell>{sickLeave.protocolNumber || "-"}</TableCell>
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
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{sickLeave.notes || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <label className="text-sm font-medium">Dipendente</label>
              <Select value={newSickLeave.userId} onValueChange={(v) => setNewSickLeave({ ...newSickLeave, userId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data Inizio</label>
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
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea value={newSickLeave.notes} onChange={(e) => setNewSickLeave({ ...newSickLeave, notes: e.target.value })} placeholder="Note aggiuntive..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
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
            <DialogDescription>Seleziona il file del certificato da caricare</DialogDescription>
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
            <Button variant="outline" onClick={() => { setUploadDialogOpen(false); setCertificateFile(null); }}>Annulla</Button>
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
    </div>
  );
}
