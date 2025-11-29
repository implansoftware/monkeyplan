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
  lateMinutes: number;
  urgentMinutes: number;
}

interface SLAThresholdsResponse {
  diagnosis: SLAThresholdConfig;
  quote: SLAThresholdConfig;
  parts: SLAThresholdConfig;
  test: SLAThresholdConfig;
  delivery: SLAThresholdConfig;
}

const defaultSLAThresholds: SLAThresholdsResponse = {
  diagnosis: { lateMinutes: 1440, urgentMinutes: 2880 },
  quote: { lateMinutes: 720, urgentMinutes: 1440 },
  parts: { lateMinutes: 4320, urgentMinutes: 10080 },
  test: { lateMinutes: 480, urgentMinutes: 1440 },
  delivery: { lateMinutes: 1440, urgentMinutes: 4320 },
};

const phaseLabels: Record<string, string> = {
  diagnosis: "Diagnosi",
  quote: "Preventivo",
  parts: "Attesa Ricambi",
  test: "Test Finale",
  delivery: "Consegna",
};

const phaseDescriptions: Record<string, string> = {
  diagnosis: "Tempo massimo dalla presa in carico alla diagnosi completata",
  quote: "Tempo massimo dalla diagnosi all'invio del preventivo",
  parts: "Tempo massimo dall'ordine ricambi alla ricezione",
  test: "Tempo massimo dalla riparazione completata al test finale",
  delivery: "Tempo massimo dal dispositivo pronto al ritiro effettivo",
};

function minutesToDisplay(minutes: number): { value: number; unit: string } {
  if (minutes >= 1440 && minutes % 1440 === 0) {
    return { value: minutes / 1440, unit: "giorni" };
  } else if (minutes >= 60 && minutes % 60 === 0) {
    return { value: minutes / 60, unit: "ore" };
  }
  return { value: minutes, unit: "minuti" };
}

function displayToMinutes(value: number, unit: string): number {
  if (unit === "giorni") return value * 1440;
  if (unit === "ore") return value * 60;
  return value;
}

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
              {(Object.keys(slaThresholds) as Array<keyof SLAThresholdsResponse>).map((phase) => {
                const lateDisplay = minutesToDisplay(slaThresholds[phase].lateMinutes);
                const urgentDisplay = minutesToDisplay(slaThresholds[phase].urgentMinutes);
                
                return (
                  <div key={phase} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{phaseLabels[phase]}</h4>
                        <p className="text-sm text-muted-foreground">{phaseDescriptions[phase]}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">
                          Ritardo: {lateDisplay.value} {lateDisplay.unit}
                        </Badge>
                        <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-300">
                          Urgente: {urgentDisplay.value} {urgentDisplay.unit}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          Soglia Ritardo (giorni)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={(slaThresholds[phase].lateMinutes / 1440).toFixed(1)}
                          onChange={(e) => {
                            const days = parseFloat(e.target.value) || 0;
                            setSlaThresholds(prev => ({
                              ...prev,
                              [phase]: {
                                ...prev[phase],
                                lateMinutes: Math.round(days * 1440)
                              }
                            }));
                          }}
                          data-testid={`input-sla-late-${phase}`}
                        />
                        <p className="text-xs text-muted-foreground">
                          Oltre questa soglia il badge diventa giallo
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          Soglia Urgente (giorni)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={(slaThresholds[phase].urgentMinutes / 1440).toFixed(1)}
                          onChange={(e) => {
                            const days = parseFloat(e.target.value) || 0;
                            setSlaThresholds(prev => ({
                              ...prev,
                              [phase]: {
                                ...prev[phase],
                                urgentMinutes: Math.round(days * 1440)
                              }
                            }));
                          }}
                          data-testid={`input-sla-urgent-${phase}`}
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
