import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  UtilityPractice, UtilitySupplier, UtilityService, User, Product,
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
  AlertCircle, CheckCircle, Circle, Play, XCircle, History, Package
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type PracticeStatus = "bozza" | "inviata" | "in_lavorazione" | "attesa_documenti" | "completata" | "rifiutata" | "annullata";
type TaskStatus = "da_fare" | "in_corso" | "completato" | "annullato";
type Priority = "bassa" | "normale" | "alta" | "urgente";

function getStatusLabels(t: (key: string) => string): Record<PracticeStatus, string> {
  return {
    bozza: t("invoices.draft"),
    inviata: t("invoices.sent"),
    in_lavorazione: t("repairs.inProgress"),
    attesa_documenti: t("utility.awaitingDocuments"),
    completata: t("common.completed"),
    annullata: t("common.cancelled"),
    rifiutata: t("common.rejected"),
  };
}

const statusColors: Record<PracticeStatus, string> = {
  bozza: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  inviata: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  in_lavorazione: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  attesa_documenti: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  completata: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  annullata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  rifiutata: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function getTaskStatusLabels(t: (key: string) => string): Record<TaskStatus, string> {
  return {
    da_fare: t("utility.toDo"),
    in_corso: t("utility.inProgress"),
    completato: t("common.completed"),
    annullato: t("repairs.status.cancelled"),
  };
}

const taskStatusIcons: Record<TaskStatus, typeof Circle> = {
  da_fare: Circle,
  in_corso: Play,
  completato: CheckCircle,
  annullato: XCircle,
};

function getPriorityLabels(t: (key: string) => string): Record<Priority, string> {
  return {
    bassa: t("utility.low"),
    normale: t("utility.normal"),
    alta: t("utility.high"),
    urgente: t("utility.urgent"),
  };
}

const priorityColors: Record<Priority, string> = {
  bassa: "bg-gray-100 text-gray-700",
  normale: "bg-blue-100 text-blue-700",
  alta: "bg-orange-100 text-orange-700",
  urgente: "bg-red-100 text-red-700",
};

function getDocumentCategoryLabels(t: (key: string) => string): Record<string, string> {
  return {
    contratto: t("utility.contract"),
    documento_identita: t("utility.identityDocument"),
    codice_fiscale: t("profile.codiceFiscale"),
    bolletta: t("utility.bill"),
    conferma_fornitore: t("utility.supplierConfirmation"),
    fattura: t("common.invoice"),
    altro: t("common.other"),
  };
}

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

interface PracticeProductWithDetail {
  id: string;
  practiceId: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  notes: string | null;
  product: Product | null;
}

interface EnrichedPractice extends UtilityPractice {
  supplier?: UtilitySupplier | null;
  service?: UtilityService | null;
  product?: Product | null;
  practiceProducts?: PracticeProductWithDetail[];
}

export default function ResellerUtilityPracticeDetail() {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const taskStatusLabels = getTaskStatusLabels(t);
  const documentCategoryLabels = getDocumentCategoryLabels(t);
  const priorityLabels = getPriorityLabels(t);
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: practiceData, isLoading } = useQuery<EnrichedPractice>({
    queryKey: ["/api/utility/practices", params.id],
    enabled: !!params.id,
  });

  // Extract enriched data from response
  const practice = practiceData;
  const supplier = practiceData?.supplier;
  const service = practiceData?.service;
  const product = practiceData?.product;
  const practiceProducts = practiceData?.practiceProducts || [];

  const { data: customer } = useQuery<User>({
    queryKey: ["/api/reseller/customers", practice?.customerId],
    queryFn: async () => {
      const res = await fetch(`/api/reseller/customers`);
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
      toast({ title: t("utility.taskCreated") });
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
      toast({ title: t("utility.taskUpdated") });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${params.id}/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "tasks"] });
      toast({ title: t("utility.taskDeleted") });
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
      toast({ title: t("utility.noteAdded") });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${params.id}/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "notes"] });
      toast({ title: t("utility.noteDeleted") });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: { status: string; reason?: string }) => {
      const res = await apiRequest("PATCH", `/api/utility/practices/${params.id}/status`, data);
      return await res.json();
    },
    onSuccess: (data: { practice: any; invoice: any | null }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "timeline"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "state-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setStatusDialogOpen(false);
      setStatusReason("");
      const invoiceMsg = data.invoice 
        ? ` - ${t("utility.invoiceGenerated", { number: data.invoice.invoiceNumber })}`
        : "";
      toast({ title: t("utility.statusUpdated") + invoiceMsg });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/practices/${params.id}/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "timeline"] });
      toast({ title: t("utility.documentDeleted") });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'altro');
      
      const res = await fetch(`/api/utility/practices/${params.id}/documents`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || t("utility.uploadError"));
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/utility/practices", params.id, "timeline"] });
      toast({ title: t("utility.documentUploaded") });
    } catch (error: any) {
      toast({ 
        title: t("common.error"), 
        description: error.message || t("utility.cannotUploadDocument"),
        variant: "destructive" 
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
          <h2 className="text-xl font-semibold mb-2">{t("utility.practiceNotFound")}</h2>
          <Link href="/reseller/utility/practices">
            <Button variant="outline">{t("utility.backToPractices")}</Button>
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
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/reseller/utility/practices">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-practice-number">{practice.practiceNumber}</h1>
            <p className="text-muted-foreground">
              {practice.itemType === "product" 
                ? product?.name || t("common.product") 
                : `${supplier?.name || ""} - ${(practice as any).customServiceName || service?.name || ""}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            {t("utility.changeStatus")}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-practice">
          <TabsTrigger value="panoramica" className="flex flex-wrap items-center gap-2" data-testid="tab-panoramica">
            <FileText className="h-4 w-4" />
            {t("utility.overview")}
          </TabsTrigger>
          <TabsTrigger value="attivita" className="flex flex-wrap items-center gap-2" data-testid="tab-attivita">
            <CheckSquare className="h-4 w-4" />
            {t("utility.tasks")} ({completedTasks}/{totalTasks})
          </TabsTrigger>
          <TabsTrigger value="documenti" className="flex flex-wrap items-center gap-2" data-testid="tab-documenti">
            <Upload className="h-4 w-4" />
            {t("utility.documents")} ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="cronologia" className="flex flex-wrap items-center gap-2" data-testid="tab-cronologia">
            <Clock className="h-4 w-4" />
            {t("utility.timeline")}
          </TabsTrigger>
          <TabsTrigger value="note" className="flex flex-wrap items-center gap-2" data-testid="tab-note">
            <MessageSquare className="h-4 w-4" />
            {t("common.notes")} ({notes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panoramica" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("utility.customerInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium" data-testid="text-customer-name">{customer?.fullName || "-"}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{t("common.email")}: {customer?.email || "-"}</p>
                  <p>{t("common.phone")}: {customer?.phone || "-"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {practice.itemType === "product" ? t("utility.productDetails") : 
                   practice.itemType === "service_with_products" ? t("utility.serviceAndProductDetails") : 
                   t("utility.serviceDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Tipo Badge */}
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.type")}</p>
                  <Badge variant="outline" className="mt-1">
                    {practice.itemType === "product" ? (
                      <><Package className="h-3 w-3 mr-1" />{t("common.product")}</>
                    ) : practice.itemType === "service_with_products" ? (
                      <><FileText className="h-3 w-3 mr-1" /><Package className="h-3 w-3 mr-1" />{t("utility.serviceAndProducts")}</>
                    ) : (
                      <>{t("utility.utilityService")}</>
                    )}
                  </Badge>
                </div>

                {/* Sezione Servizio (per service e service_with_products) */}
                {(practice.itemType === "service" || practice.itemType === "service_with_products") && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.supplier")}</p>
                      <p className="font-medium" data-testid="text-supplier-name">{supplier?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.service")}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium" data-testid="text-service-name">
                          {(practice as any).customServiceName || service?.name || "-"}
                        </p>
                        {(practice as any).customServiceName && (
                          <Badge variant="outline" className="text-xs">{t("utility.temporary")}</Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Sezione Prodotti (per product e service_with_products) */}
                {(practice.itemType === "product" || practice.itemType === "service_with_products") && (
                  <>
                    {practiceProducts.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{t("utility.productsCount", { count: practiceProducts.length })}</p>
                        <div className="border rounded-md overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2 font-medium">{t("common.product")}</th>
                                <th className="text-right p-2 font-medium">{t("common.quantity")}</th>
                                <th className="text-right p-2 font-medium">{t("utility.unitPrice")}</th>
                                <th className="text-right p-2 font-medium">{t("common.total")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {practiceProducts.map((pp, index) => (
                                <tr key={pp.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                                  <td className="p-2">
                                    <div className="font-medium">{pp.product?.name || "-"}</div>
                                    {pp.product?.sku && (
                                      <div className="text-xs text-muted-foreground">{pp.product.sku}</div>
                                    )}
                                  </td>
                                  <td className="p-2 text-right">{pp.quantity}</td>
                                  <td className="p-2 text-right">{formatCurrency(pp.unitPriceCents)}</td>
                                  <td className="p-2 text-right font-medium">{formatCurrency(pp.quantity * pp.unitPriceCents)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-muted/50 border-t">
                              <tr>
                                <td colSpan={3} className="p-2 text-right font-medium">{t("utility.productsTotal")}:</td>
                                <td className="p-2 text-right font-bold" data-testid="text-products-total">
                                  {formatCurrency(practiceProducts.reduce((sum, pp) => sum + (pp.quantity * pp.unitPriceCents), 0))}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    ) : practice.itemType === "product" && product ? (
                      <div>
                        <p className="text-sm text-muted-foreground">{t("common.product")}</p>
                        <p className="font-medium" data-testid="text-product-name">{product?.name || "-"}</p>
                        {product?.sku && (
                          <p className="text-xs text-muted-foreground">{t("products.sku")}: {product.sku}</p>
                        )}
                      </div>
                    ) : null}
                  </>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">
                    {practice.priceType === "forfait" ? t("utility.flatPrice") : t("utility.monthlyFee")}
                  </p>
                  <p className="font-medium" data-testid="text-price">
                    {practice.priceType === "forfait" 
                      ? formatCurrency(practice.flatPriceCents) 
                      : formatCurrency(practice.monthlyPriceCents)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("utility.importantDates")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("utility.createdOn")}</p>
                    <p className="font-medium">{formatDateShort(practice.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("utility.sentOn")}</p>
                    <p className="font-medium">{formatDateShort(practice.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("utility.expectedActivation")}</p>
                    <p className="font-medium">{formatDateShort(practice.expectedActivationDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("utility.activatedOn")}</p>
                    <p className="font-medium">{formatDateShort(practice.activatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("utility.references")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t("utility.supplierReference")}</p>
                  <p className="font-medium">{practice.supplierReference || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("common.priority")}</p>
                  <Badge className={priorityColors[(practice.priority as Priority) || "normale"]}>
                    {priorityLabels[(practice.priority as Priority) || "normale"]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("utility.communicationChannel")}</p>
                  <p className="font-medium">{practice.communicationChannel || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {practice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("utility.practiceNotes")}</CardTitle>
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
              <h3 className="text-lg font-semibold">{t("utility.tasksToComplete")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("utility.completedOf", { completed: completedTasks, total: totalTasks })}
              </p>
            </div>
            <Button onClick={() => setTaskDialogOpen(true)} data-testid="button-add-task">
              <Plus className="h-4 w-4 mr-2" />
              {t("utility.newTask")}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("utility.noTasks")}
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
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex flex-wrap items-center gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {taskStatusLabels[task.status as TaskStatus]}
                            </span>
                            {task.dueDate && (
                              <span className="flex flex-wrap items-center gap-1">
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
            data-testid="input-file-upload"
          />
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{t("utility.attachedDocuments")}</h3>
              <p className="text-sm text-muted-foreground">{documents.length} {t("utility.documents").toLowerCase()}</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="button-upload-document"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? t("common.loading") : t("utility.uploadDocument")}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("utility.noDocuments")}
                </div>
              ) : (
                <div className="divide-y">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex flex-wrap items-center gap-3 p-4 hover:bg-muted/50"
                      data-testid={`document-item-${doc.id}`}
                    >
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{doc.fileName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline">{documentCategoryLabels[doc.category] || doc.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          window.open(`/api/utility/practices/${params.id}/documents/${doc.id}/download`, '_blank');
                        }}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        data-testid={`button-delete-doc-${doc.id}`}
                      >
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
              <h3 className="text-lg font-semibold">{t("utility.eventTimeline")}</h3>
              <p className="text-sm text-muted-foreground">{timeline.length} {t("utility.events")}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  {t("utility.stateHistory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stateHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {t("utility.noStateChanges")}
                  </div>
                ) : (
                  <div className="divide-y">
                    {stateHistory.map((entry) => (
                      <div key={entry.id} className="flex flex-wrap items-center gap-3 p-4">
                        <div className="flex flex-wrap items-center gap-2">
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
                  {t("utility.eventTimeline")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t("utility.noEvents")}
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
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{formatDate(event.createdAt)}</span>
                              <span>•</span>
                              <span>{users.find(u => u.id === event.createdBy)?.fullName || t("utility.system")}</span>
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
              <h3 className="text-lg font-semibold">{t("utility.notesAndCommunications")}</h3>
              <p className="text-sm text-muted-foreground">{notes.length} {t("common.notes").toLowerCase()}</p>
            </div>
            <Button onClick={() => setNoteDialogOpen(true)} data-testid="button-add-note">
              <Plus className="h-4 w-4 mr-2" />
              {t("utility.newNote")}
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("utility.noNotes")}
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
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant={note.visibility === "internal" ? "secondary" : "outline"}>
                              {note.visibility === "internal" ? t("utility.internal") : t("common.customer")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(note.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{note.body}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t("utility.by")} {users.find(u => u.id === note.createdBy)?.fullName || t("utility.system")}
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
            <DialogTitle>{t("utility.newTask")}</DialogTitle>
            <DialogDescription>{t("utility.addTaskDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">{t("common.title")} *</Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder={t("utility.placeholderTaskTitle")}
                data-testid="input-task-title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">{t("common.description")}</Label>
              <Textarea
                id="task-description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder={t("utility.optionalDescription")}
                data-testid="input-task-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => createTaskMutation.mutate({ title: newTaskTitle, description: newTaskDescription || undefined })}
              disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
              data-testid="button-save-task"
            >{t("common.add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("utility.newNote")}</DialogTitle>
            <DialogDescription>{t("utility.addNoteDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note-visibility">{t("utility.visibility")}</Label>
              <Select value={newNoteVisibility} onValueChange={(v) => setNewNoteVisibility(v as "internal" | "customer")}>
                <SelectTrigger data-testid="select-note-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t("utility.internalOnly")}</SelectItem>
                  <SelectItem value="customer">{t("utility.visibleToCustomer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note-body">{t("utility.content")} *</Label>
              <Textarea
                id="note-body"
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder={t("utility.writeNote")}
                rows={4}
                data-testid="input-note-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => createNoteMutation.mutate({ body: newNoteBody, visibility: newNoteVisibility })}
              disabled={!newNoteBody.trim() || createNoteMutation.isPending}
              data-testid="button-save-note"
            >{t("common.add")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("utility.changeStatusTitle")}</DialogTitle>
            <DialogDescription>{t("utility.changeStatusDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("utility.newStatus")}</Label>
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
              <Label htmlFor="status-reason">{t("utility.reasonOptional")}</Label>
              <Textarea
                id="status-reason"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder={t("utility.reasonForStatusChange")}
                data-testid="input-status-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button 
              onClick={() => updateStatusMutation.mutate({ status: newStatus, reason: statusReason || undefined })}
              disabled={updateStatusMutation.isPending}
              data-testid="button-update-status"
            >{t("common.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
