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
import { CalendarDays, Plus, ArrowLeft, Check, X, Pencil } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface LeaveRequest {
  id: string;
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  user?: { fullName: string };
}

const leaveTypeLabels: Record<string, string> = {
  ferie: "Ferie",
  permesso: "Permesso",
  rol: "ROL",
  malattia: "Malattia",
  maternita: "Maternità",
  paternita: "Paternità",
  lutto: "Lutto",
  altro: "Altro"
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In Attesa", variant: "secondary" },
  approved: { label: "Approvata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" }
};

interface StaffMember {
  id: string;
  fullName: string;
}

export default function RepairCenterHrLeaveRequests() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [newRequest, setNewRequest] = useState({ leaveType: "ferie", startDate: "", endDate: "", notes: "", userId: "" });
  const [editForm, setEditForm] = useState({ leaveType: "", startDate: "", endDate: "", notes: "" });
  const { toast } = useToast();

  const { data: leaveRequests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/repair-center/hr/leave-requests"],
  });

  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/repair-center/team"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/repair-center/hr/leave-requests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/leave-requests"] });
      setDialogOpen(false);
      setNewRequest({ leaveType: "ferie", startDate: "", endDate: "", notes: "", userId: "" });
      toast({ title: "Richiesta inviata", description: "La richiesta è stata inviata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/repair-center/hr/leave-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/leave-requests"] });
      toast({ title: "Stato aggiornato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PATCH", `/api/repair-center/hr/leave-requests/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repair-center/hr/leave-requests"] });
      setEditDialogOpen(false);
      setEditingRequest(null);
      toast({ title: "Richiesta modificata", description: "Le modifiche sono state salvate." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const openEditDialog = (request: LeaveRequest) => {
    setEditingRequest(request);
    setEditForm({
      leaveType: request.leaveType,
      startDate: request.startDate.split("T")[0],
      endDate: request.endDate.split("T")[0],
      notes: request.notes || ""
    });
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-testid="page-rc-hr-leave-requests">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <CalendarDays className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">Richieste Ferie</h1>
              <p className="text-emerald-100">Gestione richieste ferie, permessi e ROL</p>
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
              Nuova Richiesta
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Richieste</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessuna richiesta presente
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dal</TableHead>
                  <TableHead className="hidden sm:table-cell">Al</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.user?.fullName || "N/A"}</TableCell>
                    <TableCell>{leaveTypeLabels[request.leaveType] || request.leaveType}</TableCell>
                    <TableCell>{format(new Date(request.startDate), "dd/MM/yyyy", { locale: it })}</TableCell>
                    <TableCell className="hidden sm:table-cell">{format(new Date(request.endDate), "dd/MM/yyyy", { locale: it })}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[request.status]?.variant || "secondary"}>
                        {statusLabels[request.status]?.label || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {request.status === "pending" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEditDialog(request)} data-testid={`button-edit-leave-${request.id}`}>
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate({ id: request.id, status: "approved" })}>
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate({ id: request.id, status: "rejected" })}>
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
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
            <DialogTitle>Nuova Richiesta</DialogTitle>
            <DialogDescription>Inserisci una nuova richiesta di ferie o permesso</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dipendente</label>
              <Select value={newRequest.userId} onValueChange={(v) => setNewRequest({ ...newRequest, userId: v })}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Seleziona dipendente" />
                </SelectTrigger>
                <SelectContent>
                  {staffMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={newRequest.leaveType} onValueChange={(v) => setNewRequest({ ...newRequest, leaveType: v })}>
                <SelectTrigger data-testid="select-leave-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data Inizio</label>
                <Input type="date" value={newRequest.startDate} onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fine</label>
                <Input type="date" value={newRequest.endDate} onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea value={newRequest.notes} onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })} placeholder="Motivazione..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={() => createMutation.mutate(newRequest)} disabled={createMutation.isPending || !newRequest.userId || !newRequest.startDate || !newRequest.endDate} data-testid="button-submit-leave">
              Invia Richiesta
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
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={editForm.leaveType} onValueChange={(v) => setEditForm({ ...editForm, leaveType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(leaveTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data Inizio</label>
                <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Data Fine</label>
                <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Note (opzionale)</label>
              <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Motivazione..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => editingRequest && editMutation.mutate({ id: editingRequest.id, data: editForm })} 
              disabled={editMutation.isPending || !editForm.startDate || !editForm.endDate}
              data-testid="button-save-leave-edit"
            >
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
