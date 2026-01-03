import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, LogIn, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function RepairLink() {
  const [, params] = useRoute("/repair-link/:id");
  const repairId = params?.id;
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  const { data, isLoading, error, isError } = useQuery<{ redirectPath: string }>({
    queryKey: ["/api/repair-orders", repairId, "redirect"],
    enabled: !!repairId && !!user && !authLoading,
  });

  useEffect(() => {
    if (data?.redirectPath && !redirecting) {
      setRedirecting(true);
      setLocation(data.redirectPath);
    }
  }, [data, setLocation, redirecting]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const returnUrl = encodeURIComponent(`/repair-link/${repairId}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <LogIn className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle>Accesso Richiesto</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Per visualizzare i dettagli di questa riparazione devi effettuare l'accesso.
            </p>
            <Button 
              onClick={() => setLocation(`/auth?returnTo=${returnUrl}`)}
              className="w-full"
              data-testid="button-login"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Accedi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Caricamento riparazione...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = (error as any)?.message || "Errore sconosciuto";
    const is403 = errorMessage.includes("403") || errorMessage.includes("accesso");
    const is404 = errorMessage.includes("404") || errorMessage.includes("not found");

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle>
              {is404 ? "Riparazione Non Trovata" : is403 ? "Accesso Negato" : "Errore"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {is404 && "La riparazione richiesta non esiste o è stata eliminata."}
              {is403 && "Non hai i permessi per visualizzare questa riparazione."}
              {!is404 && !is403 && errorMessage}
            </p>
            <Button 
              variant="outline"
              onClick={() => setLocation("/")}
              className="w-full"
              data-testid="button-go-home"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Torna alla Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}