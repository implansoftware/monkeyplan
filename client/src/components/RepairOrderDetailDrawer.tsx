import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AttachmentUploader } from "@/components/AttachmentUploader";
import { Wrench, Euro, FileText, Paperclip, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

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

  const getStatusBadge = (status: string) => {
    switch (status) {
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
