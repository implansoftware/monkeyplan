import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Key, Server, Info, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface EntityFiscalConfigProps {
  entityType: "repair_center" | "reseller";
  basePath: string;
}

export function EntityFiscalConfig({ entityType, basePath }: EntityFiscalConfigProps) {
  const { toast } = useToast();
  const entityLabel = entityType === "repair_center" ? "Centro Riparazione" : "Rivenditore";

  const { data: adminConfig, isLoading: adminLoading } = useQuery<{
    provider: string | null;
    sandboxMode: boolean;
    allowOverride: boolean;
  }>({
    queryKey: [basePath, "admin-config"],
    queryFn: () => fetch(`${basePath}/admin-config`).then(r => r.json()),
  });

  const { data: entityConfig, isLoading: configLoading } = useQuery<{
    rtEnabled: boolean;
    useOwnCredentials: boolean;
    rtApiKey?: string;
    rtApiSecret?: string;
    rtEndpoint?: string;
  }>({
    queryKey: [basePath, "config"],
    queryFn: () => fetch(`${basePath}/config`).then(r => r.json()),
  });

  const { data: rtStats } = useQuery<{
    total: number;
    pending: number;
    submitted: number;
    confirmed: number;
    failed: number;
  }>({
    queryKey: [basePath, "rt-stats"],
    queryFn: () => fetch(`${basePath}/rt-stats`).then(r => r.json()),
  });

  const { data: failedTransactions } = useQuery<any[]>({
    queryKey: [basePath, "failed-transactions"],
    queryFn: () => fetch(`${basePath}/failed-transactions`).then(r => r.json()),
  });

  const [rtEnabled, setRtEnabled] = useState(false);
  const [useOwnCredentials, setUseOwnCredentials] = useState(false);
  const [rtApiKey, setRtApiKey] = useState("");
  const [rtApiSecret, setRtApiSecret] = useState("");
  const [rtEndpoint, setRtEndpoint] = useState("");
  useEffect(() => {
    if (entityConfig) {
      setRtEnabled(entityConfig.rtEnabled ?? false);
      setUseOwnCredentials(entityConfig.useOwnCredentials ?? false);
      setRtApiKey(entityConfig.rtApiKey || "");
      setRtApiSecret(entityConfig.rtApiSecret || "");
      setRtEndpoint(entityConfig.rtEndpoint || "");
    }
  }, [entityConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `${basePath}/config`, {
        rtEnabled,
        useOwnCredentials,
        rtApiKey: useOwnCredentials && rtApiKey !== "****" ? rtApiKey : undefined,
        rtApiSecret: useOwnCredentials && rtApiSecret !== "****" ? rtApiSecret : undefined,
        rtEndpoint: useOwnCredentials ? rtEndpoint : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [basePath, "config"] });
      toast({ title: "Configurazione salvata" });
    },
    onError: (err: any) => {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    },
  });

  if (adminLoading || configLoading) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="fiscal-loading">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="text-fiscal-title">
            <Shield className="h-5 w-5" />
            Configurazione RT - {entityLabel}
          </CardTitle>
          <CardDescription>
            Gestisci la trasmissione telematica dei corrispettivi per il tuo punto vendita.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Configurazione Piattaforma</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Provider RT:</span>{" "}
                <Badge variant="secondary" data-testid="badge-admin-provider">
                  {adminConfig?.provider || "Non configurato"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Modalità:</span>{" "}
                <Badge variant={adminConfig?.sandboxMode ? "outline" : "default"} data-testid="badge-admin-mode">
                  {adminConfig?.sandboxMode ? "Sandbox" : "Produzione"}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Credenziali personalizzate:</span>{" "}
                <Badge variant={adminConfig?.allowOverride ? "default" : "secondary"} data-testid="badge-admin-override">
                  {adminConfig?.allowOverride ? "Consentite" : "Non consentite"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <Label htmlFor="rt-enabled">Abilita trasmissione RT</Label>
              <p className="text-sm text-muted-foreground">
                Attiva l'invio automatico dei corrispettivi al Registratore Telematico
              </p>
            </div>
            <Switch
              id="rt-enabled"
              checked={rtEnabled}
              onCheckedChange={setRtEnabled}
              data-testid="switch-rt-enabled"
            />
          </div>

          {rtEnabled && adminConfig?.allowOverride && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label htmlFor="use-own">Usa credenziali proprie</Label>
                  <p className="text-sm text-muted-foreground">
                    Utilizza le tue credenziali RT anziché quelle della piattaforma
                  </p>
                </div>
                <Switch
                  id="use-own"
                  checked={useOwnCredentials}
                  onCheckedChange={setUseOwnCredentials}
                  data-testid="switch-use-own-credentials"
                />
              </div>

              {useOwnCredentials && (
                <div className="space-y-3 rounded-md border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4" />
                    <span className="text-sm font-medium">Credenziali RT</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={rtApiKey}
                      onChange={(e) => setRtApiKey(e.target.value)}
                      placeholder="Inserisci API Key"
                      data-testid="input-rt-api-key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-secret">API Secret</Label>
                    <Input
                      id="api-secret"
                      type="password"
                      value={rtApiSecret}
                      onChange={(e) => setRtApiSecret(e.target.value)}
                      placeholder="Inserisci API Secret"
                      data-testid="input-rt-api-secret"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      value={rtEndpoint}
                      onChange={(e) => setRtEndpoint(e.target.value)}
                      placeholder="https://api.provider.com/v1"
                      data-testid="input-rt-endpoint"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-fiscal-config"
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salva Configurazione
          </Button>
        </CardContent>
      </Card>

      {rtEnabled && rtStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-rt-stats-title">
              <Server className="h-5 w-5" />
              Statistiche RT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="text-rt-total">{rtStats.total ?? 0}</div>
                <div className="text-sm text-muted-foreground">Totali</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-rt-pending">{rtStats.pending ?? 0}</div>
                <div className="text-sm text-muted-foreground">In attesa</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600" data-testid="text-rt-submitted">{rtStats.submitted ?? 0}</div>
                <div className="text-sm text-muted-foreground">Inviati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="text-rt-confirmed">{rtStats.confirmed ?? 0}</div>
                <div className="text-sm text-muted-foreground">Confermati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600" data-testid="text-rt-failed">{rtStats.failed ?? 0}</div>
                <div className="text-sm text-muted-foreground">Falliti</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {rtEnabled && failedTransactions && failedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-failed-title">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Trasmissioni Fallite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Transazione #{tx.id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {tx.rtErrorMessage || "Errore sconosciuto"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary">Tentativi: {tx.rtRetryCount ?? 0}</Badge>
                    {tx.rtStatus === "failed" ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
