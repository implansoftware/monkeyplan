import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2, Radio, AlertTriangle, RefreshCw, XCircle, Filter, Info } from "lucide-react";

interface FiscalConfig {
  id: string;
  defaultRtProvider: string;
  sandboxMode: boolean;
}

interface RTProvider {
  id: string;
  name: string;
  description: string;
}

interface RTStats {
  total: number;
  submitted: number;
  confirmed: number;
  failed: number;
  pending: number;
  notRequired: number;
}

export function AdminFiscalConfig() {
  const { toast } = useToast();
  const [provider, setProvider] = useState("sandbox");
  const [sandboxMode, setSandboxMode] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [filterType, setFilterType] = useState<"all" | "reseller" | "repair_center">("all");
  const [selectedResellerId, setSelectedResellerId] = useState<string>("");
  const [selectedRepairCenterId, setSelectedRepairCenterId] = useState<string>("");

  const { data, isLoading } = useQuery<{ config: FiscalConfig | null; providers: RTProvider[] }>({
    queryKey: ["/api/admin/fiscal/config"],
  });

  const { data: resellers } = useQuery<any[]>({
    queryKey: ["/api/admin/resellers"],
  });

  const { data: repairCentersData } = useQuery<any[]>({
    queryKey: ["/api/admin/repair-centers"],
  });

  const statsQueryParams = (() => {
    if (filterType === "reseller" && selectedResellerId) {
      return `?resellerId=${selectedResellerId}`;
    }
    if (filterType === "repair_center" && selectedRepairCenterId) {
      return `?repairCenterId=${selectedRepairCenterId}`;
    }
    return "";
  })();

  const filterReady = filterType === "all"
    || (filterType === "reseller" && !!selectedResellerId)
    || (filterType === "repair_center" && !!selectedRepairCenterId);

  const { data: stats, isLoading: statsLoading } = useQuery<RTStats>({
    queryKey: ["/api/admin/fiscal/rt-stats", filterType, selectedResellerId, selectedRepairCenterId],
    queryFn: () => fetch(`/api/admin/fiscal/rt-stats${statsQueryParams}`).then(r => r.json()),
    enabled: filterReady,
  });

  const { data: failedTx } = useQuery<any[]>({
    queryKey: ["/api/admin/fiscal/failed-transactions", filterType, selectedResellerId, selectedRepairCenterId],
    queryFn: () => fetch(`/api/admin/fiscal/failed-transactions${statsQueryParams}`).then(r => r.json()),
    enabled: filterReady,
  });

  useEffect(() => {
    if (data?.config && !configLoaded) {
      setProvider(data.config.defaultRtProvider);
      setSandboxMode(data.config.sandboxMode);
      setConfigLoaded(true);
    }
  }, [data?.config, configLoaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/admin/fiscal/config", {
        defaultRtProvider: provider,
        sandboxMode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fiscal/config"] });
      toast({ title: "Configurazione RT salvata" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (txId: string) => {
      const res = await apiRequest("POST", `/api/admin/fiscal/retry-transaction/${txId}`);
      return res.json();
    },
    onSuccess: (result: { success: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fiscal/rt-stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fiscal/failed-transactions"] });
      toast({
        title: result.success ? "Reinvio riuscito" : "Reinvio fallito",
        variant: result.success ? "default" : "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const providers = data?.providers || [];

  const repairCentersList = repairCentersData || [];

  const filterLabel = filterType === "all"
    ? "Tutti"
    : filterType === "reseller"
      ? (resellers?.find(r => r.id === selectedResellerId)?.fullName || resellers?.find(r => r.id === selectedResellerId)?.username || "Seleziona...")
      : (repairCentersList.find(rc => rc.id === selectedRepairCenterId)?.name || "Seleziona...");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-rt-config-title">
            <Radio className="h-5 w-5" />
            Registratore Telematico (RT)
          </CardTitle>
          <CardDescription>
            Seleziona i provider RT disponibili per rivenditori e centri riparazione
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label data-testid="label-rt-provider">Provider RT abilitato</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger data-testid="select-rt-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id} data-testid={`option-provider-${p.id}`}>
                    <div className="flex flex-col">
                      <span>{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label data-testid="label-sandbox-mode">Modalita Sandbox</Label>
              <p className="text-sm text-muted-foreground">
                Attiva la modalita di test — i documenti non vengono trasmessi realmente
              </p>
            </div>
            <Switch
              checked={sandboxMode}
              onCheckedChange={setSandboxMode}
              data-testid="switch-sandbox-mode"
            />
          </div>

          <div className="rounded-md border p-4 space-y-2" data-testid="banner-credentials-info">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Credenziali RT</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Ogni rivenditore e centro riparazione deve inserire le proprie credenziali Fiskaly nelle proprie impostazioni. L'admin non gestisce credenziali RT — definisce solo quale provider e quale modalità sono disponibili.
            </p>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-fiscal-config"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salva configurazione
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle data-testid="text-rt-stats-title">Statistiche RT</CardTitle>
              <CardDescription>Stato delle trasmissioni dei corrispettivi telematici</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filterType}
                onValueChange={(val: "all" | "reseller" | "repair_center") => {
                  setFilterType(val);
                  setSelectedResellerId("");
                  setSelectedRepairCenterId("");
                }}
              >
                <SelectTrigger className="w-[160px]" data-testid="select-rt-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="option-filter-all">Tutti</SelectItem>
                  <SelectItem value="reseller" data-testid="option-filter-reseller">Rivenditore</SelectItem>
                  <SelectItem value="repair_center" data-testid="option-filter-rc">Centro Riparazione</SelectItem>
                </SelectContent>
              </Select>

              {filterType === "reseller" && (
                <Select value={selectedResellerId} onValueChange={setSelectedResellerId}>
                  <SelectTrigger className="w-[200px]" data-testid="select-rt-filter-reseller">
                    <SelectValue placeholder="Seleziona rivenditore..." />
                  </SelectTrigger>
                  <SelectContent>
                    {resellers?.map((r: any) => (
                      <SelectItem key={r.id} value={r.id} data-testid={`option-reseller-${r.id}`}>
                        {r.fullName || r.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {filterType === "repair_center" && (
                <Select value={selectedRepairCenterId} onValueChange={setSelectedRepairCenterId}>
                  <SelectTrigger className="w-[200px]" data-testid="select-rt-filter-rc">
                    <SelectValue placeholder="Seleziona centro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repairCentersList.map((rc: any) => (
                      <SelectItem key={rc.id} value={rc.id} data-testid={`option-rc-${rc.id}`}>
                        {rc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filterReady ? (
            <p className="text-sm text-muted-foreground">Seleziona un {filterType === "reseller" ? "rivenditore" : "centro riparazione"} per visualizzare le statistiche</p>
          ) : statsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="text-rt-total">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Totale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="text-rt-confirmed">{stats.confirmed}</div>
                <div className="text-xs text-muted-foreground">Confermati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600" data-testid="text-rt-submitted">{stats.submitted}</div>
                <div className="text-xs text-muted-foreground">Inviati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-rt-pending">{stats.pending}</div>
                <div className="text-xs text-muted-foreground">In attesa</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600" data-testid="text-rt-failed">{stats.failed}</div>
                <div className="text-xs text-muted-foreground">Falliti</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-muted-foreground" data-testid="text-rt-not-required">{stats.notRequired}</div>
                <div className="text-xs text-muted-foreground">Non richiesto</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun dato disponibile</p>
          )}
        </CardContent>
      </Card>

      {(failedTx && failedTx.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-failed-title">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Trasmissioni fallite
              {filterType !== "all" && (
                <Badge variant="outline">{filterLabel}</Badge>
              )}
            </CardTitle>
            <CardDescription>Transazioni che non sono state trasmesse correttamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {failedTx.map((tx: any) => (
                <div key={tx.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium" data-testid={`text-failed-tx-${tx.id}`}>
                        {tx.transactionNumber}
                      </span>
                      <Badge variant="destructive" data-testid={`badge-failed-status-${tx.id}`}>
                        Fallito
                      </Badge>
                      {tx.rtRetryCount > 0 && (
                        <Badge variant="outline" data-testid={`badge-retry-count-${tx.id}`}>
                          {tx.rtRetryCount} tentativi
                        </Badge>
                      )}
                    </div>
                    {tx.rtErrorMessage && (
                      <p className="text-sm text-muted-foreground">{tx.rtErrorMessage}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryMutation.mutate(tx.id)}
                    disabled={retryMutation.isPending}
                    data-testid={`button-retry-tx-${tx.id}`}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Riprova
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
