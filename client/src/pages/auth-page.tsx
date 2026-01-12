import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
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
  Tablet,
  Headphones
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import monkeyLogo from "@assets/Screenshot_2026-01-12_alle_10.42.47_1768210969259.png";

function AnimatedMonkey() {
  return (
    <div className="relative w-64 h-64">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="furGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d2d2d" />
            <stop offset="100%" stopColor="#1a1a1a" />
          </linearGradient>
          <linearGradient id="faceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d4a574" />
            <stop offset="100%" stopColor="#c4956a" />
          </linearGradient>
        </defs>
        
        <g className="animate-[bounce_3s_ease-in-out_infinite]">
          <ellipse cx="100" cy="100" rx="55" ry="50" fill="url(#furGradient)" />
          
          <ellipse cx="40" cy="85" rx="18" ry="20" fill="url(#furGradient)" />
          <ellipse cx="40" cy="85" rx="12" ry="14" fill="url(#faceGradient)" />
          <ellipse cx="160" cy="85" rx="18" ry="20" fill="url(#furGradient)" />
          <ellipse cx="160" cy="85" rx="12" ry="14" fill="url(#faceGradient)" />
          
          <ellipse cx="100" cy="105" rx="35" ry="30" fill="url(#faceGradient)" />
          
          <g className="animate-[blink_4s_ease-in-out_infinite]">
            <ellipse cx="75" cy="85" rx="12" ry="10" fill="white" />
            <ellipse cx="125" cy="85" rx="12" ry="10" fill="white" />
            <circle cx="78" cy="85" r="5" fill="#1a1a1a" className="animate-[lookAround_5s_ease-in-out_infinite]" />
            <circle cx="128" cy="85" r="5" fill="#1a1a1a" className="animate-[lookAround_5s_ease-in-out_infinite]" />
            <circle cx="80" cy="83" r="2" fill="white" />
            <circle cx="130" cy="83" r="2" fill="white" />
          </g>
          
          <ellipse cx="85" cy="70" rx="8" ry="3" fill="#1a1a1a" className="origin-center" />
          <ellipse cx="115" cy="70" rx="8" ry="3" fill="#1a1a1a" className="origin-center" />
          
          <ellipse cx="100" cy="100" rx="8" ry="6" fill="#8B4513" />
          <circle cx="96" cy="98" r="2" fill="#1a1a1a" />
          <circle cx="104" cy="98" r="2" fill="#1a1a1a" />
          
          <path d="M 85 115 Q 100 130 115 115" stroke="#1a1a1a" strokeWidth="3" fill="none" className="animate-[smile_3s_ease-in-out_infinite]" />
        </g>
        
        <g className="animate-[wave_2s_ease-in-out_infinite]" style={{ transformOrigin: '60px 150px' }}>
          <ellipse cx="55" cy="160" rx="15" ry="12" fill="url(#furGradient)" />
          <ellipse cx="40" cy="175" rx="12" ry="8" fill="url(#faceGradient)" />
        </g>
        
        <g>
          <rect x="130" y="140" width="35" height="50" rx="5" fill="#64B5F6" className="animate-[float_2s_ease-in-out_infinite]" />
          <rect x="135" y="145" width="25" height="35" rx="2" fill="white" />
          <circle cx="147" cy="185" r="3" fill="white" />
        </g>
        
        <g className="animate-[headphonePulse_1.5s_ease-in-out_infinite]">
          <path d="M 55 70 Q 55 40 100 35 Q 145 40 145 70" stroke="#1a1a1a" strokeWidth="6" fill="none" />
          <ellipse cx="50" cy="75" rx="10" ry="12" fill="#1a1a1a" />
          <ellipse cx="150" cy="75" rx="10" ry="12" fill="#1a1a1a" />
          <ellipse cx="50" cy="75" rx="6" ry="8" fill="#64B5F6" />
          <ellipse cx="150" cy="75" rx="6" ry="8" fill="#64B5F6" />
          <path d="M 50 87 Q 50 100 60 110" stroke="#1a1a1a" strokeWidth="3" fill="none" />
          <circle cx="62" cy="112" r="5" fill="#1a1a1a" />
        </g>
      </svg>
      
      <style>{`
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes lookAround {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(3px); }
          75% { transform: translateX(-3px); }
        }
        @keyframes smile {
          0%, 100% { d: path('M 85 115 Q 100 130 115 115'); }
          50% { d: path('M 85 115 Q 100 135 115 115'); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes headphonePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
        
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-400/25 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-emerald-300/30 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 L25 0 L0 25 Z" fill="currentColor" className="text-orange-500" />
          <path d="M75 0 L100 0 L100 25 Z" fill="currentColor" className="text-yellow-400" />
          <path d="M0 75 L0 100 L25 100 Z" fill="currentColor" className="text-emerald-400" />
          <path d="M75 100 L100 100 L100 75 Z" fill="currentColor" className="text-cyan-400" />
        </svg>

        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 15 L45 15 L37 22 L40 32 L30 26 L20 32 L23 22 L15 15 L25 15 Z' fill='white'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 p-2 overflow-hidden">
              <img src={monkeyLogo} alt="MonkeyPlan" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-3xl tracking-tight">MonkeyPlan</span>
              <span className="ml-3 px-3 py-1 text-xs rounded-full bg-yellow-400/30 backdrop-blur-sm text-yellow-100 border border-yellow-300/30">
                Beta v.23
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center space-y-8">
            <AnimatedMonkey />
            
            <div className="text-center space-y-4 max-w-md">
              <h1 className="text-4xl font-bold leading-tight">
                Gestione 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-200"> riparazioni </span>
                intelligente
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                La piattaforma enterprise per gestire riparazioni, magazzino, clienti e fatturazione in un'unica soluzione.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-yellow-400/30">
                  <Zap className="h-5 w-5 text-yellow-200" />
                </div>
                <span className="font-semibold">Real-time</span>
              </div>
              <p className="text-sm text-white/70">Aggiornamenti istantanei</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-emerald-400/30">
                  <Shield className="h-5 w-5 text-emerald-200" />
                </div>
                <span className="font-semibold">Sicuro</span>
              </div>
              <p className="text-sm text-white/70">Dati sempre protetti</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-orange-400/30">
                  <BarChart3 className="h-5 w-5 text-orange-200" />
                </div>
                <span className="font-semibold">Analytics</span>
              </div>
              <p className="text-sm text-white/70">Dashboard avanzata</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-cyan-400/30">
                  <Smartphone className="h-5 w-5 text-cyan-200" />
                </div>
                <span className="font-semibold">Mobile</span>
              </div>
              <p className="text-sm text-white/70">Accesso ovunque</p>
            </div>
          </div>
          
          <div className="absolute top-24 right-12 p-3 rounded-2xl bg-orange-400/20 backdrop-blur-sm border border-orange-300/30 animate-bounce" style={{ animationDuration: '3s' }}>
            <Tablet className="h-6 w-6 text-orange-200" />
          </div>
          <div className="absolute bottom-32 left-8 p-3 rounded-2xl bg-yellow-400/20 backdrop-blur-sm border border-yellow-300/30 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <Headphones className="h-6 w-6 text-yellow-200" />
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-2 overflow-hidden">
              <img src={monkeyLogo} alt="MonkeyPlan" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-2xl text-slate-900 dark:text-white">MonkeyPlan</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">Beta</span>
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

            <TabsContent value="login" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-2 overflow-hidden p-2">
                    <img src={monkeyLogo} alt="" className="w-full h-full object-contain" />
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
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 transition-colors"
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
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
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
                    <Zap className="h-4 w-4 text-orange-500" />
                    Supporto 24/7
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="customer" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 mb-2">
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
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 transition-colors"
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
                        className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 transition-colors"
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
                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 transition-colors"
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
                        className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-teal-500 transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300"
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
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-2">
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
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
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
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
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
                            className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
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
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
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
                              className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
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
                            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
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
                            className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
                            required
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-300"
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
