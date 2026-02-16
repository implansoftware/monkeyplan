import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
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
  ArrowLeft,
  Zap,
  Shield,
  BarChart3,
  Smartphone,
  Tablet,
  Headphones,
  Wrench
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

function LoginLoadingOverlay({ t }: { t: (key: string) => string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-400/25 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-emerald-300/30 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <div 
          className="relative w-48 h-48"
          style={{ animation: 'monkeyBounce 1s ease-in-out infinite' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-400 rounded-full blur-2xl opacity-40" />
          <DotLottieReact
            src="https://assets-v2.lottiefiles.com/a/261cdf56-118b-11ee-8495-5b07400f76dd/VtFOjwyK8w.lottie"
            loop
            autoplay
            className="w-full h-full drop-shadow-2xl"
          />
        </div>
        
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white">{t("auth.loginLoading")}</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.15s' }} />
            <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
          <p className="text-white/80 text-sm">{t("auth.loginLoadingDesc")}</p>
        </div>
      </div>
      
      <style>{`
        @keyframes monkeyBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function AnimatedMonkeyMascot({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-400 rounded-full blur-3xl opacity-25 animate-pulse" />
        
        <div 
          className="relative w-64 h-64"
          style={{ animation: 'float 4s ease-in-out infinite' }}
        >
          <DotLottieReact
            src="https://assets-v2.lottiefiles.com/a/261cdf56-118b-11ee-8495-5b07400f76dd/VtFOjwyK8w.lottie"
            loop
            autoplay
            className="w-full h-full drop-shadow-2xl"
          />
        </div>
        
        <div 
          className="absolute -top-1 -right-1 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg border-2 border-white/50"
          style={{ animation: 'bounce 2s ease-in-out infinite' }}
        >
          <Smartphone className="w-5 h-5 text-white" />
        </div>
        
        <div 
          className="absolute -bottom-1 -left-1 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg border-2 border-white/50"
          style={{ animation: 'bounce 2.5s ease-in-out infinite', animationDelay: '0.5s' }}
        >
          <Wrench className="w-5 h-5 text-white" />
        </div>
        
        <div 
          className="absolute top-1/2 -right-4 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white/50"
          style={{ animation: 'bounce 3s ease-in-out infinite', animationDelay: '1s' }}
        >
          <Zap className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <div className="mt-6 flex items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-white font-medium">Online</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25">
          <BarChart3 className="w-4 h-4 text-yellow-300" />
          <span className="text-sm text-white font-medium">{t("auth.repairs10k")}</span>
        </div>
      </div>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  const { t } = useTranslation();
  usePageTitle(t("auth.pageTitle"));
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
          title: t("auth.registrationComplete"),
          description: t("auth.pendingApproval"),
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: t("auth.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (user) {
    const redirectPath = user.role === "admin" || user.role === "admin_staff" ? "/" :
      user.role === "reseller" || user.role === "reseller_staff" ? "/reseller" :
      user.role === "repair_center" || user.role === "repair_center_staff" ? "/repair-center" :
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
    <>
      {loginMutation.isPending && <LoginLoadingOverlay t={t} />}
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
          <Link href="/">
            <div className="flex flex-wrap items-center gap-4 cursor-pointer" data-testid="link-auth-home-brand">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="font-bold text-3xl tracking-tight">MonkeyPlan</span>
              </div>
            </div>
          </Link>
          
          <div className="flex flex-col items-center space-y-8">
            <AnimatedMonkeyMascot t={t} />
            
            <div className="text-center space-y-4 max-w-md">
              <h1 className="text-4xl font-bold leading-tight">
                {t("auth.heroTitle")}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-200">{t("auth.heroTitleHighlight")}</span>
                {t("auth.heroTitleEnd")}
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                {t("auth.heroDesc")}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-yellow-400/30">
                  <Zap className="h-5 w-5 text-yellow-200" />
                </div>
                <span className="font-semibold">{t("auth.realtime")}</span>
              </div>
              <p className="text-sm text-white/70">{t("auth.realtimeDesc")}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-emerald-400/30">
                  <Shield className="h-5 w-5 text-emerald-200" />
                </div>
                <span className="font-semibold">{t("auth.secure")}</span>
              </div>
              <p className="text-sm text-white/70">{t("auth.secureDesc")}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-orange-400/30">
                  <BarChart3 className="h-5 w-5 text-orange-200" />
                </div>
                <span className="font-semibold">{t("auth.analyticsLabel")}</span>
              </div>
              <p className="text-sm text-white/70">{t("auth.analyticsDesc")}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-cyan-400/30">
                  <Smartphone className="h-5 w-5 text-cyan-200" />
                </div>
                <span className="font-semibold">{t("auth.mobileLabel")}</span>
              </div>
              <p className="text-sm text-white/70">{t("auth.mobileDesc")}</p>
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
          <div className="flex items-center justify-between mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
            </Link>
          </div>
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Link href="/">
              <div className="flex flex-wrap items-center gap-3 cursor-pointer" data-testid="link-auth-home-mobile">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="font-bold text-2xl text-slate-900 dark:text-white">MonkeyPlan</span>
                </div>
              </div>
            </Link>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl">
              <TabsTrigger 
                value="login" 
                data-testid="tab-login" 
                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
              >
                {t("auth.loginButton")}
              </TabsTrigger>
              <TabsTrigger 
                value="customer" 
                data-testid="tab-customer" 
                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
              >
                {t("auth.customerTab")}
              </TabsTrigger>
              <TabsTrigger 
                value="reseller" 
                data-testid="tab-reseller" 
                className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-sm font-medium transition-all"
              >
                {t("auth.businessTab")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-2">
                    <Wrench className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("auth.welcomeBack")}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("auth.loginDesc")}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-slate-700 dark:text-slate-300">{t("auth.usernameOrEmail")}</Label>
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
                    <Label htmlFor="login-password" className="text-slate-700 dark:text-slate-300">{t("auth.password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        data-testid="input-login-password"
                        placeholder={t("auth.yourPassword")}
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
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("auth.loggingIn")}
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-2">
                        {t("auth.loginButton")}
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-center gap-8 pt-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex flex-wrap items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" />
                    {t("auth.secureConnection")}
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    {t("auth.support247")}
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
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("auth.createAccount")}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("auth.trackRepairs")}
                  </p>
                </div>

                <form onSubmit={handleCustomerRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-fullname" className="text-slate-700 dark:text-slate-300">{t("auth.fullName")}</Label>
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
                    <Label htmlFor="customer-email" className="text-slate-700 dark:text-slate-300">{t("auth.email")}</Label>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="customer-username" className="text-slate-700 dark:text-slate-300">{t("auth.username")}</Label>
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
                      <Label htmlFor="customer-password" className="text-slate-700 dark:text-slate-300">{t("auth.password")}</Label>
                      <Input
                        id="customer-password"
                        type="password"
                        data-testid="input-customer-password"
                        placeholder={t("auth.minChars")}
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
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("auth.registering")}
                      </span>
                    ) : (
                      <span className="flex flex-wrap items-center gap-2">
                        {t("auth.createAccount")}
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
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t("auth.requestSent")}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        {t("auth.requestSentDesc")}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setResellerPending(false)}
                      className="rounded-xl"
                      data-testid="button-reseller-new-request"
                    >
                      {t("auth.newRequest")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-2">
                        <Store className="h-8 w-8 text-white" />
                      </div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("auth.businessAccount")}</h1>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t("auth.businessDesc")}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {t("auth.businessVerification")}
                      </p>
                    </div>

                    <form onSubmit={handleResellerRegister} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-fullname" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.referent")}</Label>
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
                          <Label htmlFor="reseller-phone" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.phone")}</Label>
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
                        <Label htmlFor="reseller-ragione-sociale" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.companyName")}</Label>
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-partita-iva" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.vatNumber")}</Label>
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
                          <Label htmlFor="reseller-email" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.businessEmail")}</Label>
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
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="reseller-username" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.username")}</Label>
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
                          <Label htmlFor="reseller-password" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.password")}</Label>
                          <Input
                            id="reseller-password"
                            type="password"
                            data-testid="input-reseller-password"
                            placeholder={t("auth.minChars")}
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
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            {t("auth.sendingRequest")}
                          </span>
                        ) : (
                          <span className="flex flex-wrap items-center gap-2">
                            {t("auth.requestAccess")}
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
              {t("auth.footerText")}
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
