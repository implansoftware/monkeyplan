import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Clock, User, Paperclip, FileText, Image, File, Download, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type Ticket = {
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

type TicketAttachment = {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
};

type TicketMessage = {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  attachments?: TicketAttachment[];
  createdAt: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function AttachmentList({ attachments }: { attachments?: TicketAttachment[] }) {
  if (!attachments || attachments.length === 0) return null;
  
  return (
    <div className="mt-2 space-y-1">
      {attachments.map((att, idx) => (
        <a
          key={idx}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded border bg-muted/30 hover:bg-muted/50 transition-colors text-sm"
          data-testid={`attachment-${idx}`}
        >
          {getFileIcon(att.mimeType)}
          <span className="flex-1 truncate">{att.filename}</span>
          <span className="text-xs text-muted-foreground">{formatFileSize(att.size)}</span>
          <Download className="h-3 w-3 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}

export default function CustomerTicketDetail() {
  const [, params] = useRoute("/customer/tickets/:id");
  const [, setLocation] = useLocation();
  const ticketId = params?.id;
  const { toast } = useToast();
  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: ["/api/tickets", ticketId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      const response = await fetch(`/api/tickets/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Ticket non trovato");
        if (response.status === 403) throw new Error("Accesso negato");
        throw new Error("Errore nel caricamento");
      }
      return response.json();
    },
    enabled: !!ticketId,
    retry: false,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<TicketMessage[]>({
    queryKey: ["/api/tickets", ticketId, "messages"],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      const response = await fetch(`/api/tickets/${id}/messages`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Errore nel caricamento messaggi");
      return response.json();
    },
    enabled: !!ticketId,
    retry: false,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/messages`, {
        message,
        isInternal: false,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "messages"] });
      setReplyMessage("");
      toast({ title: "Messaggio inviato" });
    },
    onError: (error: Error) => {
      const serverMessage = error.message.replace(/^\d+:\s*/, '');
      
      toast({ 
        title: "Errore", 
        description: serverMessage, 
        variant: "destructive" 
      });
      
      if (serverMessage.toLowerCase().includes('closed')) {
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      }
    },
  });

  const handleSendReply = () => {
    if (replyMessage.trim().length === 0) return;
    sendMessageMutation.mutate(replyMessage);
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

  if (ticketLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Ticket non trovato
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/customer/tickets")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-muted-foreground">
              #{ticket.ticketNumber}
            </span>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Descrizione</div>
            <p className="text-sm text-muted-foreground">{ticket.description}</p>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium mb-1">Creato il</div>
              <div className="text-muted-foreground">
                {format(new Date(ticket.createdAt), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Ultimo aggiornamento</div>
              <div className="text-muted-foreground">
                {format(new Date(ticket.updatedAt), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversazione</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messagesLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun messaggio ancora. Scrivi il primo messaggio per iniziare la conversazione.
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="border rounded-lg p-4 space-y-2"
                    data-testid={`message-${msg.id}`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {msg.userId === ticket.customerId ? "Tu" : "Assistenza"}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <AttachmentList attachments={msg.attachments} />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {ticket.status !== "closed" && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="text-sm font-medium">Scrivi una risposta</div>
                <Textarea
                  placeholder="Digita il tuo messaggio..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  data-testid="textarea-reply"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={sendMessageMutation.isPending || replyMessage.trim().length === 0}
                  data-testid="button-send-reply"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMessageMutation.isPending ? "Invio..." : "Invia Messaggio"}
                </Button>
              </div>
            </>
          )}

          {ticket.status === "closed" && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Questo ticket è stato chiuso. Non è più possibile inviare messaggi.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
