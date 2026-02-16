import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "./landing";
import { PageFooter } from "./about";
import { usePageTitle } from "@/hooks/use-page-title";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const { t } = useTranslation();
  usePageTitle("Termini e Condizioni");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    { title: t("public.terms.s1Title"), content: t("public.terms.s1Content") },
    { title: t("public.terms.s2Title"), content: t("public.terms.s2Content") },
    { title: t("public.terms.s3Title"), content: t("public.terms.s3Content") },
    { title: t("public.terms.s4Title"), content: t("public.terms.s4Content") },
    { title: t("public.terms.s5Title"), content: t("public.terms.s5Content") },
    { title: t("public.terms.s6Title"), content: t("public.terms.s6Content") },
    { title: t("public.terms.s7Title"), content: t("public.terms.s7Content") },
    { title: t("public.terms.s8Title"), content: t("public.terms.s8Content") },
    { title: t("public.terms.s9Title"), content: t("public.terms.s9Content") },
    { title: t("public.terms.s10Title"), content: t("public.terms.s10Content") },
    { title: t("public.terms.s11Title"), content: t("public.terms.s11Content") },
    { title: t("public.terms.s12Title"), content: t("public.terms.s12Content") },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-8 px-4" data-testid="section-terms-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <FileText className="w-3.5 h-3.5" />
            {t("public.terms.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-terms-title">
            {t("public.terms.title")}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {t("public.terms.titleHighlight")}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("public.terms.lastUpdate")}
          </p>
        </div>
      </section>

      <section className="py-8 px-4" data-testid="section-terms-content">
        <div className="max-w-3xl mx-auto space-y-8">
          {sections.map((s, i) => (
            <div key={i} data-testid={`terms-section-${i}`}>
              <h2 className="text-lg font-bold mb-3">{s.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="py-8" />
      <PageFooter />
    </div>
  );
}
