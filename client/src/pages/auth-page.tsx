import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Zap,
  Shield,
  BarChart3,
  Smartphone,
  Sparkles,
  CircuitBoard,
  Cpu,
  Settings2
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
      return res;
    },
    onSuccess: (data: any) => {
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
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" />
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-2xl tracking-tight">MonkeyPlan</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">Beta</span>
            </div>
          </div>
          
          {/* Main Hero Text */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight">
                La piattaforma
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
                  riparazioni
                </span>
                <br />
                del futuro
              </h1>
              <p className="text-lg text-blue-100/80 max-w-md leading-relaxed">
                Gestisci riparazioni, magazzino, clienti e fatturazione in un'unica soluzione enterprise progettata per il 2025.
              </p>
            </div>
            
            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="group p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-cyan-400/20">
                    <Zap className="h-5 w-5 text-cyan-300" />
                  </div>
                  <span className="font-semibold">Real-time</span>
                </div>
                <p className="text-sm text-blue-100/70">Aggiornamenti istantanei su ogni riparazione</p>
              </div>
              
              <div className="group p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-emerald-400/20">
                    <Shield className="h-5 w-5 text-emerald-300" />
                  </div>
                  <span className="font-semibold">Sicuro</span>
                </div>
                <p className="text-sm text-blue-100/70">Dati protetti con crittografia avanzata</p>
              </div>
              
              <div className="group p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-violet-400/20">
                    <BarChart3 className="h-5 w-5 text-violet-300" />
                  </div>
                  <span className="font-semibold">Analytics</span>
                </div>
                <p className="text-sm text-blue-100/70">Dashboard avanzata con insights</p>
              </div>
              
              <div className="group p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-amber-400/20">
                    <Smartphone className="h-5 w-5 text-amber-300" />
                  </div>
                  <span className="font-semibold">Mobile</span>
                </div>
                <p className="text-sm text-blue-100/70">Accesso da qualsiasi dispositivo</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Stats */}
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-blue-100/70">Riparazioni gestite</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-blue-100/70">Centri attivi</div>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div>
              <div className="text-3xl font-bold">99.9%</div>
              <div className="text-sm text-blue-100/70">Uptime garantito</div>
            </div>
          </div>
        </div>
        
        {/* Floating Icons */}
        <div className="absolute top-32 right-16 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 animate-bounce" style={{ animationDuration: '3s' }}>
          <CircuitBoard className="h-6 w-6 text-cyan-300" />
        </div>
        <div className="absolute bottom-40 left-20 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Cpu className="h-6 w-6 text-violet-300" />
        </div>
        <div className="absolute top-1/2 right-24 p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
          <Settings2 className="h-6 w-6 text-emerald-300" />
        </div>
      </div>
      
      {/* Right Panel - Auth Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-2xl text-slate-900 dark:text-white">MonkeyPlan</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">Beta</span>
            </div>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl">
              <TabsTrigger 
                value="login" 
                data-testid="tab-login" 
                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
              >
                Accedi
              </TabsTrigger>
              <TabsTrigger 
                value="customer" 
                data-testid="tab-customer" 
                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
              >
                Cliente
              </TabsTrigger>
              <TabsTrigger 
                value="reseller" 
                data-testid="tab-reseller" 
                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
              >
                Business
              </TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-2">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bentornato</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Accedi per gestire le tue riparazioni
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-slate-700 dark:text-slate-300">Username o Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="login-username"
                        data-testid="input-login-username"
                        placeholder="nome@azienda.it"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-700 dark:text-slate-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        data-testid="input-login-password"
                        placeholder="La tua password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Accesso in corso...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Accedi
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-center gap-8 pt-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    Connessione sicura
                  </span>
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Supporto 24/7
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* CUSTOMER TAB */}
            <TabsContent value="customer" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-2">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Crea Account</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Traccia le tue riparazioni in tempo reale
                  </p>
                </div>

                <form onSubmit={handleCustomerRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-fullname" className="text-slate-700 dark:text-slate-300">Nome e Cognome</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="customer-fullname"
                        data-testid="input-customer-fullname"
                        placeholder="Mario Rossi"
                        value={customerData.fullName}
                        onChange={(e) => setCustomerData({ ...customerData, fullName: e.target.value })}
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-email" className="text-slate-700 dark:text-slate-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="customer-email"
                        type="email"
                        data-testid="input-customer-email"
                        placeholder="mario@esempio.it"
                        value={customerData.email}
                        onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="customer-username" className="text-slate-700 dark:text-slate-300">Username</Label>
                      <Input
                        id="customer-username"
                        data-testid="input-customer-username"
                        placeholder="mariorossi"
                        value={customerData.username}
                        onChange={(e) => setCustomerData({ ...customerData, username: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer-password" className="text-slate-700 dark:text-slate-300">Password</Label>
                      <Input
                        id="customer-password"
                        type="password"
                        data-testid="input-customer-password"
                        placeholder="Min. 6 caratteri"
                        value={customerData.password}
                        onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300"
                    disabled={registerMutation.isPending}
                    data-testid="button-customer-register"
                  >
                    {registerMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registrazione...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Crea Account
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* BUSINESS/RESELLER TAB */}
            <TabsContent value="reseller" className="mt-0">
              <div className="space-y-5">
                {resellerPending ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600">
                      <CheckCircle className="h-10 w-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Richiesta Inviata</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Ti contatteremo entro 24 ore per attivare il tuo account business.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setResellerPending(false)}
                      className="rounded-xl"
                      data-testid="button-reseller-new-request"
                    >
                      Nuova Richiesta
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-2">
                        <Store className="h-8 w-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Business</h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Per rivenditori e centri di riparazione
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Registrazione business con verifica entro 24h
                      </p>
                    </div>

                    <form onSubmit={handleResellerRegister} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-fullname" className="text-xs text-slate-600 dark:text-slate-400">Referente</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="reseller-fullname"
                              data-testid="input-reseller-fullname"
                              placeholder="Nome Cognome"
                              value={resellerData.fullName}
                              onChange={(e) => setResellerData({ ...resellerData, fullName: e.target.value })}
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-phone" className="text-xs text-slate-600 dark:text-slate-400">Telefono</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="reseller-phone"
                              data-testid="input-reseller-phone"
                              placeholder="+39 333..."
                              value={resellerData.phone}
                              onChange={(e) => setResellerData({ ...resellerData, phone: e.target.value })}
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label htmlFor="reseller-ragione-sociale" className="text-xs text-slate-600 dark:text-slate-400">Ragione Sociale</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="reseller-ragione-sociale"
                            data-testid="input-reseller-ragione-sociale"
                            placeholder="Nome Azienda S.r.l."
                            value={resellerData.ragioneSociale}
                            onChange={(e) => setResellerData({ ...resellerData, ragioneSociale: e.target.value })}
                            className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-partita-iva" className="text-xs text-slate-600 dark:text-slate-400">Partita IVA</Label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="reseller-partita-iva"
                              data-testid="input-reseller-partita-iva"
                              placeholder="IT12345678901"
                              value={resellerData.partitaIva}
                              onChange={(e) => setResellerData({ ...resellerData, partitaIva: e.target.value })}
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-email" className="text-xs text-slate-600 dark:text-slate-400">Email Aziendale</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              id="reseller-email"
                              type="email"
                              data-testid="input-reseller-email"
                              placeholder="info@azienda.it"
                              value={resellerData.email}
                              onChange={(e) => setResellerData({ ...resellerData, email: e.target.value })}
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-username" className="text-xs text-slate-600 dark:text-slate-400">Username</Label>
                          <Input
                            id="reseller-username"
                            data-testid="input-reseller-username"
                            placeholder="username"
                            value={resellerData.username}
                            onChange={(e) => setResellerData({ ...resellerData, username: e.target.value })}
                            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-password" className="text-xs text-slate-600 dark:text-slate-400">Password</Label>
                          <Input
                            id="reseller-password"
                            type="password"
                            data-testid="input-reseller-password"
                            placeholder="Min. 6 caratteri"
                            value={resellerData.password}
                            onChange={(e) => setResellerData({ ...resellerData, password: e.target.value })}
                            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm"
                            required
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-300"
                        disabled={resellerRegisterMutation.isPending}
                        data-testid="button-reseller-register"
                      >
                        {resellerRegisterMutation.isPending ? (
                          <span className="flex items-center gap-2">
                            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Invio richiesta...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Richiedi Accesso Business
                            <ArrowRight className="h-5 w-5" />
                          </span>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              2025 MonkeyPlan - Gestione Riparazioni Elettroniche
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
