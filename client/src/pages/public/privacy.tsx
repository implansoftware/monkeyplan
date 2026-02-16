import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "./landing";
import { PageFooter } from "./about";
import { usePageTitle } from "@/hooks/use-page-title";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  const { t } = useTranslation();
  usePageTitle("Privacy Policy");
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    { title: t("public.privacy.s1Title"), content: t("public.privacy.s1Content") },
    { title: t("public.privacy.s2Title"), content: t("public.privacy.s2Content") },
    { title: t("public.privacy.s3Title"), content: t("public.privacy.s3Content") },
    { title: t("public.privacy.s4Title"), content: t("public.privacy.s4Content") },
    { title: t("public.privacy.s5Title"), content: t("public.privacy.s5Content") },
    { title: t("public.privacy.s6Title"), content: t("public.privacy.s6Content") },
    { title: t("public.privacy.s7Title"), content: t("public.privacy.s7Content") },
    { title: t("public.privacy.s8Title"), content: t("public.privacy.s8Content") },
    { title: t("public.privacy.s9Title"), content: t("public.privacy.s9Content") },
    { title: t("public.privacy.s10Title"), content: t("public.privacy.s10Content") },
    { title: t("public.privacy.s11Title"), content: t("public.privacy.s11Content") },
    { title: t("public.privacy.s12Title"), content: t("public.privacy.s12Content") },
    { title: t("public.privacy.s13Title"), content: t("public.privacy.s13Content") },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
      <Navbar solid showLandingLinks={false} />

      <section className="pt-28 pb-8 px-4" data-testid="section-privacy-hero">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium mb-6">
            <Shield className="w-3.5 h-3.5" />
            {t("public.privacy.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6" data-testid="text-privacy-title">
            {t("public.privacy.title")}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              {t("public.privacy.titleHighlight")}
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("public.privacy.lastUpdate")}
          </p>
          <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-4 leading-relaxed">
            {t("public.privacy.intro")}
          </p>
        </div>
      </section>

      <section className="py-8 px-4" data-testid="section-privacy-content">
        <div className="max-w-3xl mx-auto space-y-8">
          {sections.map((s, i) => (
            <div key={i} data-testid={`privacy-section-${i}`}>
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
