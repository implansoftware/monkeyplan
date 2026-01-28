import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ExternalIntegration, InsertExternalIntegration } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, Search, Pencil, Trash2, Globe, Link2, Key,
  CheckCircle2, XCircle, ExternalLink, Settings
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type AuthMethod = 'bearer_token' | 'api_key_header' | 'api_key_query' | 'basic_auth' | 'oauth2' | 'none';

const authMethodLabels: Record<AuthMethod, string> = {
  bearer_token: "Bearer Token",
  api_key_header: "API Key (Header)",
  api_key_query: "API Key (Query String)",
  basic_auth: "Basic Auth",
  oauth2: "OAuth 2.0",
  none: "Nessuna",
};

export default function AdminExternalIntegrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<ExternalIntegration | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();

  const { data: integrations = [], isLoading } = useQuery<ExternalIntegration[]>({
    queryKey: ["/api/external-integrations"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertExternalIntegration) => {
      const res = await apiRequest("POST", "/api/external-integrations", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-integrations"] });
      setDialogOpen(false);
      setEditingIntegration(null);
      toast({ title: "Integrazione creata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertExternalIntegration> }) => {
      const res = await apiRequest("PATCH", `/api/external-integrations/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-integrations"] });
      setDialogOpen(false);
      setEditingIntegration(null);
      toast({ title: "Integrazione aggiornata con successo" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/external-integrations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/external-integrations"] });
      toast({ title: "Integrazione eliminata" });
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertExternalIntegration = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      logoUrl: formData.get("logoUrl") as string || undefined,
      defaultApiEndpoint: formData.get("defaultApiEndpoint") as string || undefined,
      defaultAuthMethod: formData.get("defaultAuthMethod") as string || undefined,
      docsUrl: formData.get("docsUrl") as string || undefined,
      supportsCatalog: formData.get("supportsCatalog") === "on",
      supportsOrdering: formData.get("supportsOrdering") === "on",
      supportsCart: formData.get("supportsCart") === "on",
      supportsInvoicing: formData.get("supportsInvoicing") === "on",
      supportsReconciliation: formData.get("supportsReconciliation") === "on",
      supportsAccounts: formData.get("supportsAccounts") === "on",
      isActive: formData.get("isActive") === "on",
      displayOrder: formData.get("displayOrder") ? parseInt(formData.get("displayOrder") as string) : 0,
    };

    if (editingIntegration) {
      updateMutation.mutate({ id: editingIntegration.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (integration: ExternalIntegration) => {
    setEditingIntegration(integration);
    setActiveTab("general");
    setDialogOpen(true);
  };

  const handleNewIntegration = () => {
    setEditingIntegration(null);
    setActiveTab("general");
    setDialogOpen(true);
  };

  const filteredIntegrations = integrations.filter((integration) =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-slate-100 dark:from-primary/10 dark:via-primary/5 dark:to-slate-900 p-6 border">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Integrazioni Esterne</h1>
              <p className="text-sm text-muted-foreground">
                Gestisci le integrazioni con fornitori API esterni
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewIntegration} data-testid="button-new-integration">
                <Plus className="h-4 w-4 mr-2" />
                Nuova Integrazione
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIntegration ? `Modifica ${editingIntegration.name}` : "Nuova Integrazione Esterna"}
              </DialogTitle>
              <DialogDescription>
                {editingIntegration 
                  ? "Modifica le configurazioni dell'integrazione" 
                  : "Configura una nuova integrazione con fornitore API esterno"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">Generale</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-4" forceMount hidden={activeTab !== "general"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Codice *</Label>
                      <Input 
                        id="code" 
                        name="code" 
                        placeholder="sifar"
                        defaultValue={editingIntegration?.code || ""}
                        required 
                        data-testid="input-integration-code" 
                      />
                      <p className="text-xs text-muted-foreground">
                        Identificativo univoco (lowercase)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        placeholder="SIFAR"
                        defaultValue={editingIntegration?.name || ""}
                        required 
                        data-testid="input-integration-name" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrizione</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      placeholder="Descrizione dell'integrazione..."
                      defaultValue={editingIntegration?.description || ""}
                      data-testid="input-integration-description" 
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">URL Logo</Label>
                      <Input 
                        id="logoUrl" 
                        name="logoUrl" 
                        type="url"
                        placeholder="https://example.com/logo.png"
                        defaultValue={editingIntegration?.logoUrl || ""}
                        data-testid="input-integration-logo" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="displayOrder">Ordine Visualizzazione</Label>
                      <Input 
                        id="displayOrder" 
                        name="displayOrder" 
                        type="number"
                        min={0}
                        defaultValue={editingIntegration?.displayOrder || 0}
                        data-testid="input-integration-order" 
                      />
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Settings className="h-4 w-4" />
                      Funzionalità Supportate
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="supportsCatalog"
                          name="supportsCatalog"
                          defaultChecked={editingIntegration?.supportsCatalog ?? false}
                          data-testid="switch-supports-catalog"
                        />
                        <Label htmlFor="supportsCatalog">Catalogo</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="supportsOrdering"
                          name="supportsOrdering"
                          defaultChecked={editingIntegration?.supportsOrdering ?? false}
                          data-testid="switch-supports-ordering"
                        />
                        <Label htmlFor="supportsOrdering">Ordini</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="supportsCart"
                          name="supportsCart"
                          defaultChecked={editingIntegration?.supportsCart ?? false}
                          data-testid="switch-supports-cart"
                        />
                        <Label htmlFor="supportsCart">Carrello</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="supportsInvoicing"
                          name="supportsInvoicing"
                          defaultChecked={editingIntegration?.supportsInvoicing ?? false}
                          data-testid="switch-supports-invoicing"
                        />
                        <Label htmlFor="supportsInvoicing">Fatture</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="supportsReconciliation"
                          name="supportsReconciliation"
                          defaultChecked={editingIntegration?.supportsReconciliation ?? false}
                          data-testid="switch-supports-reconciliation"
                        />
                        <Label htmlFor="supportsReconciliation">Riconciliazione</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="supportsAccounts"
                          name="supportsAccounts"
                          defaultChecked={editingIntegration?.supportsAccounts ?? false}
                          data-testid="switch-supports-accounts"
                        />
                        <Label htmlFor="supportsAccounts">Conti</Label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Switch
                        id="isActive"
                        name="isActive"
                        defaultChecked={editingIntegration?.isActive ?? false}
                        data-testid="switch-is-active"
                      />
                      <Label htmlFor="isActive">Integrazione Attiva</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="api" className="space-y-4 mt-4" forceMount hidden={activeTab !== "api"}>
                  <div className="space-y-2">
                    <Label htmlFor="defaultApiEndpoint">URL Base API</Label>
                    <Input 
                      id="defaultApiEndpoint" 
                      name="defaultApiEndpoint" 
                      type="url"
                      placeholder="https://api.fornitore.com"
                      defaultValue={editingIntegration?.defaultApiEndpoint || ""}
                      data-testid="input-api-endpoint" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultAuthMethod">Metodo Autenticazione</Label>
                    <Select 
                      name="defaultAuthMethod" 
                      defaultValue={editingIntegration?.defaultAuthMethod || "bearer_token"}
                    >
                      <SelectTrigger data-testid="select-auth-method">
                        <SelectValue placeholder="Seleziona metodo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bearer_token">Bearer Token</SelectItem>
                        <SelectItem value="api_key_header">API Key (Header)</SelectItem>
                        <SelectItem value="api_key_query">API Key (Query String)</SelectItem>
                        <SelectItem value="basic_auth">Basic Auth</SelectItem>
                        <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                        <SelectItem value="none">Nessuna</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="docsUrl">URL Documentazione</Label>
                    <Input 
                      id="docsUrl" 
                      name="docsUrl" 
                      type="url"
                      placeholder="https://docs.fornitore.com/api"
                      defaultValue={editingIntegration?.docsUrl || ""}
                      data-testid="input-docs-url" 
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-integration"
                >
                  {(createMutation.isPending || updateMutation.isPending) 
                    ? "Salvataggio..." 
                    : editingIntegration ? "Aggiorna" : "Crea Integrazione"}
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per nome o codice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-integrations"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredIntegrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nessuna integrazione trovata</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integrazione</TableHead>
                  <TableHead>Codice</TableHead>
                  <TableHead>Autenticazione</TableHead>
                  <TableHead>Funzionalità</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIntegrations.map((integration) => (
                  <TableRow key={integration.id} data-testid={`row-integration-${integration.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {integration.logoUrl ? (
                          <img 
                            src={integration.logoUrl} 
                            alt={integration.name}
                            className="h-8 w-8 rounded object-contain"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{integration.name}</div>
                          {integration.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {integration.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">{integration.code}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Key className="h-3 w-3" />
                        {authMethodLabels[integration.defaultAuthMethod as AuthMethod] || integration.defaultAuthMethod || "N/D"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {integration.supportsCatalog && (
                          <Badge variant="outline" className="text-xs">Catalogo</Badge>
                        )}
                        {integration.supportsOrdering && (
                          <Badge variant="outline" className="text-xs">Ordini</Badge>
                        )}
                        {integration.supportsCart && (
                          <Badge variant="outline" className="text-xs">Carrello</Badge>
                        )}
                        {integration.supportsInvoicing && (
                          <Badge variant="outline" className="text-xs">Fatture</Badge>
                        )}
                        {integration.supportsReconciliation && (
                          <Badge variant="outline" className="text-xs">Riconciliazione</Badge>
                        )}
                        {integration.supportsAccounts && (
                          <Badge variant="outline" className="text-xs">Conti</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {integration.isActive ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Attiva
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inattiva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {integration.docsUrl && (
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => window.open(integration.docsUrl!, '_blank')}
                            data-testid={`button-open-docs-${integration.id}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => handleEdit(integration)}
                          data-testid={`button-edit-${integration.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Eliminare l'integrazione "${integration.name}"?`)) {
                              deleteMutation.mutate(integration.id);
                            }
                          }}
                          data-testid={`button-delete-${integration.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
