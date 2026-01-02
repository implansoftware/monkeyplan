import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, 
  Store, 
  CheckCircle, 
  Lock,
  Mail,
  User,
  Phone,
  Building,
  FileText,
  ArrowRight,
  Clock,
  ShieldCheck
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [customerData, setCustomerData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
  });
  const [resellerData, setResellerData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    phone: "",
    ragioneSociale: "",
    partitaIva: "",
  });
  const [resellerPending, setResellerPending] = useState(false);

  const resellerRegisterMutation = useMutation({
    mutationFn: async (data: typeof resellerData) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "reseller",
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.pending) {
        setResellerPending(true);
        toast({
          title: "Registrazione completata",
          description: "Il tuo account è in attesa di approvazione.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user) {
    const redirectPath = user.role === "admin" ? "/" :
      user.role === "reseller" ? "/reseller" :
      user.role === "reseller_staff" ? "/reseller" :
      user.role === "repair_center" ? "/repair-center" :
      "/customer";
    return <Redirect to={redirectPath} />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({ ...customerData, role: "customer" });
  };

  const handleResellerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    resellerRegisterMutation.mutate(resellerData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="w-full py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-xl">MonkeyPlan</span>
              <span className="text-xs text-muted-foreground ml-2">Beta</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11 mb-6">
              <TabsTrigger value="login" data-testid="tab-login" className="text-sm">
                Accedi
              </TabsTrigger>
              <TabsTrigger value="customer" data-testid="tab-customer" className="text-sm">
                Cliente
              </TabsTrigger>
              <TabsTrigger value="reseller" data-testid="tab-reseller" className="text-sm">
                Business
              </TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="mt-0">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Accedi al tuo account</h1>
                    <p className="text-sm text-muted-foreground">
                      Gestisci riparazioni, magazzino e clienti
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username o Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-username"
                          data-testid="input-login-username"
                          placeholder="nome@azienda.it"
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          data-testid="input-login-password"
                          placeholder="La tua password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Accesso...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Accedi
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Connessione sicura
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Supporto 24/7
                    </span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CUSTOMER TAB */}
            <TabsContent value="customer" className="mt-0">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Registrati come Cliente</h1>
                    <p className="text-sm text-muted-foreground">
                      Traccia lo stato delle tue riparazioni in tempo reale
                    </p>
                  </div>

                  <form onSubmit={handleCustomerRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-fullname">Nome e Cognome</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer-fullname"
                          data-testid="input-customer-fullname"
                          placeholder="Mario Rossi"
                          value={customerData.fullName}
                          onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="customer-email"
                          type="email"
                          data-testid="input-customer-email"
                          placeholder="mario@esempio.it"
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="customer-username">Username</Label>
                        <Input
                          id="customer-username"
                          data-testid="input-customer-username"
                          placeholder="mariorossi"
                          value={customerData.username}
                          onChange={(e) => setCustomerData({ ...customerData, username: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-password">Password</Label>
                        <Input
                          id="customer-password"
                          type="password"
                          data-testid="input-customer-password"
                          placeholder="Min. 6 caratteri"
                          value={customerData.password}
                          onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-customer-register"
                    >
                      {registerMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Registrazione...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Crea Account
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BUSINESS/RESELLER TAB */}
            <TabsContent value="reseller" className="mt-0">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  {resellerPending ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Richiesta Inviata</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                          Ti contatteremo entro 24 ore per attivare il tuo account business.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setResellerPending(false)}
                        data-testid="button-reseller-new-request"
                      >
                        Nuova Richiesta
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center gap-2 text-primary">
                          <Store className="h-5 w-5" />
                          <h1 className="text-2xl font-bold">Account Business</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Per rivenditori e centri di riparazione
                        </p>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-xs text-amber-800 dark:text-amber-200 text-center">
                          La registrazione business richiede verifica. Sarai contattato entro 24h.
                        </p>
                      </div>

                      <form onSubmit={handleResellerRegister} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="reseller-fullname" className="text-xs">Referente</Label>
                            <div className="relative">
                              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                id="reseller-fullname"
                                data-testid="input-reseller-fullname"
                                placeholder="Nome Cognome"
                                value={resellerData.fullName}
                                onChange={(e) => setResellerData({ ...resellerData, fullName: e.target.value })}
                                className="pl-8 h-9 text-sm"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="reseller-phone" className="text-xs">Telefono</Label>
                            <div className="relative">
                              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                id="reseller-phone"
                                data-testid="input-reseller-phone"
                                placeholder="+39 333..."
                                value={resellerData.phone}
                                onChange={(e) => setResellerData({ ...resellerData, phone: e.target.value })}
                                className="pl-8 h-9 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-ragione-sociale" className="text-xs">Ragione Sociale</Label>
                          <div className="relative">
                            <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              id="reseller-ragione-sociale"
                              data-testid="input-reseller-ragione-sociale"
                              placeholder="Nome Azienda S.r.l."
                              value={resellerData.ragioneSociale}
                              onChange={(e) => setResellerData({ ...resellerData, ragioneSociale: e.target.value })}
                              className="pl-8 h-9 text-sm"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="reseller-partita-iva" className="text-xs">Partita IVA</Label>
                            <div className="relative">
                              <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                id="reseller-partita-iva"
                                data-testid="input-reseller-partita-iva"
                                placeholder="IT12345678901"
                                value={resellerData.partitaIva}
                                onChange={(e) => setResellerData({ ...resellerData, partitaIva: e.target.value })}
                                className="pl-8 h-9 text-sm"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="reseller-email" className="text-xs">Email Aziendale</Label>
                            <div className="relative">
                              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                id="reseller-email"
                                type="email"
                                data-testid="input-reseller-email"
                                placeholder="info@azienda.it"
                                value={resellerData.email}
                                onChange={(e) => setResellerData({ ...resellerData, email: e.target.value })}
                                className="pl-8 h-9 text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="reseller-username" className="text-xs">Username</Label>
                            <Input
                              id="reseller-username"
                              data-testid="input-reseller-username"
                              placeholder="username"
                              value={resellerData.username}
                              onChange={(e) => setResellerData({ ...resellerData, username: e.target.value })}
                              className="h-9 text-sm"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="reseller-password" className="text-xs">Password</Label>
                            <Input
                              id="reseller-password"
                              type="password"
                              data-testid="input-reseller-password"
                              placeholder="Min. 6 caratteri"
                              value={resellerData.password}
                              onChange={(e) => setResellerData({ ...resellerData, password: e.target.value })}
                              className="h-9 text-sm"
                              required
                            />
                          </div>
                        </div>
                        
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={resellerRegisterMutation.isPending}
                          data-testid="button-reseller-register"
                        >
                          {resellerRegisterMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Invio...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Richiedi Accesso Business
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>MonkeyPlan - Gestione Riparazioni Elettroniche</p>
      </footer>
    </div>
  );
}
