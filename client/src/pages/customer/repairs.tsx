import { useQuery } from "@tanstack/react-query";
import { RepairOrder } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, MapPin, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";
import { useLocation } from "wouter";

export default function CustomerRepairs() {
  const [, setLocation] = useLocation();
  const { data: repairs = [], isLoading } = useQuery<RepairOrder[]>({
    queryKey: ["/api/repair-orders"],
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">In attesa</Badge>;
      case "in_progress": return <Badge>In lavorazione</Badge>;
      case "waiting_parts": return <Badge variant="outline">In attesa pezzi</Badge>;
      case "completed": return <Badge>Completata</Badge>;
      case "delivered": return <Badge variant="outline">Consegnata</Badge>;
      case "cancelled": return <Badge variant="destructive">Annullata</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "pending": return "La riparazione è in attesa di essere presa in carico";
      case "in_progress": return "Il dispositivo è in lavorazione";
      case "waiting_parts": return "In attesa della disponibilità dei componenti";
      case "completed": return "La riparazione è stata completata";
      case "delivered": return "Il dispositivo è stato consegnato";
      case "cancelled": return "La riparazione è stata annullata";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Le Mie Riparazioni</h1>
        <p className="text-muted-foreground">
          Stato e dettagli delle tue riparazioni
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : repairs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Wrench className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-medium text-lg mb-2">Nessuna riparazione</h3>
            <p className="text-sm">
              Non hai ancora richiesto riparazioni. Contatta un rivenditore per iniziare.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {repairs.map((repair) => (
            <Card key={repair.id} data-testid={`card-repair-${repair.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-medium">
                        #{repair.orderNumber}
                      </span>
                      {getStatusBadge(repair.status)}
                    </div>
                    <h3 className="text-lg font-semibold mb-1 capitalize">
                      {repair.deviceType} - {repair.deviceModel}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {repair.issueDescription}
                    </p>
                  </div>
                  {repair.estimatedCost && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-1">Costo previsto</div>
                      <div className="text-2xl font-bold">
                        €{(repair.estimatedCost / 100).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Richiesta {formatDistanceToNow(new Date(repair.createdAt), { addSuffix: true, locale: it })}
                    </span>
                  </div>

                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Stato della riparazione</p>
                    <p className="text-sm text-muted-foreground">
                      {getStatusDescription(repair.status)}
                    </p>
                  </div>

                  {repair.notes && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium mb-1">Note</p>
                      <p className="text-sm text-muted-foreground">{repair.notes}</p>
                    </div>
                  )}

                  <Button
                    onClick={() => setLocation(`/customer/repairs/${repair.id}`)}
                    className="w-full"
                    data-testid={`button-view-detail-${repair.id}`}
                  >
                    Visualizza Dettaglio
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
