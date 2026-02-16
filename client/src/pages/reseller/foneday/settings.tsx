import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Key, CheckCircle, XCircle, Loader2, TestTube, Trash2, Save, ExternalLink, Package } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

type FonedayCredential = {
  id: string;
  resellerId: string;
  apiToken: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastTestAt: string | null;
  testStatus: string | null;
  testMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function FonedaySettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const { data: credential, isLoading } = useQuery<FonedayCredential | null>({
    queryKey: ["/api/foneday/credentials"],
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/foneday/credentials", { apiToken });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foneday/credentials"] });
      toast({ title: "Salvato", description: "Credenziali Foneday salvate con successo" });
      setApiToken("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/foneday/test-connection");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/foneday/credentials"] });
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/foneday/credentials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/foneday/credentials"] });
      toast({ title: t("pages.deleted"), description: "Credenziali Foneday eliminate" });
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
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Impostazioni Foneday</h1>
            <p className="text-muted-foreground">Configura la connessione con il tuo account Foneday</p>
          </div>
        </div>
        {credential && (
          <Link href="/reseller/foneday/catalog">
            <Button data-testid="button-go-catalog">
              <Package className="h-4 w-4 mr-2" />
              Vai al Catalogo
            </Button>
          </Link>
        )}
      </div>

      {credential ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <Key className="h-5 w-5" />
                  Credenziali Configurate
                </CardTitle>
                <CardDescription>Le tue credenziali Foneday sono salvate</CardDescription>
              </div>
              <Badge variant={credential.isActive ? "default" : "secondary"}>
                {credential.isActive ? t("common.active") : "Disattivato"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Token API</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={credential.apiToken}
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Key className="h-5 w-5" />
              Configura Foneday
            </CardTitle>
            <CardDescription>
              Inserisci il tuo API Token Foneday per accedere al catalogo ricambi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                placeholder="Inserisci il tuo API Token Foneday"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                data-testid="input-api-token"
              />
              <p className="text-sm text-muted-foreground">
                Puoi ottenere il tuo API Token dal pannello Foneday.{" "}
                <a
                  href="https://www.foneday.eu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Vai a Foneday <ExternalLink className="h-3 w-3" />
                </a>
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
          <CardTitle>Informazioni su Foneday</CardTitle>
          <CardDescription>Come funziona l'integrazione Foneday</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Foneday è un fornitore europeo di ricambi per smartphone e tablet.
            L'integrazione ti permette di:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Consultare il catalogo prodotti con prezzi e disponibilità in tempo reale</li>
            <li>Aggiungere prodotti al carrello e completare ordini</li>
            <li>Visualizzare lo storico ordini e fatture</li>
            <li>Scaricare le fatture in formato PDF</li>
          </ul>
          <p className="pt-2">
            Per utilizzare l'integrazione, devi prima creare un account su Foneday e
            ottenere il tuo API Token dal pannello di controllo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
