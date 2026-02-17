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
import { Settings, Plus, Trash2, CheckCircle, XCircle, Store, Key, RefreshCcw, Loader2, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SifarCredential {
  id: string;
  environment: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  hasClientKey: boolean;
}

interface SifarStore {
  id: string;
  credentialId: string;
  storeCode: string;
  storeName: string | null;
  isDefault: boolean;
  createdAt: string;
}

export default function SifarSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [clientKey, setClientKey] = useState("");
  const [environment, setEnvironment] = useState<string>("collaudo");
  const [newStoreCode, setNewStoreCode] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [testStoreCode, setTestStoreCode] = useState("");
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showAddStore, setShowAddStore] = useState(false);

  const { data: credential, isLoading: loadingCredential } = useQuery<SifarCredential | null>({
    queryKey: ["/api/sifar/credentials"],
  });

  const { data: stores = [], isLoading: loadingStores } = useQuery<SifarStore[]>({
    queryKey: ["/api/sifar/stores"],
    enabled: !!credential,
  });

  const saveCredentialsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sifar/credentials", {
        clientKey,
        environment,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sifar/credentials"] });
      setClientKey("");
      toast({ title: t("integrations.credentialsSaved"), description: t("integrations.credentialsConfigured") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (storeCode: string) => {
      const res = await apiRequest("POST", "/api/sifar/test-connection", { storeCode });
      return res.json();
    },
    onSuccess: (data) => {
      setTestResult(data);
      if (data.success) {
        toast({ title: t("integrations.connectionSuccessful"), description: t("integrations.connectionWorksCorrectly") });
      } else {
        toast({ title: t("integrations.connectionFailed"), description: data.message, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      setTestResult({ success: false, message: error.message });
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const addStoreMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sifar/stores", {
        storeCode: newStoreCode,
        storeName: newStoreName || null,
        isDefault: stores.length === 0,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sifar/stores"] });
      setNewStoreCode("");
      setNewStoreName("");
      setShowAddStore(false);
      toast({ title: t("integrations.storeAdded"), description: t("integrations.storeConfigured") });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      await apiRequest("DELETE", `/api/sifar/stores/${storeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sifar/stores"] });
      toast({ title: t("integrations.storeRemoved") });
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold">SIFAR {t("integrations.settingsTitle")}</h1>
          <p className="text-muted-foreground">{t("integrations.manageCredentialsAndStores")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <Key className="h-5 w-5" />
            {t("integrations.apiCredentials")}
          </CardTitle>
          <CardDescription>
            {t("integrations.enterClientKey")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {credential?.hasClientKey ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {t("integrations.credentialsConfiguredEnv", { env: "" })} <Badge variant="outline">{credential.environment}</Badge>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEnvironment(credential.environment);
                  }}
                  data-testid="button-update-credentials"
                >{t("common.edit")}</Button>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {t("integrations.noCredentialsConfigured")}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientKey">Client Key</Label>
              <Input
                id="clientKey"
                type="password"
                placeholder={t("integrations.enterApiToken")}
                value={clientKey}
                onChange={(e) => setClientKey(e.target.value)}
                data-testid="input-client-key"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment">{t("integrations.environment")}</Label>
              <Select value={environment} onValueChange={setEnvironment}>
                <SelectTrigger data-testid="select-environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collaudo">{t("integrations.staging")}</SelectItem>
                  <SelectItem value="produzione">{t("integrations.production")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => saveCredentialsMutation.mutate()}
            disabled={!clientKey || saveCredentialsMutation.isPending}
            data-testid="button-save-credentials"
          >
            {saveCredentialsMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {t("integrations.saveCreds")}
          </Button>
        </CardContent>
      </Card>

      {credential?.hasClientKey && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                <RefreshCcw className="h-5 w-5" />
                {t("integrations.testConnection")}
              </CardTitle>
              <CardDescription>
                {t("integrations.verifyConnection")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder={t("integrations.storeCode")}
                  value={testStoreCode}
                  onChange={(e) => setTestStoreCode(e.target.value)}
                  data-testid="input-test-store-code"
                />
                <Button
                  onClick={() => testConnectionMutation.mutate(testStoreCode)}
                  disabled={!testStoreCode || testConnectionMutation.isPending}
                  data-testid="button-test-connection"
                >
                  {testConnectionMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {t("integrations.test")}
                </Button>
              </div>

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
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Store className="h-5 w-5" />
                    {t("integrations.stores")}
                  </CardTitle>
                  <CardDescription>
                    {t("integrations.configureStoresForOrders")}
                  </CardDescription>
                </div>
                <Dialog open={showAddStore} onOpenChange={setShowAddStore}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-store">
                      <Plus className="h-4 w-4 mr-2" />{t("common.add")}</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("integrations.addStore")}</DialogTitle>
                      <DialogDescription>
                        {t("integrations.enterStoreCode")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeCode">{t("integrations.storeCodeRequired")}</Label>
                        <Input
                          id="storeCode"
                          placeholder={t("sifar.storeCodePlaceholder")}
                          value={newStoreCode}
                          onChange={(e) => setNewStoreCode(e.target.value)}
                          data-testid="input-new-store-code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storeName">{t("integrations.nameOptional")}</Label>
                        <Input
                          id="storeName"
                          placeholder={t("integrations.egMainStore")}
                          value={newStoreName}
                          onChange={(e) => setNewStoreName(e.target.value)}
                          data-testid="input-new-store-name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddStore(false)}>{t("common.cancel")}</Button>
                      <Button
                        onClick={() => addStoreMutation.mutate()}
                        disabled={!newStoreCode || addStoreMutation.isPending}
                        data-testid="button-confirm-add-store"
                      >
                        {addStoreMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        {t("common.add")}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStores ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : stores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("integrations.noStoresConfiguredYet")}
                </div>
              ) : (
                <div className="space-y-2">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`store-item-${store.id}`}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Store className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {store.storeName || t("integrations.storeLabel", { code: store.storeCode })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {t("integrations.code")}: {store.storeCode}
                          </div>
                        </div>
                        {store.isDefault && (
                          <Badge variant="secondary">{t("integrations.default")}</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteStoreMutation.mutate(store.id)}
                        disabled={deleteStoreMutation.isPending}
                        data-testid={`button-delete-store-${store.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
