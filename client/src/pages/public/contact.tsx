import { Link } from "wouter";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Mail,
  MessageSquare,
  MapPin,
  Clock,
  Send,
  Phone,
} from "lucide-react";
import { Navbar } from "./landing";
import { PageFooter } from "./about";
import { usePageTitle } from "@/hooks/use-page-title";

export default function ContactPage() {
  const { t } = useTranslation();
  usePageTitle("Contatti");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const contactMethods = [
    {
      icon: Mail,
      title: t("public.contact.methods.email.title"),
      description: t("public.contact.methods.email.description"),
      detail: t("public.contact.methods.email.detail"),
      action: "mailto:info@monkeyplan.it",
    },
    {
      icon: MessageSquare,
      title: t("public.contact.methods.support.title"),
      description: t("public.contact.methods.support.description"),
      detail: t("public.contact.methods.support.detail"),
      action: "/auth",
    },
    {
      icon: Phone,
      title: t("public.contact.methods.phone.title"),
      description: t("public.contact.methods.phone.description"),
      detail: t("public.contact.methods.phone.detail"),
      action: null,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-16 px-4" data-testid="section-contact-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <Mail className="w-3.5 h-3.5" />
            {t("public.contact.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-contact-title">
            {t("public.contact.title")}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {t("public.contact.titleHighlight")}
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="text-contact-subtitle">
            {t("public.contact.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900/50" data-testid="section-contact-methods">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((c) => (
              <Card key={c.title} className="p-6 text-center" data-testid={`card-contact-${c.title.toLowerCase().replace(/\s/g, '-')}`}>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                  <c.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{c.description}</p>
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{c.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4" data-testid="section-contact-info">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">{t("public.contact.info.title")}</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t("public.contact.info.location.title")}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("public.contact.info.location.value")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t("public.contact.info.hours.title")}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("public.contact.info.hours.weekdays")}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("public.contact.info.hours.weekend")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{t("public.contact.info.response.title")}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("public.contact.info.response.value")}</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-6">{t("public.contact.support.title")}</h2>
              <Card className="p-6" data-testid="card-contact-support">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {t("public.contact.support.registered")}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {t("public.contact.support.notRegistered")}
                </p>
                <Link href="/auth" data-testid="link-contact-cta">
                  <Button data-testid="button-contact-cta">
                    {t("public.contact.support.ctaButton")}
                    <Send className="w-3.5 h-3.5 ml-2" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
