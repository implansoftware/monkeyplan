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
  Loader2
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In Corso", variant: "secondary" },
  confirmed: { label: "Confermata", variant: "default" },
  closed: { label: "Conclusa", variant: "outline" },
};

export default function HrSickLeave() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
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
  const { toast } = useToast();

  const { data: sickLeaves = [], isLoading } = useQuery<SickLeave[]>({
    queryKey: ["/api/reseller/hr/sick-leaves"],
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
      throw new Error(error.error || "Errore durante l'upload del certificato");
    }
    return response.json();
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/reseller/hr/sick-leaves", {
        ...data,
        status: 'pending'
      });
    },
    onSuccess: async (result: any) => {
      if (certificateFile && result.id) {
        setUploadingCertificate(true);
        try {
          await uploadCertificate(result.id, certificateFile);
          toast({ title: "Malattia e certificato registrati", description: "La comunicazione di malattia e il certificato sono stati registrati." });
        } catch (error: any) {
          toast({ title: "Malattia registrata", description: "La malattia è stata registrata, ma c'è stato un errore nel caricamento del certificato.", variant: "destructive" });
        } finally {
          setUploadingCertificate(false);
        }
      } else {
        toast({ title: "Malattia registrata", description: "La comunicazione di malattia è stata registrata." });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/sick-leaves"] });
      setDialogOpen(false);
      setCertificateFile(null);
      setNewSickLeave({ userId: "", startDate: "", endDate: "", certificateNumber: "", inpsProtocol: "", notes: "" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const filteredSickLeaves = sickLeaves.filter(sl => {
    if (statusFilter !== "all" && sl.status !== statusFilter) return false;
    return true;
  });

  const activeSickLeaves = sickLeaves.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6" data-testid="page-hr-sick-leave">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500/5 via-red-500/10 to-slate-100 dark:from-red-500/10 dark:via-red-500/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Thermometer className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-sick-leave-title">Gestione Malattie</h1>
                <p className="text-muted-foreground">Certificati e comunicazioni di malattia</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/reseller/hr">
              <Button variant="outline" data-testid="button-back-to-hr">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna a HR
              </Button>
            </Link>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-sick-leave">
              <Plus className="h-4 w-4 mr-2" />
              Registra Malattia
            </Button>
          </div>
        </div>
      </div>

      {activeSickLeaves > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10" data-testid="card-active-alert">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Thermometer className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium">Malattie in corso</p>
              <p className="text-sm text-muted-foreground">{activeSickLeaves} dipendenti attualmente in malattia</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-sick-leave-list">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Registro Malattie
              </CardTitle>
              <CardDescription>Storico delle comunicazioni di malattia</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="pending">In Corso</SelectItem>
                <SelectItem value="confirmed">Confermate</SelectItem>
                <SelectItem value="closed">Concluse</SelectItem>
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
              <p>Nessuna malattia registrata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Data Inizio</TableHead>
                  <TableHead>Data Fine</TableHead>
                  <TableHead>Giorni</TableHead>
                  <TableHead>N. Certificato</TableHead>
                  <TableHead>Protocollo INPS</TableHead>
                  <TableHead>Certificato</TableHead>
                  <TableHead>Stato</TableHead>
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
                      <TableCell>{sl.endDate ? format(new Date(sl.endDate), "dd/MM/yyyy") : 'In corso'}</TableCell>
                      <TableCell>{days}</TableCell>
                      <TableCell>{sl.certificateNumber || '-'}</TableCell>
                      <TableCell>{sl.inpsProtocol || '-'}</TableCell>
                      <TableCell>
                        {sl.certificateUploaded ? (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="h-3 w-3 mr-1" />
                            Caricato
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <X className="h-3 w-3 mr-1" />
                            Mancante
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
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
            <DialogTitle>Registra Malattia</DialogTitle>
            <DialogDescription>Inserisci i dati della comunicazione di malattia</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dipendente</Label>
              <Select
                value={newSickLeave.userId}
                onValueChange={(value) => setNewSickLeave({ ...newSickLeave, userId: value })}
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Seleziona dipendente" />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inizio</Label>
                <Input
                  type="date"
                  value={newSickLeave.startDate}
                  onChange={(e) => setNewSickLeave({ ...newSickLeave, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fine (se nota)</Label>
                <Input
                  type="date"
                  value={newSickLeave.endDate}
                  onChange={(e) => setNewSickLeave({ ...newSickLeave, endDate: e.target.value })}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Numero Certificato</Label>
              <Input
                value={newSickLeave.certificateNumber}
                onChange={(e) => setNewSickLeave({ ...newSickLeave, certificateNumber: e.target.value })}
                placeholder="es. ABC123456"
                data-testid="input-certificate"
              />
            </div>
            <div className="space-y-2">
              <Label>Protocollo INPS</Label>
              <Input
                value={newSickLeave.inpsProtocol}
                onChange={(e) => setNewSickLeave({ ...newSickLeave, inpsProtocol: e.target.value })}
                placeholder="es. INPS-2024-123456"
                data-testid="input-protocol"
              />
            </div>
            <div className="space-y-2">
              <Label>Note (opzionale)</Label>
              <Textarea
                value={newSickLeave.notes}
                onChange={(e) => setNewSickLeave({ ...newSickLeave, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                data-testid="input-notes"
              />
            </div>
            <div className="space-y-2">
              <Label>Certificato Medico (opzionale)</Label>
              <div className="flex items-center gap-2">
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
                  {certificateFile ? certificateFile.name : "Seleziona file"}
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
              <p className="text-xs text-muted-foreground">Formati supportati: PDF, JPEG, PNG, WebP (max 10MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => createMutation.mutate(newSickLeave)}
              disabled={!newSickLeave.userId || !newSickLeave.startDate || createMutation.isPending || uploadingCertificate}
              data-testid="button-submit-sick-leave"
            >
              {uploadingCertificate ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Caricamento certificato...
                </>
              ) : createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrazione...
                </>
              ) : (
                "Registra"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
