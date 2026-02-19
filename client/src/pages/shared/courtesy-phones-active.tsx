import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Phone, RotateCcw, Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

type CourtesyPhoneLoan = {
  repairOrderId: string;
  orderNumber: string;
  deviceModel: string;
  brand: string | null;
  status: string;
  courtesyPhoneAssignedAt: string | null;
  courtesyPhoneReturnedAt: string | null;
  courtesyPhoneNotes: string | null;
  courtesyPhoneProduct: {
    id: string;
    name: string;
    brand: string | null;
    sku: string | null;
    imageUrl: string | null;
  } | null;
  customer: {
    id: string;
    fullName: string | null;
    phone: string | null;
  } | null;
};

interface CourtesyPhonesActivePageProps {
  backPath: string;
  rolePrefix: string;
}

export default function CourtesyPhonesActivePage({ backPath, rolePrefix }: CourtesyPhonesActivePageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [returnDialogOrderId, setReturnDialogOrderId] = useState<string | null>(null);

  const { data: loans = [], isLoading } = useQuery<CourtesyPhoneLoan[]>({
    queryKey: ["/api/courtesy-phones/active", statusFilter],
    queryFn: async () => {
      const response = await fetch(`/api/courtesy-phones/active?status=${statusFilter}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch");
      return response.json();
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest("PATCH", `/api/repair-orders/${orderId}/courtesy-phone-return`, {});
    },
    onSuccess: () => {
      toast({ title: t("repair.courtesyPhoneReturned") });
      queryClient.invalidateQueries({ queryKey: ["/api/courtesy-phones/active"] });
      setReturnDialogOrderId(null);
    },
    onError: (error: Error) => {
      toast({ title: t("repair.courtesyPhoneReturnError"), description: error.message, variant: "destructive" });
    },
  });

  const activeCount = loans.filter(l => !l.courtesyPhoneReturnedAt).length;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={backPath}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          <h1 className="text-xl font-bold" data-testid="text-page-title">{t("repair.courtesyPhonesActiveTitle", "Telefoni di Cortesia")}</h1>
        </div>
        {statusFilter === "active" && (
          <Badge variant="outline" className="text-cyan-600 border-cyan-500/30" data-testid="badge-active-count">
            {activeCount} {t("repair.courtesyPhoneActiveBadge", "In prestito")}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="text-base">{t("repair.courtesyPhoneLoans", "Prestiti telefoni di cortesia")}</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active" data-testid="select-item-active">{t("repair.courtesyPhoneFilterActive", "In prestito")}</SelectItem>
                <SelectItem value="returned" data-testid="select-item-returned">{t("repair.courtesyPhoneFilterReturned", "Restituiti")}</SelectItem>
                <SelectItem value="all" data-testid="select-item-all">{t("common.all", "Tutti")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-loans">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("repair.courtesyPhoneNoLoans", "Nessun prestito trovato")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("repairs.orderNumber", "N. Ordine")}</TableHead>
                    <TableHead>{t("repairs.customer", "Cliente")}</TableHead>
                    <TableHead>{t("repair.courtesyPhoneLabel", "Tel. Cortesia")}</TableHead>
                    <TableHead>{t("repair.courtesyPhoneAssignedDate", "Data assegnazione")}</TableHead>
                    <TableHead>{t("common.status", "Stato")}</TableHead>
                    <TableHead className="text-right">{t("common.actions", "Azioni")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((loan) => (
                    <TableRow key={loan.repairOrderId} data-testid={`row-loan-${loan.repairOrderId}`}>
                      <TableCell>
                        <Link href={`${rolePrefix}/repairs/${loan.repairOrderId}`}>
                          <span className="text-primary hover:underline cursor-pointer inline-flex items-center gap-1" data-testid={`link-order-${loan.repairOrderId}`}>
                            {loan.orderNumber}
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {loan.brand} {loan.deviceModel}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium" data-testid={`text-customer-${loan.repairOrderId}`}>
                          {loan.customer?.fullName || "-"}
                        </p>
                        {loan.customer?.phone && (
                          <p className="text-xs text-muted-foreground">{loan.customer.phone}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {loan.courtesyPhoneProduct?.imageUrl ? (
                            <img
                              src={loan.courtesyPhoneProduct.imageUrl}
                              alt={loan.courtesyPhoneProduct.name}
                              className="w-8 h-8 rounded object-cover border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center border">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">{loan.courtesyPhoneProduct?.name || "-"}</p>
                            {loan.courtesyPhoneProduct?.brand && (
                              <p className="text-xs text-muted-foreground">{loan.courtesyPhoneProduct.brand}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {loan.courtesyPhoneAssignedAt
                            ? format(new Date(loan.courtesyPhoneAssignedAt), "dd/MM/yyyy", { locale: it })
                            : "-"}
                        </p>
                        {loan.courtesyPhoneReturnedAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t("repair.courtesyPhoneReturnedDate", "Restituito")}: {format(new Date(loan.courtesyPhoneReturnedAt), "dd/MM/yyyy", { locale: it })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {loan.courtesyPhoneReturnedAt ? (
                          <Badge variant="outline" className="text-green-600 border-green-500/30" data-testid={`badge-status-${loan.repairOrderId}`}>
                            {t("repair.courtesyPhoneReturnedBadge", "Restituito")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-cyan-600 border-cyan-500/30" data-testid={`badge-status-${loan.repairOrderId}`}>
                            {t("repair.courtesyPhoneActiveBadge", "In prestito")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!loan.courtesyPhoneReturnedAt && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReturnDialogOrderId(loan.repairOrderId)}
                                data-testid={`button-return-${loan.repairOrderId}`}
                              >
                                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                                {t("repair.returnCourtesyPhone")}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("repair.courtesyPhoneReturnConfirm")}</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!returnDialogOrderId} onOpenChange={(open) => !open && setReturnDialogOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("repair.courtesyPhoneReturn")}</DialogTitle>
            <DialogDescription>{t("repair.courtesyPhoneReturnConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnDialogOrderId(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => returnDialogOrderId && returnMutation.mutate(returnDialogOrderId)}
              disabled={returnMutation.isPending}
              data-testid="button-confirm-return"
            >
              {returnMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
