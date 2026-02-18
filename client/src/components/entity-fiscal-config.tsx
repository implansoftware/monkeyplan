import { useTranslation } from "react-i18next";
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
import { Loader2, Shield, Key, Server, Info, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface EntityFiscalConfigProps {
  entityType: "repair_center" | "reseller";
  basePath: string;
}

export function EntityFiscalConfig({ entityType, basePath }: EntityFiscalConfigProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const entityLabel = entityType === "repair_center" ? t("customer.repairCenter") : t("common.reseller");

  const { data: adminConfig, isLoading: adminLoading } = useQuery<{
    provider: string | null;
    sandboxMode: boolean;
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
    rtEntityId?: string;
    rtSystemId?: string;
    inherited?: boolean;
    inheritedFrom?: string;
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
  const [rtApiKey, setRtApiKey] = useState("");
  const [rtApiSecret, setRtApiSecret] = useState("");
  const [rtEndpoint, setRtEndpoint] = useState("");
  const [rtEntityId, setRtEntityId] = useState("");
  const [rtSystemId, setRtSystemId] = useState("");
  useEffect(() => {
    if (entityConfig) {
      setRtEnabled(entityConfig.rtEnabled ?? false);
      setRtApiKey(entityConfig.rtApiKey || "");
      setRtApiSecret(entityConfig.rtApiSecret || "");
      setRtEndpoint(entityConfig.rtEndpoint || "");
      setRtEntityId(entityConfig.rtEntityId || "");
      setRtSystemId(entityConfig.rtSystemId || "");
    }
  }, [entityConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `${basePath}/config`, {
        rtEnabled,
        rtApiKey: rtApiKey !== "****" ? rtApiKey : undefined,
        rtApiSecret: rtApiSecret !== "****" ? rtApiSecret : undefined,
        rtEndpoint: rtEndpoint || undefined,
        rtEntityId: rtEntityId || undefined,
        rtSystemId: rtSystemId || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [basePath, "config"] });
      toast({ title: t("fiscal.configSaved") });
    },
    onError: (err: any) => {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
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
            {t("fiscal.rtConfigTitle")} - {entityLabel}
          </CardTitle>
          <CardDescription>
            {t("fiscal.rtConfigDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("fiscal.platformConfig")}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t("fiscal.rtProvider")}:</span>{" "}
                <Badge variant="secondary" data-testid="badge-admin-provider">
                  {adminConfig?.provider || t("fiscal.notConfigured")}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">{t("fiscal.mode")}:</span>{" "}
                <Badge variant={adminConfig?.sandboxMode ? "outline" : "default"} data-testid="badge-admin-mode">
                  {adminConfig?.sandboxMode ? t("fiscal.sandboxMode") : t("fiscal.productionMode")}
                </Badge>
              </div>
            </div>
          </div>

          {entityConfig?.inherited && (
            <div className="rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-4 space-y-1" data-testid="banner-inherited-config">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{t("fiscal.inheritedConfig")}</span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t("fiscal.rtActiveViaReseller")}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div>
              <Label htmlFor="rt-enabled">{t("fiscal.enableRtTransmission")}</Label>
              <p className="text-sm text-muted-foreground">
                {entityConfig?.inherited
                  ? t("fiscal.overrideResellerConfig")
                  : t("fiscal.activateAutoSending")}
              </p>
            </div>
            <Switch
              id="rt-enabled"
              checked={rtEnabled}
              onCheckedChange={setRtEnabled}
              data-testid="switch-rt-enabled"
            />
          </div>

          {rtEnabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 p-3" data-testid="banner-own-credentials-required">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">{t("fiscal.ownCredentialsMandatory")}</span>
                </div>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {adminConfig?.provider === "openapi_com"
                    ? t("fiscal.enterOpenApiCredentials")
                    : t("fiscal.enterFiskalyCredentials")}
                </p>
              </div>

              <div className="space-y-3 rounded-md border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("fiscal.rtCredentials")}</span>
                </div>

                {adminConfig?.provider === "openapi_com" ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="api-key">{t("fiscal.openApiToken")}</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={rtApiKey}
                        onChange={(e) => setRtApiKey(e.target.value)}
                        placeholder={t("fiscal.enterOpenApiToken")}
                        data-testid="input-rt-api-key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="entity-id">{t("fiscal.openApiFiscalId")}</Label>
                      <Input
                        id="entity-id"
                        value={rtEntityId}
                        onChange={(e) => setRtEntityId(e.target.value)}
                        placeholder={t("fiscal.enterOpenApiFiscalId")}
                        data-testid="input-rt-entity-id"
                      />
                      <p className="text-xs text-muted-foreground">{t("fiscal.openApiFiscalIdDesc")}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="api-key">{t("fiscal.apiKey")}</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={rtApiKey}
                        onChange={(e) => setRtApiKey(e.target.value)}
                        placeholder={t("fiscal.enterApiKey")}
                        data-testid="input-rt-api-key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="api-secret">{t("fiscal.apiSecret")}</Label>
                      <Input
                        id="api-secret"
                        type="password"
                        value={rtApiSecret}
                        onChange={(e) => setRtApiSecret(e.target.value)}
                        placeholder={t("fiscal.enterApiSecret")}
                        data-testid="input-rt-api-secret"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endpoint">{t("fiscal.endpoint")}</Label>
                      <Input
                        id="endpoint"
                        value={rtEndpoint}
                        onChange={(e) => setRtEndpoint(e.target.value)}
                        placeholder="https://api.provider.com/v1"
                        data-testid="input-rt-endpoint"
                      />
                    </div>
                    {adminConfig?.provider === "fiskaly" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="entity-id">{t("fiscal.fiskalyEntityId")}</Label>
                          <Input
                            id="entity-id"
                            value={rtEntityId}
                            onChange={(e) => setRtEntityId(e.target.value)}
                            placeholder={t("fiscal.fiskalyDashboardUUID")}
                            data-testid="input-rt-entity-id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="system-id">{t("fiscal.fiskalySystemId")}</Label>
                          <Input
                            id="system-id"
                            value={rtSystemId}
                            onChange={(e) => setRtSystemId(e.target.value)}
                            placeholder={t("fiscal.fiskalyDashboardUUID")}
                            data-testid="input-rt-system-id"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-fiscal-config"
          >
            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("fiscal.saveConfig")}
          </Button>
        </CardContent>
      </Card>

      {rtEnabled && rtStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="text-rt-stats-title">
              <Server className="h-5 w-5" />
              {t("fiscal.rtStats")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" data-testid="text-rt-total">{rtStats.total ?? 0}</div>
                <div className="text-sm text-muted-foreground">{t("common.total")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600" data-testid="text-rt-pending">{rtStats.pending ?? 0}</div>
                <div className="text-sm text-muted-foreground">{t("common.pending")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600" data-testid="text-rt-submitted">{rtStats.submitted ?? 0}</div>
                <div className="text-sm text-muted-foreground">{t("fiscal.submitted")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600" data-testid="text-rt-confirmed">{rtStats.confirmed ?? 0}</div>
                <div className="text-sm text-muted-foreground">{t("fiscal.confirmed")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600" data-testid="text-rt-failed">{rtStats.failed ?? 0}</div>
                <div className="text-sm text-muted-foreground">{t("fiscal.failed")}</div>
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
              {t("fiscal.failedTransmissions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{t("fiscal.transaction")} #{tx.id}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {tx.rtErrorMessage || t("common.unknownError")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="secondary">{t("fiscal.attempts")}: {tx.rtRetryCount ?? 0}</Badge>
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
