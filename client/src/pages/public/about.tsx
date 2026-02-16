import { Link } from "wouter";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Wrench,
  ArrowRight,
  Target,
  Users,
  Heart,
  Lightbulb,
  Shield,
  Globe,
  Rocket,
  Award,
} from "lucide-react";
import { Navbar } from "./landing";
import { usePageTitle } from "@/hooks/use-page-title";

function PageFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 py-10 bg-slate-50 dark:bg-slate-900/50" role="contentinfo" data-testid="footer-about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">MonkeyPlan</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/about" className="text-xs text-slate-500 dark:text-slate-400" data-testid="link-footer-about">{t("public.about.footer.about")}</Link>
            <Link href="/contact" className="text-xs text-slate-500 dark:text-slate-400" data-testid="link-footer-contact">{t("public.about.footer.contact")}</Link>
            <Link href="/faq" className="text-xs text-slate-500 dark:text-slate-400" data-testid="link-footer-faq">{t("public.about.footer.faq")}</Link>
            <Link href="/terms" className="text-xs text-slate-500 dark:text-slate-400" data-testid="link-footer-terms">{t("public.about.footer.terms")}</Link>
            <Link href="/privacy" className="text-xs text-slate-500 dark:text-slate-400" data-testid="link-footer-privacy">{t("public.about.footer.privacy")}</Link>
            <Link href="/marketplace" className="text-xs text-slate-500 dark:text-slate-400" data-testid="link-footer-marketplace">{t("public.about.footer.marketplace")}</Link>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500" data-testid="text-footer-tagline">
            {t("public.about.footer.tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}

export { PageFooter };

export default function AboutPage() {
  const { t } = useTranslation();
  usePageTitle("Chi Siamo");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const values = [
    {
      icon: Target,
      title: t("public.about.values.mission.title"),
      description: t("public.about.values.mission.description"),
    },
    {
      icon: Lightbulb,
      title: t("public.about.values.innovation.title"),
      description: t("public.about.values.innovation.description"),
    },
    {
      icon: Heart,
      title: t("public.about.values.passion.title"),
      description: t("public.about.values.passion.description"),
    },
    {
      icon: Shield,
      title: t("public.about.values.reliability.title"),
      description: t("public.about.values.reliability.description"),
    },
  ];

  const milestones = [
    { year: "2024", title: t("public.about.milestones.m1.title"), description: t("public.about.milestones.m1.description") },
    { year: "2024", title: t("public.about.milestones.m2.title"), description: t("public.about.milestones.m2.description") },
    { year: "2025", title: t("public.about.milestones.m3.title"), description: t("public.about.milestones.m3.description") },
    { year: "2025", title: t("public.about.milestones.m4.title"), description: t("public.about.milestones.m4.description") },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-16 px-4" data-testid="section-about-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <Users className="w-3.5 h-3.5" />
            {t("public.about.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-about-title">
            {t("public.about.title")}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              MonkeyPlan
            </span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed" data-testid="text-about-subtitle">
            {t("public.about.subtitle")}
          </p>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900/50" data-testid="section-about-values">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">{t("public.about.valuesTitle")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v) => (
              <Card key={v.title} className="p-6" data-testid={`card-value-${v.title.toLowerCase()}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <v.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{v.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{v.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4" data-testid="section-about-story">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">{t("public.about.storyTitle")}</h2>
          <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            {t("public.about.storySubtitle")}
          </p>
          <div className="space-y-6">
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-6 items-start" data-testid={`milestone-${i}`}>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                    {m.year}
                  </div>
                  {i < milestones.length - 1 && <div className="w-px h-full min-h-[2rem] bg-slate-200 dark:bg-slate-700 mt-2" />}
                </div>
                <div className="pb-6">
                  <h3 className="font-semibold mb-1">{m.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900/50" data-testid="section-about-stats">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Globe, value: "100%", label: t("public.about.stats.madeInItaly") },
              { icon: Rocket, value: "v1.0", label: t("public.about.stats.currentVersion") },
              { icon: Award, value: "100", label: t("public.about.stats.freeLicenses") },
              { icon: Users, value: "4+", label: t("public.about.stats.managedRoles") },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
                <s.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span className="text-2xl font-bold">{s.value}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 text-center" data-testid="section-about-cta">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">{t("public.about.ctaTitle")}</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {t("public.about.ctaSubtitle")}
          </p>
          <Link href="/auth" data-testid="link-about-cta">
            <Button size="lg" data-testid="button-about-cta">
              {t("public.about.ctaButton")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <PageFooter />
    </div>
  );
}
