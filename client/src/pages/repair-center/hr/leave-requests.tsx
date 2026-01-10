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
import { CalendarDays, Plus, ArrowLeft, Check, X } from "lucide-react";
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
  const [newRequest, setNewRequest] = useState({ leaveType: "ferie", startDate: "", endDate: "", notes: "", userId: "" });
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

  const updateMutation = useMutation({
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

  return (
    <div className="space-y-6" data-testid="page-rc-hr-leave-requests">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-slate-100 dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-slate-900 p-6 border">
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Ferie e Permessi</h1>
                <p className="text-muted-foreground">Gestione richieste ferie, permessi e ROL</p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Dal</TableHead>
                  <TableHead>Al</TableHead>
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
                    <TableCell>{format(new Date(request.endDate), "dd/MM/yyyy", { locale: it })}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[request.status]?.variant || "secondary"}>
                        {statusLabels[request.status]?.label || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: request.id, status: "approved" })}>
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateMutation.mutate({ id: request.id, status: "rejected" })}>
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
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
            <div className="grid grid-cols-2 gap-4">
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
    </div>
  );
}
