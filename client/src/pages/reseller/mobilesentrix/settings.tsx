import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, CheckCircle, XCircle, Loader2, TestTube, Trash2, Package, Shield, LogIn } from "lucide-react";
import { Link } from "wouter";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const { data: credential, isLoading } = useQuery<MobilesentrixCredential | null>({
    queryKey: ["/api/mobilesentrix/credentials"],
  });

  // Listen for OAuth success message from popup window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'mobilesentrix_oauth_success') {
        toast({
          title: "Accesso completato",
          description: "Connessione a MobileSentrix riuscita! Ora puoi accedere al catalogo.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
        setIsAuthorizing(false);
      }
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
                title: "Accesso completato",
                description: "Connessione a MobileSentrix riuscita!",
              });
              queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
            } else {
              toast({
                title: "Errore accesso",
                description: data.message || "Errore durante l'accesso",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            toast({
              title: "Errore",
              description: error.message || "Errore durante l'accesso",
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

  // Create credentials (using server-side env vars) and start OAuth
  const loginMutation = useMutation({
    mutationFn: async () => {
      // First, ensure credentials exist (server uses env vars)
      await apiRequest("POST", "/api/mobilesentrix/credentials", {});
      // Then get authorize URL
      const res = await apiRequest("GET", "/api/mobilesentrix/oauth/authorize-url");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.authorizeUrl) {
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
          title: "Accesso in corso",
          description: "Completa il login nella finestra che si è aperta.",
        });
        
        // Poll for access token completion
        const pollInterval = setInterval(async () => {
          try {
            if (popup && popup.closed) {
              clearInterval(pollInterval);
              queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
              setIsAuthorizing(false);
              return;
            }
            
            const res = await fetch("/api/mobilesentrix/credentials", { credentials: "include" });
            if (res.ok) {
              const cred = await res.json();
              if (cred && cred.accessToken) {
                clearInterval(pollInterval);
                if (popup && !popup.closed) popup.close();
                queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
                setIsAuthorizing(false);
                toast({
                  title: "Accesso completato",
                  description: "Connessione a MobileSentrix riuscita!",
                });
              }
            }
          } catch {
            // Ignore polling errors
          }
        }, 2000);
        
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsAuthorizing(false);
        }, 5 * 60 * 1000);
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/mobilesentrix/credentials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobilesentrix/credentials"] });
      toast({ title: "Disconnesso", description: "Accesso MobileSentrix rimosso" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

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

  const isConnected = credential && credential.accessToken;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">MobileSentrix</h1>
            <p className="text-muted-foreground">Integrazione fornitore ricambi</p>
          </div>
        </div>
        {isConnected && (
          <Link href="/reseller/mobilesentrix/catalog">
            <Button data-testid="button-go-catalog">
              <Package className="h-4 w-4 mr-2" />
              Vai al Catalogo
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Stato Connessione
              </CardTitle>
              <CardDescription>
                {isConnected ? "Sei connesso a MobileSentrix" : "Accedi per consultare il catalogo ricambi"}
              </CardDescription>
            </div>
            <Badge 
              variant={isConnected ? "default" : "secondary"}
              className={isConnected ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white" : ""}
            >
              {isConnected ? "Connesso" : "Non connesso"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ultimo Test</p>
                  <div className="flex items-center gap-2">
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
                    <p className="text-xs text-muted-foreground">{credential.testMessage}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Ambiente</p>
                  <Badge variant="outline">Produzione</Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t">
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
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  data-testid="button-disconnect"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Disconnetti
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Accedi a MobileSentrix</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Clicca il pulsante qui sotto per accedere con il tuo account MobileSentrix e iniziare a consultare il catalogo ricambi.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => loginMutation.mutate()}
                disabled={loginMutation.isPending || isAuthorizing}
                className="bg-gradient-to-r from-blue-500 to-cyan-500"
                data-testid="button-login-mobilesentrix"
              >
                {(loginMutation.isPending || isAuthorizing) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                Accedi con MobileSentrix
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni su MobileSentrix</CardTitle>
          <CardDescription>Come funziona l'integrazione</CardDescription>
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
        </CardContent>
      </Card>
    </div>
  );
}
