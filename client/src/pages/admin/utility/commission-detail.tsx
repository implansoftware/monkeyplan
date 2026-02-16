import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { UtilityCommission, UtilityPractice, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Coins, Clock, CheckCircle2, XCircle, Calendar,
  FileText, Pencil, Trash2, Check, X, UserCheck, Ban
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type CommissionStatus = "pending" | "accrued" | "invoiced" | "paid" | "cancelled";

const statusLabels: Record<CommissionStatus, string> = {
  pending: "In Attesa",
  accrued: "Maturata",
  invoiced: "Fatturata",
  paid: "Pagata",
  cancelled: "Annullata",
};

const statusColors: Record<CommissionStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  accrued: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  invoiced: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusIcons: Record<CommissionStatus, typeof Clock> = {
  pending: Clock,
  accrued: CheckCircle2,
  invoiced: FileText,
  paid: CheckCircle2,
  cancelled: XCircle,
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

const months = [
  { value: 1, label: "Gennaio" },
  { value: 2, label: "Febbraio" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Aprile" },
  { value: 5, label: "Maggio" },
  { value: 6, label: "Giugno" },
  { value: 7, label: "Luglio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Settembre" },
  { value: 10, label: "Ottobre" },
  { value: 11, label: "Novembre" },
  { value: 12, label: "Dicembre" },
];

export default function AdminUtilityCommissionDetail() {
  const { t } = useTranslation();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: commission, isLoading } = useQuery<UtilityCommission>({
    queryKey: ["/api/utility/commissions", params.id],
    enabled: !!params.id,
  });

  const { data: practice } = useQuery<UtilityPractice>({
    queryKey: ["/api/utility/practices", commission?.practiceId],
    enabled: !!commission?.practiceId,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/utility/commissions/${id}/approve`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      toast({ title: t("utility.commissionApproved"), description: t("utility.commissionApprovedDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/utility/commissions/${id}/reject`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      toast({ title: t("utility.commissionRejected") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/utility/commissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/utility/commissions"] });
      toast({ title: t("utility.commissionDeleted") });
      setLocation("/admin/utility/commissions");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return "-";
    const user = users.find(u => u.id === userId);
    return user ? user.fullName || user.username : userId.slice(0, 8);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!commission) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold mb-1">Commissione non trovata</h2>
          <p className="text-muted-foreground mb-4">La commissione richiesta non esiste o non hai i permessi per visualizzarla.</p>
          <Link href="/admin/utility/commissions">
            <Button variant="outline" data-testid="button-back-to-list">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla lista
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const StatusIcon = statusIcons[commission.status];
  const periodLabel = `${months.find(m => m.value === commission.periodMonth)?.label || ""} ${commission.periodYear}`;

  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/utility/commissions">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Dettaglio Compenso</h1>
                <Badge className={statusColors[commission.status]}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusLabels[commission.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {practice?.practiceNumber || commission.practiceId.slice(0, 8)} - {periodLabel}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {commission.status === "pending" && (
              <>
                <Button
                  variant="default"
                  onClick={() => approveMutation.mutate(commission.id)}
                  disabled={approveMutation.isPending}
                  data-testid="button-approve"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approva
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setRejectReason(""); setRejectDialogOpen(true); }}
                  disabled={rejectMutation.isPending}
                  data-testid="button-reject"
                >
                  <X className="h-4 w-4 mr-2" />
                  Rifiuta
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              data-testid="button-delete"
            >
              <Trash2 className="h-4 w-4 mr-2 text-destructive" />
              Elimina
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-commission-info">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Informazioni Compenso</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("common.amount")}</p>
                <p className="text-2xl font-bold" data-testid="text-amount">
                  {formatCurrency(commission.amountCents)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.status")}</p>
                <Badge className={`mt-1 ${statusColors[commission.status]}`} data-testid="text-status">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusLabels[commission.status]}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Periodo</p>
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium" data-testid="text-period">{periodLabel}</span>
                </div>
              </div>
              {commission.invoiceNumber && (
                <div>
                  <p className="text-sm text-muted-foreground">N. Fattura</p>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium" data-testid="text-invoice-number">{commission.invoiceNumber}</span>
                  </div>
                </div>
              )}
            </div>
            {commission.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("common.notes")}</p>
                  <p className="text-sm" data-testid="text-notes">{commission.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-practice-info">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Pratica Collegata</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {practice ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Numero Pratica</p>
                    <Link href={`/admin/utility/practices/${practice.id}`}>
                      <span className="text-sm font-medium text-primary cursor-pointer hover:underline" data-testid="link-practice">
                        {practice.practiceNumber}
                      </span>
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stato Pratica</p>
                    <p className="text-sm font-medium mt-1" data-testid="text-practice-status">
                      {practice.status === "completata" ? "Completata" :
                       practice.status === "in_lavorazione" ? "In Lavorazione" :
                       practice.status === "bozza" ? "Bozza" :
                       practice.status === "inviata" ? "Inviata" :
                       practice.status === "attesa_documenti" ? "Attesa Documenti" :
                       practice.status === "annullata" ? "Annullata" :
                       practice.status === "rifiutata" ? "Rifiutata" :
                       practice.status}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("common.type")}</p>
                    <p className="text-sm font-medium" data-testid="text-practice-type">{practice.itemType || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commissione Pratica</p>
                    <p className="text-sm font-medium" data-testid="text-practice-value">
                      {formatCurrency(practice.commissionAmountCents)}
                    </p>
                  </div>
                </div>
                {practice.temporaryCustomerName && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.customer")}</p>
                      <p className="text-sm font-medium" data-testid="text-practice-customer">{practice.temporaryCustomerName}</p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Caricamento pratica...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-timeline">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Cronologia</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Coins className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Commissione Creata</p>
                <p className="text-xs text-muted-foreground" data-testid="text-created-at">{formatDate(commission.createdAt)}</p>
              </div>
            </div>

            {commission.approvedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Approvata</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-approved-at">
                    {formatDate(commission.approvedAt)} da {getUserName(commission.approvedBy)}
                  </p>
                </div>
              </div>
            )}

            {commission.accruedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Maturata</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-accrued-at">{formatDate(commission.accruedAt)}</p>
                </div>
              </div>
            )}

            {commission.invoicedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Fatturata</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-invoiced-at">
                    {formatDate(commission.invoicedAt)}
                    {commission.invoiceNumber && ` - Fattura ${commission.invoiceNumber}`}
                  </p>
                </div>
              </div>
            )}

            {commission.paidAt && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t("invoices.paid")}</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-paid-at">{formatDate(commission.paidAt)}</p>
                </div>
              </div>
            )}

            {commission.rejectedAt && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                  <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Rifiutata</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-rejected-at">
                    {formatDate(commission.rejectedAt)} da {getUserName(commission.rejectedBy)}
                  </p>
                  {commission.rejectedReason && (
                    <p className="text-sm mt-1 text-red-600 dark:text-red-400" data-testid="text-rejected-reason">
                      Motivo: {commission.rejectedReason}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Ultimo Aggiornamento</p>
                <p className="text-xs text-muted-foreground" data-testid="text-updated-at">{formatDate(commission.updatedAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("utility.rejectCommission")}</DialogTitle>
            <DialogDescription>Inserisci il motivo del rifiuto della commissione.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Motivo *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t("utility.rejectionReason")}
                data-testid="textarea-reject-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} data-testid="button-cancel-reject">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ id: commission.id, reason: rejectReason })}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              Rifiuta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("utility.deleteCommission")}</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare questa commissione? L'azione non può essere annullata.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(commission.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}