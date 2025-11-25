import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Stethoscope, ExternalLink, Clock, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const severityLabels: Record<string, string> = {
  low: "Bassa",
  medium: "Media",
  high: "Alta",
  critical: "Critica",
};

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export default function DiagnosisList() {
  const [, navigate] = useLocation();

  const { data: diagnostics, isLoading } = useQuery<any[]>({
    queryKey: ["/api/diagnostics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Stethoscope className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Diagnosi</h1>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Stethoscope className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Diagnosi</h1>
      </div>

      {!diagnostics || diagnostics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nessuna diagnosi trovata
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {diagnostics.map((diagnosis) => (
            <Card
              key={diagnosis.id}
              className="hover-elevate cursor-pointer"
              onClick={() => navigate(`/repair-orders/${diagnosis.repairOrderId}`)}
              data-testid={`card-diagnosis-${diagnosis.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      #{diagnosis.orderNumber}
                    </span>
                    <span>{diagnosis.deviceType} - {diagnosis.deviceModel}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {diagnosis.severity && (
                      <Badge className={severityColors[diagnosis.severity]}>
                        {severityLabels[diagnosis.severity]}
                      </Badge>
                    )}
                    {diagnosis.requiresExternalParts && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Ricambi esterni
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {diagnosis.technicalDiagnosis}
                  </p>

                  {diagnosis.damagedComponents && diagnosis.damagedComponents.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {diagnosis.damagedComponents.slice(0, 5).map((component: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {component}
                        </Badge>
                      ))}
                      {diagnosis.damagedComponents.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{diagnosis.damagedComponents.length - 5}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {diagnosis.estimatedRepairTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {diagnosis.estimatedRepairTime} min
                        </span>
                      )}
                      <span>
                        {diagnosis.diagnosedAt && format(new Date(diagnosis.diagnosedAt), "dd MMM yyyy HH:mm", { locale: it })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/repair-orders/${diagnosis.repairOrderId}`);
                      }}
                      data-testid={`button-view-order-${diagnosis.id}`}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Vedi ordine
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
