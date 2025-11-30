import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  UtilityPractice, UtilitySupplier, UtilityService, User,
  UtilityPracticeTask, UtilityPracticeNote, UtilityPracticeDocument,
  UtilityPracticeTimelineEvent, UtilityPracticeStateHistoryEntry
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, FileText, CheckSquare, Clock, MessageSquare, 
  Plus, Trash2, Upload, Download, Calendar, User as UserIcon,
  AlertCircle, CheckCircle, Circle, Play, XCircle, History
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type PracticeStatus = "bozza" | "inviata" | "in_lavorazione" | "attesa_documenti" | "completata" | "rifiutata" | "annullata";
type TaskStatus = "da_fare" | "in_corso" | "completato" | "annullato";
type Priority = "bassa" | "normale" | "alta" | "urgente";

const statusLabels: Record<PracticeStatus, string> = {
  bozza: "Bozza",
  inviata: "Inviata",
  in_lavorazione: "In Lavorazione",
  attesa_documenti: "Attesa Documenti",
  completata: "Completata",
  annullata: "Annullata",
  rifiutata: "Rifiutata",
};

const statusColors: Record<PracticeStatus, string> = {
  bozza: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  inviata: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_lavorazione: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  attesa_documenti: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completata: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  annullata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  rifiutata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const taskStatusLabels: Record<TaskStatus, string> = {
  da_fare: "Da fare",
  in_corso: "In corso",
  completato: "Completato",
  annullato: "Annullato",
};

const taskStatusIcons: Record<TaskStatus, typeof Circle> = {
  da_fare: Circle,
  in_corso: Play,
  completato: CheckCircle,
  annullato: XCircle,
};

const priorityLabels: Record<Priority, string> = {
  bassa: "Bassa",
  normale: "Normale",
  alta: "Alta",
  urgente: "Urgente",
};

const priorityColors: Record<Priority, string> = {
  bassa: "bg-gray-100 text-gray-700",
  normale: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

const documentCategoryLabels: Record<string, string> = {
  contratto: "Contratto",
  documento_identita: "Documento Identità",
  codice_fiscale: "Codice Fiscale",
  bolletta: "Bolletta",
  conferma_fornitore: "Conferma Fornitore",
  fattura: "Fattura",
  altro: "Altro",
};

const formatCurrency = (cents: number | null | undefined) => {
  if (cents == null) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: it });
};

const formatDateShort = (date: string | Date | null | undefined) => {
  if (!date) return "-";
  return format(new Date(date), "dd/MM/yyyy", { locale: it });
};

export default function AdminUtilityPracticeDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("panoramica");
  
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteVisibility, setNewNoteVisibility] = useState<"internal" | "customer">("internal");
  const [newStatus, setNewStatus] = useState<PracticeStatus>("bozza");
  const [statusReason, setStatusReason] = useState("");

  const { data: practice, isLoading } = useQuery<UtilityPractice>({
    queryKey: ["/api/utility/practices", params.id],
    enabled: !!params.id,
  });

  const { data: supplier } = useQuery<UtilitySupplier>({
    queryKey: ["/api/utility/suppliers", practice?.supplierId],
    enabled: !!practice?.supplierId,
  });

  const { data: service } = useQuery<UtilityService>({
    queryKey: ["/api/utility/services", practice?.serviceId],
    enabled: !!practice?.serviceId,
  });

  const { data: customer } = useQuery<User>({
    queryKey: ["/api/users", practice?.customerId],
    queryFn: async () => {
      const res = await fetch(`/api/users`);
      const users = await res.json();
      return users.find((u: User) => u.id === practice?.customerId);
    },
    enabled: !!practice?.customerId,
  });

  const { data: tasks = [] } = useQuery<UtilityPracticeTask[]>({
    queryKey: ["/api/utility/practices", params.id, "tasks"],
    enabled: !!params.id,
  });

  const { data: notes = [] } = useQuery<UtilityPracticeNote[]>({
    queryKey: ["/api/utility/practices", params.id, "notes"],
    enabled: !!params.id,
  });

  const { data: documents = [] } = useQuery<UtilityPracticeDocument[]>({
    queryKey: ["/api/utility/practices", params.id, "documents"],
    enabled: !!params.id,
  });

  const { data: timeline = [] } = useQuery<UtilityPracticeTimelineEvent[]>({
    queryKey: ["/api/utility/practices", params.id, "timeline"],
    enabled: !!params.id,
  });

  const { data: stateHistory = [] } = useQuery<UtilityPracticeStateHistoryEntry[]>({
    queryKey: ["/api/utility/practices", params.id, "state-history"],
    enabled: !!params.id,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const res = await apiRequest("POST", `/api/utility/practices/${params.id}/tasks`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "timeline"] });
      setTaskDialogOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      toast({ title: "Attività creata" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UtilityPracticeTask> }) => {
      const res = await apiRequest("PATCH", `/api/utility/practices/${params.id}/tasks/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "timeline"] });
      toast({ title: "Attività aggiornata" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${params.id}/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "tasks"] });
      toast({ title: "Attività eliminata" });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (data: { body: string; visibility: string }) => {
      const res = await apiRequest("POST", `/api/utility/practices/${params.id}/notes`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "timeline"] });
      setNoteDialogOpen(false);
      setNewNoteBody("");
      setNewNoteVisibility("internal");
      toast({ title: "Nota aggiunta" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${params.id}/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "notes"] });
      toast({ title: "Nota eliminata" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/utility/practices/${params.id}/status`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "state-history"] });
      setStatusDialogOpen(false);
      setStatusReason("");
      toast({ title: "Stato aggiornato" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Pratica non trovata</h2>
          <Link href="/admin/utility/practices">
            <Button variant="outline">Torna alle pratiche</Button>
          </Link>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.status === "completato").length;
  const totalTasks = tasks.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/utility/practices">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-practice-number">{practice.practiceNumber}</h1>
            <p className="text-muted-foreground">
              {supplier?.name} - {service?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[practice.status as PracticeStatus]} data-testid="badge-status">
            {statusLabels[practice.status as PracticeStatus]}
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setNewStatus(practice.status as PracticeStatus);
              setStatusDialogOpen(true);
            }}
            data-testid="button-change-status"
          >
            Cambia Stato
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-practice">
          <TabsTrigger value="panoramica" className="flex items-center gap-2" data-testid="tab-panoramica">
            <FileText className="h-4 w-4" />
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="attivita" className="flex items-center gap-2" data-testid="tab-attivita">
            <CheckSquare className="h-4 w-4" />
            Attività ({completedTasks}/{totalTasks})
          </TabsTrigger>
          <TabsTrigger value="documenti" className="flex items-center gap-2" data-testid="tab-documenti">
            <Upload className="h-4 w-4" />
            Documenti ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="cronologia" className="flex items-center gap-2" data-testid="tab-cronologia">
            <Clock className="h-4 w-4" />
            Cronologia
          </TabsTrigger>
          <TabsTrigger value="note" className="flex items-center gap-2" data-testid="tab-note">
            <MessageSquare className="h-4 w-4" />
            Note ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panoramica" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informazioni Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium" data-testid="text-customer-name">{customer?.fullName || "-"}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Email: {customer?.email || "-"}</p>
                  <p>Telefono: {customer?.phone || "-"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dettagli Servizio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fornitore</p>
                  <p className="font-medium" data-testid="text-supplier-name">{supplier?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Servizio</p>
                  <p className="font-medium" data-testid="text-service-name">{service?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Canone Mensile</p>
                  <p className="font-medium" data-testid="text-monthly-price">{formatCurrency(practice.monthlyPriceCents)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Date Importanti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Creata il</p>
                    <p className="font-medium">{formatDateShort(practice.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Inviata il</p>
                    <p className="font-medium">{formatDateShort(practice.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attivazione Prevista</p>
                    <p className="font-medium">{formatDateShort(practice.expectedActivationDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attivata il</p>
                    <p className="font-medium">{formatDateShort(practice.activatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riferimenti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Riferimento Fornitore</p>
                  <p className="font-medium">{practice.supplierReference || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priorità</p>
                  <Badge className={priorityColors[(practice.priority as Priority) || "normale"]}>
                    {priorityLabels[(practice.priority as Priority) || "normale"]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Canale Comunicazione</p>
                  <p className="font-medium">{practice.communicationChannel || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {practice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Note Pratica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{practice.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attivita" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Attività da completare</h3>
              <p className="text-sm text-muted-foreground">
                {completedTasks} di {totalTasks} completate
              </p>
            </div>
            <Button onClick={() => setTaskDialogOpen(true)} data-testid="button-add-task">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Attività
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessuna attività. Aggiungi la prima attività per iniziare.
                </div>
              ) : (
                <div className="divide-y">
                  {tasks.map((task) => {
                    const StatusIcon = taskStatusIcons[task.status as TaskStatus];
                    return (
                      <div 
                        key={task.id} 
                        className="flex items-start gap-3 p-4 hover:bg-muted/50"
                        data-testid={`task-item-${task.id}`}
                      >
                        <Checkbox
                          checked={task.status === "completato"}
                          onCheckedChange={(checked) => {
                            updateTaskMutation.mutate({
                              id: task.id,
                              data: { status: checked ? "completato" : "da_fare" }
                            });
                          }}
                          data-testid={`checkbox-task-${task.id}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${task.status === "completato" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {taskStatusLabels[task.status as TaskStatus]}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateShort(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                          data-testid={`button-delete-task-${task.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documenti" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Documenti allegati</h3>
              <p className="text-sm text-muted-foreground">{documents.length} documenti</p>
            </div>
            <Button variant="outline" data-testid="button-upload-document">
              <Upload className="h-4 w-4 mr-2" />
              Carica Documento
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessun documento allegato.
                </div>
              ) : (
                <div className="divide-y">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center gap-3 p-4 hover:bg-muted/50"
                      data-testid={`document-item-${doc.id}`}
                    >
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.fileName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{documentCategoryLabels[doc.category] || doc.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" data-testid={`button-download-${doc.id}`}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" data-testid={`button-delete-doc-${doc.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cronologia" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Cronologia eventi</h3>
              <p className="text-sm text-muted-foreground">{timeline.length} eventi</p>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Storico Stati
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stateHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nessun cambio di stato registrato.
                  </div>
                ) : (
                  <div className="divide-y">
                    {stateHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 p-4">
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[(entry.fromStatus as PracticeStatus) || "bozza"]} variant="outline">
                            {statusLabels[(entry.fromStatus as PracticeStatus) || "bozza"]}
                          </Badge>
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                          <Badge className={statusColors[entry.toStatus as PracticeStatus]}>
                            {statusLabels[entry.toStatus as PracticeStatus]}
                          </Badge>
                        </div>
                        <div className="flex-1 text-sm text-muted-foreground">
                          {entry.reason && <span className="italic">"{entry.reason}"</span>}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timeline Eventi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nessun evento registrato.
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
                      {timeline.map((event, index) => (
                        <div key={event.id} className="relative flex gap-4 p-4 pl-12">
                          <div className="absolute left-5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                          <div className="flex-1">
                            <p className="font-medium">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{formatDate(event.createdAt)}</span>
                              <span>•</span>
                              <span>{users.find(u => u.id === event.createdBy)?.fullName || "Sistema"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="note" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Note e comunicazioni</h3>
              <p className="text-sm text-muted-foreground">{notes.length} note</p>
            </div>
            <Button onClick={() => setNoteDialogOpen(true)} data-testid="button-add-note">
              <Plus className="h-4 w-4 mr-2" />
              Nuova Nota
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nessuna nota. Aggiungi la prima nota.
                </div>
              ) : (
                <div className="divide-y">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-4 hover:bg-muted/50"
                      data-testid={`note-item-${note.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={note.visibility === "internal" ? "secondary" : "outline"}>
                              {note.visibility === "internal" ? "Interna" : "Cliente"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{note.body}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            di {users.find(u => u.id === note.createdBy)?.fullName || "Sistema"}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          data-testid={`button-delete-note-${note.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Attività</DialogTitle>
            <DialogDescription>Aggiungi un'attività da completare per questa pratica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Titolo *</Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Es: Richiedere documento identità"
                data-testid="input-task-title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Descrizione</Label>
              <Textarea
                id="task-description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Descrizione opzionale..."
                data-testid="input-task-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => createTaskMutation.mutate({ title: newTaskTitle, description: newTaskDescription || undefined })}
              disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
              data-testid="button-save-task"
            >
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Nota</DialogTitle>
            <DialogDescription>Aggiungi una nota o comunicazione per questa pratica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note-visibility">Visibilità</Label>
              <Select value={newNoteVisibility} onValueChange={(v) => setNewNoteVisibility(v as "internal" | "customer")}>
                <SelectTrigger data-testid="select-note-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Interna (solo operatori)</SelectItem>
                  <SelectItem value="customer">Cliente (visibile al cliente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note-body">Contenuto *</Label>
              <Textarea
                id="note-body"
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="Scrivi la nota..."
                rows={4}
                data-testid="input-note-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => createNoteMutation.mutate({ body: newNoteBody, visibility: newNoteVisibility })}
              disabled={!newNoteBody.trim() || createNoteMutation.isPending}
              data-testid="button-save-note"
            >
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambia Stato Pratica</DialogTitle>
            <DialogDescription>Seleziona il nuovo stato per la pratica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nuovo Stato</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PracticeStatus)}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-reason">Motivo (opzionale)</Label>
              <Textarea
                id="status-reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Motivo del cambio stato..."
                data-testid="input-status-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Annulla</Button>
            <Button 
              onClick={() => updateStatusMutation.mutate({ status: newStatus, reason: statusReason || undefined })}
              disabled={updateStatusMutation.isPending}
              data-testid="button-update-status"
            >
              Conferma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
