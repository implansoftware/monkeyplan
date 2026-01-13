import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Plug, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  ShoppingCart,
  TestTube,
  RefreshCcw,
  Loader2,
  Clock,
  Package
} from "lucide-react";

import sifarLogo from "@/assets/logos/sifar.png";
import fonedayLogo from "@/assets/logos/foneday.png";
import mobilesentrixLogo from "@/assets/logos/mobilesentrix.png";
import trovausatiLogo from "@/assets/logos/trovausati.png";
import sibillLogo from "@/assets/logos/sibill.png";

interface IntegrationSummary {
  code: string;
  name: string;
  description: string;
  isConfigured: boolean;
  isActive: boolean;
  lastTestAt: string | null;
  lastTestStatus: string | null;
  lastSyncAt: string | null;
  stats: {
    ordersCount?: number;
    cartItemsCount?: number;
    lastOrderDate?: string;
  };
  settingsUrl: string;
  catalogUrl: string | null;
  cartUrl: string | null;
  ordersUrl: string | null;
}

const INTEGRATION_LOGOS: Record<string, React.ReactNode> = {
  sifar: (
    <div className="h-12 w-24 flex items-center justify-center">
      <img src={sifarLogo} alt="SIFAR" className="max-h-10 max-w-full object-contain" />
    </div>
  ),
  foneday: (
    <div className="h-12 w-24 flex items-center justify-center">
      <img src={fonedayLogo} alt="Foneday" className="max-h-10 max-w-full object-contain" />
    </div>
  ),
  mobilesentrix: (
    <div className="h-12 w-24 flex items-center justify-center">
      <img src={mobilesentrixLogo} alt="MobileSentrix" className="max-h-10 max-w-full object-contain" />
    </div>
  ),
  trovausati: (
    <div className="h-12 w-24 flex items-center justify-center">
      <img src={trovausatiLogo} alt="TrovaUsati" className="max-h-10 max-w-full object-contain" />
    </div>
  ),
  sibill: (
    <div className="h-12 w-24 flex items-center justify-center bg-white dark:bg-gray-100 rounded-lg p-1">
      <img src={sibillLogo} alt="Sibill" className="max-h-8 max-w-full object-contain" />
    </div>
  ),
};

const INTEGRATION_COLORS: Record<string, string> = {
  sifar: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  foneday: "bg-green-500/10 text-green-600 dark:text-green-400",
  mobilesentrix: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  trovausati: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  sibill: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

function IntegrationCard({ integration }: { integration: IntegrationSummary }) {
  const { toast } = useToast();

  const testMutation = useMutation({
    mutationFn: async () => {
      const endpoint = integration.code === "sifar" 
        ? "/api/sifar/test-connection"
        : integration.code === "foneday"
        ? "/api/foneday/test-connection"
        : integration.code === "mobilesentrix"
        ? "/api/mobilesentrix/test-connection"
        : `/api/${integration.code}/test-connection`;
      
      const body = integration.code === "sifar" ? { storeCode: "" } : undefined;
      const res = await apiRequest("POST", endpoint, body);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/reseller/integrations/summary"] });
      if (data.success) {
        toast({ title: "Connessione riuscita", description: `${integration.name} funziona correttamente` });
      } else {
        toast({ title: "Connessione fallita", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (date: string | null) => {
    if (!date) return "Mai";
    return new Date(date).toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    if (!integration.isConfigured) {
      return <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" /> Non configurata</Badge>;
    }
    if (!integration.isActive) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" /> Disattiva</Badge>;
    }
    if (integration.lastTestStatus === "success") {
      return <Badge className="gap-1 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"><CheckCircle className="h-3 w-3" /> Attiva</Badge>;
    }
    if (integration.lastTestStatus === "error") {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Errore</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Da testare</Badge>;
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${integration.isConfigured && integration.isActive ? "bg-green-500" : integration.isConfigured ? "bg-yellow-500" : "bg-muted"}`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {INTEGRATION_LOGOS[integration.code] || (
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Plug className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <CardDescription className="text-sm">{integration.description}</CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {integration.isConfigured && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Ultimo test</p>
              <p className="font-medium">{formatDate(integration.lastTestAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ultima sync</p>
              <p className="font-medium">{formatDate(integration.lastSyncAt)}</p>
            </div>
            {integration.stats.ordersCount !== undefined && (
              <div>
                <p className="text-muted-foreground">Ordini totali</p>
                <p className="font-medium">{integration.stats.ordersCount}</p>
              </div>
            )}
            {integration.stats.cartItemsCount !== undefined && integration.stats.cartItemsCount > 0 && (
              <div>
                <p className="text-muted-foreground">Articoli nel carrello</p>
                <p className="font-medium">{integration.stats.cartItemsCount}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Link href={integration.settingsUrl}>
            <Button variant="outline" size="sm" data-testid={`button-settings-${integration.code}`}>
              <Settings className="h-4 w-4 mr-1" />
              {integration.isConfigured ? "Impostazioni" : "Configura"}
            </Button>
          </Link>

          {integration.isConfigured && integration.isActive && (
            <>
              {integration.catalogUrl && (
                <Link href={integration.catalogUrl}>
                  <Button variant="outline" size="sm" data-testid={`button-catalog-${integration.code}`}>
                    <Package className="h-4 w-4 mr-1" />
                    Catalogo
                  </Button>
                </Link>
              )}
              {integration.cartUrl && (
                <Link href={integration.cartUrl}>
                  <Button variant="outline" size="sm" data-testid={`button-cart-${integration.code}`}>
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Carrello
                  </Button>
                </Link>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
                data-testid={`button-test-${integration.code}`}
              >
                {testMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <TestTube className="h-4 w-4 mr-1" />
                )}
                Test
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  const { data: integrations, isLoading, refetch, isRefetching } = useQuery<IntegrationSummary[]>({
    queryKey: ["/api/reseller/integrations/summary"],
  });

  const configuredCount = integrations?.filter(i => i.isConfigured).length || 0;
  const activeCount = integrations?.filter(i => i.isConfigured && i.isActive && i.lastTestStatus === "success").length || 0;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Plug className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Integrazioni</h1>
            <p className="text-muted-foreground">
              Gestisci tutte le integrazioni con fornitori e servizi esterni
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">{configuredCount} configurate</Badge>
            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">{activeCount} attive</Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isRefetching}
            data-testid="button-refresh-integrations"
          >
            <RefreshCcw className={`h-4 w-4 mr-1 ${isRefetching ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {integrations && integrations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.code} integration={integration} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Plug className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nessuna integrazione disponibile</h3>
            <p className="text-muted-foreground">
              Contatta l'amministratore per abilitare le integrazioni con i fornitori.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informazioni</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Le integrazioni ti permettono di collegare MonkeyPlan ai tuoi fornitori di ricambi preferiti.
            Una volta configurate, potrai sfogliare i cataloghi, aggiungere articoli al carrello e inviare ordini direttamente dalla piattaforma.
          </p>
          <p>
            <strong>SIFAR:</strong> Fornitore italiano di ricambi per telefonia. Richiede CLIENT_KEY e codice punto vendita.
          </p>
          <p>
            <strong>Foneday:</strong> Fornitore europeo con ampio catalogo. Richiede API Token.
          </p>
          <p>
            <strong>MobileSentrix:</strong> Fornitore con prezzi in EUR. Richiede OAuth 1.0a (Consumer Key + Secret).
          </p>
          <p>
            <strong>TrovaUsati:</strong> Marketplace e valutatore usato. Supporta sia acquisto B2B che valutazione permute.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
