import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ticket, InsertTicket } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { Link } from "wouter";

export default function CustomerTickets() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: Partial<InsertTicket>) => {
      const res = await apiRequest("POST", "/api/tickets", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setDialogOpen(false);
      toast({ title: "Ticket creato con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<InsertTicket> = {
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as any,
    };
    createTicketMutation.mutate(data);
  };

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

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">I Miei Ticket</h1>
              <p className="text-sm text-muted-foreground">
                Richieste di assistenza e supporto
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-ticket">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Ticket
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuovo Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Oggetto</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Riassumi il problema..."
                  required
                  data-testid="input-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descrivi dettagliatamente il problema..."
                  required
                  rows={4}
                  data-testid="textarea-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorità</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger id="priority" data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bassa</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createTicketMutation.isPending}
                data-testid="button-submit-ticket"
              >
                {createTicketMutation.isPending ? "Creazione..." : "Crea Ticket"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nessun ticket trovato</p>
            <p className="text-sm mt-2">Crea un nuovo ticket per ricevere assistenza</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link key={ticket.id} href={`/customer/tickets/${ticket.id}`}>
              <Card data-testid={`card-ticket-${ticket.id}`} className="hover-elevate cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{ticket.ticketNumber}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <h3 className="font-medium mb-1">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: it })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
