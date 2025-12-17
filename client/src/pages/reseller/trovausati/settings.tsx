import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Plus, Trash2, CheckCircle, XCircle, Store, Key, RefreshCcw, Loader2, AlertTriangle, ExternalLink } from "lucide-react";

interface TrovausatiCredential {
  id: string;
  resellerId: string;
  apiType: "resellers" | "stores";
  apiKey: string;
  marketplaceId: string | null;
  isActive: boolean;
  lastTestAt: string | null;
  lastTestResult: string | null;
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
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [apiType, setApiType] = useState<"resellers" | "stores">("resellers");
  const [marketplaceId, setMarketplaceId] = useState("");
  const [newShopId, setNewShopId] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAddShop, setShowAddShop] = useState(false);
  const [showEditCredential, setShowEditCredential] = useState(false);

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
        apiKey,
        apiType,
        marketplaceId: marketplaceId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
      setApiKey("");
      setMarketplaceId("");
      toast({ title: "Credenziali salvate", description: "Le credenziali TrovaUsati sono state configurate" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateCredentialsMutation = useMutation({
    mutationFn: async () => {
      if (!credential) return;
      const res = await apiRequest("PUT", `/api/trovausati/credentials/${credential.id}`, {
        apiKey: apiKey || undefined,
        apiType,
        marketplaceId: marketplaceId || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
      setApiKey("");
      setShowEditCredential(false);
      toast({ title: "Credenziali aggiornate", description: "Le credenziali TrovaUsati sono state aggiornate" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trovausati/test", {});
      return res.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/trovausati/credentials"] });
      if (data.success) {
        toast({ title: "Connessione riuscita", description: "La connessione a TrovaUsati funziona correttamente" });
      } else {
        toast({ title: "Connessione fallita", description: data.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      setTestResult({ success: false, message: error.message });
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
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
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  if (loadingCredential) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">Configurazione TrovaUsati</h1>
          <p className="text-muted-foreground">Gestisci le credenziali e i negozi per valutazioni dispositivi e marketplace usato</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credenziali API
          </CardTitle>
          <CardDescription>
            Inserisci la API Key fornita da TrovaUsati per abilitare l'integrazione con i servizi di valutazione e marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credential ? (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Credenziali configurate - Tipo API: <Badge variant="outline">{credential.apiType === "resellers" ? "Rivenditori" : "Negozi/GDS"}</Badge>
                    {credential.lastTestResult && (
                      <span className="ml-2">
                        Ultimo test: <Badge variant={credential.lastTestResult === "success" ? "default" : "destructive"}>{credential.lastTestResult}</Badge>
                      </span>
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setApiType(credential.apiType);
                      setMarketplaceId(credential.marketplaceId || "");
                      setShowEditCredential(true);
                    }}
                    data-testid="button-update-credentials"
                  >
                    Modifica
                  </Button>
                </AlertDescription>
              </Alert>

              <Dialog open={showEditCredential} onOpenChange={setShowEditCredential}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Modifica Credenziali</DialogTitle>
                    <DialogDescription>
                      Aggiorna le credenziali TrovaUsati
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="editApiKey">Nuova API Key (lascia vuoto per mantenere)</Label>
                      <Input
                        id="editApiKey"
                        type="password"
                        placeholder="Inserisci nuova API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        data-testid="input-edit-api-key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editApiType">Tipo API</Label>
                      <Select value={apiType} onValueChange={(v) => setApiType(v as "resellers" | "stores")}>
                        <SelectTrigger data-testid="select-edit-api-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="resellers">Rivenditori (Marketplace/Ordini)</SelectItem>
                          <SelectItem value="stores">Negozi/GDS (Valutazioni/Coupon)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editMarketplaceId">Marketplace ID (opzionale)</Label>
                      <Input
                        id="editMarketplaceId"
                        placeholder="ID del marketplace"
                        value={marketplaceId}
                        onChange={(e) => setMarketplaceId(e.target.value)}
                        data-testid="input-edit-marketplace-id"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEditCredential(false)}>
                      Annulla
                    </Button>
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
            </>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nessuna credenziale configurata. Inserisci la API Key per iniziare.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Inserisci la API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    data-testid="input-api-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiType">Tipo API</Label>
                  <Select value={apiType} onValueChange={(v) => setApiType(v as "resellers" | "stores")}>
                    <SelectTrigger data-testid="select-api-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resellers">Rivenditori (Marketplace/Ordini)</SelectItem>
                      <SelectItem value="stores">Negozi/GDS (Valutazioni/Coupon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketplaceId">Marketplace ID (opzionale)</Label>
                <Input
                  id="marketplaceId"
                  placeholder="ID del marketplace (se disponibile)"
                  value={marketplaceId}
                  onChange={(e) => setMarketplaceId(e.target.value)}
                  data-testid="input-marketplace-id"
                />
              </div>

              <Button
                onClick={() => saveCredentialsMutation.mutate()}
                disabled={!apiKey || saveCredentialsMutation.isPending}
                data-testid="button-save-credentials"
              >
                {saveCredentialsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salva Credenziali
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {credential && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCcw className="h-5 w-5" />
                Test Connessione
              </CardTitle>
              <CardDescription>
                Verifica che la connessione a TrovaUsati funzioni correttamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                data-testid="button-test-connection"
              >
                {testConnectionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Testa Connessione
              </Button>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Negozi TrovaUsati
                  </CardTitle>
                  <CardDescription>
                    Configura i negozi per le operazioni GDS e valutazioni in negozio
                  </CardDescription>
                </div>
                <Dialog open={showAddShop} onOpenChange={setShowAddShop}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-shop">
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi
                    </Button>
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
                      <Button variant="outline" onClick={() => setShowAddShop(false)}>
                        Annulla
                      </Button>
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
                  Nessun negozio configurato. Aggiungi un negozio per utilizzare le funzionalità GDS.
                </div>
              ) : (
                <div className="space-y-2">
                  {shops.map((shop) => (
                    <div
                      key={shop.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`shop-item-${shop.id}`}
                    >
                      <div className="flex items-center gap-3">
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
                          <Badge variant="default">Attivo</Badge>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Link Rapidi
              </CardTitle>
              <CardDescription>
                Accedi rapidamente alle funzionalità TrovaUsati
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" data-testid="link-marketplace">
                  <Store className="h-6 w-6" />
                  <span>Marketplace Usato</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" data-testid="link-valuations">
                  <Key className="h-6 w-6" />
                  <span>Valutazioni</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" data-testid="link-coupons">
                  <CheckCircle className="h-6 w-6" />
                  <span>Coupon GDS</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
