import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Ticket, Clock, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TicketType = {
  id: string;
  ticketNumber: string;
  customerId: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

type EntityOption = {
  id: string;
  username: string;
  companyName?: string;
  role?: string;
};

export default function AdminTickets() {
  const { t } = useTranslation();
  usePageTitle(t("tickets.title"));
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [targetType, setTargetType] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState("medium");

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets"],
    retry: false,
  });

  const { data: resellers = [] } = useQuery<EntityOption[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const { data: repairCenters = [] } = useQuery<EntityOption[]>({
    queryKey: ["/api/admin/repair-centers"],
  });

  const { data: customers = [] } = useQuery<EntityOption[]>({
    queryKey: ["/api/users"],
  });

  const customerList = customers.filter((u: any) => u.role === 'customer');

  const createTicketMutation = useMutation({
    mutationFn: async (data: { subject: string; description: string; priority: string; targetType: string; targetId?: string }) => {
      const res = await apiRequest("POST", "/api/internal-tickets", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/internal-tickets"] });
      toast({ title: t("tickets.ticketCreated") });
      resetCreateForm();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message.replace(/^\d+:\s*/, ''), variant: "destructive" });
    },
  });

  const resetCreateForm = () => {
    setShowCreateDialog(false);
    setTargetType("");
    setTargetId("");
    setTicketSubject("");
    setTicketDescription("");
    setTicketPriority("medium");
  };

  const handleCreateTicket = () => {
    if (!ticketSubject.trim() || !ticketDescription.trim() || !targetType) return;
    createTicketMutation.mutate({
      subject: ticketSubject,
      description: ticketDescription,
      priority: ticketPriority,
      targetType,
      targetId: targetType !== 'admin' ? targetId : undefined,
    });
  };

  const getTargetOptions = () => {
    switch (targetType) {
      case 'reseller':
        return resellers.map((r) => ({ id: r.id, label: r.companyName || r.username }));
      case 'repair_center':
        return repairCenters.map((rc) => ({ id: rc.id, label: (rc as any).companyName || rc.username }));
      default:
        return [];
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge>{t("tickets.open")}</Badge>;
      case "in_progress": return <Badge variant="secondary">{t("tickets.inProgress")}</Badge>;
      case "closed": return <Badge variant="outline">{t("tickets.closed")}</Badge>;
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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("tickets.management")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("tickets.manageAllTickets")}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-ticket">
            <Plus className="h-4 w-4 mr-2" />
            {t("tickets.newTicket")}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("tickets.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-tickets"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="select-status-filter">
                <SelectValue placeholder={t("tickets.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("repairs.allStatuses")}</SelectItem>
                <SelectItem value="open">{t("tickets.open")}</SelectItem>
                <SelectItem value="in_progress">{t("tickets.inProgress")}</SelectItem>
                <SelectItem value="closed">{t("tickets.closed")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger data-testid="select-priority-filter">
                <SelectValue placeholder={t("tickets.filterByPriority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("tickets.allPriorities")}</SelectItem>
                <SelectItem value="high">{t("common.priorityHigh")}</SelectItem>
                <SelectItem value="medium">{t("common.priorityMedium")}</SelectItem>
                <SelectItem value="low">{t("common.priorityLow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Ticket className="h-5 w-5" />
            Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">
                {searchQuery || statusFilter !== "all" || priorityFilter !== "all" 
                  ? t("tickets.noTicketsFound") 
                  : t("tickets.noTicketsPresent")
                }
              </p>
              {(searchQuery || statusFilter !== "all" || priorityFilter !== "all") && (
                <p className="text-sm">{t("tickets.tryChangingFilters")}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setLocation(`/admin/tickets/${ticket.id}`)}
                  className="border rounded-lg p-4 hover-elevate active-elevate-2 cursor-pointer"
                  data-testid={`ticket-${ticket.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{ticket.ticketNumber}
                        </span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
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
                  {ticket.assignedTo && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <span className="text-muted-foreground">{t("tickets.assignedTo")}: </span>
                      <span className="font-medium">{ticket.assignedTo}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) resetCreateForm(); else setShowCreateDialog(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("tickets.createNewInternalTicket")}</DialogTitle>
            <DialogDescription>{t("tickets.createTicketDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("tickets.recipientType")}</Label>
              <Select value={targetType} onValueChange={(v) => { setTargetType(v); setTargetId(""); }}>
                <SelectTrigger data-testid="select-target-type">
                  <SelectValue placeholder={t("tickets.selectRecipientType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reseller">{t("tickets.reseller")}</SelectItem>
                  <SelectItem value="repair_center">{t("tickets.repairCenter")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {targetType && (
              <div className="space-y-2">
                <Label>{t("tickets.recipient")}</Label>
                <Select value={targetId} onValueChange={setTargetId}>
                  <SelectTrigger data-testid="select-target-id">
                    <SelectValue placeholder={t("tickets.selectRecipient")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getTargetOptions().map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("tickets.subjectRequired")}</Label>
              <Input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder={t("tickets.subjectPlaceholder")}
                data-testid="input-ticket-subject"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("tickets.descriptionRequired")}</Label>
              <Textarea
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder={t("tickets.descriptionPlaceholder")}
                rows={4}
                data-testid="textarea-ticket-description"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("common.priority")}</Label>
              <Select value={ticketPriority} onValueChange={setTicketPriority}>
                <SelectTrigger data-testid="select-ticket-priority">
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
              onClick={handleCreateTicket}
              className="w-full"
              disabled={!ticketSubject.trim() || !ticketDescription.trim() || !targetType || (targetType !== 'admin' && !targetId) || createTicketMutation.isPending}
              data-testid="button-submit-ticket"
            >
              {createTicketMutation.isPending ? t("tickets.invio") : t("tickets.submitTicket")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
