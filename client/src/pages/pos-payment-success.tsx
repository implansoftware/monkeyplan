import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

export default function PosPaymentSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get("transaction_id");
    const sessionId = params.get("session_id");
    const type = params.get("type");

    if (!transactionId) {
      setStatus("error");
      setMessage("ID transazione mancante");
      return;
    }

    const checkPayment = async () => {
      try {
        const res = await fetch(`/api/pos/public/check-payment-status/${transactionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed" || data.status === "paid") {
            setStatus("success");
            setMessage(data.message || "Pagamento completato con successo!");
            return;
          } else if (data.status === "pending") {
            setMessage("Pagamento in elaborazione...");
            setTimeout(checkPayment, 3000);
            return;
          } else {
            setStatus("error");
            setMessage(`Stato pagamento: ${data.status}`);
            return;
          }
        } else {
          setStatus("error");
          setMessage("Impossibile verificare lo stato del pagamento");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Errore durante la verifica del pagamento");
      }
    };

    checkPayment();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <span>Verifica pagamento...</span>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500" />
                <span className="text-green-600">Pagamento Completato</span>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-16 w-16 text-destructive" />
                <span className="text-destructive">Errore Pagamento</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {status !== "loading" && (
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => window.close()}
                variant="default"
                data-testid="button-close-window"
              >
                Chiudi questa finestra
              </Button>
              <p className="text-sm text-muted-foreground">
                Puoi chiudere questa finestra e tornare al terminale POS
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
