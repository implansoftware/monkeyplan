import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RepairOrder } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Clock, Search, ArrowRight, Calendar, Phone, FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { useLocation } from "wouter";
import { getStatusConfig, REPAIR_STATUS_CONFIG } from "@/lib/repair-status-config";

interface RepairOrderWithDetails extends RepairOrder {
  customerName?: string;
  repairCenterName?: string;
  quoteTotalAmount?: number | null;
}

export default function CustomerRepairs() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: repairs = [], isLoading } = useQuery<RepairOrderWithDetails[]>({
    queryKey: ["/api/customer/repairs"],
  });

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch = 
      repair.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repair.deviceType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || repair.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    return (
      <Badge className={`${config.bgColor} ${config.color} ${config.borderColor} border`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusDescription = (status: string) => {
    const descriptions: Record<string, string> = {
      pending: "La riparazione è in attesa di essere presa in carico",
      ingressato: "Il dispositivo è stato ricevuto presso il centro riparazioni",
      in_diagnosi: "I tecnici stanno analizzando il problema",
      preventivo_emesso: "È stato preparato un preventivo per la riparazione",
      preventivo_accettato: "Hai accettato il preventivo, la riparazione procederà",
      preventivo_rifiutato: "Il preventivo è stato rifiutato",
      attesa_ricambi: "In attesa dei componenti necessari",
      waiting_parts: "In attesa dei componenti necessari",
      in_riparazione: "Il dispositivo è in fase di riparazione",
      in_progress: "Il dispositivo è in lavorazione",
      in_test: "Verifica del corretto funzionamento",
      pronto_ritiro: "La riparazione è completata, puoi ritirare il dispositivo",
      completed: "La riparazione è stata completata",
      consegnato: "Il dispositivo è stato consegnato",
      delivered: "Il dispositivo è stato consegnato",
      cancelled: "La riparazione è stata annullata",
      annullato: "La riparazione è stata annullata",
    };
    return descriptions[status] || "";
  };

  const getProgressSteps = (status: string) => {
    const steps = [
      { key: "ingressato", label: "Ricevuto" },
      { key: "in_diagnosi", label: "Diagnosi" },
      { key: "preventivo", label: "Preventivo" },
      { key: "in_riparazione", label: "Riparazione" },
      { key: "pronto_ritiro", label: "Pronto" },
    ];

    const statusOrder: Record<string, number> = {
      pending: 0,
      ingressato: 1,
      in_diagnosi: 2,
      preventivo_emesso: 3,
      preventivo_accettato: 3,
      preventivo_rifiutato: 3,
      attesa_ricambi: 4,
      waiting_parts: 4,
      in_riparazione: 4,
      in_progress: 4,
      in_test: 4,
      pronto_ritiro: 5,
      completed: 5,
      consegnato: 6,
      delivered: 6,
    };

    const currentStep = statusOrder[status] ?? 0;
    return { steps, currentStep };
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (!cents) return null;
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const activeStatuses = Object.entries(REPAIR_STATUS_CONFIG)
    .filter(([key]) => !["consegnato", "delivered", "cancelled", "annullato"].includes(key))
    .map(([key, config]) => ({ key, label: config.label }));

  const completedStatuses = ["consegnato", "delivered", "cancelled", "annullato"];

  const activeRepairs = filteredRepairs.filter(r => !completedStatuses.includes(r.status));
  const completedRepairs = filteredRepairs.filter(r => completedStatuses.includes(r.status));

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Le Mie Riparazioni</h1>
              <p className="text-white/80 text-sm">
                Monitora lo stato delle tue riparazioni in tempo reale
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per numero ordine, dispositivo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-repairs"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                {Object.entries(REPAIR_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
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
      ) : filteredRepairs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <h3 className="font-medium text-lg mb-2">Nessun risultato</h3>
            <p className="text-sm">
              Nessuna riparazione corrisponde ai criteri di ricerca.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {activeRepairs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Riparazioni in corso ({activeRepairs.length})
              </h2>
              <div className="space-y-4">
                {activeRepairs.map((repair) => {
                  const { steps, currentStep } = getProgressSteps(repair.status);
                  return (
                    <Card key={repair.id} className="hover-elevate" data-testid={`card-repair-${repair.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="font-mono text-sm font-medium bg-muted px-2 py-1 rounded">
                                #{repair.orderNumber}
                              </span>
                              {getStatusBadge(repair.status)}
                              {repair.status === "preventivo_emesso" && (
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Richiede azione
                                </Badge>
                              )}
                            </div>
                            <h3 className="text-lg font-semibold mb-1 capitalize">
                              {repair.deviceType} - {repair.deviceModel}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {repair.issueDescription}
                            </p>
                          </div>
                          {(repair.estimatedCost || repair.quoteTotalAmount) && (
                            <div className="text-right shrink-0">
                              <div className="text-xs text-muted-foreground mb-1">
                                {repair.quoteTotalAmount ? "Preventivo" : "Stima"}
                              </div>
                              <div className="text-xl font-bold text-primary">
                                {formatCurrency(repair.quoteTotalAmount || repair.estimatedCost)}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            {steps.map((step, index) => (
                              <div key={step.key} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                  index < currentStep 
                                    ? "bg-primary text-primary-foreground" 
                                    : index === currentStep 
                                      ? "bg-primary/20 text-primary border-2 border-primary"
                                      : "bg-muted text-muted-foreground"
                                }`}>
                                  {index < currentStep ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    index + 1
                                  )}
                                </div>
                                <span className={`text-xs mt-1 text-center ${
                                  index <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"
                                }`}>
                                  {step.label}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="relative h-1 bg-muted rounded-full mt-2">
                            <div 
                              className="absolute h-1 bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((currentStep / (steps.length - 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(repair.createdAt), "d MMM yyyy", { locale: it })}
                              </div>
                              <div className="bg-muted px-2 py-1 rounded text-xs">
                                {getStatusDescription(repair.status)}
                              </div>
                            </div>
                            <Button
                              onClick={() => setLocation(`/customer/repairs/${repair.id}`)}
                              data-testid={`button-view-detail-${repair.id}`}
                            >
                              Dettagli
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {completedRepairs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                Riparazioni completate ({completedRepairs.length})
              </h2>
              <div className="space-y-3">
                {completedRepairs.map((repair) => (
                  <Card key={repair.id} className="bg-muted/30" data-testid={`card-repair-completed-${repair.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="shrink-0">
                            {["cancelled", "annullato"].includes(repair.status) ? (
                              <XCircle className="h-8 w-8 text-destructive" />
                            ) : (
                              <CheckCircle className="h-8 w-8 text-green-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono text-sm">#{repair.orderNumber}</span>
                              {getStatusBadge(repair.status)}
                            </div>
                            <p className="text-sm font-medium truncate capitalize">
                              {repair.deviceType} - {repair.deviceModel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(repair.createdAt), "d MMMM yyyy", { locale: it })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/customer/repairs/${repair.id}`)}
                          data-testid={`button-view-completed-${repair.id}`}
                        >
                          Dettagli
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
