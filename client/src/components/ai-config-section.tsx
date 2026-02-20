import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bot, Eye, EyeOff, Key, Trash2, Loader2, CheckCircle, AlertCircle, Save, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface AiConfigSectionProps {
  role: "reseller" | "repair_center";
  apiBase: string;
}

interface AiConfigResponse {
  hasKey: boolean;
  maskedKey: string | null;
  aiEnabled: boolean;
  adminDisabled: boolean;
}

export function AiConfigSection({ role, apiBase }: AiConfigSectionProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  const { data: config, isLoading } = useQuery<AiConfigResponse>({
    queryKey: [apiBase],
  });

  const saveMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await apiRequest("PUT", apiBase, { apiKey: key });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase] });
      setApiKey("");
      toast({
        title: t("ai.config.keySaved", "Chiave API salvata"),
        description: t("ai.config.keySavedDesc", "La chiave API OpenAI è stata configurata con successo."),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error", "Errore"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", apiBase, { apiKey: "" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiBase] });
      toast({
        title: t("ai.config.keyRemoved", "Chiave API rimossa"),
        description: t("ai.config.keyRemovedDesc", "La chiave API OpenAI è stata rimossa."),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error", "Errore"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!apiKey.trim()) return;
    if (!apiKey.startsWith("sk-")) {
      toast({
        title: t("ai.config.invalidKey", "Chiave non valida"),
        description: t("ai.config.invalidKeyDesc", "La chiave API OpenAI deve iniziare con 'sk-'."),
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(apiKey.trim());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <Bot className="h-5 w-5" />
          {t("ai.config.title", "Configurazione Assistente AI")}
        </CardTitle>
        <CardDescription>
          {t("ai.config.description", "Configura la tua chiave API OpenAI per abilitare l'assistente AI. Ogni entità gestisce i propri costi direttamente con OpenAI.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {config?.adminDisabled && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">
              {t("ai.config.adminDisabled", "L'assistente AI è stato disabilitato dall'amministratore per la tua entità.")}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm font-medium">{t("ai.config.status", "Stato")}</Label>
            {config?.hasKey ? (
              <Badge variant="default" data-testid="badge-ai-status">
                <CheckCircle className="mr-1 h-3 w-3" />
                {t("ai.config.configured", "Configurato")}
              </Badge>
            ) : (
              <Badge variant="secondary" data-testid="badge-ai-status">
                <AlertCircle className="mr-1 h-3 w-3" />
                {t("ai.config.notConfigured", "Non configurato")}
              </Badge>
            )}
          </div>

          {config?.hasKey && config.maskedKey && (
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm text-muted-foreground">{t("ai.config.currentKey", "Chiave attuale")}:</Label>
              <code className="rounded bg-muted px-2 py-1 text-sm font-mono" data-testid="text-masked-key">
                {config.maskedKey}
              </code>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="openai-key">{t("ai.config.apiKeyLabel", "Chiave API OpenAI")}</Label>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="openai-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pl-9 pr-9 font-mono"
                  data-testid="input-openai-key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowKey(!showKey)}
                  data-testid="button-toggle-key-visibility"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim() || saveMutation.isPending}
                data-testid="button-save-ai-key"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {t("common.save", "Salva")}
              </Button>
              {config?.hasKey && (
                <Button
                  variant="destructive"
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  data-testid="button-remove-ai-key"
                >
                  {removeMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {t("ai.config.removeKey", "Rimuovi")}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4 space-y-2">
          <h4 className="text-sm font-medium">{t("ai.config.howItWorks", "Come funziona")}</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
            <li>{t("ai.config.info1", "Ogni entità configura la propria chiave API OpenAI (modello BYOK - Bring Your Own Key).")}</li>
            <li>{t("ai.config.info2", "I costi dell'AI vengono addebitati direttamente sul tuo account OpenAI.")}</li>
            <li>{t("ai.config.info3", "L'assistente AI utilizza il modello GPT-4o-mini per risposte veloci e convenienti.")}</li>
            <li>{t("ai.config.info4", "Puoi ottenere una chiave API su platform.openai.com.")}</li>
          </ul>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            data-testid="link-openai-platform"
          >
            {t("ai.config.getKey", "Ottieni una chiave API OpenAI")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
