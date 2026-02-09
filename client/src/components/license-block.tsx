import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";

export function LicenseBlockPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex items-center justify-center min-h-[60vh]" data-testid="license-block-page">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Licenza non attiva</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            La tua licenza è scaduta o non è ancora stata attivata. Per continuare a usare la piattaforma, acquista o rinnova il tuo piano.
          </p>
          <Button
            onClick={() => setLocation("/reseller/my-license")}
            className="w-full"
            data-testid="button-go-to-license"
          >
            <Shield className="mr-2 h-4 w-4" />
            Vai alla Licenza
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function LicenseExpiringBanner({ daysRemaining }: { daysRemaining: number }) {
  const [, setLocation] = useLocation();

  return (
    <div
      className="flex items-center gap-2 justify-between flex-wrap bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2 text-sm"
      data-testid="banner-license-expiring"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-foreground">
          La tua licenza scade tra <strong>{daysRemaining}</strong> {daysRemaining === 1 ? "giorno" : "giorni"}.
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setLocation("/reseller/my-license")}
        data-testid="button-renew-license"
      >
        Rinnova ora
      </Button>
    </div>
  );
}
