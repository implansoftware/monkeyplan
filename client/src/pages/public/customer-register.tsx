import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { CheckCircle, Loader2, User, Building2, Mail, Phone, Lock, Eye, EyeOff, Store } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";

interface InviteLinkInfo {
  linkId: string;
  customerType: "private" | "business";
  label: string | null;
  resellerName: string;
  resellerLogo: string | null;
}

export default function CustomerRegisterPage() {
  const [location, navigate] = useLocation();
  const token = location.startsWith("/invite/") ? location.slice("/invite/".length) : location.split("/").pop();
  const { toast } = useToast();
  usePageTitle("Registrazione Cliente");

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    ragioneSociale: "",
    partitaIva: "",
    pec: "",
    codiceFiscale: "",
    address: "",
  });
  const [registered, setRegistered] = useState(false);

  const { data: linkInfo, isLoading: loadingLink, error: linkError } = useQuery<InviteLinkInfo>({
    queryKey: [`/api/public/invite/${token}`],
    enabled: !!token,
    retry: false,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", `/api/public/invite/${token}/register`, data);
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    },
    onSuccess: () => {
      setRegistered(true);
    },
    onError: (error: Error) => {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    },
  });

  const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({ title: "Campi obbligatori", description: "Inserisci nome, email e password", variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Errore", description: "Le password non coincidono", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Errore", description: "La password deve essere di almeno 6 caratteri", variant: "destructive" });
      return;
    }
    registerMutation.mutate(formData);
  };

  if (loadingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (linkError || !linkInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <Store className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Link non valido</h2>
            <p className="text-muted-foreground text-sm">
              Questo link di registrazione non è valido, è scaduto o ha raggiunto il numero massimo di utilizzi.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>Torna alla home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold">Registrazione completata!</h2>
            <p className="text-muted-foreground text-sm">
              Il tuo account è stato creato. Riceverai una email di conferma con i tuoi dati di accesso.
            </p>
            <Button onClick={() => navigate("/")}>Accedi alla piattaforma</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompany = linkInfo.customerType === "business";

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {linkInfo.resellerLogo ? (
            <img src={linkInfo.resellerLogo} alt={linkInfo.resellerName} className="h-8 w-auto object-contain" />
          ) : (
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Store className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <span className="font-medium text-sm">{linkInfo.resellerName}</span>
        </div>
        <ThemeToggle />
      </div>

      <div className="max-w-lg mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            {isCompany ? <Building2 className="h-7 w-7 text-primary" /> : <User className="h-7 w-7 text-primary" />}
          </div>
          <h1 className="text-2xl font-bold">
            {linkInfo.label || (isCompany ? "Registrazione Azienda" : "Registrazione Cliente")}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Crea il tuo account per accedere ai servizi di <strong>{linkInfo.resellerName}</strong>
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              {isCompany ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}
              {isCompany ? "Dati aziendali" : "Dati personali"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isCompany && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ragioneSociale">Ragione Sociale *</Label>
                    <Input
                      id="ragioneSociale"
                      value={formData.ragioneSociale}
                      onChange={handleChange("ragioneSociale")}
                      placeholder="Azienda S.r.l."
                      data-testid="input-ragione-sociale"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="partitaIva">Partita IVA</Label>
                      <Input
                        id="partitaIva"
                        value={formData.partitaIva}
                        onChange={handleChange("partitaIva")}
                        placeholder="IT12345678901"
                        data-testid="input-partita-iva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
                      <Input
                        id="codiceFiscale"
                        value={formData.codiceFiscale}
                        onChange={handleChange("codiceFiscale")}
                        placeholder="RSSMRA80A01H501U"
                        data-testid="input-codice-fiscale"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pec">PEC</Label>
                    <Input
                      id="pec"
                      type="email"
                      value={formData.pec}
                      onChange={handleChange("pec")}
                      placeholder="azienda@pec.it"
                      data-testid="input-pec"
                    />
                  </div>
                  <Separator />
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Referente</p>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName">{isCompany ? "Nome Referente" : "Nome e Cognome"} *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={handleChange("fullName")}
                    placeholder="Mario Rossi"
                    className="pl-9"
                    data-testid="input-full-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange("email")}
                    placeholder="mario@email.com"
                    className="pl-9"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    placeholder="+39 333 1234567"
                    className="pl-9"
                    data-testid="input-phone"
                  />
                </div>
              </div>

              {isCompany && (
                <div className="space-y-2">
                  <Label htmlFor="address">Indirizzo sede</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={handleChange("address")}
                    placeholder="Via Roma 1, 20100 Milano"
                    data-testid="input-address"
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange("password")}
                    placeholder="Minimo 6 caratteri"
                    className="pl-9 pr-10"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    placeholder="Ripeti la password"
                    className="pl-9"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registrazione in corso...</>
                ) : (
                  "Crea account"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Hai già un account?{" "}
                <a href="/" className="text-primary hover:underline">Accedi</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
