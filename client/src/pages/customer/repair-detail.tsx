import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clock, Euro, Package, Wrench, FileText, Paperclip } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { format } from "date-fns";
import { AttachmentUploader } from "@/components/AttachmentUploader";
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

const statusSteps = [
  { key: "pending", label: "In attesa" },
  { key: "in_progress", label: "In lavorazione" },
  { key: "completed", label: "Completata" },
  { key: "delivered", label: "Consegnata" },
];

export default function CustomerRepairDetail() {
  const [, params] = useRoute("/customer/repairs/:id");
  const [, setLocation] = useLocation();
  const repairId = params?.id;
  const { user } = useAuth();

  const { data: repair, isLoading } = useQuery<RepairOrder>({
    queryKey: ["/api/customer/repairs", repairId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      const response = await fetch(`/api/customer/repairs/${id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Riparazione non trovata");
        if (response.status === 403) throw new Error("Accesso negato");
        throw new Error("Errore nel caricamento");
      }
      return response.json();
    },
    enabled: !!repairId,
    retry: false,
  });

  // Customer can upload to own repair orders
  const canUpload = repair && user ? repair.customerId === user.id : false;
  // Customer can delete own uploads (controlled by AttachmentUploader internally)
  const canDelete = false;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">In attesa</Badge>;
      case "in_progress": return <Badge>In lavorazione</Badge>;
      case "completed": return <Badge variant="outline">Completata</Badge>;
      case "delivered": return <Badge variant="outline">Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "Da definire";
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getCurrentStepIndex = (status: string) => {
    const index = statusSteps.findIndex(step => step.key === status);
    return index === -1 ? 0 : index;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!repair) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Riparazione non trovata</p>
        <Button onClick={() => setLocation("/customer/repairs")} className="mt-4">
          Torna alle Riparazioni
        </Button>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex(repair.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/customer/repairs")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Dettaglio Riparazione</h1>
          <p className="text-muted-foreground">Ordine #{repair.orderNumber}</p>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Stato Riparazione
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {getStatusBadge(repair.status)}
            <span className="text-sm text-muted-foreground">
              Ultimo aggiornamento: {format(new Date(repair.updatedAt), "dd/MM/yyyy HH:mm")}
            </span>
          </div>

          {repair.status !== "cancelled" && (
            <div className="relative">
              <div className="flex justify-between items-center">
                {statusSteps.map((step, index) => (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                        index <= currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                      data-testid={`step-${step.key}`}
                    >
                      {index + 1}
                    </div>
                    <span className={`text-sm mt-2 text-center ${
                      index <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-1 ${
                          index < currentStep ? "bg-primary" : "bg-muted"
                        }`}
                        style={{ transform: "translateY(-50%)" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Informazioni Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo Dispositivo</p>
              <p className="font-medium">{repair.deviceType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modello</p>
              <p className="font-medium">{repair.deviceModel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Problema Rilevato</p>
              <p className="text-sm">{repair.issueDescription}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Creazione</p>
              <p className="font-medium">{format(new Date(repair.createdAt), "dd/MM/yyyy HH:mm")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Cost Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Informazioni Costi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Costo Stimato</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(repair.estimatedCost)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costo Finale</p>
              <p className="text-2xl font-bold">
                {repair.finalCost ? formatCurrency(repair.finalCost) : "Da confermare"}
              </p>
            </div>
            {repair.finalCost && repair.estimatedCost && repair.finalCost !== repair.estimatedCost && (
              <div className="text-sm text-muted-foreground">
                {repair.finalCost > repair.estimatedCost ? (
                  <Badge variant="destructive">
                    +{formatCurrency(repair.finalCost - repair.estimatedCost)} rispetto alla stima
                  </Badge>
                ) : (
                  <Badge>
                    -{formatCurrency(repair.estimatedCost - repair.finalCost)} rispetto alla stima
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {repair.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Note Centro Riparazione
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{repair.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {repair && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Allegati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentUploader
              repairOrderId={repair.id}
              canUpload={canUpload}
              canDelete={canDelete}
            />
          </CardContent>
        </Card>
      )}

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dettagli Aggiuntivi
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">ID Riparazione</p>
            <p className="font-mono text-sm">{repair.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Numero Ordine</p>
            <p className="font-semibold">{repair.orderNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ultima Modifica</p>
            <p className="text-sm">{format(new Date(repair.updatedAt), "dd/MM/yyyy HH:mm")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
