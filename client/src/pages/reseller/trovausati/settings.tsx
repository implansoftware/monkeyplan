import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Plus, Trash2, CheckCircle, XCircle, Store, Key, RefreshCcw, Loader2, AlertTriangle, ExternalLink, ShoppingBag, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrovausatiCredential {
  id: string;
  resellerId: string;
  apiType: "resellers" | "stores";
  apiKey: string | null;
  marketplaceApiKey: string | null;
  storesApiKey: string | null;
  marketplaceId: string | null;
  isActive: boolean;
  storesIsActive: boolean;
  lastTestAt: string | null;
  lastTestResult: string | null;
  storesLastTestAt: string | null;
  storesLastTestResult: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TrovausatiShop {
  id: string;
  credentialId: string;
  shopId: string;
  shopName: string | null;
  branchId: string | null;
  repairCenterId: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function TrovausatiSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [marketplaceApiKey, setMarketplaceApiKey] = useState("");
  const [storesApiKey, setStoresApiKey] = useState("");
  const [marketplaceId, setMarketplaceId] = useState("");
  const [newShopId, setNewShopId] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [marketplaceTestResult, setMarketplaceTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [storesTestResult, setStoresTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showEditCredential, setShowEditCredential] = useState(false);
  const [editTab, setEditTab] = useState<"marketplace" | "stores">("marketplace");

  const { data: credential, isLoading: loadingCredential } = useQuery<TrovausatiCredential | null>({
    queryKey: ["/api/trovausati/credentials"],
  });

  const { data: shops = [], isLoading: loadingShops } = useQuery<TrovausatiShop[]>({
    queryKey: ["/api/trovausati/shops"],
    enabled: !!credential,
  });

  const saveCredentialsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trovausati/credentials", {
        marketplaceApiKey: marketplaceApiKey || undefined,
        storesApiKey: storesApiKey || undefined,
        marketplaceId: marketplaceId || null,
        isActive: !!marketplaceApiKey,
        storesIsActive: !!storesApiKey,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
      setMarketplaceApiKey("");
      setStoresApiKey("");
      setMarketplaceId("");
      toast({ title: "Credenziali salvate", description: "Le credenziali TrovaUsati sono state configurate" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const updateCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!credential) return;
      const res = await apiRequest("PUT", `/api/trovausati/credentials/${credential.id}`, {
        marketplaceApiKey: marketplaceApiKey || undefined,
        storesApiKey: storesApiKey || undefined,
        marketplaceId: marketplaceId || credential.marketplaceId,
        isActive: marketplaceApiKey ? true : credential.isActive,
        storesIsActive: storesApiKey ? true : credential.storesIsActive,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
      setMarketplaceApiKey("");
      setStoresApiKey("");
      setShowEditCredential(false);
      toast({ title: "Credenziali aggiornate", description: "Le credenziali TrovaUsati sono state aggiornate" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const toggleApiMutation = useMutation({
    mutationFn: async ({ apiType, isActive }: { apiType: "marketplace" | "stores"; isActive: boolean }) => {
      if (!credential) return;
      const updates = apiType === "marketplace" 
        ? { isActive }
        : { storesIsActive: isActive };
      const res = await apiRequest("PUT", `/api/trovausati/credentials/${credential.id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const testMarketplaceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trovausati/test", { apiType: "resellers" });
      return res.json();
    },
    onSuccess: (data) => {
      setMarketplaceTestResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
      if (data.success) {
        toast({ title: "Connessione Marketplace riuscita", description: "La connessione al Marketplace B2B funziona" });
      } else {
        toast({ title: "Connessione fallita", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      setMarketplaceTestResult({ success: false, message: error.message });
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const testStoresMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trovausati/test", { apiType: "stores" });
      return res.json();
    },
    onSuccess: (data) => {
      setStoresTestResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
      if (data.success) {
        toast({ title: "Connessione Valutatore riuscita", description: "La connessione al Valutatore funziona" });
      } else {
        toast({ title: "Connessione fallita", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      setStoresTestResult({ success: false, message: error.message });
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const addShopMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trovausati/shops", {
        shopId: newShopId,
        shopName: newShopName || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/shops"] });
      setNewShopId("");
      setNewShopName("");
      setShowAddShop(false);
      toast({ title: "Negozio aggiunto", description: "Il negozio TrovaUsati è stato configurato" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteShopMutation = useMutation({
    mutationFn: async (shopId: string) => {
      await apiRequest("DELETE", `/api/trovausati/shops/${shopId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/shops"] });
      toast({ title: "Negozio rimosso" });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  if (loadingCredential) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasMarketplaceKey = credential?.marketplaceApiKey || credential?.apiKey;
  const hasStoresKey = credential?.storesApiKey;

  return (
    <div className="p-6 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Configurazione TrovaUsati</h1>
              <p className="text-sm text-muted-foreground">Gestisci le credenziali per Marketplace B2B e Valutatore dispositivi</p>
            </div>
          </div>
        </div>
      </div>

      {!credential ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <Key className="h-5 w-5" />
              Configurazione Iniziale
            </CardTitle>
            <CardDescription>
              Configura le API Key di TrovaUsati. Puoi configurare una o entrambe le API.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nessuna credenziale configurata. Inserisci almeno una API Key per iniziare.
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Marketplace B2B</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Per acquisto dispositivi usati e ordini B2B
                </p>
                <div className="space-y-2">
                  <Label htmlFor="marketplaceApiKey">Token API Marketplace</Label>
                  <Input
                    id="marketplaceApiKey"
                    type="password"
                    placeholder="Inserisci il token API Marketplace"
                    value={marketplaceApiKey}
                    onChange={(e) => setMarketplaceApiKey(e.target.value)}
                    data-testid="input-marketplace-api-key"
                  />
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold">Valutatore / Negozi</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Per valutazioni dispositivi, coupon e trade-in
                </p>
                <div className="space-y-2">
                  <Label htmlFor="storesApiKey">Token API Valutatore</Label>
                  <Input
                    id="storesApiKey"
                    type="password"
                    placeholder="Inserisci il token API Valutatore"
                    value={storesApiKey}
                    onChange={(e) => setStoresApiKey(e.target.value)}
                    data-testid="input-stores-api-key"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketplaceId">Marketplace ID (opzionale)</Label>
              <Input
                id="marketplaceId"
                placeholder="ID del marketplace se disponibile"
                value={marketplaceId}
                onChange={(e) => setMarketplaceId(e.target.value)}
                data-testid="input-marketplace-id"
              />
            </div>

            <Button
              onClick={() => saveCredentialsMutation.mutate()}
              disabled={(!marketplaceApiKey && !storesApiKey) || saveCredentialsMutation.isPending}
              data-testid="button-save-credentials"
            >
              {saveCredentialsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salva Credenziali
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="marketplace" className="flex flex-wrap items-center gap-2" data-testid="tab-marketplace">
              <ShoppingBag className="h-4 w-4" />
              Marketplace B2B
              {hasMarketplaceKey && <Badge variant={credential.isActive ? "default" : "secondary"} className="ml-1 text-xs">{credential.isActive ? "ON" : "OFF"}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="valutatore" className="flex flex-wrap items-center gap-2" data-testid="tab-valutatore">
              <Tag className="h-4 w-4" />
              Valutatore
              {hasStoresKey && <Badge variant={credential.storesIsActive ? "default" : "secondary"} className="ml-1 text-xs">{credential.storesIsActive ? "ON" : "OFF"}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                    API Marketplace B2B
                  </div>
                  {hasMarketplaceKey && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("common.active")}</span>
                      <Switch
                        checked={credential.isActive}
                        onCheckedChange={(checked) => toggleApiMutation.mutate({ apiType: "marketplace", isActive: checked })}
                        data-testid="switch-marketplace-active"
                      />
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  Token per acquisto dispositivi usati e gestione ordini B2B sul marketplace TrovaUsati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasMarketplaceKey ? (
                  <>
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>
                          Token Marketplace configurato
                          {credential.lastTestResult && (
                            <Badge variant={credential.lastTestResult === "success" ? "default" : "destructive"} className="ml-2">
                              {credential.lastTestResult === "success" ? "Funzionante" : t("common.error")}
                            </Badge>
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditTab("marketplace");
                            setShowEditCredential(true);
                          }}
                          data-testid="button-update-marketplace"
                        >
                          Modifica Token
                        </Button>
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => testMarketplaceMutation.mutate()}
                        disabled={testMarketplaceMutation.isPending || !credential.isActive}
                        data-testid="button-test-marketplace"
                      >
                        {testMarketplaceMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4 mr-2" />
                        )}
                        Testa Connessione
                      </Button>
                    </div>

                    {marketplaceTestResult && (
                      <Alert variant={marketplaceTestResult.success ? "default" : "destructive"}>
                        {marketplaceTestResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{marketplaceTestResult.message}</AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Token Marketplace non configurato</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditTab("marketplace");
                          setShowEditCredential(true);
                        }}
                        data-testid="button-add-marketplace"
                      >
                        Configura
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="valutatore" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag className="h-5 w-5 text-green-600" />
                    API Valutatore / Negozi
                  </div>
                  {hasStoresKey && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">{t("common.active")}</span>
                      <Switch
                        checked={credential.storesIsActive}
                        onCheckedChange={(checked) => toggleApiMutation.mutate({ apiType: "stores", isActive: checked })}
                        data-testid="switch-stores-active"
                      />
                    </div>
                  )}
                </CardTitle>
                <CardDescription>
                  Token per valutazioni dispositivi, gestione coupon e operazioni trade-in in negozio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasStoresKey ? (
                  <>
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="flex items-center justify-between">
                        <span>
                          Token Valutatore configurato
                          {credential.storesLastTestResult && (
                            <Badge variant={credential.storesLastTestResult === "success" ? "default" : "destructive"} className="ml-2">
                              {credential.storesLastTestResult === "success" ? "Funzionante" : t("common.error")}
                            </Badge>
                          )}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditTab("stores");
                            setShowEditCredential(true);
                          }}
                          data-testid="button-update-stores"
                        >
                          Modifica Token
                        </Button>
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => testStoresMutation.mutate()}
                        disabled={testStoresMutation.isPending || !credential.storesIsActive}
                        data-testid="button-test-stores"
                      >
                        {testStoresMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCcw className="h-4 w-4 mr-2" />
                        )}
                        Testa Connessione
                      </Button>
                    </div>

                    {storesTestResult && (
                      <Alert variant={storesTestResult.success ? "default" : "destructive"}>
                        {storesTestResult.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>{storesTestResult.message}</AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>Token Valutatore non configurato</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditTab("stores");
                          setShowEditCredential(true);
                        }}
                        data-testid="button-add-stores"
                      >
                        Configura
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {hasStoresKey && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        <Store className="h-5 w-5" />
                        Negozi TrovaUsati
                      </CardTitle>
                      <CardDescription>
                        Configura i negozi per le operazioni in-store e coupon
                      </CardDescription>
                    </div>
                    <Dialog open={showAddShop} onOpenChange={setShowAddShop}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-shop">
                          <Plus className="h-4 w-4 mr-2" />{t("common.add")}</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Aggiungi Negozio TrovaUsati</DialogTitle>
                          <DialogDescription>
                            Inserisci l'ID del negozio TrovaUsati da associare
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="shopId">Shop ID *</Label>
                            <Input
                              id="shopId"
                              placeholder="Es. 12345"
                              value={newShopId}
                              onChange={(e) => setNewShopId(e.target.value)}
                              data-testid="input-new-shop-id"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shopName">Nome negozio (opzionale)</Label>
                            <Input
                              id="shopName"
                              placeholder="Es. Negozio Principale"
                              value={newShopName}
                              onChange={(e) => setNewShopName(e.target.value)}
                              data-testid="input-new-shop-name"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddShop(false)}>{t("common.cancel")}</Button>
                          <Button
                            onClick={() => addShopMutation.mutate()}
                            disabled={!newShopId || addShopMutation.isPending}
                            data-testid="button-confirm-add-shop"
                          >
                            {addShopMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
                            Aggiungi
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingShops ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : shops.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nessun negozio configurato. Aggiungi un negozio per utilizzare le funzionalità in-store.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {shops.map((shop) => (
                        <div
                          key={shop.id}
                          className="flex items-center justify-between p-3 border rounded-md"
                          data-testid={`shop-item-${shop.id}`}
                        >
                          <div className="flex flex-wrap items-center gap-3">
                            <Store className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {shop.shopName || `Negozio ${shop.shopId}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Shop ID: {shop.shopId}
                              </div>
                            </div>
                            {shop.isActive ? (
                              <Badge variant="default">{t("common.active")}</Badge>
                            ) : (
                              <Badge variant="secondary">Disattivo</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteShopMutation.mutate(shop.id)}
                            disabled={deleteShopMutation.isPending}
                            data-testid={`button-delete-shop-${shop.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {credential && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Link Rapidi
            </CardTitle>
            <CardDescription>
              Accedi rapidamente alle funzionalità TrovaUsati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2" 
                disabled={!hasMarketplaceKey || !credential.isActive}
                onClick={() => navigate("/reseller/trovausati/marketplace")}
                data-testid="link-marketplace"
              >
                <ShoppingBag className="h-6 w-6" />
                <span>Marketplace B2B</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2" 
                disabled={!hasStoresKey || !credential.storesIsActive}
                onClick={() => navigate("/reseller/trovausati/valutatore")}
                data-testid="link-valuations"
              >
                <Tag className="h-6 w-6" />
                <span>Valutazioni</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2" 
                disabled={!hasStoresKey || !credential.storesIsActive}
                onClick={() => navigate("/reseller/trovausati/valutatore")}
                data-testid="link-coupons"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Coupon GDS</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showEditCredential} onOpenChange={setShowEditCredential}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editTab === "marketplace" ? "Modifica Token Marketplace" : "Modifica Token Valutatore"}
            </DialogTitle>
            <DialogDescription>
              {editTab === "marketplace" 
                ? "Aggiorna il token API per il Marketplace B2B"
                : "Aggiorna il token API per il Valutatore/Negozi"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editTab === "marketplace" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="editMarketplaceApiKey">Token API Marketplace</Label>
                  <Input
                    id="editMarketplaceApiKey"
                    type="password"
                    placeholder="Inserisci nuovo token (vuoto = mantieni)"
                    value={marketplaceApiKey}
                    onChange={(e) => setMarketplaceApiKey(e.target.value)}
                    data-testid="input-edit-marketplace-api-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editMarketplaceId">Marketplace ID</Label>
                  <Input
                    id="editMarketplaceId"
                    placeholder="ID marketplace"
                    value={marketplaceId || credential?.marketplaceId || ""}
                    onChange={(e) => setMarketplaceId(e.target.value)}
                    data-testid="input-edit-marketplace-id"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="editStoresApiKey">Token API Valutatore</Label>
                <Input
                  id="editStoresApiKey"
                  type="password"
                  placeholder="Inserisci nuovo token (vuoto = mantieni)"
                  value={storesApiKey}
                  onChange={(e) => setStoresApiKey(e.target.value)}
                  data-testid="input-edit-stores-api-key"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditCredential(false);
              setMarketplaceApiKey("");
              setStoresApiKey("");
              setMarketplaceId("");
            }}>{t("common.cancel")}</Button>
            <Button
              onClick={() => updateCredentialsMutation.mutate()}
              disabled={updateCredentialsMutation.isPending}
              data-testid="button-confirm-update-credentials"
            >
              {updateCredentialsMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Aggiorna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
