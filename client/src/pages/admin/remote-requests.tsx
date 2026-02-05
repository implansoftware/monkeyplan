import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Truck, Check, Clock, Building2, User, Store, Smartphone, Image } from "lucide-react";
import type { RemoteRepairRequest, User as UserType, RepairCenter, RemoteRepairRequestDevice } from "@shared/schema";

type EnrichedRemoteRequest = RemoteRepairRequest & { devices: RemoteRepairRequestDevice[] };
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
  const { data: requests, isLoading } = useQuery<EnrichedRemoteRequest[]>({
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Richieste di Riparazione Remota</h1>
              <p className="text-sm text-muted-foreground">Panoramica globale di tutte le richieste</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex flex-wrap items-center gap-1">
              <Clock className="h-4 w-4" /> In Attesa
            </CardDescription>
            <CardTitle className="text-3xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex flex-wrap items-center gap-1">
              <Building2 className="h-4 w-4" /> Assegnate
            </CardDescription>
            <CardTitle className="text-3xl">{assignedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex flex-wrap items-center gap-1">
              <Truck className="h-4 w-4" /> In Lavorazione
            </CardDescription>
            <CardTitle className="text-3xl">{inProgressCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex flex-wrap items-center gap-1">
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
                    className="p-4 border rounded-lg space-y-3"
                    data-testid={`row-request-${request.id}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{request.requestNumber}</span>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                          {request.devices?.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {request.devices.length} dispositiv{request.devices.length === 1 ? 'o' : 'i'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(request.createdAt), "d MMM yyyy HH:mm", { locale: it })}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-6">
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
                    {request.devices?.map((device) => (
                      <div key={device.id} className="p-3 border rounded-md space-y-2" data-testid={`device-${device.id}`}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Dispositivo</p>
                            <p className="text-sm font-medium">{device.deviceType}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Marca / Modello</p>
                            <p className="text-sm font-medium">{device.brand} {device.model}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Quantità</p>
                            <p className="text-sm font-medium">{device.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Stato</p>
                            <Badge variant={statusLabels[device.status]?.variant || "secondary"} className="text-xs">
                              {statusLabels[device.status]?.label || device.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Problema</p>
                          <p className="text-sm">{device.issueDescription}</p>
                        </div>
                        {device.photos && device.photos.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                              <Image className="h-3 w-3" /> Foto
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {device.photos.map((photo: string, pi: number) => (
                                <a key={pi} href={photo} target="_blank" rel="noopener noreferrer">
                                  <img src={photo} alt={`Foto ${pi + 1}`} className="w-16 h-16 object-cover rounded-md border hover:opacity-80 transition-opacity" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
