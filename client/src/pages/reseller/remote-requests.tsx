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
import { Loader2, Package, Truck, Check, X, Clock, Building2, UserCheck, Image, Smartphone, User2, Mail, Phone } from "lucide-react";
import type { RemoteRepairRequest, RepairCenter, RemoteRepairRequestDevice } from "@shared/schema";

type RepairCenterWithUserId = RepairCenter & { userId: string | null };
type EnrichedRemoteRequest = RemoteRepairRequest & {
  devices: RemoteRepairRequestDevice[];
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
};
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useTranslation } from "react-i18next";

function getStatusLabels(t: (key: string) => string): Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> {
  return {
    pending: { label: t("hr.pending"), variant: "secondary" },
    assigned: { label: t("remoteRequests.assigned"), variant: "outline" },
    accepted: { label: t("remoteRequests.accepted"), variant: "default" },
    rejected: { label: t("common.rejected"), variant: "destructive" },
    awaiting_shipment: { label: t("remoteRequests.awaitingShipment"), variant: "outline" },
    in_transit: { label: t("shipping.inTransit"), variant: "default" },
    received: { label: t("repairs.status.received"), variant: "default" },
    repair_created: { label: t("reseller.repairCreated"), variant: "default" },
    cancelled: { label: t("common.cancelled"), variant: "destructive" },
    quoted: { label: t("reseller.quoteSent"), variant: "outline" },
    quote_accepted: { label: t("reseller.quoteAccepted"), variant: "default" },
    quote_declined: { label: t("reseller.quoteDeclined"), variant: "destructive" },
  };
}

export default function ResellerRemoteRequests() {
  const { t } = useTranslation();
  const statusLabels = getStatusLabels(t);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RemoteRepairRequest | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState("");

  const { data: requests, isLoading } = useQuery<EnrichedRemoteRequest[]>({
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
        title: t("reseller.requestAssigned"),
        description: t("reseller.requestAssignedDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
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
  const activeRequests = requests?.filter(r => ['accepted', 'quoted', 'quote_accepted', 'awaiting_shipment', 'in_transit', 'received'].includes(r.status)) || [];
  const completedRequests = requests?.filter(r => ['repair_created', 'rejected', 'cancelled', 'quote_declined'].includes(r.status)) || [];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white" data-testid="text-page-title">
                {t("reseller.remoteRepairRequests")}
              </h1>
              <p className="text-sm text-white/80">
                {t("reseller.superviseAndAssignRequests")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>{t("common.pending")}</CardDescription>
            <CardTitle className="text-3xl">{pendingRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>{t("reseller.assigned")}</CardDescription>
            <CardTitle className="text-3xl">{assignedRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>{t("repairs.inProgress")}</CardDescription>
            <CardTitle className="text-3xl">{activeRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardDescription>{t("common.completed")}</CardDescription>
            <CardTitle className="text-3xl">{completedRequests.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {requests && requests.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">{t("reseller.noRequests")}</h3>
            <p className="text-muted-foreground text-center mt-2">
              {t("reseller.noRemoteRequestsAtMoment")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingRequests.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                {t("reseller.toAssign")} ({pendingRequests.length})
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
                            {request.devices?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Smartphone className="h-3 w-3 mr-1" />
                                {t("reseller.devicesCount", { count: request.devices.length })}
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {format(new Date(request.createdAt), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
                          </CardDescription>
                        </div>
                        <Button onClick={() => openAssignDialog(request)} data-testid={`button-assign-${request.id}`}>
                          <Building2 className="h-4 w-4 mr-2" />
                          {t("reseller.assignCenter")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(request.customerName || request.customerEmail) && (
                          <div className="flex flex-wrap items-center gap-4 p-3 rounded-md bg-muted/50" data-testid={`customer-info-${request.id}`}>
                            <div className="flex items-center gap-2">
                              <User2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{request.customerName || t("common.nd")}</span>
                            </div>
                            {request.customerEmail && (
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{request.customerEmail}</span>
                              </div>
                            )}
                            {request.customerPhone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{request.customerPhone}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {request.devices?.map((device) => (
                          <div key={device.id} className="p-3 border rounded-md space-y-2" data-testid={`device-${device.id}`}>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">{t("repairs.device")}</p>
                                <p className="text-sm font-medium">{device.deviceType}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("reseller.brandModel")}</p>
                                <p className="text-sm font-medium">{device.brand} {device.model}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("common.quantity")}</p>
                                <p className="text-sm font-medium">{device.quantity}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{t("common.status")}</p>
                                <Badge variant={statusLabels[device.status]?.variant || "secondary"} className="text-xs">
                                  {statusLabels[device.status]?.label || device.status}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t("reseller.problem")}</p>
                              <p className="text-sm">{device.issueDescription}</p>
                            </div>
                            {device.photos && device.photos.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                  <Image className="h-3 w-3" />{t("common.photo")}</p>
                                <div className="flex flex-wrap gap-1">
                                  {device.photos.map((photo: string, pi: number) => (
                                    <a key={pi} href={photo} target="_blank" rel="noopener noreferrer">
                                      <img src={photo} alt={t("reseller.photoNumber", { number: pi + 1 })} className="w-16 h-16 object-cover rounded-md border hover:opacity-80 transition-opacity" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {request.requestedCenterId && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">{t("reseller.preferredCenter")}</p>
                            <p className="text-sm">
                              {repairCenters?.find(c => c.id === request.requestedCenterId)?.name || t("common.nd")}
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
                {t("reseller.assigned")} ({assignedRequests.length})
              </h2>
              <div className="space-y-4">
                {assignedRequests.map((request) => (
                  <Card key={request.id} className="rounded-2xl" data-testid={`card-assigned-${request.id}`}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                          {request.devices?.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {t("reseller.devicesCount", { count: request.devices.length })}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span>{request.devices?.map(d => `${d.brand} ${d.model}`).join(', ') || '-'}</span>
                          <span className="text-muted-foreground">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            {repairCenters?.find(c => c.userId === request.assignedCenterId)?.name || t("common.nd")}
                          </span>
                        </div>
                      </div>
                      {(request.customerName || request.customerEmail) && (
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm" data-testid={`customer-info-${request.id}`}>
                          <span className="flex items-center gap-1.5"><User2 className="h-3.5 w-3.5 text-muted-foreground" />{request.customerName || t("common.nd")}</span>
                          {request.customerEmail && <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{request.customerEmail}</span>}
                          {request.customerPhone && <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{request.customerPhone}</span>}
                        </div>
                      )}
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
                {t("repairs.inProgress")} ({activeRequests.length})
              </h2>
              <div className="space-y-4">
                {activeRequests.map((request) => (
                  <Card key={request.id} className="rounded-2xl" data-testid={`card-active-${request.id}`}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                          {request.devices?.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {t("reseller.devicesCount", { count: request.devices.length })}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span>{request.devices?.map(d => `${d.brand} ${d.model}`).join(', ') || '-'}</span>
                          <span className="text-muted-foreground">
                            <Building2 className="h-4 w-4 inline mr-1" />
                            {repairCenters?.find(c => c.userId === request.assignedCenterId)?.name || t("common.nd")}
                          </span>
                        </div>
                      </div>
                      {(request.customerName || request.customerEmail) && (
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm" data-testid={`customer-info-active-${request.id}`}>
                          <span className="flex items-center gap-1.5"><User2 className="h-3.5 w-3.5 text-muted-foreground" />{request.customerName || t("common.nd")}</span>
                          {request.customerEmail && <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{request.customerEmail}</span>}
                          {request.customerPhone && <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{request.customerPhone}</span>}
                        </div>
                      )}
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
                {t("common.completed")} ({completedRequests.length})
              </h2>
              <div className="space-y-4">
                {completedRequests.slice(0, 5).map((request) => (
                  <Card key={request.id} className="rounded-2xl opacity-75" data-testid={`card-completed-${request.id}`}>
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-3">
                          <CardTitle className="text-base">{request.requestNumber}</CardTitle>
                          <Badge {...statusLabels[request.status]}>
                            {statusLabels[request.status]?.label}
                          </Badge>
                          {request.devices?.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <Smartphone className="h-3 w-3 mr-1" />
                              {t("reseller.devicesCount", { count: request.devices.length })}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {request.devices?.map(d => `${d.brand} ${d.model}`).join(', ') || '-'}
                        </span>
                      {(request.customerName || request.customerEmail) && (
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm" data-testid={`customer-info-completed-${request.id}`}>
                          <span className="flex items-center gap-1.5"><User2 className="h-3.5 w-3.5 text-muted-foreground" />{request.customerName || t("common.nd")}</span>
                          {request.customerEmail && <span className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{request.customerEmail}</span>}
                          {request.customerPhone && <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{request.customerPhone}</span>}
                        </div>
                      )}
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
            <DialogTitle>{t("reseller.assignRepairCenter")}</DialogTitle>
            <DialogDescription>
              {t("reseller.selectCenterForRequest", { number: selectedRequest?.requestNumber })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="centerId">{t("repairs.repairCenter")}</Label>
              <Select value={selectedCenterId} onValueChange={setSelectedCenterId}>
                <SelectTrigger data-testid="select-center">
                  <SelectValue placeholder={t("reseller.selectCenterPlaceholder")} />
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
              <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={assignMutation.isPending || !selectedCenterId} data-testid="button-confirm-assign">
                {assignMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("reseller.assign")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
