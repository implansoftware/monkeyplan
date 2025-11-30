import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Save, Clock, Euro, AlertTriangle, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HourlyRateResponse {
  hourlyRateCents: number;
  description?: string;
  updatedAt?: string;
}

interface SLAThresholdConfig {
  warning: number;   // ore per soglia gialla
  critical: number;  // ore per soglia rossa
}

interface SLAThresholdsResponse {
  ingressato: SLAThresholdConfig;
  in_diagnosi: SLAThresholdConfig;
  preventivo_emesso: SLAThresholdConfig;
  attesa_ricambi: SLAThresholdConfig;
  in_riparazione: SLAThresholdConfig;
  in_test: SLAThresholdConfig;
  pronto_ritiro: SLAThresholdConfig;
}

const defaultSLAThresholds: SLAThresholdsResponse = {
  ingressato: { warning: 24, critical: 48 },
  in_diagnosi: { warning: 24, critical: 48 },
  preventivo_emesso: { warning: 48, critical: 72 },
  attesa_ricambi: { warning: 72, critical: 120 },
  in_riparazione: { warning: 24, critical: 48 },
  in_test: { warning: 8, critical: 24 },
  pronto_ritiro: { warning: 24, critical: 72 },
};

const phaseLabels: Record<string, string> = {
  ingressato: "1. Ingresso",
  in_diagnosi: "2. Diagnosi",
  preventivo_emesso: "3. Preventivo",
  attesa_ricambi: "4. Attesa Ricambi",
  in_riparazione: "5. In Riparazione",
  in_test: "6. Test Finale",
  pronto_ritiro: "7. Pronto Ritiro",
};

const phaseDescriptions: Record<string, string> = {
  ingressato: "Tempo dalla presa in carico all'inizio diagnosi",
  in_diagnosi: "Tempo per completare la diagnosi del dispositivo",
  preventivo_emesso: "Tempo di attesa per risposta cliente al preventivo",
  attesa_ricambi: "Tempo dall'ordine ricambi alla ricezione",
  in_riparazione: "Tempo per completare la riparazione",
  in_test: "Tempo per eseguire i test finali",
  pronto_ritiro: "Tempo dal dispositivo pronto al ritiro effettivo",
};

const phaseIcons: Record<string, string> = {
  ingressato: "📥",
  in_diagnosi: "🔍",
  preventivo_emesso: "📋",
  attesa_ricambi: "📦",
  in_riparazione: "🔧",
  in_test: "✅",
  pronto_ritiro: "🚚",
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");
  const [slaThresholds, setSlaThresholds] = useState<SLAThresholdsResponse>(defaultSLAThresholds);

  const { data: hourlyRateData, isLoading } = useQuery<HourlyRateResponse>({
    queryKey: ["/api/admin/settings/hourly-rate"],
  });

  const { data: slaData, isLoading: slaLoading } = useQuery<SLAThresholdsResponse>({
    queryKey: ["/api/admin/settings/sla-thresholds"],
  });

  useEffect(() => {
    if (slaData) {
      setSlaThresholds(slaData);
    }
  }, [slaData]);

  const updateSLAMutation = useMutation({
    mutationFn: async (thresholds: SLAThresholdsResponse) => {
      return await apiRequest("PUT", "/api/admin/settings/sla-thresholds", thresholds);
    },
    onSuccess: () => {
      toast({
        title: "Soglie SLA Salvate",
        description: "Le soglie temporali sono state aggiornate con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/sla-thresholds"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHourlyRateMutation = useMutation({
    mutationFn: async (hourlyRateCents: number) => {
      return await apiRequest("PATCH", "/api/admin/settings/hourly-rate", {
        hourlyRateCents,
      });
    },
    onSuccess: () => {
      toast({
        title: "Impostazioni Salvate",
        description: "La tariffa oraria è stata aggiornata con successo",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/hourly-rate"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/hourly-rate"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveHourlyRate = () => {
    const euros = parseFloat(hourlyRateEuros);
    if (isNaN(euros) || euros < 0) {
      toast({
        title: "Errore",
        description: "Inserisci un valore valido per la tariffa oraria",
        variant: "destructive",
      });
      return;
    }
    const cents = Math.round(euros * 100);
    updateHourlyRateMutation.mutate(cents);
  };

  const currentRateEuros = hourlyRateData 
    ? (hourlyRateData.hourlyRateCents / 100).toFixed(2) 
    : "35.00";

  const displayRate = hourlyRateEuros || currentRateEuros;

  return (
    <div className="flex-1 space-y-6 p-6 overflow-y-auto">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
          <p className="text-muted-foreground">
            Configura i parametri globali del sistema
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tariffa Manodopera
            </CardTitle>
            <CardDescription>
              Imposta la tariffa oraria per il calcolo automatico del costo manodopera nei preventivi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hourly-rate">Tariffa Oraria (EUR)</Label>
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="hourly-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={currentRateEuros}
                      value={hourlyRateEuros}
                      onChange={(e) => setHourlyRateEuros(e.target.value)}
                      className="max-w-[200px]"
                      data-testid="input-hourly-rate"
                    />
                    <span className="text-sm text-muted-foreground">/ ora</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Valore attuale: <span className="font-semibold">{currentRateEuros} EUR/ora</span>
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <h4 className="font-medium mb-2">Come funziona</h4>
                  <p className="text-sm text-muted-foreground">
                    Quando crei un preventivo, il costo della manodopera viene calcolato automaticamente 
                    moltiplicando questa tariffa per il tempo stimato di riparazione indicato nella diagnosi.
                  </p>
                  <div className="mt-3 p-2 bg-background rounded border">
                    <p className="text-sm font-mono">
                      Costo Manodopera = Tariffa Oraria × Ore Stimate
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveHourlyRate}
                  disabled={updateHourlyRateMutation.isPending || !hourlyRateEuros}
                  data-testid="button-save-hourly-rate"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateHourlyRateMutation.isPending ? "Salvataggio..." : "Salva Tariffa"}
                </Button>

                {hourlyRateData?.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Ultimo aggiornamento: {new Date(hourlyRateData.updatedAt).toLocaleString("it-IT")}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Esempio di Calcolo</CardTitle>
            <CardDescription>
              Simulazione del calcolo manodopera per un preventivo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tariffa Oraria</p>
                  <p className="font-semibold">{displayRate} EUR</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tempo Stimato</p>
                  <p className="font-semibold">2 ore</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <p className="font-medium">Costo Manodopera</p>
                  <p className="text-xl font-bold text-primary">
                    {(parseFloat(displayRate || "0") * 2).toFixed(2)} EUR
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Soglie SLA (Service Level Agreement)
          </CardTitle>
          <CardDescription>
            Configura le soglie temporali per il monitoraggio delle riparazioni. 
            Il sistema cambierà automaticamente il colore di priorità quando vengono superate le soglie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm font-medium">In Tempo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" />
              <span className="text-sm font-medium">In Ritardo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm font-medium">Urgente</span>
            </div>
          </div>

          {slaLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {(Object.keys(defaultSLAThresholds) as Array<keyof SLAThresholdsResponse>).map((phase) => {
                const threshold = slaThresholds[phase] || defaultSLAThresholds[phase];
                
                return (
                  <div key={phase} className="border rounded-lg p-4 space-y-4 bg-card">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{phaseIcons[phase]}</span>
                        <div>
                          <h4 className="font-semibold text-lg">{phaseLabels[phase]}</h4>
                          <p className="text-sm text-muted-foreground">{phaseDescriptions[phase]}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600">
                          Ritardo: {threshold.warning}h
                        </Badge>
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600">
                          Urgente: {threshold.critical}h
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          Soglia Ritardo (ore)
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={threshold.warning}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 1;
                            setSlaThresholds(prev => ({
                              ...prev,
                              [phase]: {
                                ...prev[phase],
                                warning: hours
                              }
                            }));
                          }}
                          data-testid={`input-sla-warning-${phase}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          Oltre questa soglia il badge diventa giallo
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          Soglia Urgente (ore)
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={threshold.critical}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 1;
                            setSlaThresholds(prev => ({
                              ...prev,
                              [phase]: {
                                ...prev[phase],
                                critical: hours
                              }
                            }));
                          }}
                          data-testid={`input-sla-critical-${phase}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          Oltre questa soglia il badge diventa rosso
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSlaThresholds(defaultSLAThresholds)}
                  data-testid="button-reset-sla"
                >
                  Ripristina Predefiniti
                </Button>
                <Button
                  onClick={() => updateSLAMutation.mutate(slaThresholds)}
                  disabled={updateSLAMutation.isPending}
                  data-testid="button-save-sla"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSLAMutation.isPending ? "Salvataggio..." : "Salva Soglie SLA"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
