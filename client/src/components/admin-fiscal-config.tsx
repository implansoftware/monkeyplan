import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2, Radio, AlertTriangle, CheckCircle, RefreshCw, XCircle } from "lucide-react";

interface FiscalConfig {
  id: string;
  defaultRtProvider: string;
  rtApiKey: string | null;
  rtApiSecret: string | null;
  rtEndpoint: string | null;
  allowOverride: boolean;
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
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [allowOverride, setAllowOverride] = useState(true);
  const [sandboxMode, setSandboxMode] = useState(true);
  const [configLoaded, setConfigLoaded] = useState(false);

  const { data, isLoading } = useQuery<{ config: FiscalConfig | null; providers: RTProvider[] }>({
    queryKey: ["/api/admin/fiscal/config"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<RTStats>({
    queryKey: ["/api/admin/fiscal/rt-stats"],
  });

  const { data: failedTx, isLoading: failedLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/fiscal/failed-transactions"],
  });

  useEffect(() => {
    if (data?.config && !configLoaded) {
      setProvider(data.config.defaultRtProvider);
      setApiKey(data.config.rtApiKey || "");
      setApiSecret(data.config.rtApiSecret || "");
      setEndpoint(data.config.rtEndpoint || "");
      setAllowOverride(data.config.allowOverride);
      setSandboxMode(data.config.sandboxMode);
      setConfigLoaded(true);
    }
  }, [data?.config, configLoaded]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/admin/fiscal/config", {
        defaultRtProvider: provider,
        rtApiKey: apiKey || null,
        rtApiSecret: apiSecret || null,
        rtEndpoint: endpoint || null,
        allowOverride,
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

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/fiscal/test-connection", {
        provider,
        apiKey,
        apiSecret,
        endpoint,
        sandboxMode,
      });
      return res.json();
    },
    onSuccess: (result: { success: boolean; message: string }) => {
      toast({
        title: result.success ? "Connessione riuscita" : "Connessione fallita",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    },
    onError: (error: any) => {
      toast({ title: "Errore test", description: error.message, variant: "destructive" });
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
  const needsCredentials = provider !== "none" && provider !== "sandbox";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Registratore Telematico (RT)
          </CardTitle>
          <CardDescription>
            Configura il provider cloud per la trasmissione dei corrispettivi telematici all'Agenzia delle Entrate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label data-testid="label-rt-provider">Provider RT</Label>
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

          {needsCredentials && (
            <div className="space-y-4 rounded-md border p-4">
              <div className="space-y-2">
                <Label data-testid="label-api-key">API Key</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Inserisci la API Key del provider"
                  data-testid="input-rt-api-key"
                />
              </div>
              <div className="space-y-2">
                <Label data-testid="label-api-secret">API Secret</Label>
                <Input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Inserisci la API Secret del provider"
                  data-testid="input-rt-api-secret"
                />
              </div>
              <div className="space-y-2">
                <Label data-testid="label-rt-endpoint">Endpoint personalizzato (opzionale)</Label>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://..."
                  data-testid="input-rt-endpoint"
                />
              </div>
            </div>
          )}

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

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label data-testid="label-allow-override">Consenti override per reseller/centri</Label>
              <p className="text-sm text-muted-foreground">
                Permetti ai reseller e centri riparazione di usare un provider RT diverso
              </p>
            </div>
            <Switch
              checked={allowOverride}
              onCheckedChange={setAllowOverride}
              data-testid="switch-allow-override"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              data-testid="button-save-fiscal-config"
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salva configurazione
            </Button>
            {provider !== "none" && (
              <Button
                variant="outline"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
                data-testid="button-test-connection"
              >
                {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                Testa connessione
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiche RT</CardTitle>
          <CardDescription>Stato delle trasmissioni dei corrispettivi telematici</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
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
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Trasmissioni fallite
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
