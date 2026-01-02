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
  Shield, 
  Building, 
  Users, 
  Store, 
  CheckCircle, 
  Smartphone,
  Lock,
  Mail,
  User,
  Phone,
  FileText,
  ArrowRight,
  Sparkles
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-gradient-to-br from-primary via-primary/95 to-primary/80 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full blur-3xl" />
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
              <Wrench className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">MonkeyPlan</h1>
              <p className="text-white/60 text-sm font-medium">Beta v.22.5</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium text-white">Design 2025</span>
              </div>
              <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                La gestione delle riparazioni,<br />
                <span className="text-white/80">semplificata.</span>
              </h2>
              <p className="text-lg text-white/70 max-w-lg leading-relaxed">
                Piattaforma completa per centri di riparazione, rivenditori e clienti. 
                Tutto in un unico sistema, a prova di errore.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <FeatureCard 
                icon={Shield} 
                title="Multi-Ruolo" 
                description="Dashboard personalizzate per ogni utente"
              />
              <FeatureCard 
                icon={Building} 
                title="Gestione Completa" 
                description="Lavorazioni, magazzino e fatturazione"
              />
              <FeatureCard 
                icon={Users} 
                title="Collaborazione" 
                description="Chat e ticket in tempo reale"
              />
              <FeatureCard 
                icon={Smartphone} 
                title="Mobile Ready" 
                description="Perfetto su ogni dispositivo"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/40 text-sm">
            2025 MonkeyPlan. Tutti i diritti riservati.
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-[440px]">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-10 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4 shadow-lg">
              <Wrench className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">MonkeyPlan</h1>
            <p className="text-muted-foreground text-sm mt-1">Beta v.22.5</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50 rounded-xl mb-6">
              <TabsTrigger 
                value="login" 
                data-testid="tab-login"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
              >
                Accedi
              </TabsTrigger>
              <TabsTrigger 
                value="customer" 
                data-testid="tab-customer"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
              >
                Cliente
              </TabsTrigger>
              <TabsTrigger 
                value="reseller" 
                data-testid="tab-reseller"
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium"
              >
                Rivenditore
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Bentornato</h2>
                    <p className="text-muted-foreground">
                      Inserisci le tue credenziali per accedere
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username" className="text-sm font-medium">
                        Username o Email
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-username"
                          data-testid="input-login-username"
                          placeholder="nome@esempio.it"
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          className="h-12 pl-11 text-base rounded-xl border-input/50 focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          data-testid="input-login-password"
                          placeholder="La tua password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="h-12 pl-11 text-base rounded-xl border-input/50 focus:border-primary"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Accesso in corso...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Accedi
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customer" className="mt-0">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0 space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Crea Account Cliente</h2>
                    <p className="text-muted-foreground">
                      Registrati per gestire le tue riparazioni
                    </p>
                  </div>

                  <form onSubmit={handleCustomerRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer-fullname" className="text-sm font-medium">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="customer-fullname"
                          data-testid="input-customer-fullname"
                          placeholder="Mario Rossi"
                          value={customerData.fullName}
                          onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                          className="h-12 pl-11 text-base rounded-xl border-input/50"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="customer-email"
                          type="email"
                          data-testid="input-customer-email"
                          placeholder="mario@esempio.it"
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          className="h-12 pl-11 text-base rounded-xl border-input/50"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-username" className="text-sm font-medium">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="customer-username"
                          data-testid="input-customer-username"
                          placeholder="mariorossi"
                          value={customerData.username}
                          onChange={(e) => setCustomerData({ ...customerData, username: e.target.value })}
                          className="h-12 pl-11 text-base rounded-xl border-input/50"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="customer-password"
                          type="password"
                          data-testid="input-customer-password"
                          placeholder="Minimo 6 caratteri"
                          value={customerData.password}
                          onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                          className="h-12 pl-11 text-base rounded-xl border-input/50"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
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
                          Registrati
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reseller" className="mt-0">
              <Card className="border-0 shadow-none bg-transparent">
                <CardContent className="p-0 space-y-6">
                  {resellerPending ? (
                    <div className="text-center py-10 space-y-6">
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Richiesta Inviata</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto">
                          La tua richiesta è in attesa di approvazione. Riceverai una notifica quando sarà elaborata.
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setResellerPending(false)}
                        className="h-11 rounded-xl"
                        data-testid="button-reseller-new-request"
                      >
                        Nuova Richiesta
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Store className="h-5 w-5 text-primary" />
                          <h2 className="text-2xl font-bold tracking-tight">Diventa Rivenditore</h2>
                        </div>
                        <p className="text-muted-foreground">
                          La registrazione richiede approvazione
                        </p>
                      </div>

                      <form onSubmit={handleResellerRegister} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="reseller-fullname" className="text-sm font-medium">Nome Referente</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="reseller-fullname"
                                data-testid="input-reseller-fullname"
                                placeholder="Mario Rossi"
                                value={resellerData.fullName}
                                onChange={(e) => setResellerData({ ...resellerData, fullName: e.target.value })}
                                className="h-11 pl-10 text-sm rounded-xl border-input/50"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reseller-phone" className="text-sm font-medium">Telefono</Label>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="reseller-phone"
                                data-testid="input-reseller-phone"
                                placeholder="+39 333..."
                                value={resellerData.phone}
                                onChange={(e) => setResellerData({ ...resellerData, phone: e.target.value })}
                                className="h-11 pl-10 text-sm rounded-xl border-input/50"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reseller-ragione-sociale" className="text-sm font-medium">Ragione Sociale</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="reseller-ragione-sociale"
                              data-testid="input-reseller-ragione-sociale"
                              placeholder="Nome Azienda S.r.l."
                              value={resellerData.ragioneSociale}
                              onChange={(e) => setResellerData({ ...resellerData, ragioneSociale: e.target.value })}
                              className="h-11 pl-10 text-sm rounded-xl border-input/50"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reseller-partita-iva" className="text-sm font-medium">Partita IVA</Label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="reseller-partita-iva"
                              data-testid="input-reseller-partita-iva"
                              placeholder="IT12345678901"
                              value={resellerData.partitaIva}
                              onChange={(e) => setResellerData({ ...resellerData, partitaIva: e.target.value })}
                              className="h-11 pl-10 text-sm rounded-xl border-input/50"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="reseller-email" className="text-sm font-medium">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="reseller-email"
                              type="email"
                              data-testid="input-reseller-email"
                              placeholder="info@azienda.it"
                              value={resellerData.email}
                              onChange={(e) => setResellerData({ ...resellerData, email: e.target.value })}
                              className="h-11 pl-10 text-sm rounded-xl border-input/50"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="reseller-username" className="text-sm font-medium">Username</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="reseller-username"
                                data-testid="input-reseller-username"
                                placeholder="username"
                                value={resellerData.username}
                                onChange={(e) => setResellerData({ ...resellerData, username: e.target.value })}
                                className="h-11 pl-10 text-sm rounded-xl border-input/50"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reseller-password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="reseller-password"
                                type="password"
                                data-testid="input-reseller-password"
                                placeholder="Min. 6 caratteri"
                                value={resellerData.password}
                                onChange={(e) => setResellerData({ ...resellerData, password: e.target.value })}
                                className="h-11 pl-10 text-sm rounded-xl border-input/50"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          type="submit"
                          className="w-full h-12 text-base font-semibold rounded-xl shadow-lg shadow-primary/25"
                          disabled={resellerRegisterMutation.isPending}
                          data-testid="button-reseller-register"
                        >
                          {resellerRegisterMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Invio richiesta...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              Richiedi Account
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

          {/* Mobile Footer */}
          <p className="lg:hidden text-center text-xs text-muted-foreground mt-8">
            2025 MonkeyPlan. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { 
  icon: typeof Shield; 
  title: string; 
  description: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-colors">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 mb-3">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}
