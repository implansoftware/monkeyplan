import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Package, Truck, Check, X, Clock, Building2, UserCheck, Image } from "lucide-react";
import type { RemoteRepairRequest, RepairCenter } from "@shared/schema";

type RepairCenterWithUserId = RepairCenter & { userId: string | null };
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

export default function ResellerRemoteRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RemoteRepairRequest | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState("");

  const { data: requests, isLoading } = useQuery<RemoteRepairRequest[]>({
    queryKey: ["/api/reseller/remote-requests"],
  });

  const { data: repairCenters } = useQuery<RepairCenterWithUserId[]>({
    queryKey: ["/api/reseller/repair-centers"],
  });

  const assignMutation = useMutation({
    mutationFn: async ({ id, centerId }: { id: string; centerId: string }) => {
      const res = await apiRequest("PATCH", `/api/reseller/remote-requests/${id}/assign`, { assignedCenterId: centerId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/remote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/remote-requests/pending-count"] });
      setIsAssignOpen(false);
      setSelectedRequest(null);
      setSelectedCenterId("");
      toast({
        title: "Richiesta assegnata",
        description: "La richiesta è stata assegnata al centro di riparazione",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openAssignDialog = (request: RemoteRepairRequest) => {
    setSelectedRequest(request);
    setIsAssignOpen(true);
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequest && selectedCenterId) {
      assignMutation.mutate({ id: selectedRequest.id, centerId: selectedCenterId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const assignedRequests = requests?.filter(r => r.status === 'assigned') || [];
  const activeRequests = requests?.filter(r => ['accepted', 'awaiting_shipment', 'in_transit', 'received'].includes(r.status)) || [];
  const completedRequests = requests?.filter(r => ['repair_created', 'rejected', 'cancelled'].includes(r.status)) || [];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">
                Richieste di Riparazione Remota
              </h1>
              <p className="text-sm text-white/80">
                Supervisiona e assegna le richieste ai centri di riparazione
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>In Attesa</CardDescription>
            <CardTitle className="text-3xl">{pendingRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Assegnate</CardDescription>
            <CardTitle className="text-3xl">{assignedRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>In Lavorazione</CardDescription>
            <CardTitle className="text-3xl">{activeRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>Completate</CardDescription>
            <CardTitle className="text-3xl">{completedRequests.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {requests && requests.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nessuna richiesta</h3>
            <p className="text-muted-foreground text-center mt-2">
              Non ci sono richieste di riparazione remota al momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Da Assegnare ({pendingRequests.length})
              </h2>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="rounded-2xl border-yellow-200" data-testid={`card-pending-${request.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {request.requestNumber}
                            <Badge {...statusLabels[request.status]}>
                              {statusLabels[request.status]?.label}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(request.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                          </CardDescription>
                        </div>
                        <Button onClick={() => openAssignDialog(request)} data-testid={`button-assign-${request.id}`}>
                          <Building2 className="h-4 w-4 mr-2" />
                          Assegna Centro
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Dispositivo</p>
                          <p className="font-medium">{request.deviceType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Marca/Modello</p>
                          <p className="font-medium">{request.brand} {request.model}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Problema</p>
                          <p className="text-sm truncate">{request.issueDescription}</p>
                        </div>
                        {request.photos && request.photos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <Image className="h-3 w-3" /> {request.photos.length} foto
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {request.photos.slice(0, 3).map((photo, index) => (
                                <a
                                  key={index}
                                  href={photo}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={photo}
                                    alt={`Foto ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded-md border hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                              {request.photos.length > 3 && (
                                <span className="text-xs text-muted-foreground self-center ml-1">
                                  +{request.photos.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {request.requestedCenterId && (
                          <div>
                            <p className="text-sm text-muted-foreground">Centro Preferito</p>
                            <p className="text-sm">
                              {repairCenters?.find(c => c.id === request.requestedCenterId)?.name || "N/D"}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {assignedRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                Assegnate ({assignedRequests.length})
              </h2>
              <div className="space-y-4">
                {assignedRequests.map((request) => (
                  <Card key={request.id} className="rounded-2xl" data-testid={`card-assigned-${request.id}`}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{request.brand} {request.model}</span>
                          <span className="text-muted-foreground">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            {repairCenters?.find(c => c.userId === request.assignedCenterId)?.name || "N/D"}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-500" />
                In Lavorazione ({activeRequests.length})
              </h2>
              <div className="space-y-4">
                {activeRequests.map((request) => (
                  <Card key={request.id} className="rounded-2xl" data-testid={`card-active-${request.id}`}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{request.brand} {request.model}</span>
                          <span className="text-muted-foreground">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            {repairCenters?.find(c => c.userId === request.assignedCenterId)?.name || "N/D"}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Check className="h-5 w-5 text-gray-500" />
                Completate ({completedRequests.length})
              </h2>
              <div className="space-y-4">
                {completedRequests.slice(0, 5).map((request) => (
                  <Card key={request.id} className="rounded-2xl opacity-75" data-testid={`card-completed-${request.id}`}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {request.brand} {request.model}
                        </span>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assegna Centro di Riparazione</DialogTitle>
            <DialogDescription>
              Seleziona il centro a cui assegnare la richiesta {selectedRequest?.requestNumber}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="centerId">Centro di Riparazione</Label>
              <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
                <SelectTrigger data-testid="select-center">
                  <SelectValue placeholder="Seleziona centro" />
                </SelectTrigger>
                <SelectContent>
                  {repairCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name} - {center.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={assignMutation.isPending || !selectedCenterId} data-testid="button-confirm-assign">
                {assignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Assegna"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
