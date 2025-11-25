import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { DiagnosisFormDialog } from "@/components/DiagnosisFormDialog";
import { QuoteFormDialog } from "@/components/QuoteFormDialog";
import { PartsOrderDialog } from "@/components/PartsOrderDialog";
import { RepairLogDialog } from "@/components/RepairLogDialog";
import { TestChecklistDialog } from "@/components/TestChecklistDialog";
import { DeliveryDialog } from "@/components/DeliveryDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench, Euro, FileText, Paperclip, Calendar, Package, ClipboardList,
  ClipboardCheck, PackageCheck, Play, CheckCircle, Stethoscope, Receipt,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

type RepairQuote = {
  id: string;
  repairOrderId: string;
  quoteNumber: string;
  parts: any;
  laborCost: number;
  totalAmount: number;
  status: string;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
};

type RepairOrder = {
  id: string;
  orderNumber: string;
  customerId: string;
  resellerId: string | null;
  repairCenterId: string | null;
  deviceType: string;
  deviceModel: string;
  issueDescription: string;
  status: string;
  estimatedCost: number | null;
  finalCost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

interface RepairOrderDetailDrawerProps {
  repairOrderId: string | null;
  open: boolean;
  onClose: () => void;
}

export function RepairOrderDetailDrawer({
  repairOrderId,
  open,
  onClose,
}: RepairOrderDetailDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [diagnosisDialogOpen, setDiagnosisDialogOpen] = useState(false);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [partsDialogOpen, setPartsDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

  const { data: repair, isLoading, error } = useQuery<RepairOrder>({
    queryKey: ["/api/repair-orders", repairOrderId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      const response = await fetch(`/api/repair-orders/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Riparazione non trovata");
        if (response.status === 403) throw new Error("Accesso negato");
        throw new Error("Errore nel caricamento");
      }
      return response.json();
    },
    enabled: !!repairOrderId && open,
    retry: false,
  });

  const { data: quote } = useQuery<RepairQuote>({
    queryKey: ["/api/repair-orders", repairOrderId, "quote"],
    queryFn: async () => {
      const response = await fetch(`/api/repair-orders/${repairOrderId}/quote`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Errore nel caricamento preventivo");
      }
      return response.json();
    },
    enabled: !!repairOrderId && open,
    retry: false,
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return await apiRequest("PATCH", `/api/repair-orders/${repairOrderId}/quote`, { status });
    },
    onSuccess: () => {
      toast({ title: "Stato preventivo aggiornato" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId, "quote"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  // Calculate permissions based on user role and repair order ownership
  const canUpload = repair && user ? (
    user.role === 'admin' ||
    (user.role === 'customer' && repair.customerId === user.id) ||
    (user.role === 'reseller' && repair.resellerId === user.id) ||
    (user.role === 'repair_center' && repair.repairCenterId === user.repairCenterId)
  ) : false;

  const canDelete = repair && user ? (
    user.role === 'admin' ||
    (user.role === 'repair_center' && repair.repairCenterId === user.repairCenterId)
  ) : false;

  const canManageWorkflow = user ? (
    user.role === 'admin' || user.role === 'repair_center'
  ) : false;

  const startRepairMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/start-repair`);
    },
    onSuccess: () => {
      toast({ title: "Riparazione avviata" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const readyForPickupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/repair-orders/${repairOrderId}/ready-for-pickup`);
    },
    onSuccess: () => {
      toast({ title: "Dispositivo pronto per il ritiro" });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ingressato": return <Badge variant="secondary" data-testid={`status-${status}`}>Ingressato</Badge>;
      case "in_diagnosi": return <Badge variant="outline" data-testid={`status-${status}`}>In Diagnosi</Badge>;
      case "preventivo_inviato": return <Badge variant="outline" data-testid={`status-${status}`}>Preventivo Inviato</Badge>;
      case "preventivo_accettato": return <Badge data-testid={`status-${status}`}>Preventivo Accettato</Badge>;
      case "preventivo_rifiutato": return <Badge variant="destructive" data-testid={`status-${status}`}>Preventivo Rifiutato</Badge>;
      case "attesa_ricambi": return <Badge variant="outline" data-testid={`status-${status}`}>Attesa Ricambi</Badge>;
      case "in_riparazione": return <Badge data-testid={`status-${status}`}>In Riparazione</Badge>;
      case "in_test": return <Badge data-testid={`status-${status}`}>In Test</Badge>;
      case "pronto_ritiro": return <Badge data-testid={`status-${status}`}>Pronto Ritiro</Badge>;
      case "consegnato": return <Badge variant="outline" data-testid={`status-${status}`}>Consegnato</Badge>;
      case "annullato": return <Badge variant="destructive" data-testid={`status-${status}`}>Annullato</Badge>;
      // Legacy stati
      case "pending": return <Badge variant="secondary" data-testid={`status-${status}`}>In attesa</Badge>;
      case "in_progress": return <Badge data-testid={`status-${status}`}>In lavorazione</Badge>;
      case "waiting_parts": return <Badge variant="outline" data-testid={`status-${status}`}>In attesa pezzi</Badge>;
      case "completed": return <Badge variant="outline" data-testid={`status-${status}`}>Completata</Badge>;
      case "delivered": return <Badge variant="outline" data-testid={`status-${status}`}>Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive" data-testid={`status-${status}`}>Annullata</Badge>;
      default: return <Badge variant="outline" data-testid={`status-${status}`}>{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "Da definire";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto" data-testid="sheet-repair-detail">
        <SheetHeader>
          <SheetTitle data-testid="text-drawer-title">Dettaglio Riparazione</SheetTitle>
          {repair && (
            <SheetDescription data-testid="text-order-number">
              Ordine #{repair.orderNumber}
            </SheetDescription>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : repair ? (
          <div className="space-y-6 mt-6">
            {/* Status */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Stato</span>
                {getStatusBadge(repair.status)}
              </div>
            </div>

            <Separator />

            {/* Device Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Wrench className="h-4 w-4" />
                Dispositivo
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="text-sm font-medium" data-testid="text-device-type">{repair.deviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modello</p>
                  <p className="text-sm font-medium" data-testid="text-device-model">{repair.deviceModel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Problema</p>
                  <p className="text-sm" data-testid="text-issue-description">{repair.issueDescription}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cost Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Euro className="h-4 w-4" />
                Costi
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Costo Stimato</p>
                  <p className="text-lg font-bold text-primary" data-testid="text-estimated-cost">
                    {formatCurrency(repair.estimatedCost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Costo Finale</p>
                  <p className="text-lg font-bold" data-testid="text-final-cost">
                    {repair.finalCost ? formatCurrency(repair.finalCost) : "Da confermare"}
                  </p>
                </div>
              </div>
            </div>

            {/* Quote Info */}
            {quote && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Receipt className="h-4 w-4" />
                    Preventivo
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Numero</p>
                      <p className="text-sm font-mono" data-testid="text-quote-number">{quote.quoteNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Totale</p>
                      <p className="text-lg font-bold text-primary" data-testid="text-quote-total">
                        {formatCurrency(quote.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Stato Preventivo</p>
                      {canManageWorkflow ? (
                        <Select
                          value={quote.status}
                          onValueChange={(value) => updateQuoteStatusMutation.mutate(value)}
                          disabled={updateQuoteStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-full" data-testid="select-quote-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Bozza</SelectItem>
                            <SelectItem value="sent">Inviato</SelectItem>
                            <SelectItem value="accepted">Accettato</SelectItem>
                            <SelectItem value="rejected">Rifiutato</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge 
                          variant={quote.status === 'accepted' ? 'default' : quote.status === 'rejected' ? 'destructive' : 'secondary'}
                          data-testid="badge-quote-status"
                        >
                          {quote.status === 'draft' && 'Bozza'}
                          {quote.status === 'sent' && 'Inviato'}
                          {quote.status === 'accepted' && 'Accettato'}
                          {quote.status === 'rejected' && 'Rifiutato'}
                        </Badge>
                      )}
                    </div>
                    {quote.validUntil && (
                      <div>
                        <p className="text-sm text-muted-foreground">Valido fino al</p>
                        <p className="text-sm" data-testid="text-quote-valid-until">
                          {format(new Date(quote.validUntil), "dd/MM/yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {repair.notes && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <FileText className="h-4 w-4" />
                    Note
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-notes">
                    {repair.notes}
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Dates */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="h-4 w-4" />
                Date
              </div>
              <div className="grid gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Creata</p>
                  <p className="text-sm" data-testid="text-created-at">
                    {format(new Date(repair.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aggiornata</p>
                  <p className="text-sm" data-testid="text-updated-at">
                    {format(new Date(repair.updatedAt), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-medium">
                <Paperclip className="h-4 w-4" />
                Allegati
              </div>
              <AttachmentUploader
                repairOrderId={repair.id}
                canUpload={canUpload}
                canDelete={canDelete}
              />
            </div>

            {/* Workflow Actions */}
            {canManageWorkflow && (
              <>
                <Separator />
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Azioni Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    {/* Download Intake Document - always available */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/repair-orders/${repair.id}/intake-document`, '_blank')}
                      className="gap-1"
                      data-testid="button-intake-document"
                    >
                      <Download className="h-4 w-4" />
                      Doc. Accettazione
                    </Button>

                    {/* Download Delivery Document - available when delivered */}
                    {repair.status === 'consegnato' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/api/repair-orders/${repair.id}/delivery-document`, '_blank')}
                        className="gap-1"
                        data-testid="button-delivery-document"
                      >
                        <Download className="h-4 w-4" />
                        Doc. Consegna
                      </Button>
                    )}

                    {/* Diagnosis - available when order is received */}
                    {['ingressato', 'in_diagnosi'].includes(repair.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDiagnosisDialogOpen(true)}
                        className="gap-1"
                        data-testid="button-diagnosis"
                      >
                        <Stethoscope className="h-4 w-4" />
                        Diagnosi
                      </Button>
                    )}

                    {/* Quote - available after diagnosis */}
                    {['in_diagnosi', 'preventivo_inviato'].includes(repair.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setQuoteDialogOpen(true)}
                        className="gap-1"
                        data-testid="button-quote"
                      >
                        <Receipt className="h-4 w-4" />
                        Preventivo
                      </Button>
                    )}

                    {/* Parts Order - available when quote is accepted or waiting for parts */}
                    {['preventivo_accettato', 'attesa_ricambi'].includes(repair.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPartsDialogOpen(true)}
                        className="gap-1"
                        data-testid="button-parts-order"
                      >
                        <Package className="h-4 w-4" />
                        Ordina Ricambi
                      </Button>
                    )}

                    {/* Start Repair - available when quote is accepted or parts received */}
                    {['preventivo_accettato', 'attesa_ricambi'].includes(repair.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startRepairMutation.mutate()}
                        disabled={startRepairMutation.isPending}
                        className="gap-1"
                        data-testid="button-start-repair"
                      >
                        <Play className="h-4 w-4" />
                        Avvia Riparazione
                      </Button>
                    )}

                    {/* Repair Logs - available during repair */}
                    {['in_riparazione', 'in_test'].includes(repair.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsDialogOpen(true)}
                        className="gap-1"
                        data-testid="button-repair-logs"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Log Attività
                      </Button>
                    )}

                    {/* Test Checklist - available during repair or test */}
                    {['in_riparazione', 'in_test'].includes(repair.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTestDialogOpen(true)}
                        className="gap-1"
                        data-testid="button-test-checklist"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        Collaudo
                      </Button>
                    )}

                    {/* Ready for Pickup - available after tests */}
                    {repair.status === 'in_test' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => readyForPickupMutation.mutate()}
                        disabled={readyForPickupMutation.isPending}
                        className="gap-1"
                        data-testid="button-ready-pickup"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Pronto Ritiro
                      </Button>
                    )}

                    {/* Complete Delivery - available when ready for pickup */}
                    {repair.status === 'pronto_ritiro' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setDeliveryDialogOpen(true)}
                        className="gap-1"
                        data-testid="button-delivery"
                      >
                        <PackageCheck className="h-4 w-4" />
                        Consegna
                      </Button>
                    )}

                    {/* View Delivery - available when delivered */}
                    {repair.status === 'consegnato' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeliveryDialogOpen(true)}
                        className="gap-1"
                        data-testid="button-view-delivery"
                      >
                        <PackageCheck className="h-4 w-4" />
                        Dettagli Consegna
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Dialogs */}
            {repairOrderId && (
              <>
                <DiagnosisFormDialog
                  open={diagnosisDialogOpen}
                  onOpenChange={setDiagnosisDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <QuoteFormDialog
                  open={quoteDialogOpen}
                  onOpenChange={setQuoteDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <PartsOrderDialog
                  open={partsDialogOpen}
                  onOpenChange={setPartsDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <RepairLogDialog
                  open={logsDialogOpen}
                  onOpenChange={setLogsDialogOpen}
                  repairOrderId={repairOrderId}
                />
                <TestChecklistDialog
                  open={testDialogOpen}
                  onOpenChange={setTestDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
                <DeliveryDialog
                  open={deliveryDialogOpen}
                  onOpenChange={setDeliveryDialogOpen}
                  repairOrderId={repairOrderId}
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/repair-orders", repairOrderId] })}
                />
              </>
            )}
          </div>
        ) : error ? (
          <div className="mt-6 text-center text-destructive" data-testid="error-repair-load">
            {error.message}
          </div>
        ) : (
          <div className="mt-6 text-center text-muted-foreground">
            Riparazione non trovata
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
