import { useState, useEffect } from "react";
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
import { Settings, Key, CheckCircle, XCircle, Loader2, TestTube, Trash2, Save, ExternalLink, Package, Shield, LogIn } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

type MobilesentrixCredential = {
  id: string;
  resellerId: string;
  consumerName: string;
  consumerKey: string;
  consumerSecret: string;
  accessToken: string | null;
  accessTokenSecret: string | null;
  environment: "production" | "staging";
  isActive: boolean;
  lastSyncAt: string | null;
  lastTestAt: string | null;
  testStatus: string | null;
  testMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function MobilesentrixSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [consumerName, setConsumerName] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [environment, setEnvironment] = useState<"production" | "staging">("production");
  const [showSecret, setShowSecret] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const { data: credential, isLoading } = useQuery<MobilesentrixCredential | null>({
    queryKey: ["/api/mobilesentrix/credentials"],
  });

  // Listen for OAuth success message from popup window (server-side exchange)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Server-side exchange completed successfully
      if (event.data?.type === 'mobilesentrix_oauth_success') {
        toast({
          title: "Autorizzazione completata",
          description: "Access Token ottenuto con successo! Ora puoi accedere al catalogo.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
        setIsAuthorizing(false);
      }
      // Legacy: client-side exchange (fallback)
      if (event.data?.type === 'mobilesentrix_oauth_callback') {
        const { oauth_token, oauth_verifier } = event.data;
        if (oauth_token && oauth_verifier) {
          setIsAuthorizing(true);
          try {
            const res = await apiRequest("POST", "/api/mobilesentrix/oauth/exchange", {
              oauth_token,
              oauth_verifier,
            });
            const data = await res.json();
            
            if (data.success) {
              toast({
                title: "Autorizzazione completata",
                description: "Access Token ottenuto con successo! Ora puoi testare la connessione.",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
            } else {
              toast({
                title: "Errore autorizzazione",
                description: data.message || "Errore durante lo scambio dei token",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            toast({
              title: t("common.error"),
              description: error.message || "Errore durante lo scambio dei token",
              variant: "destructive",
            });
          } finally {
            setIsAuthorizing(false);
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, toast]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/mobilesentrix/credentials", { consumerName, consumerKey, consumerSecret, environment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
      toast({ title: "Salvato", description: "Credenziali MobileSentrix salvate con successo. Ora completa l'autorizzazione OAuth." });
      setConsumerName("");
      setConsumerKey("");
      setConsumerSecret("");
      setEnvironment("production");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const authorizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/mobilesentrix/oauth/authorize-url");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authorizeUrl) {
        // Open popup for OAuth authorization
        const width = 600;
        const height = 700;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        const popup = window.open(
          data.authorizeUrl,
          'mobilesentrix_oauth',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
        
        setIsAuthorizing(true);
        toast({
          title: "Autorizzazione avviata",
          description: "Completa il login nella finestra popup che si è aperta.",
        });
        
        // Poll for access token completion every 2 seconds
        const pollInterval = setInterval(async () => {
          try {
            // Check if popup was closed
            if (popup && popup.closed) {
              clearInterval(pollInterval);
              // Final check for access token
              queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
              setIsAuthorizing(false);
              return;
            }
            
            // Check if access token was obtained
            const res = await fetch("/api/mobilesentrix/credentials", { credentials: "include" });
            if (res.ok) {
              const cred = await res.json();
              if (cred && cred.accessToken) {
                clearInterval(pollInterval);
                if (popup && !popup.closed) popup.close();
                queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
                setIsAuthorizing(false);
                toast({
                  title: "Autorizzazione completata",
                  description: "Access Token ottenuto con successo! Ora puoi accedere al catalogo.",
                });
              }
            }
          } catch {
            // Ignore polling errors
          }
        }, 2000);
        
        // Stop polling after 5 minutes max
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsAuthorizing(false);
        }, 5 * 60 * 1000);
      }
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      setIsAuthorizing(false);
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mobilesentrix/test-connection");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
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
      return apiRequest("DELETE", "/api/mobilesentrix/credentials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
      toast({ title: t("pages.deleted"), description: "Credenziali MobileSentrix eliminate" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!consumerName.trim() || !consumerKey.trim() || !consumerSecret.trim()) {
      toast({ title: t("common.error"), description: "Compila tutti i campi obbligatori", variant: "destructive" });
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
            <h1 className="text-2xl font-bold">Impostazioni MobileSentrix</h1>
            <p className="text-muted-foreground">Configura la connessione con il tuo account MobileSentrix</p>
          </div>
        </div>
        {credential && credential.accessToken && (
          <Link href="/reseller/mobilesentrix/catalog">
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
                <CardDescription>Le tue credenziali MobileSentrix sono salvate</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {credential.accessToken ? (
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Autorizzato
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-500 text-amber-600">
                    Richiede Autorizzazione
                  </Badge>
                )}
                <Badge variant={credential.isActive ? "default" : "secondary"}>
                  {credential.isActive ? t("common.active") : "Disattivato"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Consumer Name</Label>
                <Input
                  type="text"
                  value={credential.consumerName}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-consumer-name-display"
                />
              </div>
              <div className="space-y-2">
                <Label>Consumer Key</Label>
                <Input
                  type="text"
                  value={credential.consumerKey}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-consumer-key-display"
                />
              </div>
              <div className="space-y-2">
                <Label>Consumer Secret</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={credential.consumerSecret}
                    readOnly
                    className="font-mono text-sm"
                    data-testid="input-consumer-secret-display"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? "Nascondi" : "Mostra"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ambiente</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={credential.environment === "production" ? "default" : "outline"}>
                    {credential.environment === "production" ? "Produzione" : "Staging"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {credential.environment === "production" ? "www.mobilesentrix.eu" : "preprod.mobilesentrix.eu"}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ultimo Test</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {credential.testStatus === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : credential.testStatus === "failed" ? (
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
              <div className="space-y-2">
                <Label>Access Token</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {credential.accessToken ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">{t("admin.resellerDetail.configured")}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-600">Non ancora ottenuto</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!credential.accessToken && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                <AlertDescription className="flex items-center justify-between flex-wrap gap-4">
                  <span>
                    Per accedere al catalogo, devi completare l'autorizzazione OAuth con MobileSentrix.
                  </span>
                  <Button
                    onClick={() => authorizeMutation.mutate()}
                    disabled={authorizeMutation.isPending || isAuthorizing}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500"
                    data-testid="button-authorize-oauth"
                  >
                    {(authorizeMutation.isPending || isAuthorizing) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4 mr-2" />
                    )}
                    Autorizza con MobileSentrix
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
              {!credential.accessToken && (
                <Button
                  variant="outline"
                  onClick={() => authorizeMutation.mutate()}
                  disabled={authorizeMutation.isPending || isAuthorizing}
                  data-testid="button-authorize-oauth-secondary"
                >
                  {(authorizeMutation.isPending || isAuthorizing) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4 mr-2" />
                  )}
                  Autorizza OAuth
                </Button>
              )}
              {credential.accessToken && (
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
              )}
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
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Key className="h-5 w-5" />
              Configura MobileSentrix
            </CardTitle>
            <CardDescription>
              Inserisci le tue credenziali OAuth MobileSentrix per accedere al catalogo ricambi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="consumerName">Consumer Name</Label>
              <Input
                id="consumerName"
                type="text"
                placeholder="Il nome del tuo consumer"
                value={consumerName}
                onChange={(e) => setConsumerName(e.target.value)}
                data-testid="input-consumer-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumerKey">Consumer Key</Label>
              <Input
                id="consumerKey"
                type="text"
                placeholder="La tua Consumer Key"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                data-testid="input-consumer-key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumerSecret">Consumer Secret</Label>
              <Input
                id="consumerSecret"
                type="password"
                placeholder="Il tuo Consumer Secret"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                data-testid="input-consumer-secret"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">Ambiente</Label>
              <Select value={environment} onValueChange={(v) => setEnvironment(v as "production" | "staging")}>
                <SelectTrigger data-testid="select-environment">
                  <SelectValue placeholder="Seleziona ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Produzione (www.mobilesentrix.eu)</SelectItem>
                  <SelectItem value="staging">Staging (preprod.mobilesentrix.eu)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Puoi ottenere le tue credenziali OAuth dal pannello MobileSentrix.{" "}
                <a
                  href="https://www.mobilesentrix.eu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Vai a MobileSentrix <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Flusso di configurazione:</strong><br />
                1. Inserisci Consumer Name, Consumer Key e Consumer Secret<br />
                2. Clicca "Salva Credenziali"<br />
                3. Clicca "Autorizza con MobileSentrix" per completare l'autenticazione OAuth
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !consumerName.trim() || !consumerKey.trim() || !consumerSecret.trim()}
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
          <CardTitle>Informazioni su MobileSentrix</CardTitle>
          <CardDescription>Come funziona l'integrazione MobileSentrix</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            MobileSentrix è un fornitore premium di ricambi per smartphone e tablet.
            L'integrazione ti permette di:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Consultare il catalogo prodotti con prezzi e disponibilità in tempo reale</li>
            <li>Ricercare prodotti per marca, modello e categoria</li>
            <li>Visualizzare dettagli prodotto e specifiche tecniche</li>
            <li>Effettuare ordini direttamente dalla piattaforma</li>
          </ul>
          <p className="pt-2">
            Per utilizzare l'integrazione, devi prima creare un account business su MobileSentrix e
            ottenere le tue credenziali OAuth (Consumer Key e Consumer Secret) dal pannello di controllo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
