import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, User, UserCog, AlertCircle, CheckCircle2, Paperclip, X, FileText, Image, File, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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

type StaffUser = {
  id: string;
  username: string;
  role: string;
};

function getStatusBadge(status: string) {
  switch (status) {
    case "open": return <Badge>Aperto</Badge>;
    case "in_progress": return <Badge variant="secondary">In lavorazione</Badge>;
    case "closed": return <Badge variant="outline">Chiuso</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (mimeType.includes("pdf")) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
          className="flex items-center gap-2 p-2 rounded border bg-muted/50 hover:bg-muted text-sm"
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

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "high": return <Badge variant="destructive">Alta</Badge>;
    case "medium": return <Badge variant="secondary">Media</Badge>;
    case "low": return <Badge variant="outline">Bassa</Badge>;
    default: return <Badge variant="outline">{priority}</Badge>;
  }
}

function TicketDetailManageView({ basePath }: { basePath: string }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const ticketIdMatch = location.match(/\/tickets\/([^/?]+)/);
  const ticketId = ticketIdMatch?.[1];
  
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: ["/api/tickets", ticketId],
    enabled: !!ticketId,
    retry: false,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<TicketMessage[]>({
    queryKey: ["/api/tickets", ticketId, "messages"],
    enabled: !!ticketId,
    retry: false,
  });

  const { data: staffUsers = [] } = useQuery<StaffUser[]>({
    queryKey: ["/api/users/staff"],
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Stato aggiornato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message.replace(/^\d+:\s*/, ''), variant: "destructive" });
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}/priority`, { priority });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Priorità aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message.replace(/^\d+:\s*/, ''), variant: "destructive" });
    },
  });

  const assignTicketMutation = useMutation({
    mutationFn: async (assignedTo: string | null) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}/assign`, { assignedTo });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Assegnazione aggiornata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message.replace(/^\d+:\s*/, ''), variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, isInternal, attachments }: { message: string; isInternal: boolean; attachments: TicketAttachment[] }) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/messages`, { message, isInternal, attachments });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "messages"] });
      setReplyMessage("");
      setIsInternalNote(false);
      setSelectedFiles([]);
      toast({ title: "Messaggio inviato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message.replace(/^\d+:\s*/, ''), variant: "destructive" });
      if (error.message.toLowerCase().includes('closed')) {
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      }
    },
  });

  const uploadFile = async (file: File): Promise<TicketAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    const data = await res.json();
    return {
      url: data.url,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
    };
  };

  const handleSendReply = async () => {
    if (replyMessage.trim().length === 0) return;
    
    setIsUploading(true);
    try {
      // Upload all selected files first
      const uploadedAttachments: TicketAttachment[] = [];
      for (const file of selectedFiles) {
        const attachment = await uploadFile(file);
        uploadedAttachments.push(attachment);
      }
      
      // Then send the message with attachments
      sendMessageMutation.mutate({ 
        message: replyMessage, 
        isInternal: isInternalNote,
        attachments: uploadedAttachments 
      });
    } catch (error: any) {
      toast({ title: "Errore upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024); // Max 10MB
    if (validFiles.length !== files.length) {
      toast({ title: "Attenzione", description: "Alcuni file superano il limite di 10MB", variant: "destructive" });
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
  
  const canUseInternalNotes = user?.role === 'admin' || ticket.assignedTo === user?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(basePath)} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-muted-foreground">#{ticket.ticketNumber}</span>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                <div className="text-center py-8 text-muted-foreground">Nessun messaggio ancora.</div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`border rounded-lg p-4 space-y-2 ${msg.isInternal ? 'border-amber-500/50 bg-amber-500/5' : ''}`} data-testid={`message-${msg.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            {msg.isInternal ? <UserCog className="h-4 w-4 text-amber-600" /> : <User className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-medium">{msg.userId === ticket.customerId ? "Cliente" : "Staff"}</span>
                            {msg.isInternal && <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">Nota interna</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}</span>
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
                    <div className="flex items-center justify-between">
                      <Label>Scrivi una risposta</Label>
                      {canUseInternalNotes && (
                        <div className="flex items-center gap-2">
                          <Switch checked={isInternalNote} onCheckedChange={setIsInternalNote} data-testid="switch-internal-note" />
                          <Label className="text-sm cursor-pointer">Nota interna</Label>
                        </div>
                      )}
                    </div>
                    {isInternalNote && canUseInternalNotes && (
                      <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-500/10 p-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span>Le note interne sono visibili solo allo staff</span>
                      </div>
                    )}
                    <Textarea placeholder="Digita il tuo messaggio..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={4} data-testid="textarea-reply" />
                    
                    {selectedFiles.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Allegati selezionati:</Label>
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-muted/50 text-sm">
                            {getFileIcon(file.type)}
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(idx)} data-testid={`button-remove-file-${idx}`}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        data-testid="input-file"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        data-testid="button-add-attachment"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Allega file
                      </Button>
                      <Button 
                        onClick={handleSendReply} 
                        disabled={sendMessageMutation.isPending || isUploading || replyMessage.trim().length === 0} 
                        data-testid="button-send-reply"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isUploading ? "Upload in corso..." : sendMessageMutation.isPending ? "Invio..." : isInternalNote ? "Aggiungi nota interna" : "Invia risposta"}
                      </Button>
                    </div>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stato</Label>
                <Select value={ticket.status} onValueChange={(value) => updateStatusMutation.mutate(value)} disabled={updateStatusMutation.isPending}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aperto</SelectItem>
                    <SelectItem value="in_progress">In lavorazione</SelectItem>
                    <SelectItem value="closed">Chiuso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorità</Label>
                <Select value={ticket.priority} onValueChange={(value) => updatePriorityMutation.mutate(value)} disabled={updatePriorityMutation.isPending}>
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

              <div className="space-y-2">
                <Label>Assegnato a</Label>
                <Select value={ticket.assignedTo || "unassigned"} onValueChange={(value) => assignTicketMutation.mutate(value === "unassigned" ? null : value)} disabled={assignTicketMutation.isPending}>
                  <SelectTrigger data-testid="select-assigned-to">
                    <SelectValue placeholder="Non assegnato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Non assegnato</SelectItem>
                    {staffUsers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>{staff.username} ({staff.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informazioni Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">ID Cliente: </span>
                <span className="font-mono">{ticket.customerId}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TicketDetailReadView({ basePath }: { basePath: string }) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const ticketIdMatch = location.match(/\/tickets\/([^/?]+)/);
  const ticketId = ticketIdMatch?.[1];
  
  const [replyMessage, setReplyMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: ["/api/tickets", ticketId],
    enabled: !!ticketId,
    retry: false,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<TicketMessage[]>({
    queryKey: ["/api/tickets", ticketId, "messages"],
    enabled: !!ticketId,
    retry: false,
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, attachments }: { message: string; attachments: TicketAttachment[] }) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/messages`, { message, isInternal: false, attachments });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId, "messages"] });
      setReplyMessage("");
      setSelectedFiles([]);
      toast({ title: "Messaggio inviato" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message.replace(/^\d+:\s*/, ''), variant: "destructive" });
      if (error.message.toLowerCase().includes('closed')) {
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      }
    },
  });

  const uploadFile = async (file: File): Promise<TicketAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(await res.text());
    }
    
    const data = await res.json();
    return {
      url: data.url,
      filename: data.filename,
      mimeType: data.mimeType,
      size: data.size,
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => f.size <= 10 * 1024 * 1024);
    if (validFiles.length !== files.length) {
      toast({ title: "Attenzione", description: "Alcuni file superano il limite di 10MB", variant: "destructive" });
    }
    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const closeTicketMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}/status`, { status: "closed" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/tickets/pending-count"] });
      toast({ title: "Ticket chiuso", description: "Il ticket è stato chiuso con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message.replace(/^\d+:\s*/, ''), variant: "destructive" });
    },
  });

  const handleSendReply = async () => {
    if (replyMessage.trim().length === 0) return;
    
    setIsUploading(true);
    try {
      const uploadedAttachments: TicketAttachment[] = [];
      for (const file of selectedFiles) {
        const attachment = await uploadFile(file);
        uploadedAttachments.push(attachment);
      }
      
      sendMessageMutation.mutate({ 
        message: replyMessage, 
        attachments: uploadedAttachments 
      });
    } catch (error: any) {
      toast({ title: "Errore upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const isReseller = user?.role === 'reseller' || user?.role === 'reseller_staff';
  const canCloseTicket = isReseller && ticket?.status !== 'closed';

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
        <Button variant="ghost" size="icon" onClick={() => setLocation(basePath)} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-muted-foreground">#{ticket.ticketNumber}</span>
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
          </div>
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
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
                <div className="text-center py-8 text-muted-foreground">Nessun messaggio ancora.</div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`border rounded-lg p-4 space-y-2 ${msg.isInternal ? 'border-amber-500/50 bg-amber-500/5' : ''}`} data-testid={`message-${msg.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            {msg.isInternal ? <UserCog className="h-4 w-4 text-amber-600" /> : <User className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-medium">{msg.userId === ticket.customerId ? "Cliente" : "Staff"}</span>
                            {msg.isInternal && <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">Nota interna</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}</span>
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
                    <Label>Scrivi una risposta</Label>
                    <Textarea placeholder="Digita il tuo messaggio..." value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} rows={4} data-testid="textarea-reply" />
                    
                    {selectedFiles.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Allegati selezionati:</Label>
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded border bg-muted/50 text-sm">
                            {getFileIcon(file.type)}
                            <span className="flex-1 truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(idx)} data-testid={`button-remove-file-${idx}`}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                        data-testid="input-file"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        data-testid="button-add-attachment"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Allega file
                      </Button>
                      <Button 
                        onClick={handleSendReply} 
                        disabled={sendMessageMutation.isPending || isUploading || replyMessage.trim().length === 0} 
                        data-testid="button-send-reply"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isUploading ? "Upload in corso..." : sendMessageMutation.isPending ? "Invio..." : "Invia risposta"}
                      </Button>
                    </div>
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="text-muted-foreground">ID Ticket: </span>
                <span className="font-mono">{ticket.ticketNumber}</span>
              </div>
            </CardContent>
          </Card>

          {canCloseTicket && (
            <Card>
              <CardHeader>
                <CardTitle>Azioni</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      disabled={closeTicketMutation.isPending}
                      data-testid="button-close-ticket"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {closeTicketMutation.isPending ? "Chiusura in corso..." : "Chiudi Ticket"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Conferma chiusura ticket</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sei sicuro di voler chiudere questo ticket? Una volta chiuso, il cliente non potrà più inviare messaggi.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-close">Annulla</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => closeTicketMutation.mutate()}
                        data-testid="button-confirm-close"
                      >
                        Conferma chiusura
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminTicketDetail() {
  return <TicketDetailManageView basePath="/admin/tickets" />;
}

export function ResellerTicketDetail() {
  return <TicketDetailReadView basePath="/reseller/tickets" />;
}

export function RepairCenterTicketDetail() {
  return <TicketDetailReadView basePath="/repair-center/tickets" />;
}
