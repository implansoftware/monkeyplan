import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Key, CheckCircle, XCircle, Loader2, TestTube, Trash2, Save, ExternalLink, FileText, Building2, RefreshCcw } from "lucide-react";
import { Link } from "wouter";

import sibillLogo from "@/assets/logos/sibill.png";
import { useTranslation } from "react-i18next";

type SibillCredential = {
  id: string;
  resellerId: string;
  apiKey: string;
  environment: string | null;
  companyId: string | null;
  selectedCompanyId: string | null;
  selectedCompanyName: string | null;
  isActive: boolean;
  lastSyncAt: string | null;
  lastTestAt: string | null;
  testStatus: string | null;
  testMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type SibillCompany = {
  id: string;
  credentialId: string;
  resellerId: string;
  externalId: string;
  name: string;
  vatNumber: string | null;
  fiscalCode: string | null;
  rawData: unknown;
  createdAt: string;
  updatedAt: string;
};

export default function SibillSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiToken, setApiToken] = useState("");
  const [sibillCompanyId, setSibillCompanyId] = useState("");
  const [environment, setEnvironment] = useState<"development" | "production">("production");
  const [showToken, setShowToken] = useState(false);

  const { data: credential, isLoading } = useQuery<SibillCredential | null>({
    queryKey: ["/api/sibill/credentials"],
  });

  const { data: companies } = useQuery<SibillCompany[]>({
    queryKey: ["/api/sibill/companies"],
    enabled: !!credential,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/sibill/credentials", { 
        apiToken, 
        environment,
        companyId: sibillCompanyId || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sibill/credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/integrations/summary"] });
      toast({ title: t("common.saved"), description: t("integrations.credentialsSavedDesc") });
      setApiToken("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sibill/test-connection");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sibill/credentials"] });
      if (data.success) {
        toast({ title: t("integrations.connectionSuccessful"), description: data.message });
      } else {
        toast({ title: t("integrations.connectionFailed"), description: data.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const syncCompaniesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sibill/companies/sync");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sibill/companies"] });
      toast({ title: t("integrations.syncCompleted"), description: t("integrations.syncCompletedCount", { count: data.count || 0 }) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/sibill/credentials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sibill/credentials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/integrations/summary"] });
      toast({ title: t("pages.deleted"), description: t("integrations.sibillCredentialsDeleted") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!apiToken.trim()) {
      toast({ title: t("common.error"), description: t("integrations.enterApiToken"), variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const formatDate = (date: string | null) => {
    if (!date) return t("integrations.never");
    return new Date(date).toLocaleString("it-IT");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-12 w-24 flex items-center justify-center bg-white dark:bg-gray-100 rounded-lg p-1">
            <img src={sibillLogo} alt="Sibill" className="max-h-8 max-w-full object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("integrations.sibillSettingsTitle")}</h1>
            <p className="text-muted-foreground">{t("integrations.invoiceAndBankReconciliation")}</p>
          </div>
        </div>
        {credential && (
          <Link href="/reseller/sibill/documents">
            <Button data-testid="button-go-documents">
              <FileText className="h-4 w-4 mr-2" />
              {t("integrations.goToDocuments")}
            </Button>
          </Link>
        )}
      </div>

      {credential ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Key className="h-5 w-5" />
                    {t("integrations.configuredCredentials")}
                  </CardTitle>
                  <CardDescription>{t("integrations.sibillCredentialsSaved")}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {credential.environment === "production" ? t("common.production") : t("common.development")}
                  </Badge>
                  <Badge variant={credential.isActive ? "default" : "secondary"}>
                    {credential.isActive ? t("common.active") : t("common.deactivated")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("sibill.apiTokenLabel")}</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={credential.apiKey}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-token-display"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowToken(!showToken)}
                    >
                      {showToken ? t("common.hide") : t("common.show")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("integrations.lastTestLabel")}</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {credential.testStatus === "success" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : credential.testStatus === "error" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(credential.lastTestAt)}
                    </span>
                  </div>
                  {credential.testMessage && (
                    <p className="text-sm text-muted-foreground">{credential.testMessage}</p>
                  )}
                </div>
              </div>

              {credential.selectedCompanyName && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">{t("integrations.selectedCompany")}</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {credential.selectedCompanyName}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => testMutation.mutate()}
                  disabled={testMutation.isPending}
                  data-testid="button-test-connection"
                >
                  {testMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  {t("integrations.testConnection")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => syncCompaniesMutation.mutate()}
                  disabled={syncCompaniesMutation.isPending}
                  data-testid="button-sync-companies"
                >
                  {syncCompaniesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4 mr-2" />
                  )}
                  {t("integrations.syncCompanies")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-credentials"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {t("integrations.deleteCredentials")}
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  {t("integrations.toUpdateCredentials")}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {companies && companies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t("integrations.linkedCompanies")}
                </CardTitle>
                <CardDescription>{t("integrations.companiesSyncedFromSibill")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {company.vatNumber && t("integrations.vatNumber", { number: company.vatNumber })}
                          {company.vatNumber && company.fiscalCode && " • "}
                          {company.fiscalCode && t("integrations.fiscalCode", { code: company.fiscalCode })}
                        </p>
                      </div>
                      {credential.selectedCompanyId === company.externalId && (
                        <Badge>{t("integrations.selected")}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Key className="h-5 w-5" />
              {t("integrations.configureSibill")}
            </CardTitle>
            <CardDescription>
              {t("integrations.enterSibillApiToken")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder={t("integrations.enterSibillPlaceholder")}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                data-testid="input-api-token"
              />
              <p className="text-sm text-muted-foreground">
                {t("integrations.getSibillToken")}{" "}
                <a
                  href="https://www.sibill.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {t("integrations.goToSibill")} <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sibillCompanyId">{t("integrations.sibillCompanyIdOptional")}</Label>
              <Input
                id="sibillCompanyId"
                type="text"
                placeholder={t("integrations.sibillCompanyIdPlaceholder")}
                value={sibillCompanyId}
                onChange={(e) => setSibillCompanyId(e.target.value)}
                data-testid="input-sibill-company-id"
              />
              <p className="text-sm text-muted-foreground">
                {t("integrations.sibillCompanyIdHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">{t("integrations.environmentLabel")}</Label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as "development" | "production")}>
                <SelectTrigger data-testid="select-environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">{t("common.production")}</SelectItem>
                  <SelectItem value="development">{t("common.development")} (Sandbox)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t("integrations.envHint")}
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !apiToken.trim()}
              data-testid="button-save-credentials"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t("integrations.saveCreds")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("integrations.aboutSibill")}</CardTitle>
          <CardDescription>{t("integrations.howSibillWorks")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            {t("integrations.sibillDescription")}
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>{t("integrations.sibillFeature1")}</li>
            <li>{t("integrations.sibillFeature2")}</li>
            <li>{t("integrations.sibillFeature3")}</li>
            <li>{t("integrations.sibillFeature4")}</li>
          </ul>
          <p className="pt-2">
            {t("integrations.sibillSetupHint")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
