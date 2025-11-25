import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Save, Clock, Euro } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HourlyRateResponse {
  hourlyRateCents: number;
  description?: string;
  updatedAt?: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [hourlyRateEuros, setHourlyRateEuros] = useState<string>("");

  const { data: hourlyRateData, isLoading } = useQuery<HourlyRateResponse>({
    queryKey: ["/api/admin/settings/hourly-rate"],
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
    </div>
  );
}
