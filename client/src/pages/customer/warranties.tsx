import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Calendar, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

type CustomerWarranty = {
  warranty: {
    id: string;
    repairOrderId: string | null;
    warrantyProductId: string;
    status: "offered" | "accepted" | "declined" | "expired";
    priceSnapshot: number;
    durationMonthsSnapshot: number;
    coverageTypeSnapshot: string;
    productNameSnapshot: string;
    startsAt: string | null;
    endsAt: string | null;
    createdAt: string;
  };
  repairOrder: {
    id: string;
    orderNumber: string;
    deviceType: string;
    brand: string | null;
    deviceModel: string;
  } | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    total: number;
  } | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  offered: { label: "In Attesa", variant: "secondary", icon: Clock },
  accepted: { label: "Attiva", variant: "default", icon: CheckCircle2 },
  declined: { label: "Rifiutata", variant: "destructive", icon: XCircle },
  expired: { label: "Scaduta", variant: "outline", icon: Clock },
};

const coverageLabels: Record<string, string> = {
  basic: "Base",
  extended: "Estesa",
  full: "Completa",
};

export default function CustomerWarranties() {
  const { data: warranties = [], isLoading } = useQuery<CustomerWarranty[]>({
    queryKey: ["/api/customer/warranties"],
  });

  const isWarrantyActive = (warranty: CustomerWarranty["warranty"]) => {
    if (warranty.status !== "accepted" || !warranty.endsAt) return false;
    return new Date(warranty.endsAt) > new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Le Mie Garanzie</h1>
            <p className="text-white/80 text-sm">Gestisci le garanzie dei tuoi dispositivi</p>
          </div>
        </div>
      </div>

      {warranties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nessuna garanzia trovata</p>
            <p className="text-muted-foreground">
              Le garanzie acquistate appariranno qui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {warranties.map(({ warranty, repairOrder, invoice }) => {
            const status = statusConfig[warranty.status] || statusConfig.offered;
            const StatusIcon = status.icon;
            const active = isWarrantyActive(warranty);

            return (
              <Card key={warranty.id} data-testid={`card-warranty-${warranty.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${active ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'}`}>
                        <Shield className={`h-5 w-5 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{warranty.productNameSnapshot}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {repairOrder ? `Riparazione #${repairOrder.orderNumber}` : "Garanzia Diretta"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {repairOrder && (
                    <div>
                      <p className="text-muted-foreground">Dispositivo</p>
                      <p className="font-medium">
                        {[repairOrder.brand, repairOrder.deviceModel].filter(Boolean).join(" ") || repairOrder.deviceType || "N/A"}
                      </p>
                    </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">Copertura</p>
                      <p className="font-medium">{coverageLabels[warranty.coverageTypeSnapshot] || warranty.coverageTypeSnapshot}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Durata</p>
                      <p className="font-medium">{warranty.durationMonthsSnapshot} mesi</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Prezzo</p>
                      <p className="font-medium">
                        {(warranty.priceSnapshot / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>

                  {warranty.status === "accepted" && warranty.startsAt && warranty.endsAt && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${active ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        Valida dal {format(new Date(warranty.startsAt), "dd/MM/yyyy", { locale: it })} al {format(new Date(warranty.endsAt), "dd/MM/yyyy", { locale: it })}
                        {!active && " (Scaduta)"}
                      </span>
                    </div>
                  )}

                  {invoice && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      Fattura: {invoice.invoiceNumber}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
