import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast({ title: t("auth.error"), description: error.message, variant: "destructive" });
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
      case "open": return <Badge>{t("tickets.status.open")}</Badge>;
      case "in_progress": return <Badge variant="secondary">{t("tickets.status.inProgress")}</Badge>;
      case "closed": return <Badge variant="outline">{t("tickets.status.closed")}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <Badge variant="destructive">{t("common.priorityHigh")}</Badge>;
      case "medium": return <Badge variant="secondary">{t("common.priorityMedium")}</Badge>;
      case "low": return <Badge variant="outline">{t("common.priorityLow")}</Badge>;
      default: return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">I Miei Ticket</h1>
              <p className="text-white/80 text-sm">
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
              <DialogTitle>{t("tickets.creaNuovoTicket")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">{t("tickets.subject")}</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="Riassumi il problema..."
                  required
                  data-testid="input-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("common.description")}</Label>
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
                <Label htmlFor="priority">{t("common.priority")}</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger id="priority" data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("common.priorityLow")}</SelectItem>
                    <SelectItem value="medium">{t("common.priorityMedium")}</SelectItem>
                    <SelectItem value="high">{t("common.priorityHigh")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createTicketMutation.isPending}
                data-testid="button-submit-ticket"
              >
                {createTicketMutation.isPending ? "Creazione..." : t("tickets.createTicket")}
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
            <p>{t("tickets.noTicketsFound")}</p>
            <p className="text-sm mt-2">{t("customerPages.creaUnNuovoTicketPerRicevereAssistenza")}</p>
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
                      <div className="flex flex-wrap items-center gap-2 mb-2">
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
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
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
