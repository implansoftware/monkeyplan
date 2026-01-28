import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Smartphone, Calendar, MapPin, CheckCircle, Clock, Wrench, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "In Attesa", color: "bg-yellow-500", icon: Clock },
  received: { label: "Ricevuto", color: "bg-blue-500", icon: Package },
  diagnosing: { label: "In Diagnosi", color: "bg-purple-500", icon: Wrench },
  awaiting_quote: { label: "In Attesa Preventivo", color: "bg-orange-500", icon: AlertCircle },
  quote_approved: { label: "Preventivo Approvato", color: "bg-green-500", icon: CheckCircle },
  quote_rejected: { label: "Preventivo Rifiutato", color: "bg-red-500", icon: AlertCircle },
  repairing: { label: "In Riparazione", color: "bg-indigo-500", icon: Wrench },
  awaiting_parts: { label: "In Attesa Ricambi", color: "bg-amber-500", icon: Package },
  completed: { label: "Completato", color: "bg-green-600", icon: CheckCircle },
  delivered: { label: "Consegnato", color: "bg-emerald-600", icon: CheckCircle },
};

export default function PublicTrack() {
  const [, params] = useRoute("/track/:orderNumber");
  const orderNumber = params?.orderNumber;

  const { data: repair, isLoading, error } = useQuery({
    queryKey: ["/api/public/track", orderNumber],
    enabled: !!orderNumber,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento stato riparazione...</p>
        </div>
      </div>
    );
  }

  if (error || !repair) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>Riparazione Non Trovata</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>Non è stata trovata nessuna riparazione con il numero d'ordine:</p>
            <p className="font-mono font-bold mt-2">{orderNumber}</p>
            <p className="mt-4 text-sm">Verifica il numero d'ordine e riprova.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[repair.status] || { label: repair.status, color: "bg-gray-500", icon: Clock };
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Stato Riparazione</h1>
          <p className="text-muted-foreground mt-1">Numero Ordine: <span className="font-mono font-bold">{orderNumber}</span></p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex flex-wrap items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                Stato Attuale
              </CardTitle>
              <Badge className={`${status.color} text-white`}>
                {status.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Dispositivo</p>
                  <p className="text-muted-foreground">
                    {repair.deviceBrand} {repair.deviceModel}
                    {repair.deviceColor && ` - ${repair.deviceColor}`}
                  </p>
                </div>
              </div>

              {repair.problemDescription && (
                <div className="flex items-start gap-3">
                  <Wrench className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Problema Segnalato</p>
                    <p className="text-muted-foreground">{repair.problemDescription}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Data Ingresso</p>
                  <p className="text-muted-foreground">
                    {repair.ingressatoAt 
                      ? new Date(repair.ingressatoAt).toLocaleDateString('it-IT', { 
                          day: '2-digit', month: 'long', year: 'numeric' 
                        })
                      : new Date(repair.createdAt).toLocaleDateString('it-IT', { 
                          day: '2-digit', month: 'long', year: 'numeric' 
                        })
                    }
                  </p>
                </div>
              </div>

              {repair.estimatedCompletionDate && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Data Prevista Completamento</p>
                    <p className="text-muted-foreground">
                      {new Date(repair.estimatedCompletionDate).toLocaleDateString('it-IT', { 
                        day: '2-digit', month: 'long', year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Per maggiori informazioni contatta il centro assistenza.</p>
        </div>
      </div>
    </div>
  );
}