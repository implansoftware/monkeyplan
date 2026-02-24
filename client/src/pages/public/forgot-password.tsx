import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle2, Wrench, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  usePageTitle(t("auth.forgotPassword", { defaultValue: "Password dimenticata" }));
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/forgot-password", { email });
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: t("common.error", { defaultValue: "Errore" }),
        description: error?.message || t("auth.forgotPasswordError", { defaultValue: "Errore durante l'invio. Riprova." }),
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
            <div className="absolute top-12 left-12 flex flex-wrap items-center gap-4 cursor-pointer" data-testid="link-forgot-home-brand">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Wrench className="w-7 h-7 text-white" />
              </div>
              <span className="font-bold text-3xl tracking-tight">MonkeyPlan</span>
            </div>
          </Link>

          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto">
              <Mail className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              {t("auth.forgotPasswordHeroTitle", { defaultValue: "Recupera il tuo accesso" })}
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              {t("auth.forgotPasswordHeroDesc", { defaultValue: "Inserisci la tua email e ti invieremo un link per reimpostare la password in modo sicuro." })}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-slate-500 dark:text-slate-400" data-testid="button-back-login">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("auth.backToLogin", { defaultValue: "Torna al login" })}
              </Button>
            </Link>
          </div>

          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Link href="/">
              <div className="flex flex-wrap items-center gap-3 cursor-pointer" data-testid="link-forgot-home-mobile">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Wrench className="w-7 h-7 text-white" />
                </div>
                <span className="font-bold text-2xl text-slate-900 dark:text-white">MonkeyPlan</span>
              </div>
            </Link>
          </div>

          {isSubmitted ? (
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t("auth.forgotPasswordSentTitle", { defaultValue: "Email inviata!" })}
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                {t("auth.forgotPasswordSentDesc", { defaultValue: "Se l'indirizzo email è associato a un account, riceverai un link per reimpostare la password. Controlla anche la cartella spam." })}
              </p>
              <Link href="/auth">
                <Button
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/25 mt-4"
                  data-testid="button-back-login-after-send"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("auth.backToLogin", { defaultValue: "Torna al login" })}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 mb-2">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("auth.forgotPassword", { defaultValue: "Password dimenticata?" })}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("auth.forgotPasswordDesc", { defaultValue: "Inserisci l'email del tuo account e ti invieremo un link per reimpostare la password." })}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email" className="text-slate-700 dark:text-slate-300">
                    {t("auth.email", { defaultValue: "Email" })}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input
                      id="forgot-email"
                      type="email"
                      data-testid="input-forgot-email"
                      placeholder="nome@azienda.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-300"
                  disabled={isSubmitting}
                  data-testid="button-forgot-submit"
                >
                  {isSubmitting ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t("common.sending", { defaultValue: "Invio in corso..." })}
                    </span>
                  ) : (
                    <span className="flex flex-wrap items-center gap-2">
                      <Send className="h-5 w-5" />
                      {t("auth.sendResetLink", { defaultValue: "Invia link di reset" })}
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
