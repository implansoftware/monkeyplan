import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Smartphone, Calendar, MapPin, CheckCircle, Clock, Wrench, AlertCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

export default function PublicTrack() {
  const { t } = useTranslation();
  usePageTitle("Traccia Riparazione");
  const [, params] = useRoute("/track/:orderNumber");
  const orderNumber = params?.orderNumber;

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: t("public.track.statusPending"), color: "bg-yellow-500", icon: Clock },
    received: { label: t("public.track.statusReceived"), color: "bg-blue-500", icon: Package },
    diagnosing: { label: t("public.track.statusDiagnosing"), color: "bg-purple-500", icon: Wrench },
    awaiting_quote: { label: t("public.track.statusAwaitingQuote"), color: "bg-orange-500", icon: AlertCircle },
    quote_approved: { label: t("public.track.statusQuoteApproved"), color: "bg-green-500", icon: CheckCircle },
    quote_rejected: { label: t("public.track.statusQuoteRejected"), color: "bg-red-500", icon: AlertCircle },
    repairing: { label: t("public.track.statusRepairing"), color: "bg-indigo-500", icon: Wrench },
    awaiting_parts: { label: t("public.track.statusAwaitingParts"), color: "bg-amber-500", icon: Package },
    completed: { label: t("public.track.statusCompleted"), color: "bg-green-600", icon: CheckCircle },
    delivered: { label: t("public.track.statusDelivered"), color: "bg-emerald-600", icon: CheckCircle },
  };

  const { data: repair, isLoading, error } = useQuery({
    queryKey: ["/api/public/track", orderNumber],
    enabled: !!orderNumber,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("public.track.caricamento")}</p>
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
            <CardTitle>{t("public.track.nonTrovata")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            <p>{t("public.track.nonTrovataDesc")}</p>
            <p className="font-mono font-bold mt-2">{orderNumber}</p>
            <p className="mt-4 text-sm">{t("public.track.verificaOrdine")}</p>
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
          <h1 className="text-2xl font-bold text-foreground">{t("public.track.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("public.track.orderNumber")}: <span className="font-mono font-bold">{orderNumber}</span></p>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex flex-wrap items-center gap-2">
                <StatusIcon className="h-5 w-5" />
                {t("public.track.statoAttuale")}
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
                  <p className="font-medium">{t("public.track.dispositivo")}</p>
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
                    <p className="font-medium">{t("public.track.problemaSegnalato")}</p>
                    <p className="text-muted-foreground">{repair.problemDescription}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{t("public.track.dataIngresso")}</p>
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
                    <p className="font-medium">{t("public.track.dataPrevista")}</p>
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
          <p>{t("public.track.contattoAssistenza")}</p>
        </div>
      </div>
    </div>
  );
}
