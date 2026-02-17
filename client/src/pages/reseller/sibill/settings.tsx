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
        toast({ title: "Connessione riuscita", description: data.message });
      } else {
        toast({ title: "Connessione fallita", description: data.message, variant: "destructive" });
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
      toast({ title: "Sincronizzazione completata", description: `${data.count || 0} aziende sincronizzate` });
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
      toast({ title: t("pages.deleted"), description: "Credenziali Sibill eliminate" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!apiToken.trim()) {
      toast({ title: t("common.error"), description: "Inserisci il token API", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Mai";
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
            <h1 className="text-2xl font-bold">Impostazioni Sibill</h1>
            <p className="text-muted-foreground">Gestione fatture e riconciliazione bancaria</p>
          </div>
        </div>
        {credential && (
          <Link href="/reseller/sibill/documents">
            <Button data-testid="button-go-documents">
              <FileText className="h-4 w-4 mr-2" />
              Vai ai Documenti
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
                    Credenziali Configurate
                  </CardTitle>
                  <CardDescription>Le tue credenziali Sibill sono salvate</CardDescription>
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
                  <Label>Token API</Label>
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
                      {showToken ? "Nascondi" : "Mostra"}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ultimo Test</Label>
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
                  <Label className="text-xs text-muted-foreground">Azienda selezionata</Label>
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
                  Test Connessione
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
                  Sincronizza Aziende
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
                  Elimina Credenziali
                </Button>
              </div>

              <Alert>
                <AlertDescription>
                  Per aggiornare le credenziali, eliminale prima e poi inseriscine di nuove.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {companies && companies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Aziende Collegate
                </CardTitle>
                <CardDescription>Aziende sincronizzate da Sibill</CardDescription>
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
                          {company.vatNumber && `P.IVA: ${company.vatNumber}`}
                          {company.vatNumber && company.fiscalCode && " • "}
                          {company.fiscalCode && `CF: ${company.fiscalCode}`}
                        </p>
                      </div>
                      {credential.selectedCompanyId === company.externalId && (
                        <Badge>Selezionata</Badge>
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
              Configura Sibill
            </CardTitle>
            <CardDescription>
              Inserisci il tuo API Token Sibill per gestire fatture e riconciliazione bancaria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Inserisci il tuo API Token Sibill"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                data-testid="input-api-token"
              />
              <p className="text-sm text-muted-foreground">
                Puoi ottenere il tuo API Token dal pannello Sibill.{" "}
                <a
                  href="https://www.sibill.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Vai a Sibill <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sibillCompanyId">Company ID Sibill (opzionale)</Label>
              <Input
                id="sibillCompanyId"
                type="text"
                placeholder="Es: comp_abc123..."
                value={sibillCompanyId}
                onChange={(e) => setSibillCompanyId(e.target.value)}
                data-testid="input-sibill-company-id"
              />
              <p className="text-sm text-muted-foreground">
                ID dell'azienda su Sibill. Se non lo inserisci, verrà recuperato automaticamente dopo la sincronizzazione.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment">Ambiente</Label>
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
              Salva Credenziali
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informazioni su Sibill</CardTitle>
          <CardDescription>Come funziona l'integrazione Sibill</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Sibill è una piattaforma italiana per la gestione delle fatture e la riconciliazione bancaria.
            L'integrazione ti permette di:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Sincronizzare automaticamente fatture emesse e ricevute</li>
            <li>Collegare i conti bancari per la riconciliazione automatica</li>
            <li>Visualizzare lo stato dei pagamenti in tempo reale</li>
            <li>Categorizzare le transazioni per una gestione contabile semplificata</li>
          </ul>
          <p className="pt-2">
            Per utilizzare l'integrazione, devi prima creare un account su Sibill e
            ottenere il tuo API Token dal pannello di controllo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
