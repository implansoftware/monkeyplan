import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  Smartphone,
  User,
  RotateCcw,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface RepairReturnWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface RepairSearchResult {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  repairCenterId: string | null;
  deviceType: string;
  deviceModel: string;
  brand: string | null;
  deviceModelId: string | null;
  imei: string | null;
  serial: string | null;
  status: string;
  createdAt: string;
}

export function RepairReturnWizard({
  open,
  onOpenChange,
  onSuccess,
}: RepairReturnWizardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<RepairSearchResult | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [selectedRepairCenterId, setSelectedRepairCenterId] = useState<string>("");
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string } | null>(null);

  const debounceTimerRef = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (debounceTimerRef[0]) clearTimeout(debounceTimerRef[0]);
    debounceTimerRef[0] = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const { data: searchResults = [], isLoading: isSearching } = useQuery<RepairSearchResult[]>({
    queryKey: ["/api/repair-orders/search-for-return", debouncedSearch],
    queryFn: async () => {
      const res = await fetch(`/api/repair-orders/search-for-return?search=${encodeURIComponent(debouncedSearch)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: debouncedSearch.length >= 2,
  });

  const { data: repairCenters = [] } = useQuery<any[]>({
    queryKey: ["/api/repair-centers"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) throw new Error("No order selected");

      const payload: Record<string, any> = {
        customerId: selectedOrder.customerId,
        deviceType: selectedOrder.deviceType,
        deviceModel: selectedOrder.deviceModel,
        issueDescription: issueDescription || returnReason,
        isReturn: true,
        parentRepairOrderId: selectedOrder.id,
        returnReason: returnReason,
        notes: returnReason,
      };

      if (selectedOrder.brand) payload.brand = selectedOrder.brand;
      if (selectedOrder.deviceModelId) payload.deviceModelId = selectedOrder.deviceModelId;
      if (selectedOrder.imei) payload.imei = selectedOrder.imei;
      if (selectedOrder.serial) payload.serial = selectedOrder.serial;

      const centerId = selectedRepairCenterId || selectedOrder.repairCenterId;
      if (centerId) payload.repairCenterId = centerId;

      payload.acceptance = {
        declaredDefects: [],
        accessories: [],
        aestheticPhotosMandatory: false,
        hasLockCode: false,
        accessoriesRemoved: true,
      };

      const res = await apiRequest("POST", "/api/repair-orders", payload);
      return res.json();
    },
    onSuccess: async (data: { order: { id: string; orderNumber: string } }) => {
      setCreatedOrder(data.order);
      setStep(3);

      await queryClient.invalidateQueries({ queryKey: ["/api/repair-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/reseller/repairs"] });

      toast({
        title: t("repairs.return.created", "Rientro creato"),
        description: `${t("repairs.return.orderCreated", "Ordine")} #${data.order.orderNumber}`,
      });

      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error", "Errore"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep(1);
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedOrder(null);
    setReturnReason("");
    setIssueDescription("");
    setSelectedRepairCenterId("");
    setCreatedOrder(null);
    onOpenChange(false);
  };

  const handleSelectOrder = (order: RepairSearchResult) => {
    setSelectedOrder(order);
    if (order.repairCenterId) {
      setSelectedRepairCenterId(order.repairCenterId);
    }
    setStep(2);
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: t("repairs.status.pending", "In attesa"),
      ingressato: t("repairs.status.ingressato", "Ingressato"),
      diagnosed: t("repairs.status.diagnosed", "Diagnosticato"),
      quoted: t("repairs.status.quoted", "Preventivato"),
      approved: t("repairs.status.approved", "Approvato"),
      in_repair: t("repairs.status.in_repair", "In riparazione"),
      repaired: t("repairs.status.repaired", "Riparato"),
      delivered: t("repairs.status.delivered", "Consegnato"),
      completed: t("repairs.status.completed", "Completato"),
      cancelled: t("repairs.status.cancelled", "Annullato"),
    };
    return statusMap[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {t("repairs.return.title", "Nuovo Rientro")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`step-indicator-${s}`}
              >
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-8 h-0.5 ${
                    step > s ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-sm text-muted-foreground">
            {step === 1 && t("repairs.return.stepSearch", "Cerca lavorazione")}
            {step === 2 && t("repairs.return.stepDetails", "Dettagli rientro")}
            {step === 3 && t("repairs.return.stepComplete", "Completato")}
          </span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label data-testid="label-search">
                {t("repairs.return.searchLabel", "Cerca per numero ordine, cliente o dispositivo")}
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t("repairs.return.searchPlaceholder", "Es: ORD-001, Mario Rossi, iPhone 15...")}
                  className="pl-9"
                  autoFocus
                  data-testid="input-return-search"
                />
              </div>
            </div>

            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && debouncedSearch.length >= 2 && searchResults.length === 0 && (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{t("repairs.return.noResults", "Nessuna lavorazione trovata")}</p>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchResults.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => handleSelectOrder(order)}
                    data-testid={`card-return-order-${order.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm">#{order.orderNumber}</span>
                          <Badge variant="secondary">{getStatusLabel(order.status)}</Badge>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <div className="mt-1 flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {order.customerName}
                        </span>
                        <span>
                          {order.brand ? `${order.brand} ` : ""}{order.deviceModel}
                        </span>
                        {order.imei && <span>IMEI: {order.imei}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {debouncedSearch.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t("repairs.return.searchHint", "Digita almeno 2 caratteri per cercare")}</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedOrder && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  {t("repairs.return.originalOrder", "Lavorazione originale")}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("repairs.orderNumber", "N° Ordine")}:</span>
                    <span className="ml-1 font-medium">#{selectedOrder.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("repairs.customer", "Cliente")}:</span>
                    <span className="ml-1">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("repairs.device", "Dispositivo")}:</span>
                    <span className="ml-1">{selectedOrder.brand ? `${selectedOrder.brand} ` : ""}{selectedOrder.deviceModel}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("repairs.status.label", "Stato")}:</span>
                    <Badge variant="secondary" className="ml-1">{getStatusLabel(selectedOrder.status)}</Badge>
                  </div>
                  {selectedOrder.imei && (
                    <div>
                      <span className="text-muted-foreground">IMEI:</span>
                      <span className="ml-1 font-mono text-xs">{selectedOrder.imei}</span>
                    </div>
                  )}
                  {selectedOrder.serial && (
                    <div>
                      <span className="text-muted-foreground">{t("repairs.serial", "Seriale")}:</span>
                      <span className="ml-1 font-mono text-xs">{selectedOrder.serial}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label htmlFor="returnReason" data-testid="label-return-reason">
                  {t("repairs.return.reason", "Motivo del rientro")} *
                </Label>
                <Textarea
                  id="returnReason"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder={t("repairs.return.reasonPlaceholder", "Es: Il problema si è ripresentato, difetto diverso...")}
                  className="mt-1"
                  data-testid="textarea-return-reason"
                />
              </div>

              <div>
                <Label htmlFor="issueDescription" data-testid="label-issue-description">
                  {t("repairs.return.newIssue", "Descrizione nuovo problema")}
                </Label>
                <Textarea
                  id="issueDescription"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder={t("repairs.return.newIssuePlaceholder", "Descrivi il nuovo problema riscontrato...")}
                  className="mt-1"
                  data-testid="textarea-issue-description"
                />
              </div>

              {repairCenters.length > 0 && (
                <div>
                  <Label data-testid="label-repair-center">
                    {t("repairs.repairCenter", "Centro di riparazione")}
                  </Label>
                  <Select
                    value={selectedRepairCenterId}
                    onValueChange={setSelectedRepairCenterId}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-repair-center">
                      <SelectValue placeholder={t("repairs.return.selectCenter", "Seleziona centro")} />
                    </SelectTrigger>
                    <SelectContent>
                      {repairCenters.map((center: any) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                data-testid="button-return-back"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                {t("common.back", "Indietro")}
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!returnReason.trim() || createMutation.isPending}
                data-testid="button-return-confirm"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                {t("repairs.return.confirm", "Crea Rientro")}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && createdOrder && (
          <div className="flex flex-col items-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">
                {t("repairs.return.successTitle", "Rientro creato con successo")}
              </h3>
              <p className="text-muted-foreground mt-1">
                {t("repairs.return.successOrder", "Ordine")} <span className="font-medium">#{createdOrder.orderNumber}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                data-testid="button-return-close"
              >
                {t("common.close", "Chiudi")}
              </Button>
              <Button
                onClick={() => {
                  handleClose();
                  setLocation(`/repairs/${createdOrder.id}`);
                }}
                data-testid="button-return-view-order"
              >
                {t("repairs.return.viewOrder", "Vai all'ordine")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
