import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Shield, Building, Users, Store, CheckCircle } from "lucide-react";
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
          description: "Il tuo account è in attesa di approvazione da parte dell'amministratore.",
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
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4">
              <Wrench className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold">Monkey Plan <span className="text-red-500">Beta</span></h1>
            <p className="text-muted-foreground mt-2">
              Gestione Centri di Riparazione Elettronica
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="customer" data-testid="tab-customer">Cliente</TabsTrigger>
              <TabsTrigger value="reseller" data-testid="tab-reseller">Rivenditore</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Accedi</CardTitle>
                  <CardDescription>
                    Inserisci le tue credenziali per accedere
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username o Email</Label>
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        placeholder="Inserisci username o email"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        data-testid="input-login-password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Accesso in corso..." : "Accedi"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer">
              <Card>
                <CardHeader>
                  <CardTitle>Registrazione Cliente</CardTitle>
                  <CardDescription>
                    Crea un account per gestire le tue riparazioni
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCustomerRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-fullname">Nome Completo</Label>
                      <Input
                        id="customer-fullname"
                        data-testid="input-customer-fullname"
                        value={customerData.fullName}
                        onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-email">Email</Label>
                      <Input
                        id="customer-email"
                        type="email"
                        data-testid="input-customer-email"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-username">Username</Label>
                      <Input
                        id="customer-username"
                        data-testid="input-customer-username"
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
                        value={customerData.password}
                        onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-customer-register"
                    >
                      {registerMutation.isPending ? "Registrazione..." : "Registrati come Cliente"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reseller">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Registrazione Rivenditore
                  </CardTitle>
                  <CardDescription>
                    Richiedi un account rivenditore (richiede approvazione)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {resellerPending ? (
                    <div className="text-center py-8 space-y-4">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                      <h3 className="text-lg font-semibold">Richiesta Inviata</h3>
                      <p className="text-muted-foreground">
                        La tua richiesta di registrazione come rivenditore è stata inviata.
                        Riceverai una notifica quando l'amministratore approverà il tuo account.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setResellerPending(false)}
                        data-testid="button-reseller-new-request"
                      >
                        Nuova Richiesta
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleResellerRegister} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reseller-fullname">Nome Referente</Label>
                          <Input
                            id="reseller-fullname"
                            data-testid="input-reseller-fullname"
                            value={resellerData.fullName}
                            onChange={(e) => setResellerData({ ...resellerData, fullName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reseller-phone">Telefono</Label>
                          <Input
                            id="reseller-phone"
                            data-testid="input-reseller-phone"
                            value={resellerData.phone}
                            onChange={(e) => setResellerData({ ...resellerData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reseller-ragione-sociale">Ragione Sociale</Label>
                        <Input
                          id="reseller-ragione-sociale"
                          data-testid="input-reseller-ragione-sociale"
                          value={resellerData.ragioneSociale}
                          onChange={(e) => setResellerData({ ...resellerData, ragioneSociale: e.target.value })}
                          placeholder="Nome azienda"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reseller-partita-iva">Partita IVA</Label>
                        <Input
                          id="reseller-partita-iva"
                          data-testid="input-reseller-partita-iva"
                          value={resellerData.partitaIva}
                          onChange={(e) => setResellerData({ ...resellerData, partitaIva: e.target.value })}
                          placeholder="IT12345678901"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reseller-email">Email</Label>
                        <Input
                          id="reseller-email"
                          type="email"
                          data-testid="input-reseller-email"
                          value={resellerData.email}
                          onChange={(e) => setResellerData({ ...resellerData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reseller-username">Username</Label>
                          <Input
                            id="reseller-username"
                            data-testid="input-reseller-username"
                            value={resellerData.username}
                            onChange={(e) => setResellerData({ ...resellerData, username: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reseller-password">Password</Label>
                          <Input
                            id="reseller-password"
                            type="password"
                            data-testid="input-reseller-password"
                            value={resellerData.password}
                            onChange={(e) => setResellerData({ ...resellerData, password: e.target.value })}
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
                        {resellerRegisterMutation.isPending ? "Invio richiesta..." : "Richiedi Account Rivenditore"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        La registrazione richiede approvazione da parte dell'amministratore
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="hidden lg:flex items-center justify-center bg-muted p-12">
        <div className="max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-semibold mb-4">
              Gestisci le riparazioni in modo efficiente
            </h2>
            <p className="text-muted-foreground text-lg">
              Monkey Plan Beta è la piattaforma completa per gestire centri di riparazione,
              rivenditori e clienti finali con un unico sistema integrato.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Sistema Multi-Ruolo</h3>
                <p className="text-sm text-muted-foreground">
                  Dashboard personalizzate per Admin, Rivenditori, Centri e Clienti
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Gestione Completa</h3>
                <p className="text-sm text-muted-foreground">
                  Lavorazioni, magazzino, fatturazione e assistenza clienti
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium mb-1">Collaborazione Real-Time</h3>
                <p className="text-sm text-muted-foreground">
                  Live chat e sistema ticket per comunicazione istantanea
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
