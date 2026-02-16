import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, Plus, MessageSquare, Building2, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type TicketType = {
  id: string;
  ticketNumber: string;
  customerId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  ticketType: string;
  initiatorId: string | null;
  initiatorRole: string | null;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Reseller = {
  id: string;
  username: string;
  fullName: string;
  company: string;
};

export default function RepairCenterTickets() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    priority: "medium",
    targetType: "admin",
    targetId: "",
  });
  const { toast } = useToast();

  const { data: internalTickets = [], isLoading: loadingInternal } = useQuery<TicketType[]>({
    queryKey: ["/api/internal-tickets"],
    retry: false,
  });

  const { data: resellers = [] } = useQuery<Reseller[]>({
    queryKey: ["/api/resellers"],
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newTicket) => {
      return apiRequest("POST", "/api/internal-tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internal-tickets"] });
      toast({ title: "Ticket creato con successo" });
      setIsDialogOpen(false);
      setNewTicket({
        subject: "",
        description: "",
        priority: "medium",
        targetType: "admin",
        targetId: "",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Errore", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const filteredTickets = internalTickets.filter((ticket) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge>Aperto</Badge>;
      case "in_progress": return <Badge variant="secondary">In lavorazione</Badge>;
      case "closed": return <Badge variant="outline">Chiuso</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">Alta</Badge>;
      case "medium": return <Badge variant="secondary">Media</Badge>;
      case "low": return <Badge variant="outline">Bassa</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getTargetLabel = (ticket: TicketType) => {
    if (ticket.targetType === "admin") return "Admin";
    if (ticket.targetType === "reseller") {
      const reseller = resellers.find(r => r.id === ticket.targetId);
      return reseller?.company || reseller?.fullName || "Rivenditore";
    }
    return ticket.targetType;
  };

  const handleSubmit = () => {
    if (!newTicket.subject || !newTicket.description) {
      toast({ 
        title: "Errore", 
        description: "Compila tutti i campi obbligatori",
        variant: "destructive" 
      });
      return;
    }
    
    if (newTicket.targetType === "reseller" && !newTicket.targetId) {
      toast({ 
        title: "Errore", 
        description: "Seleziona un rivenditore",
        variant: "destructive" 
      });
      return;
    }
    
    createMutation.mutate(newTicket);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-4 sm:p-6">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-emerald-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <MessageSquare className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">Ticket</h1>
              <p className="text-emerald-100">Comunica con Admin e Rivenditori</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 shadow-lg" variant="outline" data-testid="button-new-ticket">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Ticket
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crea Nuovo Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Destinatario *</Label>
                <Select 
                  value={newTicket.targetType} 
                  onValueChange={(v) => setNewTicket({ ...newTicket, targetType: v, targetId: "" })}
                >
                  <SelectTrigger data-testid="select-target-type">
                    <SelectValue placeholder="Seleziona destinatario" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex flex-wrap items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Amministrazione
                      </div>
                    </SelectItem>
                    <SelectItem value="reseller">
                      <div className="flex flex-wrap items-center gap-2">
                        <Users className="h-4 w-4" />
                        Rivenditore
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {newTicket.targetType === "reseller" && (
                <div className="space-y-2">
                  <Label>Rivenditore *</Label>
                  <Select 
                    value={newTicket.targetId} 
                    onValueChange={(v) => setNewTicket({ ...newTicket, targetId: v })}
                  >
                    <SelectTrigger data-testid="select-reseller">
                      <SelectValue placeholder="Seleziona rivenditore" />
                    </SelectTrigger>
                    <SelectContent>
                      {resellers.map((reseller) => (
                        <SelectItem key={reseller.id} value={reseller.id}>
                          {reseller.company || reseller.fullName || reseller.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Oggetto *</Label>
                <Input
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="Oggetto del ticket"
                  data-testid="input-ticket-subject"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descrizione *</Label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Descrivi il problema o la richiesta..."
                  rows={4}
                  data-testid="input-ticket-description"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Priorità</Label>
                <Select 
                  value={newTicket.priority} 
                  onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                >
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bassa</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-ticket"
                >
                  {createMutation.isPending ? "Invio..." : "Invia Ticket"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero o oggetto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-tickets"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="open">Aperto</SelectItem>
                <SelectItem value="in_progress">In lavorazione</SelectItem>
                <SelectItem value="closed">Chiuso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ticket Interni ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInternal ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">
                {searchQuery || statusFilter !== "all" 
                  ? "Nessun ticket trovato" 
                  : "Nessun ticket interno"
                }
              </p>
              <p className="text-sm mb-4">
                {!searchQuery && statusFilter === "all" && "Crea il tuo primo ticket per comunicare con Admin o il tuo Rivenditore"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-ticket">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setLocation(`/repair-center/tickets/${ticket.id}`)}
                  className="border rounded-lg p-4 hover-elevate active-elevate-2 cursor-pointer"
                  data-testid={`ticket-${ticket.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{ticket.ticketNumber}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <Badge variant="outline" className="text-xs">
                          → {getTargetLabel(ticket)}
                        </Badge>
                      </div>
                      <h3 className="font-medium mb-1 truncate">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ticket.createdAt), "dd MMM yyyy", { locale: it })}
                      </div>
                      <div className="text-xs">{format(new Date(ticket.createdAt), "HH:mm")}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
