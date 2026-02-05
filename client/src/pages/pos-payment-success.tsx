import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function PosPaymentSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <span className="text-green-600">Grazie!</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-lg">Il pagamento è stato elaborato.</p>
          <p className="text-muted-foreground">
            Puoi chiudere questa finestra e tornare in negozio.
          </p>
          
          <Button 
            onClick={() => window.close()}
            variant="default"
            className="mt-4"
            data-testid="button-close-window"
          >
            Chiudi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
