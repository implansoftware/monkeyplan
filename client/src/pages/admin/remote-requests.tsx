import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Truck, Check, Clock, Building2, User, Store } from "lucide-react";
import type { RemoteRepairRequest, User as UserType, RepairCenter } from "@shared/schema";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "In attesa", variant: "secondary" },
  assigned: { label: "Assegnata", variant: "outline" },
  accepted: { label: "Accettata", variant: "default" },
  rejected: { label: "Rifiutata", variant: "destructive" },
  awaiting_shipment: { label: "Attesa spedizione", variant: "outline" },
  in_transit: { label: "In transito", variant: "default" },
  received: { label: "Ricevuto", variant: "default" },
  repair_created: { label: "Riparazione creata", variant: "default" },
  cancelled: { label: "Annullata", variant: "destructive" },
};

export default function AdminRemoteRequests() {
  const { data: requests, isLoading } = useQuery<RemoteRepairRequest[]>({
    queryKey: ["/api/admin/remote-requests"],
  });

  const { data: users } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: repairCenters } = useQuery<RepairCenter[]>({
    queryKey: ["/api/repair-centers"],
  });

  const getCustomerName = (customerId: string) => {
    const customer = users?.find(u => u.id === customerId);
    return customer?.fullName || customer?.username || "N/D";
  };

  const getResellerName = (resellerId: string) => {
    const reseller = users?.find(u => u.id === resellerId);
    return reseller?.fullName || reseller?.ragioneSociale || reseller?.username || "N/D";
  };

  const getCenterName = (centerId: string | null) => {
    if (!centerId) return "Non assegnato";
    const center = repairCenters?.find(c => c.id === centerId);
    return center?.name || "N/D";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;
  const assignedCount = requests?.filter(r => r.status === 'assigned').length || 0;
  const inProgressCount = requests?.filter(r => ['accepted', 'awaiting_shipment', 'in_transit', 'received'].includes(r.status)).length || 0;
  const completedCount = requests?.filter(r => ['repair_created', 'rejected', 'cancelled'].includes(r.status)).length || 0;

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Richieste di Riparazione Remota
        </h1>
        <p className="text-muted-foreground mt-1">
          Panoramica globale di tutte le richieste
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> In Attesa
            </CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Building2 className="h-4 w-4" /> Assegnate
            </CardDescription>
            <CardTitle className="text-3xl">{assignedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Truck className="h-4 w-4" /> In Lavorazione
            </CardDescription>
            <CardTitle className="text-3xl">{inProgressCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Check className="h-4 w-4" /> Completate
            </CardDescription>
            <CardTitle className="text-3xl">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {requests && requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nessuna richiesta</h3>
            <p className="text-muted-foreground text-center mt-2">
              Non ci sono richieste di riparazione remota nel sistema.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tutte le Richieste</CardTitle>
              <CardDescription>
                {requests?.length} richieste totali
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {requests?.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`row-request-${request.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.requestNumber}</span>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <p className="text-muted-foreground">Dispositivo</p>
                        <p className="font-medium">{request.brand} {request.model}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Cliente
                        </p>
                        <p className="font-medium">{getCustomerName(request.customerId)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Store className="h-3 w-3" /> Reseller
                        </p>
                        <p className="font-medium">{getResellerName(request.resellerId)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> Centro
                        </p>
                        <p className="font-medium">{getCenterName(request.assignedCenterId)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
