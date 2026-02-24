import { useState } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, CheckCircle2, Wrench, ShieldCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  usePageTitle(t("auth.resetPassword", { defaultValue: "Reimposta password" }));
  const { toast } = useToast();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-2">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("auth.resetInvalidLink", { defaultValue: "Link non valido" })}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t("auth.resetInvalidLinkDesc", { defaultValue: "Questo link di reset non è valido. Richiedi un nuovo link dalla pagina di recupero password." })}
          </p>
          <Link href="/forgot-password">
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/25 mt-4"
              data-testid="button-request-new-reset"
            >
              {t("auth.requestNewReset", { defaultValue: "Richiedi nuovo link" })}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("auth.passwordTooShort", { defaultValue: "La password deve essere di almeno 6 caratteri" }));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch", { defaultValue: "Le password non corrispondono" }));
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/reset-password", { token, password });
      setIsSuccess(true);
    } catch (err: any) {
      const msg = err?.message || t("auth.resetPasswordError", { defaultValue: "Errore durante il reset. Il link potrebbe essere scaduto." });
      setError(msg);
      toast({
        title: t("common.error", { defaultValue: "Errore" }),
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-orange-400/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-400/25 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-emerald-300/30 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
          <Link href="/">
            <div className="absolute top-12 left-12 flex flex-wrap items-center gap-4 cursor-pointer" data-testid="link-reset-home-brand">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold text-3xl tracking-tight">MonkeyPlan</span>
            </div>
          </Link>

          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              {t("auth.resetPasswordHeroTitle", { defaultValue: "Nuova password" })}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {t("auth.resetPasswordHeroDesc", { defaultValue: "Scegli una password sicura per proteggere il tuo account MonkeyPlan." })}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" data-testid="button-back-login-reset">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("auth.backToLogin", { defaultValue: "Torna al login" })}
              </Button>
            </Link>
          </div>

          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Link href="/">
              <div className="flex flex-wrap items-center gap-3 cursor-pointer" data-testid="link-reset-home-mobile">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-2xl text-slate-900 dark:text-white">MonkeyPlan</span>
              </div>
            </Link>
          </div>

          {isSuccess ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t("auth.resetPasswordSuccessTitle", { defaultValue: "Password reimpostata!" })}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {t("auth.resetPasswordSuccessDesc", { defaultValue: "La tua password è stata aggiornata con successo. Ora puoi accedere con la nuova password." })}
              </p>
              <Link href="/auth">
                <Button
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/25 mt-4"
                  data-testid="button-go-login-after-reset"
                >
                  {t("auth.goToLogin", { defaultValue: "Vai al login" })}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-2">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("auth.resetPasswordTitle", { defaultValue: "Nuova password" })}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("auth.resetPasswordDesc", { defaultValue: "Inserisci la tua nuova password. Deve contenere almeno 6 caratteri." })}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-700 dark:text-slate-300">
                    {t("auth.newPassword", { defaultValue: "Nuova password" })}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="new-password"
                      type="password"
                      data-testid="input-new-password"
                      placeholder={t("auth.newPasswordPlaceholder", { defaultValue: "Almeno 6 caratteri" })}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 transition-colors"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-700 dark:text-slate-300">
                    {t("auth.confirmPassword", { defaultValue: "Conferma password" })}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="confirm-password"
                      type="password"
                      data-testid="input-confirm-password"
                      placeholder={t("auth.confirmPasswordPlaceholder", { defaultValue: "Ripeti la password" })}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                      className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 transition-colors"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm" data-testid="text-reset-error">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
                  disabled={isSubmitting}
                  data-testid="button-reset-submit"
                >
                  {isSubmitting ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("common.saving", { defaultValue: "Salvataggio..." })}
                    </span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      {t("auth.resetPasswordButton", { defaultValue: "Reimposta password" })}
                    </span>
                  )}
                </Button>
              </form>
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {t("auth.footerText", { defaultValue: "2024 MonkeyPlan. Tutti i diritti riservati." })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
