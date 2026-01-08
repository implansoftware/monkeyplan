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
  Calendar
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

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
  vacation: { label: "Ferie", color: "bg-emerald-500" },
  permit: { label: "Permesso", color: "bg-blue-500" },
  rol: { label: "ROL", color: "bg-purple-500" },
  parental: { label: "Parentale", color: "bg-pink-500" },
  other: { label: "Altro", color: "bg-gray-500" },
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In Attesa", variant: "secondary" },
  approved: { label: "Approvata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" },
  cancelled: { label: "Annullata", variant: "outline" },
};

export default function HrLeaveRequests() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    leaveType: "vacation",
    startDate: "",
    endDate: "",
    reason: "",
    userId: ""
  });
  const { toast } = useToast();

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/reseller/hr/leave-requests"],
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
      setNewRequest({ leaveType: "vacation", startDate: "", endDate: "", reason: "", userId: "" });
      toast({ title: "Richiesta inviata", description: "La richiesta ferie è stata inviata con successo." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/reseller/hr/leave-requests/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/hr/leave-requests"] });
      toast({ title: "Richiesta aggiornata", description: "Lo stato della richiesta è stato aggiornato." });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    }
  });

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== "all" && req.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6" data-testid="page-hr-leave-requests">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-slate-100 dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-leave-title">Ferie e Permessi</h1>
                <p className="text-muted-foreground">Gestione richieste ferie, permessi e ROL</p>
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
            <Button onClick={() => setDialogOpen(true)} data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Richiesta
            </Button>
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-900/10" data-testid="card-pending-alert">
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

      <Card data-testid="card-leave-requests-list">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Richieste Ferie e Permessi
              </CardTitle>
              <CardDescription>Elenco di tutte le richieste</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40" data-testid="select-status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="pending">In Attesa</SelectItem>
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
              <p>Nessuna richiesta trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dipendente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Giorni</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
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
                        {request.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => updateMutation.mutate({ id: request.id, status: 'approved' })}
                              data-testid={`button-approve-${request.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateMutation.mutate({ id: request.id, status: 'rejected' })}
                              data-testid={`button-reject-${request.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Richiesta Ferie/Permessi</DialogTitle>
            <DialogDescription>Compila il modulo per richiedere ferie o permessi</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dipendente</Label>
              <Select value={newRequest.userId} onValueChange={(v) => setNewRequest({ ...newRequest, userId: v })}>
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Seleziona dipendente..." />
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
              <Label>Tipo</Label>
              <Select value={newRequest.leaveType} onValueChange={(v) => setNewRequest({ ...newRequest, leaveType: v })}>
                <SelectTrigger data-testid="select-leave-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Ferie</SelectItem>
                  <SelectItem value="permit">Permesso</SelectItem>
                  <SelectItem value="rol">ROL</SelectItem>
                  <SelectItem value="parental">Congedo Parentale</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Inizio</Label>
                <Input
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fine</Label>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => createMutation.mutate(newRequest)}
              disabled={!newRequest.userId || !newRequest.startDate || !newRequest.endDate || createMutation.isPending}
              data-testid="button-submit-request"
            >
              {createMutation.isPending ? "Invio..." : "Invia Richiesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
