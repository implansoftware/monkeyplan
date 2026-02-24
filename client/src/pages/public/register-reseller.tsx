import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Store,
  CheckCircle,
  Mail,
  User,
  Phone,
  Building,
  FileText,
  ArrowRight,
  ArrowLeft,
  Shield,
  Wrench,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterResellerPage() {
  const { t } = useTranslation();
  usePageTitle(t("auth.businessAccount"));
  const { toast } = useToast();
  const [pending, setPending] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    phone: "",
    ragioneSociale: "",
    partitaIva: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/register", {
        ...data,
        role: "reseller",
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.pending) {
        setPending(true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500" />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-red-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-orange-300/25 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <Link href="/">
            <div className="flex flex-wrap items-center gap-4 cursor-pointer" data-testid="link-register-home-brand">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="font-bold text-3xl tracking-tight">MonkeyPlan</span>
              </div>
            </div>
          </Link>

          <div className="flex flex-col items-center space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-3xl blur-2xl" />
              <div className="relative w-32 h-32 rounded-3xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Store className="w-16 h-16 text-white" />
              </div>
            </div>

            <div className="text-center space-y-4 max-w-md">
              <h1 className="text-4xl font-bold leading-tight">
                {t("auth.registerHeroTitle", { defaultValue: "Porta la tua attivita' su" })}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200">MonkeyPlan</span>
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                {t("auth.registerHeroDesc", { defaultValue: "Gestisci riparazioni, magazzino, vendite e clienti da un'unica piattaforma professionale." })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-white/20">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-sm">{t("auth.registerFeature1", { defaultValue: "Verifica in 24h" })}</span>
              </div>
              <p className="text-xs text-white/70">{t("auth.registerFeature1Desc", { defaultValue: "Account verificato e attivato dal nostro team" })}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-white/20">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-sm">{t("auth.registerFeature2", { defaultValue: "Multi-negozio" })}</span>
              </div>
              <p className="text-xs text-white/70">{t("auth.registerFeature2Desc", { defaultValue: "Gestisci piu' punti vendita e centri assistenza" })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" data-testid="button-back-login">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("auth.loginButton")}
              </Button>
            </Link>
            <ThemeToggle data-testid="button-theme-toggle" />
          </div>

          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Link href="/">
              <div className="flex flex-wrap items-center gap-3 cursor-pointer" data-testid="link-register-home-mobile">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <div>
                  <span className="font-bold text-2xl text-slate-900 dark:text-white">MonkeyPlan</span>
                </div>
              </div>
            </Link>
          </div>

          {pending ? (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-request-sent">{t("auth.requestSent")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  {t("auth.requestSentDesc")}
                </p>
              </div>
              <div className="flex flex-col gap-2 items-center pt-4">
                <Link href="/auth">
                  <Button data-testid="button-go-login">
                    {t("auth.loginButton")}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setPending(false)}
                  className="rounded-xl"
                  data-testid="button-reseller-new-request"
                >
                  {t("auth.newRequest")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 mb-2">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white" data-testid="text-register-title">{t("auth.businessAccount")}</h1>
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

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="reseller-fullname" className="text-xs text-slate-600 dark:text-slate-400">{t("auth.referent")}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="reseller-fullname"
                        data-testid="input-reseller-fullname"
                        placeholder="Nome Cognome"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                      value={formData.ragioneSociale}
                      onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
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
                        value={formData.partitaIva}
                        onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
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
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-300"
                  disabled={registerMutation.isPending}
                  data-testid="button-reseller-register"
                >
                  {registerMutation.isPending ? (
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

              <div className="text-center pt-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {t("auth.alreadyHaveAccount", { defaultValue: "Hai gia' un account?" })}{" "}
                  <Link href="/auth" className="text-orange-500 font-medium" data-testid="link-go-login">
                    {t("auth.loginButton")}
                  </Link>
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t("auth.footerText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
